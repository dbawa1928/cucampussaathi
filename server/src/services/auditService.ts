import { Types } from 'mongoose';
import {
  AdminAuditLog,
  IAdminAuditLog,
  AuditAction,
  AuditEntityType,
} from '../models/AdminAuditLog';
import { logger } from '../utils/logger';

export interface LogAdminActionInput {
  adminId: string | Types.ObjectId;
  action: AuditAction;
  targetUserId?: string | Types.ObjectId;
  targetAppointmentId?: string | Types.ObjectId;
  entityType: AuditEntityType;
  reason?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export interface GetAuditLogsQuery {
  page?: number;
  limit?: number;
  action?: string;
  adminId?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

export class AuditService {
  /**
   * Securely persist an administrative action to the immutable audit trail.
   */
  async logAdminAction(input: LogAdminActionInput): Promise<IAdminAuditLog> {
    try {
      const log = await AdminAuditLog.create({
        adminUser: new Types.ObjectId(input.adminId),
        action: input.action,
        targetUser: input.targetUserId ? new Types.ObjectId(input.targetUserId) : undefined,
        targetAppointment: input.targetAppointmentId
          ? new Types.ObjectId(input.targetAppointmentId)
          : undefined,
        entityType: input.entityType,
        reason: input.reason?.trim() || undefined,
        metadata: input.metadata || {},
        ipAddress: input.ipAddress,
      });

      logger.info(
        `[AUDIT] Action: ${input.action} | Admin: ${input.adminId} | Entity: ${input.entityType}${
          input.targetUserId ? ` | TargetUser: ${input.targetUserId}` : ''
        }`
      );

      return log;
    } catch (error) {
      // Non-fatal logging failure fallback so core transaction does not crash unexpectedly
      logger.error('Failed to persist admin audit log:', error);
      throw error;
    }
  }

  /**
   * Retrieve paginated administrative audit logs with populated user and appointment references.
   */
  async getAuditLogs(query: GetAuditLogsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.action) {
      filter.action = query.action;
    }
    if (query.entityType) {
      filter.entityType = query.entityType;
    }
    if (query.adminId && Types.ObjectId.isValid(query.adminId)) {
      filter.adminUser = new Types.ObjectId(query.adminId);
    }
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.createdAt.$lte = new Date(query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('adminUser', 'fullName email role uid department')
        .populate('targetUser', 'fullName email role uid department')
        .populate('targetAppointment', 'agenda status meetingMode')
        .lean(),
      AdminAuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const auditService = new AuditService();
