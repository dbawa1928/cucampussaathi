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
    primary: 'bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20',
    secondary: 'bg-[#FFF7F7] text-[#666666] border border-[#E7DADA]',
    success: 'bg-[#E6F5EF] text-[#16845B] border border-[#16845B]/20',
    warning: 'bg-[#FFF7ED] text-[#C2410C] border border-[#C2410C]/20',
    neutral: 'bg-white text-[#252525] border border-[#E7DADA] shadow-xs',
  };

  const dotColors = {
    primary: 'bg-[#C62828]',
    secondary: 'bg-[#666666]',
    success: 'bg-[#16845B]',
    warning: 'bg-[#C2410C]',
    neutral: 'bg-[#252525]',
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
