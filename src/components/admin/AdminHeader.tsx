import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ExternalLink,
  Menu,
  Search,
  X,
  User,
  CalendarCheck,
  Calendar,
  BookOpen,
  MessageSquare,
  LogOut,
  ChevronRight,
  Bell,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient, type ApiResponse } from '../../api/client';
import { Badge } from '../ui/Badge';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onMobileToggle?: () => void;
  onSelectUser?: (userId: string) => void;
  onNavigateTab?: (tab: string) => void;
  pendingTotal?: number;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  onMobileToggle,
  onSelectUser,
  onNavigateTab,
  pendingTotal = 0,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiClient.get<ApiResponse<any>>(
          `/admin/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.data) {
          setSearchResults(res.data);
          setIsSearchOpen(true);
        }
      } catch (err) {
        console.error('Admin search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <header className="bg-white border-b border-[#E7DADA] px-6 py-3.5 flex items-center justify-between shadow-2xs relative z-40">
      {/* Left: Mobile Toggle & Breadcrumb Title */}
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
          <div className="flex items-center gap-1.5 text-[11px] text-[#666666] font-medium">
            <span>Admin Console</span>
            <ChevronRight className="w-3 h-3 text-[#999999]" />
            <span className="text-[#C62828] font-bold">{title}</span>
          </div>
          <h1 className="text-lg font-black text-[#252525] tracking-tight">{title}</h1>
          {subtitle && <p className="text-[11px] text-[#666666]">{subtitle}</p>}
        </div>
      </div>

      {/* Middle: Universal Search Bar */}
      <div ref={searchContainerRef} className="relative hidden md:block max-w-md w-full mx-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults) setIsSearchOpen(true);
            }}
            placeholder="Universal search: users, appointments, events, groups..."
            className="w-full bg-[#FFF7F7] border border-[#E7DADA] rounded-xl pl-9 pr-8 py-2 text-xs text-[#252525] placeholder-[#888888] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#252525]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C62828]" />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchResults && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-[#E7DADA] shadow-xl p-3 max-h-96 overflow-y-auto space-y-3 z-50 animate-in fade-in-50 duration-150">
            {/* Users */}
            {searchResults.users?.length > 0 && (
              <div>
                <span className="text-[10px] font-black uppercase text-[#888888] tracking-wider px-2 block mb-1">
                  Users & Faculty
                </span>
                <div className="space-y-1">
                  {searchResults.users.map((u: any) => (
                    <button
                      key={u._id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        onSelectUser?.(u._id);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-[#FFF7F7] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#C62828]" />
                        <div>
                          <span className="font-bold text-[#252525] block">{u.fullName}</span>
                          <span className="text-[11px] text-[#666666]">{u.email} • {u.uid}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Appointments */}
            {searchResults.appointments?.length > 0 && (
              <div>
                <span className="text-[10px] font-black uppercase text-[#888888] tracking-wider px-2 block mb-1">
                  Consultation Appointments
                </span>
                <div className="space-y-1">
                  {searchResults.appointments.map((a: any) => (
                    <button
                      key={a._id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        onNavigateTab?.('appointments');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-[#FFF7F7] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                        <div>
                          <span className="font-bold text-[#252525] block truncate max-w-xs">{a.agenda}</span>
                          <span className="text-[11px] text-[#666666]">Student: {a.student?.fullName || 'N/A'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {a.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {searchResults.events?.length > 0 && (
              <div>
                <span className="text-[10px] font-black uppercase text-[#888888] tracking-wider px-2 block mb-1">
                  Campus Events
                </span>
                <div className="space-y-1">
                  {searchResults.events.map((ev: any) => (
                    <button
                      key={ev._id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        onNavigateTab?.('events');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-[#FFF7F7] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <div>
                          <span className="font-bold text-[#252525] block truncate max-w-xs">{ev.title}</span>
                          <span className="text-[11px] text-[#666666]">{ev.category} • {ev.mode}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700">
                        {ev.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Learn & Teach Listings */}
            {searchResults.listings?.length > 0 && (
              <div>
                <span className="text-[10px] font-black uppercase text-[#888888] tracking-wider px-2 block mb-1">
                  Teaching Skills
                </span>
                <div className="space-y-1">
                  {searchResults.listings.map((l: any) => (
                    <button
                      key={l._id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        onNavigateTab?.('learn-teach');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-[#FFF7F7] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <div>
                          <span className="font-bold text-[#252525] block">{l.skillName || 'Skill'}</span>
                          <span className="text-[11px] text-[#666666]">By: {l.user?.fullName}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                        {l.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Messages */}
            {searchResults.messages?.length > 0 && (
              <div>
                <span className="text-[10px] font-black uppercase text-[#888888] tracking-wider px-2 block mb-1">
                  Contact Messages
                </span>
                <div className="space-y-1">
                  {searchResults.messages.map((m: any) => (
                    <button
                      key={m._id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        onNavigateTab?.('communication');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-[#FFF7F7] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        <div>
                          <span className="font-bold text-[#252525] block truncate max-w-xs">{m.subject}</span>
                          <span className="text-[11px] text-[#666666]">From: {m.fullName} ({m.email})</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700">
                        {m.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!searchResults.users?.length &&
              !searchResults.appointments?.length &&
              !searchResults.events?.length &&
              !searchResults.listings?.length &&
              !searchResults.messages?.length) && (
              <div className="p-4 text-center text-xs text-[#888888]">
                No platform records matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions, Role Indicator, User Avatar, Logout */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs font-semibold text-[#666666] hover:text-[#C62828] hover:bg-[#FFF7F7] transition-all"
        >
          <span>Main Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Notification Bell Badge */}
        {pendingTotal > 0 && (
          <div className="relative">
            <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs" title={`${pendingTotal} actions pending review`}>
              <Bell className="w-3.5 h-3.5" />
            </span>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C62828] text-white text-[9px] font-bold flex items-center justify-center">
              {pendingTotal}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2.5 pl-3 border-l border-[#E7DADA]">
          <div className="w-8 h-8 rounded-full bg-[#C62828] text-white flex items-center justify-center font-black text-xs shadow-xs">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-[#252525] leading-none">
              {user?.fullName || 'Super Admin'}
            </span>
            <span className="text-[10px] text-[#666666] font-mono">
              {user?.adminRole || 'SUPER_ADMIN'}
            </span>
          </div>
          <Badge variant="primary" size="sm" className="hidden lg:inline-flex">
            <Shield className="w-3 h-3 mr-1" /> Verified Admin
          </Badge>

          <button
            onClick={handleLogout}
            title="Sign Out of Admin Console"
            className="p-1.5 rounded-xl text-[#666666] hover:text-red-700 hover:bg-red-50 transition-colors ml-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
