import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs md:text-sm px-2.5 py-1 font-medium',
  };

  const variantClasses = {
    primary: 'bg-[#EAF1FF] text-[#3157D5] border border-[#3157D5]/20',
    secondary: 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]',
    success: 'bg-[#E6F5EF] text-[#16845B] border border-[#16845B]/20',
    warning: 'bg-[#FFF7ED] text-[#C2410C] border border-[#C2410C]/20',
    neutral: 'bg-white text-[#17233B] border border-[#E2E8F0] shadow-xs',
  };

  const dotColors = {
    primary: 'bg-[#3157D5]',
    secondary: 'bg-[#64748B]',
    success: 'bg-[#16845B]',
    warning: 'bg-[#C2410C]',
    neutral: 'bg-[#17233B]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
