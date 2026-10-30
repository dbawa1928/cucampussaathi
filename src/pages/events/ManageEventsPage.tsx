import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  PlusCircle,
  Edit,
  Trash2,
  XCircle,
  CheckCircle,
  Eye,
  Users,
  Clock,
  MapPin,
  Video,
  AlertCircle,
  Loader2,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  eventsApi,
  type CampusEventItem,
  type EventStats,
  type EventRegistrationItem,
} from '../../api/eventsApi';
import { CreateEventModal } from '../../components/events/CreateEventModal';
import { getCategoryColor } from '../../components/events/EventCard';

export const ManageEventsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Role Guard
  useEffect(() => {
    if (user && user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      navigate('/events');
    }
  }, [user, navigate]);

  // States
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'CANCELLED' | 'COMPLETED'>('ALL');
  const [events, setEvents] = useState<CampusEventItem[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CampusEventItem | null>(null);

  // Cancel Modal
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Attendees Modal
  const [viewingAttendeesEvent, setViewingAttendeesEvent] = useState<CampusEventItem | null>(null);
  const [attendees, setAttendees] = useState<EventRegistrationItem[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState<boolean>(false);

  const fetchManagedEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await eventsApi.getMyEvents();
      if (res) {
        setEvents(res.events || []);
        setStats(res.stats || null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load your events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagedEvents();
  }, []);

  // Filtered Events by tab
  const filteredEvents = events.filter((ev) => {
    if (activeTab === 'ALL') return true;
    return ev.status === activeTab;
  });

  // Handle Publish draft
  const handlePublish = async (id: string) => {
    try {
      await eventsApi.publishEvent(id);
      fetchManagedEvents();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to publish event');
    }
  };

  // Handle Cancel Event
  const handleConfirmCancel = async () => {
    if (!cancellingEventId || !cancellationReason.trim()) return;
    setIsCancelling(true);
    try {
      await eventsApi.cancelEvent(cancellingEventId, cancellationReason.trim());
      setCancellingEventId(null);
      setCancellationReason('');
      fetchManagedEvents();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to cancel event');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Delete Draft
  const handleDeleteDraft = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this draft event? This cannot be undone.')) return;
    try {
      await eventsApi.deleteDraft(id);
      fetchManagedEvents();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete draft');
    }
  };

  // Open Attendees Modal
  const handleOpenAttendees = async (event: CampusEventItem) => {
    setViewingAttendeesEvent(event);
    setIsLoadingAttendees(true);
    try {
      const res = await eventsApi.getEventRegistrations(event._id);
      if (res && res.registrations) {
        setAttendees(res.registrations);
      }
    } catch (err: any) {
      console.error('Failed to load attendees:', err);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link
                to="/events"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#666666] hover:text-[#C62828] mb-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Public Calendar</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#252525] tracking-tight">
                Event Management Portal
              </h1>
              <p className="text-xs sm:text-sm text-[#666666] mt-1">
                Manage, publish, track attendee lists, and coordinate your department's campus sessions.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingEvent(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C62828] hover:bg-[#8E1717] text-white text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#C62828]/20 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create Event</span>
            </button>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-[#E7DADA]">
              <div className="p-3 bg-[#FFF7F7] rounded-xl border border-[#E7DADA]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Total Events
                </span>
                <span className="text-lg font-black text-gray-900 mt-0.5 block">
                  {stats.totalEvents}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Published
                </span>
                <span className="text-lg font-black text-emerald-900 mt-0.5 block">
                  {stats.publishedCount}
                </span>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  Drafts
                </span>
                <span className="text-lg font-black text-amber-900 mt-0.5 block">
                  {stats.draftCount}
                </span>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Upcoming
                </span>
                <span className="text-lg font-black text-blue-900 mt-0.5 block">
                  {stats.upcomingCount}
                </span>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                  Total Registrations
                </span>
                <span className="text-lg font-black text-rose-900 mt-0.5 block">
                  {stats.totalRegistrations}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Tab Filters */}
        <div className="bg-white rounded-2xl border border-[#E7DADA] p-2 shadow-xs flex flex-wrap gap-1.5 text-xs">
          {(['ALL', 'PUBLISHED', 'DRAFT', 'CANCELLED', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                activeTab === tab
                  ? 'bg-[#C62828] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-[#FFF7F7]'
              }`}
            >
              {tab === 'ALL' ? 'All Events' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Event List */}
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-[#E7DADA] p-12 text-center shadow-xs">
            <div className="w-10 h-10 border-3 border-[#C62828] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-600">Loading your events...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E7DADA] p-12 text-center shadow-xs">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No events found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
              You do not have any events in this tab. Click below to draft or publish your first campus session.
            </p>
            <button
              onClick={() => {
                setEditingEvent(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C62828] text-white text-xs font-bold hover:bg-[#8E1717]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xs overflow-hidden">
            <div className="divide-y divide-[#E7DADA]">
              {filteredEvents.map((ev) => {
                const startDate = new Date(ev.startDateTime);
                return (
                  <div key={ev._id} className="p-5 sm:p-6 hover:bg-[#FFF7F7]/40 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getCategoryColor(ev.category)}`}>
                            {ev.category}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              ev.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ev.status === 'DRAFT'
                                ? 'bg-amber-100 text-amber-800'
                                : ev.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {ev.status}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-semibold text-gray-600">
                            {ev.mode === 'ONLINE' ? 'Virtual Online' : 'In-Campus Offline'}
                          </span>
                        </div>

                        <Link
                          to={`/events/${ev._id}`}
                          className="text-base sm:text-lg font-bold text-gray-900 hover:text-[#C62828] transition-colors block"
                        >
                          {ev.title}
                        </Link>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#C62828]" />
                            <span>
                              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>

                          <span className="flex items-center gap-1.5">
                            {ev.mode === 'ONLINE' ? (
                              <Video className="w-3.5 h-3.5 text-[#C62828]" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-[#C62828]" />
                            )}
                            <span>
                              {ev.mode === 'ONLINE' ? ev.onlinePlatform || 'Virtual' : `${ev.campusBlock || ''} ${ev.venue || ''}`}
                            </span>
                          </span>

                          <button
                            onClick={() => handleOpenAttendees(ev)}
                            className="flex items-center gap-1.5 font-bold text-[#C62828] hover:underline"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>
                              {ev.registeredCount} / {ev.capacity || '∞'} Attendees
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                        <Link
                          to={`/events/${ev._id}`}
                          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-white text-xs font-bold transition-colors"
                          title="View Public Page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => {
                            setEditingEvent(ev);
                            setIsCreateModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:text-[#C62828] hover:bg-white text-xs font-bold transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {ev.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => handlePublish(ev._id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Publish</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(ev._id)}
                              className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs transition-colors"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {ev.status === 'PUBLISHED' && (
                          <button
                            onClick={() => {
                              setCancellingEventId(ev._id);
                              setCancellationReason('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel Event</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Reason Modal */}
      {cancellingEventId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E7DADA] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>Cancel Campus Event</span>
            </h3>
            <p className="text-xs text-gray-600">
              Provide a clear reason for cancellation. All registered participants will receive notifications.
            </p>
            <textarea
              rows={3}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Postponed due to university exams, rescheduled venue, speaker unavailable..."
              className="w-full p-3 rounded-xl border border-[#E7DADA] text-xs focus:outline-none focus:border-red-600"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingEventId(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!cancellationReason.trim() || isCancelling}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendees List Modal */}
      {viewingAttendeesEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E7DADA] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-5 border-b border-[#E7DADA] flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Registered Attendees
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {viewingAttendeesEvent.title} ({attendees.length} confirmed)
                </p>
              </div>
              <button
                onClick={() => setViewingAttendeesEvent(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {isLoadingAttendees ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#C62828] mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Loading attendee roster...</p>
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  No registrations have been recorded for this event yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                  {attendees.map((reg) => (
                    <div key={reg._id} className="p-3.5 bg-white flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-gray-900">{reg.user.fullName}</h4>
                        <p className="text-[11px] text-gray-500">{reg.user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20">
                          {reg.user.role}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(reg.registeredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingEvent(null);
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setEditingEvent(null);
          fetchManagedEvents();
        }}
        initialData={editingEvent}
      />
    </div>
  );
};
