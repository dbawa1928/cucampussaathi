import React from 'react';
import type { TeamMember } from '../../data/teamData';
import { IdCard, ShieldCheck } from 'lucide-react';


export interface TeamCardProps {
  member: TeamMember;
}

export const TeamCard: React.FC<TeamCardProps> = ({ member }) => {
  const isLeader = member.role.toLowerCase().includes('leader');

  return (
    <div className="relative flex flex-col items-center text-center p-6 bg-white rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#3157D5]/30 transition-all duration-200">
      {/* Avatar with Initials */}
      <div className="relative mb-4">
        <div
          className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl border-2 ${member.colorScheme.bg} ${member.colorScheme.text} ${member.colorScheme.border} shadow-inner select-none`}
        >
          {member.initials}
        </div>
        {isLeader && (
          <div
            title="Team Leader"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#3157D5] text-white flex items-center justify-center border-2 border-white shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-lg font-bold text-[#17233B] tracking-tight">
        {member.name}
      </h3>

      {/* Role Badge */}
      <div className="mt-1.5">
        <span
          className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${
            isLeader
              ? 'bg-[#EAF1FF] text-[#3157D5] border border-[#3157D5]/20 font-semibold'
              : 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
          }`}
        >
          {member.role}
        </span>
      </div>

      {/* UID */}
      <div className="mt-4 pt-3 w-full border-t border-[#E2E8F0]/70 flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
        <IdCard className="w-3.5 h-3.5 text-[#3157D5]" />
        <span className="font-mono font-medium tracking-wide text-[#17233B] uppercase">
          UID: {member.uid}
        </span>
      </div>
    </div>
  );
};
