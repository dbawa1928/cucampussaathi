import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Share2,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Mail,
  Phone,
  UserCheck,
  Building,
  ExternalLink,
  Edit,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { eventsApi, type CampusEventItem } from '../../api/eventsApi';
import { generateAndDownloadIcs } from '../../utils/calendarIcs';
import { getCategoryColor } from '../../components/events/EventCard';
import { CreateEventModal } from '../../components/events/CreateEventModal';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<CampusEventItem | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Registration loading states
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Edit Modal for organizer / admin
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Share feedback
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  const fetchEventData = async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const eventData = await eventsApi.getEventById(eventId);
      if (eventData) {
        setEvent(eventData);
        setIsRegistered(Boolean(eventData.isRegistered));
      } else {
        setError('Event not found or has been removed');
      }
    } catch (err: any) {
      console.error('Failed to load event:', err);
      setError(err?.response?.data?.message || 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const handleRegister = async () => {
    if (!user) {
      // Direct visitor to login with redirect back to this event
      navigate(`/login?redirect=/events/${eventId}`);
      return;
    }

    if (!eventId) return;
    setIsRegistering(true);
    setRegError(null);
    setRegSuccess(null);
    try {
      const reg = await eventsApi.registerForEvent(eventId);
      if (reg) {
        setIsRegistered(true);
        setRegSuccess('You have successfully registered for this event!');
        // Refresh event data to update registered count
        fetchEventData();
      }
    } catch (err: any) {
      setRegError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!eventId || !window.confirm('Are you sure you want to cancel your registration?')) return;
    setIsRegistering(true);
    setRegError(null);
    setRegSuccess(null);
    try {
      const res = await eventsApi.unregisterFromEvent(eventId);
      if (res.success) {
        setIsRegistered(false);
        setRegSuccess('Your registration has been cancelled.');
        fetchEventData();
      }
    } catch (err: any) {
      setRegError(err?.response?.data?.message || 'Failed to cancel registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    const shareData = {
      title: event.title,
      text: `${event.title} - ${event.category} at Chandigarh University`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // Share cancelled or not supported
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    generateAndDownloadIcs(event);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF7F7]/60 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#C62828] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-base font-bold text-gray-800">Loading event details...</h2>
          <p className="text-xs text-gray-500 mt-1">Fetching campus schedule and seat availability</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#FFF7F7]/60 py-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-[#E7DADA] p-8 text-center shadow-xs">
          <AlertCircle className="w-12 h-12 text-[#C62828] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Event Unavailable</h2>
          <p className="text-xs text-gray-600 mb-6">{error || 'This campus event could not be found.'}</p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C62828] text-white text-xs font-bold hover:bg-[#8E1717] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Events Calendar</span>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startDateTime);
  const endDate = new Date(event.endDateTime);
  const isCancelled = event.status === 'CANCELLED';
  const isPast = endDate < new Date() || event.status === 'COMPLETED';
  const isOrganizer = user && (event.createdBy?._id === user._id || user.role === 'ADMIN');
  const isFull = event.capacity > 0 ? event.registeredCount >= event.capacity : false;
  const isDeadlinePassed = event.registrationDeadline ? new Date(event.registrationDeadline) < new Date() : false;

  const dateFormatted = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      {/* Back button bar */}
      <div className="bg-white border-b border-[#E7DADA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#666666] hover:text-[#C62828] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Campus Events</span>
          </Link>

          <div className="flex items-center gap-2">
            {isOrganizer && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7DADA] bg-white text-xs font-bold text-[#252525] hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-[#C62828]" />
                <span>Edit Event</span>
              </button>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7DADA] bg-white text-xs font-bold text-[#252525] hover:bg-gray-50 transition-colors"
              title="Share event link"
            >
              <Share2 className="w-3.5 h-3.5 text-[#C62828]" />
              <span>{shareSuccess ? 'Copied Link!' : 'Share'}</span>
            </button>
            <button
              onClick={handleAddToCalendar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF7F7] border border-[#C62828]/20 text-xs font-bold text-[#C62828] hover:bg-[#C62828] hover:text-white transition-all"
              title="Download iCal (.ics) for Google Calendar or Apple Calendar"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Add to Calendar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6">
        {/* Cancellation Notice Banner */}
        {isCancelled && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-red-900 shadow-xs">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-red-900">
                This Campus Event Has Been Cancelled
              </h3>
              <p className="text-xs sm:text-sm text-red-700 mt-1">
                {event.cancellationReason || 'No specific cancellation remarks were provided by the organizer.'}
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xs overflow-hidden">
          {event.bannerUrl && (
            <div className="w-full h-64 sm:h-80 relative overflow-hidden bg-gray-100">
              <img
                src={event.bannerUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getCategoryColor(event.category)}`}>
                {event.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                {event.mode === 'ONLINE' ? 'Virtual • Online' : 'In-Person • Campus'}
              </span>
              {event.isFeatured && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Featured</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#252525] tracking-tight">
              {event.title}
            </h1>

            <p className="text-sm sm:text-base text-gray-600 mt-2 leading-relaxed">
              {event.shortDescription}
            </p>

            {/* Quick Meta Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#E7DADA]">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FFF7F7]/60 border border-[#E7DADA]">
                <Calendar className="w-5 h-5 text-[#C62828] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    Date & Day
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 block">
                    {dateFormatted}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FFF7F7]/60 border border-[#E7DADA]">
                <Clock className="w-5 h-5 text-[#C62828] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    Scheduled Time
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 block">
                    {timeFormatted}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FFF7F7]/60 border border-[#E7DADA]">
                {event.mode === 'ONLINE' ? (
                  <Video className="w-5 h-5 text-[#C62828] shrink-0 mt-0.5" />
                ) : (
                  <MapPin className="w-5 h-5 text-[#C62828] shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    Location & Venue
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 block">
                    {event.mode === 'ONLINE'
                      ? event.onlinePlatform || 'Online Video Meeting'
                      : `${event.campusBlock || 'Campus Block'}, ${event.venue || 'Main Hall'}${event.roomNumber ? ` (Room ${event.roomNumber})` : ''}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content & Action Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Full Description Card */}
            <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-extrabold text-[#252525] mb-4">
                About this Event
              </h2>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {event.description}
              </div>

              {event.additionalInstructions && (
                <div className="mt-6 p-4 rounded-2xl bg-[#FFF7F7] border border-[#C62828]/20">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#C62828] mb-1">
                    Participant Guidelines & Instructions
                  </h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {event.additionalInstructions}
                  </p>
                </div>
              )}
            </div>

            {/* Speaker Card (if available) */}
            {event.speakerDetails && event.speakerDetails.name && (
              <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
                <h2 className="text-lg font-extrabold text-[#252525] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C62828]" />
                  <span>Featured Speaker</span>
                </h2>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF7F7] border border-[#C62828]/20 text-[#C62828] flex items-center justify-center font-black text-lg shrink-0">
                    {event.speakerDetails.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{event.speakerDetails.name}</h3>
                    {event.speakerDetails.designation && (
                      <p className="text-xs font-semibold text-gray-600">{event.speakerDetails.designation}</p>
                    )}
                    {event.speakerDetails.organization && (
                      <p className="text-xs text-gray-500">{event.speakerDetails.organization}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Online Access Details (for registered participants) */}
            {event.mode === 'ONLINE' && (
              <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 shadow-xs">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#C62828]" />
                  <span>Virtual Meeting Access</span>
                </h3>
                {isRegistered || isOrganizer ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    <p className="font-bold mb-1.5">You have access to this virtual meeting link:</p>
                    {event.publicMeetingUrl ? (
                      <a
                        href={event.publicMeetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 transition-colors"
                      >
                        <span>Join Meeting ({event.onlinePlatform || 'Link'})</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <p className="italic text-gray-500">Meeting link will be activated closer to the start time.</p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
                    <p>Meeting link and credentials become visible upon registering for this event.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action / Registration Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 shadow-xs space-y-5">
              <h3 className="text-base font-extrabold text-[#252525]">
                Event Registration
              </h3>

              {/* Capacity & seats */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#C62828]" />
                    <span>Seat Availability</span>
                  </span>
                  <span className="font-extrabold text-gray-900">
                    {event.registeredCount} / {event.capacity || 'Unlimited'}
                  </span>
                </div>
                {event.capacity > 0 && (
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C62828] rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((event.registeredCount / event.capacity) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {event.registrationDeadline && (
                <div className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Deadline: </span>
                  {new Date(event.registrationDeadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              )}

              {/* Notification Alerts */}
              {regError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}
              {regSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{regSuccess}</span>
                </div>
              )}

              {/* Action Buttons */}
              {isCancelled ? (
                <div className="p-3 text-center bg-gray-100 rounded-xl text-xs font-bold text-gray-500">
                  Registration is closed for cancelled events
                </div>
              ) : isPast ? (
                <div className="p-3 text-center bg-gray-100 rounded-xl text-xs font-bold text-gray-500">
                  This event has ended
                </div>
              ) : !user ? (
                /* Visitor: prompted to login to complete registration */
                <div className="space-y-2">
                  <button
                    onClick={handleRegister}
                    className="w-full py-3 px-4 rounded-xl bg-[#C62828] hover:bg-[#8E1717] text-white text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#C62828]/20 flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Sign In to Register</span>
                  </button>
                  <p className="text-[11px] text-gray-500 text-center">
                    Chandigarh University account required to reserve a seat.
                  </p>
                </div>
              ) : isRegistered ? (
                /* Already Registered */
                <div className="space-y-2.5">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You are registered for this event</span>
                  </div>
                  <button
                    onClick={handleUnregister}
                    disabled={isRegistering}
                    className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isRegistering ? 'Processing...' : 'Cancel Registration'}
                  </button>
                </div>
              ) : isFull ? (
                <div className="p-3 text-center bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
                  Capacity reached. Event is fully booked.
                </div>
              ) : isDeadlinePassed ? (
                <div className="p-3 text-center bg-gray-100 rounded-xl text-xs font-bold text-gray-500">
                  Registration deadline has passed.
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="w-full py-3 px-4 rounded-xl bg-[#C62828] hover:bg-[#8E1717] text-white text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#C62828]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRegistering ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Register for Event</span>
                </button>
              )}
            </div>

            {/* Organizer & Support Card */}
            <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                Organized By
              </h3>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF7F7] border border-[#C62828]/20 text-[#C62828] flex items-center justify-center font-black">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{event.organizerName}</h4>
                  <p className="text-[11px] text-gray-500">Chandigarh University</p>
                </div>
              </div>

              {(event.contactEmail || event.contactPhone) && (
                <div className="pt-3 border-t border-[#E7DADA] space-y-2 text-xs text-gray-600">
                  {event.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#C62828]" />
                      <a href={`mailto:${event.contactEmail}`} className="hover:underline">
                        {event.contactEmail}
                      </a>
                    </div>
                  )}
                  {event.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#C62828]" />
                      <span>{event.contactPhone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal for organizer / admin */}
      {isOrganizer && (
        <CreateEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchEventData();
          }}
          initialData={event}
        />
      )}
    </div>
  );
};
