import React, { useState } from 'react';
import { X, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { learnTeachApi, type SkillItem } from '../../../api/learnTeachApi';

interface ProposeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  connectionId?: string;
  teacherUser?: {
    _id: string;
    fullName: string;
  };
  skills: SkillItem[];
}

export const ProposeSessionModal: React.FC<ProposeSessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  connectionId,
  teacherUser,
  skills,
}) => {
  const [skillId, setSkillId] = useState(skills[0]?._id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [startTime, setStartTime] = useState('16:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingMode, setMeetingMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [meetingLink, setMeetingLink] = useState('');
  const [offlineLocation, setOfflineLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillId) {
      setError('Please select a skill');
      return;
    }
    if (!sessionDate) {
      setError('Please choose a session date');
      return;
    }
    if (meetingMode === 'ONLINE' && meetingLink && !meetingLink.startsWith('https://')) {
      setError('Meeting link must start with https://');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await learnTeachApi.proposeSession({
        connectionId,
        teacherId: teacherUser?._id,
        skillId,
        title,
        description,
        sessionDate,
        startTime,
        durationMinutes: Number(durationMinutes),
        meetingMode,
        meetingLink: meetingMode === 'ONLINE' ? meetingLink : undefined,
        offlineLocation: meetingMode === 'OFFLINE' ? offlineLocation : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to propose learning session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E7DADA] relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-50 text-[#C62828] rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Propose Learning Session</h3>
              <p className="text-xs text-gray-500">
                {teacherUser ? `Schedule a session with ${teacherUser.fullName}` : 'Schedule a 1-on-1 session'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-xs text-red-700">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Topic / Session Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dynamic Programming & LeetCode Practice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Skill
            </label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
            >
              {skills.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes (1 hr)</option>
                <option value={90}>90 minutes (1.5 hrs)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mode
              </label>
              <select
                value={meetingMode}
                onChange={(e) => setMeetingMode(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              >
                <option value="ONLINE">Online (Meet Link)</option>
                <option value="OFFLINE">Offline (Campus)</option>
              </select>
            </div>
          </div>

          {meetingMode === 'ONLINE' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Meeting Link (Google Meet / Zoom - Optional)
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/xyz-abc-def"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Campus Location
              </label>
              <input
                type="text"
                placeholder="e.g. Block D3 Library / Academic Block 4"
                value={offlineLocation}
                onChange={(e) => setOfflineLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description / Agenda (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="What specifically will be covered in this session?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#C62828] hover:bg-[#8E1717] rounded-lg shadow-sm flex items-center disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Send Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
