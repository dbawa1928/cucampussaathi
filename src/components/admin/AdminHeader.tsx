import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onMobileToggle?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  onMobileToggle,
}) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-[#E7DADA] px-6 py-4 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        {onMobileToggle && (
          <button
            onClick={onMobileToggle}
            className="md:hidden p-2 rounded-lg text-[#666666] hover:bg-[#FFF7F7]"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-[#252525] tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-[#666666]">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs font-semibold text-[#666666] hover:text-[#C62828] hover:bg-[#FFF7F7] transition-all"
        >
          <span>Campus Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-2 pl-3 border-l border-[#E7DADA]">
          <div className="w-8 h-8 rounded-full bg-[#C62828] text-white flex items-center justify-center font-bold text-xs">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-[#252525] leading-none">
              {user?.fullName || 'Admin'}
            </span>
            <span className="text-[10px] text-[#666666]">Administrator</span>
          </div>
          <Badge variant="primary" size="sm" className="hidden lg:inline-flex">
            <Shield className="w-3 h-3 mr-1" /> Verified Admin
          </Badge>
        </div>
      </div>
    </header>
  );
};
