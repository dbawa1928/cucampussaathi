import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Lock,
  ArrowRight,
  Briefcase,
  FileText,
  CalendarCheck,
  CalendarX,
  Sparkles,
  ExternalLink,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import { apiClient, type ApiResponse } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface AvailabilitySlot {
  _id: string;
  teacherProfile: any;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  locationType: 'CABIN' | 'VIRTUAL_MEET';
  locationDetails?: string;
  isBooked: boolean;
  status: 'AVAILABLE' | 'RESERVED' | 'CANCELLED';
}

interface AppointmentItem {
  _id: string;
  student: {
    _id: string;
    fullName: string;
    email: string;
    department: string;
    uid: string;
  };
  teacherProfile: {
    _id: string;
    designation: string;
    department: string;
    officeLocation: string;
    user?: {
      _id: string;
      fullName: string;
      email: string;
      department: string;
    };
  };
  slot: AvailabilitySlot;
  agenda: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';
  rejectionReason?: string;
  teacherNotes?: string;
  meetingMode?: 'ONLINE' | 'IN_PERSON';
  meetingLink?: string;
  meetingInstructions?: string;
  createdAt: string;
}

interface RescheduleProposalItem {
  _id: string;
  appointment: string;
  proposedBy: {
    _id: string;
    fullName: string;
    role: string;
  };
  proposedSlot: AvailabilitySlot;
  originalSlot: AvailabilitySlot;
  reason?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
}

interface TeacherDirectoryItem {
  id: string;
  profileId: string;
  fullName: string;
  role: string;
  department: string;
  designation?: string;
  officeLocation?: string;
}

