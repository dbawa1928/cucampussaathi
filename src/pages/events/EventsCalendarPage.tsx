import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  Search,
  Filter,
  Clock,
  Sparkles,
  PlusCircle,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { eventsApi, type CampusEventItem, type EventCategory, type EventMode } from '../../api/eventsApi';
import { EventCard } from '../../components/events/EventCard';
import { CreateEventModal } from '../../components/events/CreateEventModal';

type CalendarView = 'MONTH' | 'WEEK' | 'LIST';

const CATEGORIES: EventCategory[] = [
  'Workshops',
  'Seminars',
  'Guest Lectures',
  'Webinars',
  'Hackathons',
  'Competitions',
  'Technical Events',
  'Cultural Events',
  'Sports Events',
  'Placement & Career Events',
  'Club Activities',
  'Faculty Events',
  'Other',
];

export const EventsCalendarPage: React.FC = () => {
  const { user } = useAuth();

  // View & Date Navigation State
  const [view, setView] = useState<CalendarView>('MONTH');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'UPCOMING' | 'PAST' | 'ALL'>('UPCOMING');

  // Data State
  const [events, setEvents] = useState<CampusEventItem[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<CampusEventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Teacher / Admin Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // Fetch Events
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eventsRes, featuredRes] = await Promise.all([
        eventsApi.getPublicEvents({
          category: selectedCategory !== 'ALL' ? (selectedCategory as EventCategory) : undefined,
          mode: selectedMode !== 'ALL' ? (selectedMode as EventMode) : undefined,
          search: searchQuery.trim() || undefined,
          timeframe: timeframe === 'PAST' ? 'PAST' : timeframe === 'UPCOMING' ? 'UPCOMING' : 'ALL',
          limit: 100,
        }),
        eventsApi.getFeaturedEvents(),
      ]);

      if (eventsRes && eventsRes.events) {
        setEvents(eventsRes.events);
      }
      if (featuredRes) {
        setFeaturedEvents(featuredRes);
      }
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setError(err?.response?.data?.message || 'Unable to load events calendar');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedMode, timeframe]);

  // Handle Search submit / debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  // Date Navigation Helpers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (view === 'MONTH') {
      next.setMonth(next.getMonth() - 1);
    } else if (view === 'WEEK') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (view === 'MONTH') {
      next.setMonth(next.getMonth() + 1);
    } else if (view === 'WEEK') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Header Title
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const currentMonthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Month View Grid Generation
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill 5 or 6 weeks (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Week View Days (7 days of currently focused week)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Sunday

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Map events by date string (YYYY-MM-DD) for instant calendar lookup
  const eventsByDate = useMemo(() => {
    const map: Record<string, CampusEventItem[]> = {};
    events.forEach((ev) => {
      const d = new Date(ev.startDateTime);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ev);
    });
    return map;
  }, [events]);

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      {/* Top University Hero Section */}
      <div className="bg-white border-b border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF7F7] border border-[#C62828]/20 text-xs font-bold text-[#C62828] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chandigarh University Campus Life</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#252525] tracking-tight">
                Campus <span className="text-[#C62828]">Events Calendar</span>
              </h1>
              <p className="text-sm sm:text-base text-[#666666] mt-1.5 max-w-2xl">
                Discover workshops, guest lectures, technical hackathons, cultural festivals, and faculty sessions across university blocks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isTeacherOrAdmin && (
                <>
                  <Link
                    to="/events/manage"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E7DADA] bg-white text-xs sm:text-sm font-bold text-[#252525] hover:bg-[#FFF7F7] hover:border-[#C62828]/30 transition-all shadow-xs"
                  >
                    <Settings className="w-4 h-4 text-[#C62828]" />
                    <span>Manage Events</span>
                  </Link>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C62828] hover:bg-[#8E1717] text-xs sm:text-sm font-bold text-white transition-all shadow-sm shadow-[#C62828]/20"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Create Event</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Featured Events Banner (if available) */}
        {featuredEvents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#252525] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C62828]" />
                <span>Featured Campus Highlights</span>
              </h2>
              <span className="text-xs font-semibold text-[#666666]">Handpicked university events</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Controls Bar: Navigation, Search, Views */}
        <div className="bg-white rounded-2xl border border-[#E7DADA] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Date Navigators */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#FFF7F7] border border-[#E7DADA] rounded-xl p-1 shadow-xs">
                <button
                  onClick={handlePrev}
                  className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors"
                  aria-label="Previous"
                  title="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 py-1 text-xs font-bold text-[#C62828] hover:bg-white rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors"
                  aria-label="Next"
                  title="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-[#252525] tracking-tight">
                {currentMonthYear}
              </h2>
            </div>

            {/* Live Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, organizer, or venue..."
                className="w-full pl-10 pr-20 py-2 text-xs sm:text-sm bg-[#FFF7F7]/50 border border-[#E7DADA] rounded-xl focus:bg-white focus:outline-none focus:border-[#C62828] transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#C62828] text-white rounded-lg text-xs font-bold hover:bg-[#8E1717] transition-colors"
              >
                Search
              </button>
            </form>

            {/* View Switchers */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#FFF7F7] border border-[#E7DADA] rounded-xl p-1">
                <button
                  onClick={() => setView('MONTH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    view === 'MONTH'
                      ? 'bg-white text-[#C62828] shadow-xs border border-[#E7DADA]'
                      : 'text-[#666666] hover:text-[#252525]'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Month</span>
                </button>
                <button
                  onClick={() => setView('WEEK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    view === 'WEEK'
                      ? 'bg-white text-[#C62828] shadow-xs border border-[#E7DADA]'
                      : 'text-[#666666] hover:text-[#252525]'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Week</span>
                </button>
                <button
                  onClick={() => setView('LIST')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    view === 'LIST'
                      ? 'bg-white text-[#C62828] shadow-xs border border-[#E7DADA]'
                      : 'text-[#666666] hover:text-[#252525]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills (Category, Mode, Timeframe) */}
          <div className="pt-3 border-t border-[#E7DADA] flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Category selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
              <span className="font-bold text-[#666666] shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#C62828]" />
                <span>Categories:</span>
              </span>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#C62828] text-white shadow-xs'
                    : 'bg-[#FFF7F7] text-[#666666] hover:bg-gray-100 border border-[#E7DADA]'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full font-semibold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#C62828] text-white shadow-xs'
                      : 'bg-[#FFF7F7] text-[#666666] hover:bg-gray-100 border border-[#E7DADA]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Mode & Timeframe options */}
            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                aria-label="Filter events by mode"
                className="px-2.5 py-1 bg-[#FFF7F7] border border-[#E7DADA] rounded-lg font-semibold text-[#252525] focus:outline-none focus:border-[#C62828]"
              >
                <option value="ALL">All Modes</option>
                <option value="OFFLINE">Offline (In-Campus)</option>
                <option value="ONLINE">Online (Virtual)</option>
              </select>

              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                aria-label="Filter events by timeframe"
                className="px-2.5 py-1 bg-[#FFF7F7] border border-[#E7DADA] rounded-lg font-semibold text-[#252525] focus:outline-none focus:border-[#C62828]"
              >
                <option value="UPCOMING">Upcoming Events</option>
                <option value="PAST">Past Events</option>
                <option value="ALL">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* CALENDAR BODY */}
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-[#E7DADA] p-12 text-center shadow-xs">
            <div className="w-10 h-10 border-3 border-[#C62828] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-[#666666]">Loading campus events...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={fetchEvents}
              className="mt-3 px-4 py-1.5 bg-[#C62828] text-white text-xs font-bold rounded-lg hover:bg-[#8E1717]"
            >
              Retry
            </button>
          </div>
        ) : view === 'MONTH' ? (
          /* MONTH VIEW GRID */
          <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xs overflow-hidden">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-[#E7DADA] bg-[#FFF7F7] text-center text-xs font-bold text-[#666666] py-3">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 auto-rows-[120px] sm:auto-rows-[140px] divide-x divide-y divide-[#E7DADA]">
              {calendarGrid.map((dayItem, index) => {
                const dateKey = `${dayItem.date.getFullYear()}-${String(dayItem.date.getMonth() + 1).padStart(2, '0')}-${String(dayItem.date.getDate()).padStart(2, '0')}`;
                const dayEvents = eventsByDate[dateKey] || [];
                const currentDay = isToday(dayItem.date);

                return (
                  <div
                    key={index}
                    className={`p-1.5 sm:p-2 flex flex-col justify-between transition-colors overflow-hidden ${
                      dayItem.isCurrentMonth ? 'bg-white hover:bg-gray-50/60' : 'bg-gray-50/70 text-gray-400'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          currentDay
                            ? 'bg-[#C62828] text-white shadow-xs'
                            : dayItem.isCurrentMonth
                            ? 'text-gray-800'
                            : 'text-gray-400'
                        }`}
                      >
                        {dayItem.date.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-black text-[#C62828] sm:hidden">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Pill Tags */}
                    <div className="flex-1 space-y-1 overflow-y-auto scrollbar-none max-h-[85px] sm:max-h-[100px]">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const isCancelled = ev.status === 'CANCELLED';
                        return (
                          <Link
                            key={ev._id}
                            to={`/events/${ev._id}`}
                            className={`block px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border transition-transform hover:scale-[1.02] ${
                              isCancelled
                                ? 'bg-gray-100 text-gray-500 line-through border-gray-200'
                                : 'bg-[#FFF7F7] text-[#C62828] border-[#C62828]/20 hover:bg-[#C62828] hover:text-white'
                            }`}
                            title={`${ev.title} - ${ev.category} (${new Date(ev.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                          >
                            <span className="font-bold mr-1">
                              {new Date(ev.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {ev.title}
                          </Link>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="block text-[9px] font-bold text-[#666666] text-center">
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : view === 'WEEK' ? (
          /* WEEK VIEW */
          <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xs overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[#E7DADA] bg-[#FFF7F7] text-center py-3">
              {weekDays.map((d, idx) => {
                const currentDay = isToday(d);
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-full mt-0.5 ${
                        currentDay ? 'bg-[#C62828] text-white shadow-xs' : 'text-gray-900'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-7 min-h-[380px] divide-x divide-[#E7DADA]">
              {weekDays.map((d, idx) => {
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const dayEvents = eventsByDate[dateKey] || [];

                return (
                  <div key={idx} className="p-2 space-y-2 bg-white">
                    {dayEvents.length === 0 ? (
                      <p className="text-[11px] text-gray-300 text-center pt-8 italic">No events</p>
                    ) : (
                      dayEvents.map((ev) => (
                        <Link
                          key={ev._id}
                          to={`/events/${ev._id}`}
                          className="block p-2 rounded-xl bg-[#FFF7F7] border border-[#C62828]/20 hover:border-[#C62828] transition-all hover:shadow-xs group"
                        >
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white border border-[#C62828]/20 text-[#C62828] mb-1">
                            {ev.category}
                          </span>
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#C62828] transition-colors line-clamp-2">
                            {ev.title}
                          </h4>
                          <div className="mt-1 flex items-center text-[10px] text-gray-500 gap-1">
                            <Clock className="w-3 h-3 text-[#C62828]" />
                            <span>{new Date(ev.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E7DADA] p-12 text-center shadow-xs">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">No events found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  There are no scheduled events matching your current filters or date range. Check back later or adjust filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teacher / Admin Create Event Modal */}
      {isTeacherOrAdmin && (
        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
};
