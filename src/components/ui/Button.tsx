import React from 'react';
import { Link } from 'react-router-dom';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  href?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  to,
  href,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 shadow-sm',
  };

  const variantClasses = {
    primary:
      'bg-[#C62828] text-white hover:bg-[#8E1717] active:bg-[#701212] focus-visible:ring-[#C62828] shadow-[0_1px_2px_rgba(198,40,40,0.2)] hover:shadow-[0_4px_12px_rgba(198,40,40,0.3)]',
    secondary:
      'bg-[#FFF7F7] text-[#C62828] hover:bg-[#ffebee] active:bg-[#ffcdd2] border border-[#E7DADA] focus-visible:ring-[#C62828] font-semibold',
    outline:
      'border border-[#E7DADA] bg-white text-[#252525] hover:bg-[#FFF7F7] hover:border-[#C62828]/40 active:bg-[#ffebee] focus-visible:ring-[#C62828] shadow-xs',
    ghost:
      'text-[#666666] hover:text-[#252525] hover:bg-[#FFF7F7] active:bg-[#ffebee] focus-visible:ring-[#C62828]',
    success:
      'bg-[#16845B] text-white hover:bg-[#126c4a] active:bg-[#0e573b] focus-visible:ring-[#16845B] shadow-sm',
  };

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClasses} role="button">
        {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClasses} target="_blank" rel="noopener noreferrer">
        {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
      </a>
    );
  }

  return (
    <button className={combinedClasses} disabled={disabled} {...props}>
      {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
    </button>
  );
};
