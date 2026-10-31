import React, { useState, useEffect } from 'react';
import { Info, AlertTriangle, X, Megaphone } from 'lucide-react';
import { apiClient } from '../../api/client';

interface AnnouncementData {
  enabled: boolean;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
}

export const AnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAnnouncement = async () => {
      try {
        const res = await apiClient.get<any>('/public/announcement');
        if (
          isMounted &&
          res.data?.announcementBanner?.enabled &&
          res.data.announcementBanner.message
        ) {
          setAnnouncement(res.data.announcementBanner);
        }
      } catch {
        // Silently ignore if not configured
      }
    };

    fetchAnnouncement();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!announcement || !announcement.enabled || isDismissed) {
    return null;
  }

  const getTypeStyles = () => {
    switch (announcement.type) {
      case 'WARNING':
        return {
          bg: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
          icon: <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />,
          badge: 'bg-[#FDE68A] text-[#92400E]',
          label: 'Campus Notice',
        };
      case 'ALERT':
        return {
          bg: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
          icon: <Megaphone className="w-4 h-4 text-[#DC2626] shrink-0" />,
          badge: 'bg-[#FEE2E2] text-[#991B1B]',
          label: 'Urgent Announcement',
        };
      case 'INFO':
      default:
        return {
          bg: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]',
          icon: <Info className="w-4 h-4 text-[#2563EB] shrink-0" />,
          badge: 'bg-[#DBEAFE] text-[#1E40AF]',
          label: 'University Update',
        };
    }
  };

  const style = getTypeStyles();

  return (
    <div
      role="alert"
      className={`relative z-40 border-b px-4 py-2.5 text-xs sm:text-sm font-medium transition-all ${style.bg}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {style.icon}
          <span
            className={`hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${style.badge}`}
          >
            {style.label}
          </span>
          <span className="truncate">{announcement.message}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-md hover:bg-black/5 text-current shrink-0 transition-colors cursor-pointer"
          aria-label="Dismiss banner"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
