import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary',
}) => {
  const variantStyles = {
    primary: {
      bg: 'bg-[#EAF1FF]',
      text: 'text-[#3157D5]',
      border: 'hover:border-[#3157D5]/40',
    },
    success: {
      bg: 'bg-[#E6F5EF]',
      text: 'text-[#16845B]',
      border: 'hover:border-[#16845B]/40',
    },
    warning: {
      bg: 'bg-[#FFF7ED]',
      text: 'text-[#C2410C]',
      border: 'hover:border-[#C2410C]/40',
    },
    danger: {
      bg: 'bg-[#FEF2F2]',
      text: 'text-[#EF4444]',
      border: 'hover:border-[#EF4444]/40',
    },
    neutral: {
      bg: 'bg-[#F1F5F9]',
      text: 'text-[#475569]',
      border: 'hover:border-[#64748B]/40',
    },
  }[variant];

  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs transition-all ${variantStyles.border}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#64748B]">{title}</span>
        <div className={`w-9 h-9 rounded-xl ${variantStyles.bg} ${variantStyles.text} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-[#17233B] tracking-tight">{value}</div>
      {subtitle && <p className="text-[11px] text-[#94A3B8] mt-1">{subtitle}</p>}
    </div>
  );
};
