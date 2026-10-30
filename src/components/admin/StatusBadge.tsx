import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck, UserX } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'account' | 'verification' | 'appointment';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'account' }) => {
  const s = status ? status.toUpperCase() : 'UNKNOWN';

  if (type === 'verification') {
    switch (s) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6F5EF] text-[#16845B] border border-[#16845B]/20">
            <ShieldCheck className="w-3 h-3" /> Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#C2410C]/20">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#EF4444] border border-[#FCA5A5]">
            <XCircle className="w-3 h-3" /> Declined
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs text-[#64748B] bg-[#F1F5F9]">{s}</span>;
    }
  }

  if (type === 'account') {
    switch (s) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6F5EF] text-[#16845B] border border-[#16845B]/20">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#EF4444] border border-[#FCA5A5]">
            <UserX className="w-3 h-3" /> Suspended
          </span>
        );
      case 'DEACTIVATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
            <AlertTriangle className="w-3 h-3" /> Deactivated
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs text-[#64748B] bg-[#F1F5F9]">{s}</span>;
    }
  }

  // Appointment status
  switch (s) {
    case 'ACCEPTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6F5EF] text-[#16845B] border border-[#16845B]/20">
          <CheckCircle2 className="w-3 h-3" /> Confirmed
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#C2410C]/20">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF7F7] text-[#C62828] border border-[#E7DADA]">
          <CheckCircle2 className="w-3 h-3 text-[#C62828]" /> Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
          <XCircle className="w-3 h-3" /> Cancelled
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#EF4444] border border-[#FCA5A5]">
          <XCircle className="w-3 h-3" /> Declined
        </span>
      );
    default:
      return <span className="px-2 py-0.5 rounded text-xs text-[#64748B] bg-[#F1F5F9]">{s}</span>;
  }
};
