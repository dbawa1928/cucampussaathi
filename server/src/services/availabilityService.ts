import { Types } from 'mongoose';
import { AvailabilitySlot, IAvailabilitySlot } from '../models/AvailabilitySlot';
import { TeacherProfile } from '../models/TeacherProfile';
import { Appointment } from '../models/Appointment';
import {
  CreateAvailabilitySlotInput,
  UpdateAvailabilitySlotInput,
} from '../utils/validators';
import { AppError } from '../utils/errors';

export class AvailabilityService {
  /**
   * Helper to fetch the teacher's profile given their authenticated User ID.
   */
  private async getTeacherProfileByUserId(userId: string) {
    const profile = await TeacherProfile.findOne({ user: userId });
    if (!profile) {
      throw new AppError(
        'Teacher profile must be initialized before creating consultation slots.',
        404
      );
    }
    return profile;
  }

  /**
   * Create a new availability slot for the authenticated teacher.
   */
  async createSlot(
    teacherUserId: string,
    data: CreateAvailabilitySlotInput
  ): Promise<IAvailabilitySlot> {
    const profile = await this.getTeacherProfileByUserId(teacherUserId);

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Overlap prevention: Ensure teacher doesn't have an overlapping active slot
    const existingOverlap = await AvailabilitySlot.findOne({
      teacherProfile: profile._id,
      status: { $ne: 'CANCELLED' },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (existingOverlap) {
      throw new AppError(
        'You already have an existing consultation slot that overlaps with the selected time window.',
        409
      );
    }

    const durationMinutes =
      data.durationMinutes ||
      Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const slot = await AvailabilitySlot.create({
      teacherProfile: profile._id,
      startTime,
      endTime,
      durationMinutes,
      locationType: data.locationType || 'CABIN',
      locationDetails: data.locationDetails || profile.officeLocation || '',
      isBooked: false,
      status: 'AVAILABLE',
    });

    return slot;
  }

  /**
   * List slots belonging to the authenticated teacher with optional date filters and pagination.
   */
  async getMySlots(
    teacherUserId: string,
    filters: {
      from?: string;
      to?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    slots: IAvailabilitySlot[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const profile = await this.getTeacherProfileByUserId(teacherUserId);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = { teacherProfile: profile._id };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.from || filters.to) {
      query.startTime = {};
      if (filters.from) query.startTime.$gte = new Date(filters.from);
      if (filters.to) query.startTime.$lte = new Date(filters.to);
    }

    const [total, slots] = await Promise.all([
      AvailabilitySlot.countDocuments(query),
      AvailabilitySlot.find(query).sort({ startTime: 1 }).skip(skip).limit(limit),
    ]);

    return {
      slots,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve upcoming available consultation slots for a specific teacher (publicly accessible to students).
   */
  async getTeacherPublicSlots(
    teacherProfileId: string,
    filters: { from?: string; to?: string }
  ): Promise<IAvailabilitySlot[]> {
    if (!Types.ObjectId.isValid(teacherProfileId)) {
      throw new AppError('Invalid faculty profile identifier.', 400);
    }

    const now = new Date();
    const query: any = {
      teacherProfile: teacherProfileId,
      status: 'AVAILABLE',
      isBooked: false,
      startTime: { $gt: now },
    };

    if (filters.from) {
      const fromDate = new Date(filters.from);
      query.startTime.$gte = fromDate > now ? fromDate : now;
    }
    if (filters.to) {
      query.startTime.$lte = new Date(filters.to);
    }

    const slots = await AvailabilitySlot.find(query).sort({ startTime: 1 }).limit(50);
    return slots;
  }

  /**
   * Update an existing availability slot if no active appointment prevents it.
   */
  async updateSlot(
    teacherUserId: string,
    slotId: string,
    data: UpdateAvailabilitySlotInput
  ): Promise<IAvailabilitySlot> {
    if (!Types.ObjectId.isValid(slotId)) {
      throw new AppError('Invalid slot identifier format.', 400);
    }

    const profile = await this.getTeacherProfileByUserId(teacherUserId);

    const slot = await AvailabilitySlot.findById(slotId);
    if (!slot) {
      throw new AppError('Availability slot not found.', 404);
    }

    if (!slot.teacherProfile.equals(profile._id)) {
      throw new AppError('You are not authorized to modify another teacher’s slots.', 403);
    }

    // Safety check: Prevent modifying slots with active bookings
    const activeAppointment = await Appointment.findOne({
      slot: slot._id,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });

    if (activeAppointment || slot.isBooked) {
      throw new AppError(
        'Cannot modify an availability slot that has active booking requests or is reserved. Cancel or reject the active appointment first.',
        409
      );
    }

    const startTime = data.startTime ? new Date(data.startTime) : slot.startTime;
    const endTime = data.endTime ? new Date(data.endTime) : slot.endTime;

    // Check overlap if timing changed
    if (data.startTime || data.endTime) {
      const overlap = await AvailabilitySlot.findOne({
        teacherProfile: profile._id,
        _id: { $ne: slot._id },
        status: { $ne: 'CANCELLED' },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      });

      if (overlap) {
        throw new AppError(
          'The updated slot times overlap with another existing consultation slot.',
          409
        );
      }
    }

    if (data.startTime) slot.startTime = startTime;
    if (data.endTime) slot.endTime = endTime;
    if (data.durationMinutes) {
      slot.durationMinutes = data.durationMinutes;
    } else if (data.startTime || data.endTime) {
      slot.durationMinutes = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      );
    }

    if (data.locationType) slot.locationType = data.locationType;
    if (data.locationDetails !== undefined) slot.locationDetails = data.locationDetails;

    await slot.save();
    return slot;
  }

  /**
   * Cancel or remove an availability slot if no active appointments are pending.
   */
  async deleteSlot(teacherUserId: string, slotId: string): Promise<void> {
    if (!Types.ObjectId.isValid(slotId)) {
      throw new AppError('Invalid slot identifier format.', 400);
    }

    const profile = await this.getTeacherProfileByUserId(teacherUserId);

    const slot = await AvailabilitySlot.findById(slotId);
    if (!slot) {
      throw new AppError('Availability slot not found.', 404);
    }

    if (!slot.teacherProfile.equals(profile._id)) {
      throw new AppError('You are not authorized to delete another teacher’s slots.', 403);
    }

    // Safety check: Prevent deleting slots with active bookings
    const activeAppointment = await Appointment.findOne({
      slot: slot._id,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });

    if (activeAppointment) {
      throw new AppError(
        'Cannot delete a slot with active appointments. Please reject or cancel the active appointment first.',
        409
      );
    }

    slot.status = 'CANCELLED';
    slot.isBooked = false;
    await slot.save();
  }
}

export const availabilityService = new AvailabilityService();
