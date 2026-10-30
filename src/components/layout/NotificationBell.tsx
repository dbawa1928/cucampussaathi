import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Calendar,
  Video,
  XCircle,
  AlertCircle,
  Trash2,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import { useSocket, type NotificationItem } from '../../context/SocketContext';

export const NotificationBell: React.FC = () => {
  const {
    unreadCount,
    notifications,
    loadingNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter((n) =>
    filter === 'UNREAD' ? !n.isRead : true
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_ACCEPTED':
      case 'APPOINTMENT_RESCHEDULE_ACCEPTED':
        return <Check className="w-4 h-4 text-[#16845B]" />;
      case 'APPOINTMENT_REJECTED':
      case 'APPOINTMENT_RESCHEDULE_REJECTED':
        return <XCircle className="w-4 h-4 text-[#C62828]" />;
      case 'APPOINTMENT_CANCELLED':
        return <AlertCircle className="w-4 h-4 text-[#F59E0B]" />;
      case 'APPOINTMENT_COMPLETED':
        return <Sparkles className="w-4 h-4 text-[#C62828]" />;
      case 'CONSULTATION_REMINDER':
        return <Clock className="w-4 h-4 text-[#C62828]" />;
      case 'MEETING_LINK_ADDED':
        return <Video className="w-4 h-4 text-[#C62828]" />;
      case 'APPOINTMENT_RESCHEDULE_REQUESTED':
        return <CalendarClock className="w-4 h-4 text-[#C62828]" />;
      default:
        return <Calendar className="w-4 h-4 text-[#C62828]" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.isRead) {
      markAsRead(n._id);
    }
    setIsOpen(false);
    navigate('/appointments');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        id="notification-bell-btn"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-[#666666] hover:text-[#C62828] hover:bg-[#FFF7F7] border border-[#E7DADA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C62828]/40 cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C62828] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-150">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#E7DADA] shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-[#E7DADA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#252525]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7F7] text-[#C62828] border border-[#E7DADA]">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#C62828] hover:text-[#8E1717] hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 px-4 py-2 bg-[#FFF7F7] border-b border-[#E7DADA] text-xs">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-white text-[#C62828] shadow-xs border border-[#E7DADA]'
                  : 'text-[#666666] hover:text-[#252525]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-white text-[#C62828] shadow-xs border border-[#E7DADA]'
                  : 'text-[#666666] hover:text-[#252525]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E7DADA]/60">
            {loadingNotifications && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#666666]">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[#FFF7F7] text-[#C62828] border border-[#E7DADA] flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#252525]">You are all caught up!</p>
                <p className="text-[11px] text-[#666666] mt-0.5">
                  {filter === 'UNREAD' ? 'No unread notifications' : 'No notifications in your inbox'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                    n.isRead ? 'hover:bg-[#FFF7F7]' : 'bg-[#FFF7F7]/60 hover:bg-[#FFF7F7]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E7DADA] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs truncate ${n.isRead ? 'font-medium text-[#252525]' : 'font-bold text-[#252525]'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-[#999999] shrink-0">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#C62828] shrink-0" title="Unread" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#999999] hover:text-[#C62828] rounded transition-opacity cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#FFF7F7] border-t border-[#E7DADA] text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/appointments');
              }}
              className="text-xs font-semibold text-[#C62828] hover:text-[#8E1717] hover:underline cursor-pointer"
            >
              View Consultation Hub &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