export const AppointmentsPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  // Active Tab:
  // For teacher: 'manage_slots' (default) | 'requests'
  // For student: 'book_slot' (default) | 'my_bookings'
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (tabParam === 'slots' || tabParam === 'manage_slots') return 'manage_slots';
      if (tabParam === 'book' || tabParam === 'book_slot') return 'book_slot';
      if (tabParam === 'requests') return 'requests';
      if (tabParam === 'my_bookings' || tabParam === 'bookings') return 'my_bookings';
    }
    return user?.role === 'TEACHER' ? 'manage_slots' : 'book_slot';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  // Sync activeTab whenever URL search parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (tabParam === 'slots' || tabParam === 'manage_slots') setActiveTab('manage_slots');
      else if (tabParam === 'book' || tabParam === 'book_slot') setActiveTab('book_slot');
      else if (tabParam === 'requests') setActiveTab('requests');
      else if (tabParam === 'my_bookings' || tabParam === 'bookings') setActiveTab('my_bookings');
    }
  }, [searchParams]);

  // General feedback states
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // ----------------------------------------------------
  // APPOINTMENT & PROPOSAL DATA
  // ----------------------------------------------------
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [proposalsMap, setProposalsMap] = useState<Record<string, RescheduleProposalItem[]>>({});

  // ----------------------------------------------------
  // STUDENT DATA & BOOKING STATE
  // ----------------------------------------------------
  const [teachersList, setTeachersList] = useState<TeacherDirectoryItem[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    searchParams.get('teacherId') || ''
  );
  const [teacherSlots, setTeacherSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [bookingAgenda, setBookingAgenda] = useState<string>('');

  // ----------------------------------------------------
  // TEACHER DATA & SLOT CREATION STATE
  // ----------------------------------------------------
  const [teacherSlotsList, setTeacherSlotsList] = useState<AvailabilitySlot[]>([]);
  const [newSlotDate, setNewSlotDate] = useState<string>('');
  const [newSlotStartTime, setNewSlotStartTime] = useState<string>('10:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState<string>('10:30');
  const [newSlotLocationType, setNewSlotLocationType] = useState<'CABIN' | 'VIRTUAL_MEET'>('CABIN');
  const [newSlotLocationDetails, setNewSlotLocationDetails] = useState<string>('');

  // ----------------------------------------------------
  // MODALS STATE
  // ----------------------------------------------------
  const [actionModal, setActionModal] = useState<{
    type: 'REJECT' | 'COMPLETE' | 'CANCEL';
    appointmentId: string;
    studentName?: string;
    textInput: string;
  } | null>(null);

  const [meetingModal, setMeetingModal] = useState<{
    appointmentId: string;
    meetingMode: 'ONLINE' | 'IN_PERSON';
    meetingLink: string;
    meetingInstructions: string;
  } | null>(null);

  const [rescheduleModal, setRescheduleModal] = useState<{
    appointmentId: string;
    teacherProfileId: string;
    slots: AvailabilitySlot[];
    selectedSlotId: string;
    reason: string;
    loadingSlots: boolean;
  } | null>(null);

  // Helper: Format ISO to local human date-time
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Helper: Format time only
  const formatTimeOnly = (isoString: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        timeStyle: 'short',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Load proposals for all active appointments
  const fetchProposalsForAppointments = useCallback(async (appts: AppointmentItem[]) => {
    const activeAppts = appts.filter(
      (a) => a.status === 'PENDING' || a.status === 'ACCEPTED'
    );
    const newMap: Record<string, RescheduleProposalItem[]> = {};

    await Promise.all(
      activeAppts.map(async (appt) => {
        try {
          const res = await apiClient.get<ApiResponse<{ proposals: RescheduleProposalItem[] }>>(
            `/appointments/${appt._id}/reschedule-proposals`
          );
          if (res.data?.proposals) {
            newMap[appt._id] = res.data.proposals;
          }
        } catch {
          // Non-fatal proposal fetch error
        }
      })
    );
    setProposalsMap(newMap);
  }, []);

  // Load appointments (Student or Teacher)
  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await apiClient.get<ApiResponse<{ appointments: AppointmentItem[] }>>(
        '/appointments/mine'
      );
      if (res.data?.appointments) {
        setAppointments(res.data.appointments);
        fetchProposalsForAppointments(res.data.appointments);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [user, fetchProposalsForAppointments]);

  // Load teacher's own slots
  const fetchTeacherSlots = useCallback(async () => {
    if (user?.role !== 'TEACHER') return;
    setLoading(true);
    setApiError('');
    try {
      const res = await apiClient.get<ApiResponse<{ slots: AvailabilitySlot[] }>>(
        '/availability/mine'
      );
      if (res.data?.slots) {
        setTeacherSlotsList(res.data.slots);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to fetch your consultation slots.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load teachers list for booking tab
  const fetchTeachersList = useCallback(async () => {
    if (user?.role !== 'STUDENT') return;
    try {
      const res = await apiClient.get<ApiResponse<{ items: TeacherDirectoryItem[] }>>(
        '/directory?type=teacher&limit=50'
      );
      if (res.data?.items) {
        setTeachersList(res.data.items);
        if (!selectedTeacherId && res.data.items.length > 0) {
          setSelectedTeacherId(res.data.items[0].profileId);
        }
      }
    } catch {
      // Non-fatal fallback
    }
  }, [user, selectedTeacherId]);

  // Fetch public slots when selected teacher changes
  const fetchSelectedTeacherSlots = useCallback(async (profileId: string) => {
    if (!profileId) return;
    try {
      const res = await apiClient.get<ApiResponse<{ slots: AvailabilitySlot[] }>>(
        `/availability/teacher/${profileId}`
      );
      if (res.data?.slots) {
        setTeacherSlots(res.data.slots);
        if (res.data.slots.length > 0) {
          setSelectedSlotId(res.data.slots[0]._id);
        } else {
          setSelectedSlotId('');
        }
      }
    } catch (err: any) {
      setApiError(err.message || 'Could not retrieve faculty consultation availability.');
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'TEACHER') {
      fetchAppointments();
      fetchTeacherSlots();
    } else if (user?.role === 'STUDENT') {
      fetchAppointments();
      fetchTeachersList();
    }
  }, [user, fetchAppointments, fetchTeacherSlots, fetchTeachersList]);

  useEffect(() => {
    if (selectedTeacherId) {
      fetchSelectedTeacherSlots(selectedTeacherId);
    }
  }, [selectedTeacherId, fetchSelectedTeacherSlots]);

  // If search param had teacherId, pre-set tab to book_slot
  useEffect(() => {
    if (searchParams.get('teacherId')) {
      setActiveTab('book_slot');
    }
  }, [searchParams]);

  // Handle slot creation by teacher
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');
    setActionLoading('create_slot');

    try {
      if (!newSlotDate) {
        throw new Error('Please pick a calendar date for the consultation slot.');
      }

      const startDateTime = new Date(`${newSlotDate}T${newSlotStartTime}:00`);
      const endDateTime = new Date(`${newSlotDate}T${newSlotEndTime}:00`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date or time format entered.');
      }

      if (endDateTime.getTime() <= startDateTime.getTime()) {
        throw new Error('Slot end time must be after start time.');
      }

      if (startDateTime.getTime() <= Date.now()) {
        throw new Error('Slot start time must be in the future.');
      }

      const res = await apiClient.post<ApiResponse<{ slot: AvailabilitySlot }>>(
        '/availability',
        {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          locationType: newSlotLocationType,
          locationDetails: newSlotLocationDetails.trim() || undefined,
        }
      );

      if (res.success) {
        setSuccessMessage('Consultation slot created and added to campus availability schedule.');
        setNewSlotLocationDetails('');
        fetchTeacherSlots();
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to create availability slot.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle slot deletion by teacher
  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to cancel and remove this consultation slot?')) return;
    setApiError('');
    setSuccessMessage('');
    setActionLoading(slotId);

    try {
      const res = await apiClient.delete<ApiResponse<any>>(`/availability/${slotId}`);
      if (res.success) {
        setSuccessMessage('Availability slot removed successfully.');
        fetchTeacherSlots();
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete slot.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle student booking submission
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) {
      setApiError('Please select an available consultation slot.');
      return;
    }
    if (bookingAgenda.trim().length < 10) {
      setApiError('Please provide a specific agenda of at least 10 characters.');
      return;
    }

    setApiError('');
    setSuccessMessage('');
    setActionLoading('book');

    try {
      const res = await apiClient.post<ApiResponse<{ appointment: AppointmentItem }>>(
        '/appointments',
        {
          slotId: selectedSlotId,
          agenda: bookingAgenda.trim(),
        }
      );

      if (res.success) {
        setSuccessMessage(
          'Consultation appointment booked successfully! The faculty member has been notified.'
        );
        setBookingAgenda('');
        setSelectedSlotId('');
        setActiveTab('my_bookings');
        fetchAppointments();
        if (selectedTeacherId) {
          fetchSelectedTeacherSlots(selectedTeacherId);
        }
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to book appointment.');
    } finally {
      setActionLoading(null);
    }
  };

  // Teacher action: Accept appointment
  const handleAcceptAppointment = async (appointmentId: string) => {
    setApiError('');
    setSuccessMessage('');
    setActionLoading(appointmentId);

    try {
      const res = await apiClient.post<ApiResponse<any>>(
        `/appointments/${appointmentId}/accept`
      );
      if (res.success) {
        setSuccessMessage('Appointment confirmed and accepted.');
        fetchAppointments();
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to accept appointment.');
    } finally {
      setActionLoading(null);
    }
  };

  // Execute modal action (Reject, Cancel, Complete)
  const handleExecuteModalAction = async () => {
    if (!actionModal) return;
    const { type, appointmentId, textInput } = actionModal;

    setApiError('');
    setSuccessMessage('');
    setActionLoading(appointmentId);

    try {
      if (type === 'REJECT') {
        const res = await apiClient.post<ApiResponse<any>>(
          `/appointments/${appointmentId}/reject`,
          { rejectionReason: textInput.trim() || undefined }
        );
        if (res.success) {
          setSuccessMessage('Consultation request rejected and slot released.');
        }
      } else if (type === 'CANCEL') {
        const res = await apiClient.post<ApiResponse<any>>(
          `/appointments/${appointmentId}/cancel`,
          { reason: textInput.trim() || undefined }
        );
        if (res.success) {
          setSuccessMessage('Appointment cancelled and slot restored to available.');
        }
      } else if (type === 'COMPLETE') {
        const res = await apiClient.post<ApiResponse<any>>(
          `/appointments/${appointmentId}/complete`,
          { teacherNotes: textInput.trim() || undefined }
        );
        if (res.success) {
          setSuccessMessage('Consultation marked as completed with meeting notes.');
        }
      }

      setActionModal(null);
      fetchAppointments();
    } catch (err: any) {
      setApiError(err.message || `Failed to process ${type.toLowerCase()} action.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Save Meeting Details (Online / In-Person, Link, Instructions)
  const handleSaveMeetingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingModal) return;

    setApiError('');
    setSuccessMessage('');
    setActionLoading(`meeting_${meetingModal.appointmentId}`);

    try {
      const res = await apiClient.patch<ApiResponse<{ appointment: AppointmentItem }>>(
        `/appointments/${meetingModal.appointmentId}/meeting-details`,
        {
          meetingMode: meetingModal.meetingMode,
          meetingLink: meetingModal.meetingLink.trim() || null,
          meetingInstructions: meetingModal.meetingInstructions.trim() || undefined,
        }
      );

      if (res.success) {
        setSuccessMessage('Consultation meeting details updated successfully.');
        setMeetingModal(null);
        fetchAppointments();
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to update meeting details.');
    } finally {
      setActionLoading(null);
    }
  };

  // Open Reschedule Modal & Fetch Slots
  const handleOpenRescheduleModal = async (appt: AppointmentItem) => {
    setApiError('');
    setSuccessMessage('');
    const profileId = appt.teacherProfile?._id;

    setRescheduleModal({
      appointmentId: appt._id,
      teacherProfileId: profileId,
      slots: [],
      selectedSlotId: '',
      reason: '',
      loadingSlots: true,
    });

    try {
      let slots: AvailabilitySlot[] = [];
      if (user?.role === 'TEACHER') {
        const res = await apiClient.get<ApiResponse<{ slots: AvailabilitySlot[] }>>(
          '/availability/mine'
        );
        slots = (res.data?.slots || []).filter(
          (s) => s.status === 'AVAILABLE' && !s.isBooked && new Date(s.startTime).getTime() > Date.now()
        );
      } else {
        const res = await apiClient.get<ApiResponse<{ slots: AvailabilitySlot[] }>>(
          `/availability/teacher/${profileId}`
        );
        slots = (res.data?.slots || []).filter(
          (s) => s.status === 'AVAILABLE' && !s.isBooked && new Date(s.startTime).getTime() > Date.now()
        );
      }

      setRescheduleModal((prev) =>
        prev
          ? {
              ...prev,
              slots,
              selectedSlotId: slots.length > 0 ? slots[0]._id : '',
              loadingSlots: false,
            }
          : null
      );
    } catch (err: any) {
      setApiError(err.message || 'Failed to load available slots for rescheduling.');
      setRescheduleModal(null);
    }
  };

  // Submit Reschedule Proposal
  const handleSubmitRescheduleProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModal || !rescheduleModal.selectedSlotId) {
      setApiError('Please select a valid upcoming time slot.');
      return;
    }

    setApiError('');
    setSuccessMessage('');
    setActionLoading(`reschedule_${rescheduleModal.appointmentId}`);

    try {
      const res = await apiClient.post<ApiResponse<{ proposal: RescheduleProposalItem }>>(
        `/appointments/${rescheduleModal.appointmentId}/reschedule-proposals`,
        {
          proposedSlotId: rescheduleModal.selectedSlotId,
          reason: rescheduleModal.reason.trim() || undefined,
        }
      );

      if (res.success) {
        setSuccessMessage('Rescheduling proposal sent to the other participant.');
        setRescheduleModal(null);
        fetchAppointments();
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to submit rescheduling proposal.');
    } finally {
      setActionLoading(null);
    }
  };

  // Accept Reschedule Proposal
  const handleAcceptProposal = async (proposalId: string) => {
    setApiError('');
    setSuccessMessage('');
    setActionLoading(proposalId);
    try {
      const res = await apiClient.post<ApiResponse<any>>(
        `/reschedule-proposals/${proposalId}/accept`
      );
      if (res.success) {
        setSuccessMessage('Reschedule proposal accepted! Appointment moved to new slot.');
        fetchAppointments();
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to accept rescheduling proposal.');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject Reschedule Proposal
  const handleRejectProposal = async (proposalId: string) => {
    const reason = window.prompt('Enter an optional reason for declining this rescheduling request:');
    setApiError('');
    setSuccessMessage('');
    setActionLoading(proposalId);
    try {
      const res = await apiClient.post<ApiResponse<any>>(
        `/reschedule-proposals/${proposalId}/reject`,
        { reason: reason || undefined }
      );
      if (res.success) {
        setSuccessMessage('Rescheduling proposal declined. Appointment preserved at current slot.');
        fetchAppointments();
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to decline proposal.');
    } finally {
      setActionLoading(null);
    }
  };

  // Withdraw Reschedule Proposal
  const handleWithdrawProposal = async (proposalId: string) => {
    if (!window.confirm('Withdraw this rescheduling request?')) return;
    setApiError('');
    setSuccessMessage('');
    setActionLoading(proposalId);
    try {
      const res = await apiClient.post<ApiResponse<any>>(
        `/reschedule-proposals/${proposalId}/withdraw`
      );
      if (res.success) {
        setSuccessMessage('Rescheduling proposal withdrawn.');
        fetchAppointments();
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to withdraw proposal.');
    } finally {
      setActionLoading(null);
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#C2410C]/20 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F5EF] text-[#16845B] border border-[#16845B]/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E7DADA] text-[#666666] border border-[#E7DADA] flex items-center gap-1">
            <CalendarX className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#EF4444] border border-[#FCA5A5] flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Declined
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E7DADA] text-[#666666]">
            {status}
          </span>
        );
    }
  };

  // Unauthenticated Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF7F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C62828] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF7F7] py-16 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-[#E7DADA] p-8 sm:p-10 max-w-md w-full text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF7F7] text-[#C62828] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#252525] mb-2">FacultyConnect Authentication</h2>
          <p className="text-xs sm:text-sm text-[#666666] mb-6 leading-relaxed">
            Please log in with your Chandigarh University credentials to book consultation slots or
            manage faculty appointment requests.
          </p>
          <Button to="/login" variant="primary" size="md" className="w-full">
            Log In to CUCampusSaathi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7F7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-3">
            <Badge variant="primary" size="sm" dot>
              FacultyConnect Engine
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#252525] tracking-tight">
            Faculty Consultation & Office Hours
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#666666] leading-relaxed">
            {user.role === 'TEACHER'
              ? 'Publish available office consultation windows and manage student academic guidance requests.'
              : 'Book 1-on-1 consultations with Chandigarh University faculty mentors for capstone projects, research guidance, and coursework assistance.'}
          </p>
        </div>

        {/* Global Feedback Banners */}
        {apiError && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[#991B1B]">
              <strong className="font-bold">Error: </strong> {apiError}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#E6F5EF] border border-[#16845B]/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#16845B] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[#16845B]">
              <strong className="font-bold">Success: </strong> {successMessage}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8 flex gap-2 p-1.5 bg-white rounded-2xl border border-[#E7DADA] shadow-2xs w-fit">
          {user.role === 'TEACHER' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manage_slots');
                  setApiError('');
                  setSuccessMessage('');
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'manage_slots'
                    ? 'bg-[#C62828] text-white shadow-xs'
                    : 'text-[#666666] hover:text-[#252525]'
                }`}
              >
                <Calendar className="w-4 h-4" /> Manage Availability Slots
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('requests');
                  setApiError('');
                  setSuccessMessage('');
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'requests'
                    ? 'bg-[#C62828] text-white shadow-xs'
                    : 'text-[#666666] hover:text-[#252525]'
                }`}
              >
                <CalendarCheck className="w-4 h-4" /> Consultation Requests ({appointments.length})
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('book_slot');
                  setApiError('');
                  setSuccessMessage('');
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'book_slot'
                    ? 'bg-[#C62828] text-white shadow-xs'
                    : 'text-[#666666] hover:text-[#252525]'
                }`}
              >
                <Plus className="w-4 h-4" /> Available Slots / Book Consultation
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('my_bookings');
                  setApiError('');
                  setSuccessMessage('');
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'my_bookings'
                    ? 'bg-[#C62828] text-white shadow-xs'
                    : 'text-[#666666] hover:text-[#252525]'
                }`}
              >
                <CalendarCheck className="w-4 h-4" /> My Appointments ({appointments.length})
              </button>
            </>
          )}
        </div>

        {/* ==================================================================== */}
        {/* TEACHER TAB 1: CONSULTATION REQUESTS */}
        {/* ==================================================================== */}
        {user.role === 'TEACHER' && activeTab === 'requests' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#E7DADA]">
                <Loader2 className="w-8 h-8 text-[#C62828] animate-spin mb-3" />
                <p className="text-sm font-semibold text-[#252525]">Loading consultation requests...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-16 px-6 bg-white rounded-3xl border border-[#E7DADA] text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF7F7] text-[#C62828] flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#252525] mb-1">No Consultation Requests Yet</h3>
                <p className="text-xs sm:text-sm text-[#666666] max-w-md mx-auto mb-6">
                  When students request appointments for your office consultation slots, they will
                  appear here for your approval.
                </p>
                <Button onClick={() => setActiveTab('manage_slots')} variant="primary" size="sm">
                  Publish Availability Slots
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {appointments.map((appt) => {
                  const pendingProposal = proposalsMap[appt._id]?.find(
                    (p) => p.status === 'PENDING'
                  );

                  return (
                    <div
                      key={appt._id}
                      className="bg-white rounded-2xl border border-[#E7DADA] p-6 shadow-xs hover:border-[#C62828]/40 transition-all flex flex-col gap-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-extrabold text-base text-[#252525]">
                              {appt.student?.fullName || 'Student'}
                            </span>
                            <span className="text-xs text-[#666666] bg-[#E7DADA] px-2.5 py-0.5 rounded-md font-mono">
                              {appt.student?.uid}
                            </span>
                            {renderStatusBadge(appt.status)}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#666666]">
                            <span className="flex items-center gap-1 text-[#252525] font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-[#C62828]" />
                              {formatDateTime(appt.slot?.startTime)} - {formatTimeOnly(appt.slot?.endTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              {appt.meetingMode === 'ONLINE' || appt.slot?.locationType === 'VIRTUAL_MEET' ? (
                                <Video className="w-3.5 h-3.5 text-[#C62828]" />
                              ) : (
                                <MapPin className="w-3.5 h-3.5 text-[#16845B]" />
                              )}
                              {appt.meetingMode === 'ONLINE' ? 'Virtual Video Meet' : 'In Cabin'}
                              {appt.slot?.locationDetails ? ` (${appt.slot.locationDetails})` : ''}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] text-xs text-[#252525]">
                            <span className="text-[#666666] font-semibold block mb-0.5">Discussion Agenda:</span>
                            <p className="italic">"{appt.agenda}"</p>
                          </div>

                          {appt.teacherNotes && (
                            <div className="text-xs text-[#16845B] bg-[#E6F5EF] p-2.5 rounded-lg border border-[#16845B]/20">
                              <strong>Consultation Notes: </strong> {appt.teacherNotes}
                            </div>
                          )}

                          {appt.rejectionReason && (
                            <div className="text-xs text-[#991B1B] bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FCA5A5]">
                              <strong>Rejection Reason: </strong> {appt.rejectionReason}
                            </div>
                          )}
                        </div>

                        {/* Teacher Action Buttons */}
                        <div className="flex flex-wrap md:flex-col items-center gap-2 shrink-0">
                          {appt.status === 'PENDING' && (
                            <>
                              <Button
                                onClick={() => handleAcceptAppointment(appt._id)}
                                disabled={actionLoading === appt._id}
                                variant="primary"
                                size="sm"
                                className="w-full"
                                icon={
                                  actionLoading === appt._id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )
                                }
                              >
                                Accept
                              </Button>
                              <Button
                                onClick={() =>
                                  setActionModal({
                                    type: 'REJECT',
                                    appointmentId: appt._id,
                                    studentName: appt.student?.fullName,
                                    textInput: '',
                                  })
                                }
                                variant="outline"
                                size="sm"
                                className="w-full text-[#EF4444] hover:bg-[#FEF2F2] hover:border-[#EF4444]"
                                icon={<XCircle className="w-3.5 h-3.5" />}
                              >
                                Decline
                              </Button>
                            </>
                          )}

                          {appt.status === 'ACCEPTED' && (
                            <>
                              <Button
                                onClick={() =>
                                  setActionModal({
                                    type: 'COMPLETE',
                                    appointmentId: appt._id,
                                    studentName: appt.student?.fullName,
                                    textInput: '',
                                  })
                                }
                                variant="primary"
                                size="sm"
                                className="w-full bg-[#16845B] hover:bg-[#126b4a]"
                                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              >
                                Complete
                              </Button>
                              <Button
                                onClick={() =>
                                  setActionModal({
                                    type: 'CANCEL',
                                    appointmentId: appt._id,
                                    studentName: appt.student?.fullName,
                                    textInput: '',
                                  })
                                }
                                variant="ghost"
                                size="sm"
                                className="w-full text-[#EF4444] hover:bg-[#FEF2F2]"
                              >
                                Cancel
                              </Button>
                            </>
                          )}

                          {(appt.status === 'ACCEPTED' || appt.status === 'PENDING') && (
                            <Button
                              onClick={() => handleOpenRescheduleModal(appt)}
                              variant="outline"
                              size="sm"
                              className="w-full text-[#C62828] border-[#C62828]/30 hover:bg-[#FFF7F7]"
                              icon={<RefreshCw className="w-3.5 h-3.5" />}
                            >
                              Reschedule
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Consultation Meeting Link & Details Section */}
                      <div className="p-3.5 rounded-xl border border-[#E7DADA] bg-[#FFF7F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-[#252525]">Meeting Format:</span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                appt.meetingMode === 'ONLINE'
                                  ? 'bg-[#FFF7F7] text-[#C62828]'
                                  : 'bg-[#E6F5EF] text-[#16845B]'
                              }`}
                            >
                              {appt.meetingMode === 'ONLINE'
                                ? 'Virtual Video Conference'
                                : 'In-Person Cabin Consultation'}
                            </span>
                          </div>

                          {appt.meetingMode === 'ONLINE' ? (
                            appt.meetingLink ? (
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <a
                                  href={appt.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C62828] text-white font-bold hover:bg-[#8E1717] transition-all shadow-xs"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  Join Video Meeting
                                  <ExternalLink className="w-3 h-3 ml-0.5" />
                                </a>
                                <span className="text-[11px] text-[#666666] font-mono truncate max-w-[260px]">
                                  {appt.meetingLink}
                                </span>
                              </div>
                            ) : (
                              <p className="text-[#666666] italic text-[11px] mt-0.5">
                                No video link provided yet. Add a manual Google Meet or Zoom URL below.
                              </p>
                            )
                          ) : null}

                          {appt.meetingInstructions && (
                            <div className="mt-1.5 text-[11px] text-[#475569]">
                              <strong>Instructions: </strong> {appt.meetingInstructions}
                            </div>
                          )}
                        </div>

                        {(appt.status === 'PENDING' || appt.status === 'ACCEPTED') && (
                          <Button
                            onClick={() =>
                              setMeetingModal({
                                appointmentId: appt._id,
                                meetingMode: appt.meetingMode || 'ONLINE',
                                meetingLink: appt.meetingLink || '',
                                meetingInstructions: appt.meetingInstructions || '',
                              })
                            }
                            variant="outline"
                            size="sm"
                            className="shrink-0 text-xs"
                            icon={<Edit3 className="w-3.5 h-3.5" />}
                          >
                            Edit Meeting Details
                          </Button>
                        )}
                      </div>

                      {/* Active Rescheduling Proposal Banner */}
                      {pendingProposal && (
                        <div className="p-3.5 rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] text-xs text-[#92400E] space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-bold flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-[#D97706]" />
                              Reschedule Request Proposed by {pendingProposal.proposedBy?.fullName} (
                              {pendingProposal.proposedBy?.role})
                            </span>
                            <span className="text-[10px] bg-[#FEF3C7] px-2 py-0.5 rounded font-mono font-bold">
                              Pending Response
                            </span>
                          </div>
                          <div>
                            <strong>Proposed Slot: </strong>
                            {formatDateTime(pendingProposal.proposedSlot?.startTime)} -{' '}
                            {formatTimeOnly(pendingProposal.proposedSlot?.endTime)}
                            {pendingProposal.reason && (
                              <span className="block mt-0.5 italic">
                                "Reason: {pendingProposal.reason}"
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            {pendingProposal.proposedBy?._id === user._id ? (
                              <Button
                                onClick={() => handleWithdrawProposal(pendingProposal._id)}
                                disabled={actionLoading === pendingProposal._id}
                                variant="ghost"
                                size="sm"
                                className="text-[#B45309] hover:bg-[#FDE68A]"
                              >
                                {actionLoading === pendingProposal._id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Withdraw Proposal'
                                )}
                              </Button>
                            ) : (
                              <>
                                <Button
                                  onClick={() => handleAcceptProposal(pendingProposal._id)}
                                  disabled={actionLoading === pendingProposal._id}
                                  variant="primary"
                                  size="sm"
                                  className="bg-[#D97706] hover:bg-[#B45309]"
                                >
                                  {actionLoading === pendingProposal._id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Accept New Time'
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handleRejectProposal(pendingProposal._id)}
                                  disabled={actionLoading === pendingProposal._id}
                                  variant="outline"
                                  size="sm"
                                  className="border-[#D97706]/40 text-[#92400E] hover:bg-[#FEF3C7]"
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TEACHER TAB 2: MANAGE AVAILABILITY SLOTS */}
        {/* ==================================================================== */}
        {user.role === 'TEACHER' && activeTab === 'manage_slots' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Slot Creator Form */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs h-fit">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C62828]" /> Create Availability Window
              </h2>
              <p className="text-xs text-[#666666] mb-6">
                Define when you are available for student academic office hours or project consultations.
              </p>

              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Consultation Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newSlotDate}
                    onChange={(e) => setNewSlotDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={newSlotStartTime}
                      onChange={(e) => setNewSlotStartTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={newSlotEndTime}
                      onChange={(e) => setNewSlotEndTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Consultation Mode *
                  </label>
                  <select
                    value={newSlotLocationType}
                    onChange={(e) => setNewSlotLocationType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] focus:border-transparent transition-all"
                  >
                    <option value="CABIN">Faculty Cabin / Office</option>
                    <option value="VIRTUAL_MEET">Virtual Video Conference</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Location Notes or Cabin Details
                  </label>
                  <input
                    type="text"
                    value={newSlotLocationDetails}
                    onChange={(e) => setNewSlotLocationDetails(e.target.value)}
                    placeholder={
                      newSlotLocationType === 'CABIN'
                        ? 'e.g. Block 3, Cabin 402'
                        : 'e.g. Google Meet link or MS Teams details'
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] focus:border-transparent transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={actionLoading === 'create_slot'}
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={
                    actionLoading === 'create_slot' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )
                  }
                >
                  {actionLoading === 'create_slot' ? 'Publishing Slot...' : 'Publish Availability Slot'}
                </Button>
              </form>
            </div>

            {/* List of Existing Teacher Slots */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center justify-between">
                <span>My Published Availability Slots</span>
                <span className="text-xs font-semibold text-[#666666]">
                  {teacherSlotsList.length} Total Slots
                </span>
              </h2>
              <p className="text-xs text-[#666666] mb-6">
                Active slots are visible to students. Reserved slots cannot be deleted until the
                associated appointment is concluded.
              </p>

              {teacherSlotsList.length === 0 ? (
                <div className="py-12 text-center text-[#666666] text-xs">
                  No availability slots created yet. Use the form on the left to add your first slot.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {teacherSlotsList.map((slot) => (
                    <div
                      key={slot._id}
                      className="p-4 rounded-xl border border-[#E7DADA] bg-[#FFF7F7] flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#252525]">
                            {formatDateTime(slot.startTime)} - {formatTimeOnly(slot.endTime)}
                          </span>
                          {slot.status === 'AVAILABLE' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F5EF] text-[#16845B]">
                              Available
                            </span>
                          )}
                          {slot.status === 'RESERVED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF7F7] text-[#C62828]">
                              Booked / Reserved
                            </span>
                          )}
                          {slot.status === 'CANCELLED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E7DADA] text-[#666666]">
                              Cancelled
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#666666] mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            {slot.locationType === 'VIRTUAL_MEET' ? (
                              <Video className="w-3.5 h-3.5 text-[#C62828]" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-[#16845B]" />
                            )}
                            {slot.locationType === 'VIRTUAL_MEET' ? 'Virtual' : 'In Cabin'}
                          </span>
                          {slot.locationDetails && (
                            <span className="truncate max-w-[200px]">{slot.locationDetails}</span>
                          )}
                        </div>
                      </div>

                      {slot.status === 'AVAILABLE' && !slot.isBooked && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot._id)}
                          disabled={actionLoading === slot._id}
                          className="p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Remove slot"
                        >
                          {actionLoading === slot._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STUDENT TAB 1: MY APPOINTMENTS */}
        {/* ==================================================================== */}
        {user.role === 'STUDENT' && activeTab === 'my_bookings' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#E7DADA]">
                <Loader2 className="w-8 h-8 text-[#C62828] animate-spin mb-3" />
                <p className="text-sm font-semibold text-[#252525]">Loading your appointments...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-16 px-6 bg-white rounded-3xl border border-[#E7DADA] text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF7F7] text-[#C62828] flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#252525] mb-1">No Consultations Booked Yet</h3>
                <p className="text-xs sm:text-sm text-[#666666] max-w-md mx-auto mb-6">
                  You haven't requested any faculty consultation appointments yet. Browse faculty
                  availability slots to get guidance.
                </p>
                <Button onClick={() => setActiveTab('book_slot')} variant="primary" size="sm">
                  Schedule Consultation
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {appointments.map((appt) => {
                  const pendingProposal = proposalsMap[appt._id]?.find(
                    (p) => p.status === 'PENDING'
                  );

                  return (
                    <div
                      key={appt._id}
                      className="bg-white rounded-2xl border border-[#E7DADA] p-6 shadow-xs hover:border-[#C62828]/40 transition-all flex flex-col gap-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-extrabold text-base text-[#252525]">
                              {appt.teacherProfile?.user?.fullName || 'Faculty Mentor'}
                            </span>
                            <span className="text-xs text-[#666666] bg-[#E7DADA] px-2.5 py-0.5 rounded-md">
                              {appt.teacherProfile?.designation || 'Faculty'} •{' '}
                              {appt.teacherProfile?.department}
                            </span>
                            {renderStatusBadge(appt.status)}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#666666]">
                            <span className="flex items-center gap-1 text-[#252525] font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-[#C62828]" />
                              {formatDateTime(appt.slot?.startTime)} - {formatTimeOnly(appt.slot?.endTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              {appt.meetingMode === 'ONLINE' || appt.slot?.locationType === 'VIRTUAL_MEET' ? (
                                <Video className="w-3.5 h-3.5 text-[#C62828]" />
                              ) : (
                                <MapPin className="w-3.5 h-3.5 text-[#16845B]" />
                              )}
                              {appt.meetingMode === 'ONLINE'
                                ? 'Virtual Meeting'
                                : `Cabin: ${appt.slot?.locationDetails || appt.teacherProfile?.officeLocation || 'Campus'}`}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] text-xs text-[#252525]">
                            <span className="text-[#666666] font-semibold block mb-0.5">Submitted Agenda:</span>
                            <p className="italic">"{appt.agenda}"</p>
                          </div>

                          {appt.teacherNotes && (
                            <div className="text-xs text-[#16845B] bg-[#E6F5EF] p-2.5 rounded-lg border border-[#16845B]/20">
                              <strong>Faculty Feedback: </strong> {appt.teacherNotes}
                            </div>
                          )}

                          {appt.rejectionReason && (
                            <div className="text-xs text-[#991B1B] bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FCA5A5]">
                              <strong>Faculty Note: </strong> {appt.rejectionReason}
                            </div>
                          )}
                        </div>

                        {/* Student Actions */}
                        <div className="flex flex-wrap md:flex-col items-center gap-2 shrink-0">
                          {(appt.status === 'PENDING' || appt.status === 'ACCEPTED') && (
                            <>
                              <Button
                                onClick={() => handleOpenRescheduleModal(appt)}
                                variant="outline"
                                size="sm"
                                className="w-full text-[#C62828] border-[#C62828]/30 hover:bg-[#FFF7F7]"
                                icon={<RefreshCw className="w-3.5 h-3.5" />}
                              >
                                Reschedule
                              </Button>
                              <Button
                                onClick={() =>
                                  setActionModal({
                                    type: 'CANCEL',
                                    appointmentId: appt._id,
                                    studentName: appt.teacherProfile?.user?.fullName,
                                    textInput: '',
                                  })
                                }
                                disabled={actionLoading === appt._id}
                                variant="outline"
                                size="sm"
                                className="w-full text-[#EF4444] hover:bg-[#FEF2F2] hover:border-[#EF4444]"
                                icon={<XCircle className="w-3.5 h-3.5" />}
                              >
                                Cancel Booking
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Consultation Meeting Link & Details Section */}
                      <div className="p-3.5 rounded-xl border border-[#E7DADA] bg-[#FFF7F7] text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[#252525]">Meeting Format:</span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              appt.meetingMode === 'ONLINE'
                                ? 'bg-[#FFF7F7] text-[#C62828]'
                                : 'bg-[#E6F5EF] text-[#16845B]'
                            }`}
                          >
                            {appt.meetingMode === 'ONLINE'
                              ? 'Virtual Video Conference'
                              : 'In-Person Cabin Consultation'}
                          </span>
                        </div>

                        {appt.meetingMode === 'ONLINE' ? (
                          appt.meetingLink ? (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <a
                                href={appt.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C62828] text-white font-bold hover:bg-[#8E1717] transition-all shadow-xs"
                              >
                                <Video className="w-3.5 h-3.5" />
                                Join Video Consultation
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                              <span className="text-[11px] text-[#666666] font-mono truncate max-w-[260px]">
                                {appt.meetingLink}
                              </span>
                            </div>
                          ) : (
                            <p className="text-[#666666] italic text-[11px] mt-0.5">
                              Faculty will share the Google Meet or Zoom link prior to the consultation.
                            </p>
                          )
                        ) : null}

                        {appt.meetingInstructions && (
                          <div className="mt-1.5 text-[11px] text-[#475569]">
                            <strong>Instructions: </strong> {appt.meetingInstructions}
                          </div>
                        )}
                      </div>

                      {/* Active Rescheduling Proposal Banner */}
                      {pendingProposal && (
                        <div className="p-3.5 rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] text-xs text-[#92400E] space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-bold flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-[#D97706]" />
                              Reschedule Request Proposed by {pendingProposal.proposedBy?.fullName} (
                              {pendingProposal.proposedBy?.role})
                            </span>
                            <span className="text-[10px] bg-[#FEF3C7] px-2 py-0.5 rounded font-mono font-bold">
                              Pending Response
                            </span>
                          </div>
                          <div>
                            <strong>Proposed Slot: </strong>
                            {formatDateTime(pendingProposal.proposedSlot?.startTime)} -{' '}
                            {formatTimeOnly(pendingProposal.proposedSlot?.endTime)}
                            {pendingProposal.reason && (
                              <span className="block mt-0.5 italic">
                                "Reason: {pendingProposal.reason}"
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            {pendingProposal.proposedBy?._id === user._id ? (
                              <Button
                                onClick={() => handleWithdrawProposal(pendingProposal._id)}
                                disabled={actionLoading === pendingProposal._id}
                                variant="ghost"
                                size="sm"
                                className="text-[#B45309] hover:bg-[#FDE68A]"
                              >
                                {actionLoading === pendingProposal._id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Withdraw Proposal'
                                )}
                              </Button>
                            ) : (
                              <>
                                <Button
                                  onClick={() => handleAcceptProposal(pendingProposal._id)}
                                  disabled={actionLoading === pendingProposal._id}
                                  variant="primary"
                                  size="sm"
                                  className="bg-[#D97706] hover:bg-[#B45309]"
                                >
                                  {actionLoading === pendingProposal._id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Accept New Time'
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handleRejectProposal(pendingProposal._id)}
                                  disabled={actionLoading === pendingProposal._id}
                                  variant="outline"
                                  size="sm"
                                  className="border-[#D97706]/40 text-[#92400E] hover:bg-[#FEF3C7]"
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* STUDENT TAB 2: BOOK FACULTY SLOT */}
        {/* ==================================================================== */}
        {user.role === 'STUDENT' && activeTab === 'book_slot' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Faculty Selector and Slot Chooser */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#C62828]" /> Select Faculty Member
              </h2>
              <p className="text-xs text-[#666666] mb-4">
                Choose a faculty mentor from the verified campus directory to view their open office
                consultation hours.
              </p>

              <div className="mb-6">
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] focus:border-transparent transition-all"
                >
                  <option value="" disabled>
                    -- Select Faculty Member --
                  </option>
                  {teachersList.map((t) => (
                    <option key={t.profileId} value={t.profileId}>
                      {t.fullName} ({t.designation || 'Faculty'} - {t.department})
                    </option>
                  ))}
                </select>
              </div>

              <h3 className="text-sm font-bold text-[#252525] mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C62828]" /> Available Consultation Slots
              </h3>

              {teacherSlots.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] text-center text-xs text-[#666666]">
                  No upcoming open consultation slots published for this faculty member right now.
                  Please select another faculty member or check back later.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {teacherSlots.map((slot) => (
                    <label
                      key={slot._id}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedSlotId === slot._id
                          ? 'border-[#C62828] bg-[#FFF7F7]/40 shadow-xs ring-1 ring-[#C62828]'
                          : 'border-[#E7DADA] bg-white hover:bg-[#FFF7F7]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-[#252525]">
                          {formatDateTime(slot.startTime)} - {formatTimeOnly(slot.endTime)}
                        </div>
                        <div className="text-[11px] text-[#666666] flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            {slot.locationType === 'VIRTUAL_MEET' ? (
                              <Video className="w-3 h-3 text-[#C62828]" />
                            ) : (
                              <MapPin className="w-3 h-3 text-[#16845B]" />
                            )}
                            {slot.locationType === 'VIRTUAL_MEET' ? 'Virtual Meet' : 'Cabin'}
                          </span>
                          <span>•</span>
                          <span>{slot.durationMinutes} minutes</span>
                        </div>
                      </div>

                      <input
                        type="radio"
                        name="selectedSlot"
                        value={slot._id}
                        checked={selectedSlotId === slot._id}
                        onChange={() => setSelectedSlotId(slot._id)}
                        className="w-4 h-4 text-[#C62828] focus:ring-[#C62828]"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Booking Form / Agenda */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs h-fit">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C62828]" /> Consultation Agenda & Purpose
              </h2>
              <p className="text-xs text-[#666666] mb-6">
                Describe the topic or specific questions you wish to discuss with the faculty member.
              </p>

              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-[#252525]">
                      Meeting Agenda * (Min 10 characters)
                    </label>
                    <span className="text-[11px] text-[#94A3B8]">
                      {bookingAgenda.length} / 500
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    maxLength={500}
                    value={bookingAgenda}
                    onChange={(e) => setBookingAgenda(e.target.value)}
                    placeholder="e.g. Discuss my final year project architecture, review algorithm choice, and seek thesis mentorship approval."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] focus:border-transparent transition-all"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#FFF7F7]/40 border border-[#C62828]/20 text-xs text-[#C62828] leading-relaxed">
                  <strong>Notice: </strong> Appointments are subject to faculty approval. You will
                  receive real-time notifications on your status updates.
                </div>

                <Button
                  type="submit"
                  disabled={!selectedSlotId || actionLoading === 'book'}
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={
                    actionLoading === 'book' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )
                  }
                  iconPosition="right"
                >
                  {actionLoading === 'book' ? 'Submitting Request...' : 'Confirm Appointment Request'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* INTERACTIVE ACTION MODAL (Reject, Cancel, Complete) */}
        {/* ==================================================================== */}
        {actionModal && (
          <div className="fixed inset-0 z-50 bg-[#252525]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-[#252525] mb-1 flex items-center gap-2">
                {actionModal.type === 'REJECT' && <XCircle className="w-5 h-5 text-[#EF4444]" />}
                {actionModal.type === 'CANCEL' && <CalendarX className="w-5 h-5 text-[#EF4444]" />}
                {actionModal.type === 'COMPLETE' && <CheckCircle2 className="w-5 h-5 text-[#16845B]" />}
                <span>
                  {actionModal.type === 'REJECT' && 'Decline Consultation Request'}
                  {actionModal.type === 'CANCEL' && 'Cancel Consultation Appointment'}
                  {actionModal.type === 'COMPLETE' && 'Complete Consultation'}
                </span>
              </h3>

              <p className="text-xs text-[#666666] mb-4">
                {actionModal.type === 'REJECT' &&
                  'Please provide an optional reason for the student regarding why this request cannot be accommodated.'}
                {actionModal.type === 'CANCEL' &&
                  'Are you sure you want to cancel this booking? The slot will be released back to the schedule.'}
                {actionModal.type === 'COMPLETE' &&
                  'Record consultation notes or action items discussed during the session.'}
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  {actionModal.type === 'COMPLETE' ? 'Meeting Notes' : 'Reason (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={actionModal.textInput}
                  onChange={(e) =>
                    setActionModal({ ...actionModal, textInput: e.target.value })
                  }
                  placeholder={
                    actionModal.type === 'COMPLETE'
                      ? 'e.g. Reviewed methodology, approved dataset'
                      : 'e.g. Department committee meeting clash'
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7DADA]">
                <Button
                  onClick={() => setActionModal(null)}
                  variant="outline"
                  size="sm"
                  type="button"
                >
                  Close
                </Button>
                <Button
                  onClick={handleExecuteModalAction}
                  disabled={actionLoading === actionModal.appointmentId}
                  variant={actionModal.type === 'COMPLETE' ? 'primary' : 'outline'}
                  size="sm"
                  className={
                    actionModal.type !== 'COMPLETE'
                      ? 'text-[#EF4444] border-[#FCA5A5] hover:bg-[#FEF2F2]'
                      : 'bg-[#16845B] hover:bg-[#126b4a]'
                  }
                  type="button"
                >
                  {actionLoading === actionModal.appointmentId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : actionModal.type === 'COMPLETE' ? (
                    'Mark Completed'
                  ) : actionModal.type === 'REJECT' ? (
                    'Decline Request'
                  ) : (
                    'Confirm Cancellation'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* MEETING DETAILS MODAL (Faculty / Teacher) */}
        {/* ==================================================================== */}
        {meetingModal && (
          <div className="fixed inset-0 z-50 bg-[#252525]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-[#252525] mb-1 flex items-center gap-2">
                <Video className="w-5 h-5 text-[#C62828]" />
                Update Consultation Meeting Details
              </h3>
              <p className="text-xs text-[#666666] mb-4">
                Set meeting format and add manual Google Meet or Zoom link for this student consultation.
              </p>

              <form onSubmit={handleSaveMeetingDetails} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Meeting Mode
                  </label>
                  <select
                    value={meetingModal.meetingMode}
                    onChange={(e) =>
                      setMeetingModal({
                        ...meetingModal,
                        meetingMode: e.target.value as 'ONLINE' | 'IN_PERSON',
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] transition-all"
                  >
                    <option value="ONLINE">Virtual Video Conference (Google Meet / Zoom)</option>
                    <option value="IN_PERSON">In-Person (Faculty Cabin / Office)</option>
                  </select>
                </div>

                {meetingModal.meetingMode === 'ONLINE' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#252525] mb-1">
                      Meeting Link (HTTPS URL)
                    </label>
                    <input
                      type="url"
                      value={meetingModal.meetingLink}
                      onChange={(e) =>
                        setMeetingModal({ ...meetingModal, meetingLink: e.target.value })
                      }
                      placeholder="https://meet.google.com/abc-defg-hij"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] transition-all"
                    />
                    <p className="text-[11px] text-[#94A3B8] mt-1">
                      Paste your Google Meet, Zoom, or Microsoft Teams meeting link.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={meetingModal.meetingInstructions}
                    onChange={(e) =>
                      setMeetingModal({ ...meetingModal, meetingInstructions: e.target.value })
                    }
                    placeholder="e.g. Please join with your capstone presentation and report ready."
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7DADA]">
                  <Button
                    onClick={() => setMeetingModal(null)}
                    variant="outline"
                    size="sm"
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={actionLoading === `meeting_${meetingModal.appointmentId}`}
                    variant="primary"
                    size="sm"
                  >
                    {actionLoading === `meeting_${meetingModal.appointmentId}` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Save Meeting Details'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* RESCHEDULE PROPOSAL MODAL */}
        {/* ==================================================================== */}
        {rescheduleModal && (
          <div className="fixed inset-0 z-50 bg-[#252525]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-[#252525] mb-1 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#C62828]" />
                Propose Appointment Rescheduling
              </h3>
              <p className="text-xs text-[#666666] mb-4">
                Select a new open consultation slot to propose moving this appointment. The other
                participant will receive a real-time notification to accept or decline.
              </p>

              {rescheduleModal.loadingSlots ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#C62828] animate-spin mb-2" />
                  <p className="text-xs text-[#666666]">Loading available upcoming slots...</p>
                </div>
              ) : rescheduleModal.slots.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] text-center text-xs text-[#666666] my-4">
                  No other open upcoming slots available right now. Please create or publish a new slot
                  first.
                </div>
              ) : (
                <form onSubmit={handleSubmitRescheduleProposal} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                      Select Proposed New Slot *
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {rescheduleModal.slots.map((slot) => (
                        <label
                          key={slot._id}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                            rescheduleModal.selectedSlotId === slot._id
                              ? 'border-[#C62828] bg-[#FFF7F7]/40 ring-1 ring-[#C62828]'
                              : 'border-[#E7DADA] bg-white hover:bg-[#FFF7F7]'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-[#252525] block">
                              {formatDateTime(slot.startTime)} - {formatTimeOnly(slot.endTime)}
                            </span>
                            <span className="text-[11px] text-[#666666]">
                              {slot.locationType === 'VIRTUAL_MEET' ? 'Virtual' : 'In Cabin'}
                              {slot.locationDetails ? ` (${slot.locationDetails})` : ''}
                            </span>
                          </div>
                          <input
                            type="radio"
                            name="proposedSlot"
                            value={slot._id}
                            checked={rescheduleModal.selectedSlotId === slot._id}
                            onChange={() =>
                              setRescheduleModal({ ...rescheduleModal, selectedSlotId: slot._id })
                            }
                            className="w-4 h-4 text-[#C62828]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#252525] mb-1">
                      Reason for Rescheduling (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={rescheduleModal.reason}
                      onChange={(e) =>
                        setRescheduleModal({ ...rescheduleModal, reason: e.target.value })
                      }
                      placeholder="e.g. Schedule clash with university lab exam."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7DADA]">
                    <Button
                      onClick={() => setRescheduleModal(null)}
                      variant="outline"
                      size="sm"
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        !rescheduleModal.selectedSlotId ||
                        actionLoading === `reschedule_${rescheduleModal.appointmentId}`
                      }
                      variant="primary"
                      size="sm"
                    >
                      {actionLoading === `reschedule_${rescheduleModal.appointmentId}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Submit Proposal'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
