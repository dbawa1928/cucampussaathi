import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Video,
  AlertCircle,
  Loader2,
  Eye,
} from 'lucide-react';
import { eventsApi, type EventCategory, type EventMode } from '../../api/eventsApi';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // For editing
}

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

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [activeTab, setActiveTab] = useState<'FORM' | 'PREVIEW'>('FORM');

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState<EventCategory>(initialData?.category || 'Workshops');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [bannerUrl, setBannerUrl] = useState(initialData?.bannerUrl || '');

  // Default dates: tomorrow 10:00 to 12:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(
    initialData ? new Date(initialData.startDateTime).toISOString().split('T')[0] : defaultDateStr
  );
  const [startTime, setStartTime] = useState(
    initialData
      ? new Date(initialData.startDateTime).toTimeString().substring(0, 5)
      : '10:00'
  );

  const [endDate, setEndDate] = useState(
    initialData ? new Date(initialData.endDateTime).toISOString().split('T')[0] : defaultDateStr
  );
  const [endTime, setEndTime] = useState(
    initialData
      ? new Date(initialData.endDateTime).toTimeString().substring(0, 5)
      : '12:00'
  );

  const [mode, setMode] = useState<EventMode>(initialData?.mode || 'OFFLINE');
  const [campusBlock, setCampusBlock] = useState(initialData?.campusBlock || 'Block D3');
  const [venue, setVenue] = useState(initialData?.venue || '');
  const [roomNumber, setRoomNumber] = useState(initialData?.roomNumber || '');

  const [onlinePlatform, setOnlinePlatform] = useState(initialData?.onlinePlatform || 'Google Meet');
  const [publicMeetingUrl, setPublicMeetingUrl] = useState(initialData?.publicMeetingUrl || '');

  const [organizerName, setOrganizerName] = useState(initialData?.organizerName || '');
  const [organizerDepartment, setOrganizerDepartment] = useState(
    initialData?.organizerDepartment || 'Computer Science & Engineering'
  );

  const [speakerName, setSpeakerName] = useState(initialData?.speakerDetails?.name || '');
  const [speakerDesignation, setSpeakerDesignation] = useState(
    initialData?.speakerDetails?.designation || ''
  );
  const [speakerOrg, setSpeakerOrg] = useState(initialData?.speakerDetails?.organization || '');

  const [registrationEnabled, setRegistrationEnabled] = useState(
    initialData ? initialData.registrationEnabled : true
  );
  const [registrationDeadline, setRegistrationDeadline] = useState(
    initialData?.registrationDeadline
      ? new Date(initialData.registrationDeadline).toISOString().split('T')[0]
      : ''
  );
  const [capacity, setCapacity] = useState(initialData?.capacity || 0);

  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone || '');
  const [additionalInstructions, setAdditionalInstructions] = useState(
    initialData?.additionalInstructions || ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (publishImmediate: boolean) => {
    setError(null);

    // Validation
    if (!title.trim() || title.trim().length < 3) {
      setError('Event title must be at least 3 characters.');
      return;
    }
    if (!shortDescription.trim() || shortDescription.trim().length < 10) {
      setError('Short description must be at least 10 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setError('Full event description must be at least 20 characters.');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${endDate}T${endTime}:00`).toISOString();

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      setError('End date/time must be after start date/time.');
      return;
    }

    if (mode === 'OFFLINE' && (!venue.trim() || venue.trim().length < 2)) {
      setError('Please provide a campus venue for offline events.');
      return;
    }

    if (!organizerName.trim()) {
      setError('Organizer name is required.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        title: title.trim(),
        category,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        bannerUrl: bannerUrl.trim() || undefined,
        startDateTime,
        endDateTime,
        mode,
        campusBlock: mode === 'OFFLINE' ? campusBlock.trim() : undefined,
        venue: mode === 'OFFLINE' ? venue.trim() : undefined,
        roomNumber: mode === 'OFFLINE' ? roomNumber.trim() : undefined,
        onlinePlatform: mode === 'ONLINE' ? onlinePlatform.trim() : undefined,
        publicMeetingUrl: mode === 'ONLINE' ? publicMeetingUrl.trim() : undefined,
        organizerName: organizerName.trim(),
        organizerDepartment: organizerDepartment.trim() || undefined,
        speakerDetails: speakerName.trim()
          ? {
              name: speakerName.trim(),
              designation: speakerDesignation.trim() || undefined,
              organization: speakerOrg.trim() || undefined,
            }
          : undefined,
        registrationEnabled,
        registrationDeadline: registrationDeadline
          ? new Date(`${registrationDeadline}T23:59:59`).toISOString()
          : undefined,
        capacity: Number(capacity) || 0,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        additionalInstructions: additionalInstructions.trim() || undefined,
        status: publishImmediate ? 'PUBLISHED' : 'DRAFT',
      };

      if (initialData?._id) {
        await eventsApi.updateEvent(initialData._id, payload);
        if (publishImmediate && initialData.status !== 'PUBLISHED') {
          await eventsApi.publishEvent(initialData._id);
        }
      } else {
        await eventsApi.createEvent(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save event. Please check required fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E7DADA] relative animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#FFF7F7]/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#C62828] text-white rounded-xl shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {initialData ? 'Edit Campus Event' : 'Create & Publish Campus Event'}
              </h2>
              <p className="text-xs text-gray-500">
                Add an official workshop, guest lecture, competition, or hackathon.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('FORM')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'FORM'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                className={`px-3 py-1 rounded-md transition-all flex items-center ${
                  activeTab === 'PREVIEW'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-xs text-red-700">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'PREVIEW' ? (
            /* Live Preview View */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-amber-700 shrink-0" />
                This is a live preview of how your event will appear on the university calendar.
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden p-6 bg-white shadow-xs">
                {bannerUrl && (
                  <img
                    src={bannerUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl mb-4"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-[#C62828] border border-red-200">
                    {category}
                  </span>
                  <span className="text-xs text-gray-500">
                    Mode: <strong>{mode}</strong>
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-gray-900 mt-2">
                  {title || 'Untitled Event'}
                </h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  {shortDescription || 'Short summary will appear here.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl text-xs text-gray-700">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>
                      {startDate} ({startTime} - {endTime})
                    </span>
                  </div>
                  <div className="flex items-center">
                    {mode === 'OFFLINE' ? (
                      <>
                        <MapPin className="w-4 h-4 mr-2 text-red-500" />
                        <span>
                          {venue || 'Campus Venue'} ({campusBlock})
                        </span>
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2 text-blue-500" />
                        <span>{onlinePlatform || 'Online Event'}</span>
                      </>
                    )}
                  </div>
                </div>

                {speakerName && (
                  <div className="mt-4 p-3 bg-red-50/40 rounded-xl border border-red-100 text-xs">
                    <span className="font-bold text-gray-800">Featured Speaker:</span>{' '}
                    <span>
                      {speakerName}
                      {speakerDesignation ? ` (${speakerDesignation}` : ''}
                      {speakerOrg ? `, ${speakerOrg})` : speakerDesignation ? ')' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Form View */
            <div className="space-y-5">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Chandigarh University Hackathon & AI Showcase 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#C62828] outline-none"
                />
              </div>

              {/* Category & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Event Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#C62828] outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Event Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('OFFLINE')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        mode === 'OFFLINE'
                          ? 'bg-[#C62828] text-white border-[#C62828] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Offline (Campus)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('ONLINE')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        mode === 'ONLINE'
                          ? 'bg-[#C62828] text-white border-[#C62828] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Online (Webinar)
                    </button>
                  </div>
                </div>
              </div>

              {/* Short & Full Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Short Summary / Catchphrase <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="A one-sentence overview displayed on event cards (min 10 characters)"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#C62828] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Event Description & Agenda <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide comprehensive details, eligibility, prerequisites, and event schedule..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#C62828] outline-none"
                />
              </div>

              {/* Date & Time */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-800 block">Date & Schedule (IST)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Location or Online Details */}
              {mode === 'OFFLINE' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-red-50/30 rounded-2xl border border-red-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Campus Block
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Block D3, Academic Block 4"
                      value={campusBlock}
                      onChange={(e) => setCampusBlock(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Venue Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Auditorium Hall 1"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Room / Lab Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lab 402"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-blue-50/30 rounded-2xl border border-blue-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Online Platform Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Google Meet, Zoom, MS Teams"
                      value={onlinePlatform}
                      onChange={(e) => setOnlinePlatform(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Public Meeting URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/xyz-abc"
                      value={publicMeetingUrl}
                      onChange={(e) => setPublicMeetingUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Organizer & Speaker Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Organizer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Department of CSE / IEEE Student Branch"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Department / Club
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UIET / Apex Institute of Technology"
                    value={organizerDepartment}
                    onChange={(e) => setOrganizerDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Featured Speaker Details */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-800 block">
                  Guest Speaker / Keynote Details (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Speaker Full Name"
                      value={speakerName}
                      onChange={(e) => setSpeakerName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Designation (e.g. Lead Architect)"
                      value={speakerDesignation}
                      onChange={(e) => setSpeakerDesignation(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Organization (e.g. Google)"
                      value={speakerOrg}
                      onChange={(e) => setSpeakerOrg(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Registration Settings */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Enable Participant Registrations
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Students & faculty can register with one click.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={registrationEnabled}
                    onChange={(e) => setRegistrationEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#C62828] accent-[#C62828] rounded cursor-pointer"
                  />
                </div>

                {registrationEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Max Capacity (0 = Unlimited)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Registration Deadline
                      </label>
                      <input
                        type="date"
                        value={registrationDeadline}
                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Banner Poster URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Event Banner / Poster URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                />
              </div>

              {/* Contact Info & Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="events.coordinator@cuchd.in"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Additional Instructions / Guidelines (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Bring your student ID, laptops required, dress code..."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex space-x-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-[#C62828] hover:bg-[#8E1717] rounded-xl shadow-xs flex items-center cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Publish Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
