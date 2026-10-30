import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Video,
  Users,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { CampusEventItem } from '../../api/eventsApi';

interface EventCardProps {
  event: CampusEventItem;
}

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Hackathons':
    case 'Technical Events':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Workshops':
    case 'Seminars':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Guest Lectures':
    case 'Webinars':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Cultural Events':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'Sports Events':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Placement & Career Events':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-red-50 text-[#C62828] border-red-200';
  }
};

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const startDate = new Date(event.startDateTime);
  const isCancelled = event.status === 'CANCELLED';
  const isPast = new Date(event.endDateTime) < new Date() || event.status === 'COMPLETED';

  const dayStr = startDate.toLocaleDateString('en-US', { day: 'numeric' });
  const monthStr = startDate.toLocaleDateString('en-US', { month: 'short' });
  const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md group relative ${
        isCancelled
          ? 'border-gray-200 opacity-85'
          : 'border-[#E7DADA] hover:border-[#C62828]'
      }`}
    >
      {/* Top Banner or Date Header */}
      {event.bannerUrl ? (
        <div className="relative h-44 w-full overflow-hidden bg-gray-100">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute top-3 left-3 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs rounded-xl px-2.5 py-1.5 shadow-md border border-gray-100">
            <span className="text-[10px] font-black uppercase text-[#C62828] leading-none">
              {monthStr}
            </span>
            <span className="text-lg font-black text-gray-900 leading-tight">
              {dayStr}
            </span>
          </div>

          {isCancelled && (
            <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Cancelled
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 pb-0 flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex flex-col items-center justify-center bg-[#FFF7F7] border border-red-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-[#C62828] leading-none">
                {monthStr}
              </span>
              <span className="text-xl font-black text-gray-900 leading-tight">
                {dayStr}
              </span>
            </div>
            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryColor(
                  event.category
                )}`}
              >
                {event.category}
              </span>
            </div>
          </div>

          {isCancelled ? (
            <span className="bg-red-100 text-red-800 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Cancelled
            </span>
          ) : isPast ? (
            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Past Event
            </span>
          ) : null}
        </div>
      )}

      {/* Body details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {event.bannerUrl && (
            <div className="mb-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryColor(
                  event.category
                )}`}
              >
                {event.category}
              </span>
            </div>
          )}

          <h3
            className={`text-base font-bold leading-snug group-hover:text-[#C62828] transition-colors line-clamp-2 ${
              isCancelled ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {event.title}
          </h3>

          <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
            {event.shortDescription}
          </p>

          {/* Logistics chips */}
          <div className="mt-4 space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
              <span>{timeStr} IST</span>
            </div>

            <div className="flex items-center">
              {event.mode === 'ONLINE' ? (
                <>
                  <Video className="w-3.5 h-3.5 mr-2 text-blue-500 shrink-0" />
                  <span className="truncate">
                    {event.onlinePlatform || 'Online Event'}
                  </span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 mr-2 text-red-500 shrink-0" />
                  <span className="truncate">
                    {event.venue || 'Campus Venue'}
                    {event.campusBlock ? ` (${event.campusBlock})` : ''}
                  </span>
                </>
              )}
            </div>

            {event.registrationEnabled && (
              <div className="flex items-center text-[11px] text-gray-500 pt-0.5">
                <Users className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                <span>
                  {event.registeredCount} registered
                  {event.capacity > 0 ? ` / ${event.capacity} seats` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 truncate max-w-[130px]">
            By {event.organizerName}
          </span>

          <Link
            to={`/events/${event._id}`}
            className="inline-flex items-center text-xs font-bold text-[#C62828] hover:text-[#8E1717] group/link"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
