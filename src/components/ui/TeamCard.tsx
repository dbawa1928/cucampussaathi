import React from 'react';
import type { TeamMember } from '../../data/teamData';
import { IdCard, ShieldCheck } from 'lucide-react';

export interface TeamCardProps {
  member: TeamMember;
}

export const TeamCard: React.FC<TeamCardProps> = ({ member }) => {
  const isLeader = member.role.toLowerCase().includes('leader');

  return (
    <div className="relative flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-[#E7DADA] shadow-xs hover:shadow-md hover:border-[#C62828]/30 transition-all duration-200">
      {/* Avatar with Initials */}
      <div className="relative mb-4">
        <div
          className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl border-2 ${
            isLeader
              ? 'bg-[#FFF7F7] text-[#C62828] border-[#C62828]'
              : 'bg-[#FFF7F7] text-[#C62828] border-[#E7DADA]'
          } shadow-inner select-none`}
        >
          {member.initials}
        </div>
        {isLeader && (
          <div
            title="Team Leader"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#C62828] text-white flex items-center justify-center border-2 border-white shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-lg font-bold text-[#252525] tracking-tight">
        {member.name}
      </h3>

      {/* Role Badge */}
      <div className="mt-1.5">
        <span
          className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${
            isLeader
              ? 'bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 font-semibold'
              : 'bg-[#FFF7F7] text-[#666666] border border-[#E7DADA]'
          }`}
        >
          {member.role}
        </span>
      </div>

      {/* UID */}
      <div className="mt-4 pt-3 w-full border-t border-[#E7DADA] flex items-center justify-center gap-1.5 text-xs text-[#666666]">
        <IdCard className="w-3.5 h-3.5 text-[#C62828]" />
        <span className="font-mono font-medium tracking-wide text-[#252525] uppercase">
          UID: {member.uid}
        </span>
      </div>
    </div>
  );
};
