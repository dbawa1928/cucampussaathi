import { Request, Response, NextFunction } from 'express';
import { rescheduleService } from '../services/rescheduleService';
import {
  createRescheduleProposalSchema,
  rejectRescheduleProposalSchema,
} from '../utils/validators';

export class RescheduleController {
  /**
   * POST /api/v1/appointments/:appointmentId/reschedule-proposals
   * Propose a new slot for an appointment.
   */
  async proposeReschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const data = createRescheduleProposalSchema.parse(req.body);

      const proposal = await rescheduleService.proposeReschedule(
        req.user!.id,
        req.user!.role,
        appointmentId,
        data.proposedSlotId,
        data.reason
      );

      res.status(201).json({
        success: true,
        message: 'Reschedule proposal submitted successfully.',
        data: { proposal },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/appointments/:appointmentId/reschedule-proposals
   * List all proposals for an appointment.
   */
  async getProposals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const proposals = await rescheduleService.getProposalsForAppointment(
        req.user!.id,
        req.user!.role,
        appointmentId
      );

      res.status(200).json({
        success: true,
        data: { proposals },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/reschedule-proposals/:proposalId/accept
   * Accept a pending reschedule proposal.
   */
  async acceptProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { proposalId } = req.params;
      const result = await rescheduleService.acceptProposal(
        req.user!.id,
        req.user!.role,
        proposalId
      );

      res.status(200).json({
        success: true,
        message: 'Reschedule proposal accepted successfully. Appointment has been updated.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/reschedule-proposals/:proposalId/reject
   * Reject a pending reschedule proposal.
   */
  async rejectProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { proposalId } = req.params;
      const data = rejectRescheduleProposalSchema.parse(req.body || {});

      const proposal = await rescheduleService.rejectProposal(
        req.user!.id,
        req.user!.role,
        proposalId,
        data.reason
      );

      res.status(200).json({
        success: true,
        message: 'Reschedule proposal rejected.',
        data: { proposal },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/reschedule-proposals/:proposalId/withdraw
   * Withdraw a proposal submitted by the caller.
   */
  async withdrawProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { proposalId } = req.params;
      const proposal = await rescheduleService.withdrawProposal(
        req.user!.id,
        proposalId
      );

      res.status(200).json({
        success: true,
        message: 'Reschedule proposal withdrawn.',
        data: { proposal },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const rescheduleController = new RescheduleController();
