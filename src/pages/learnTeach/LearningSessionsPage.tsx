import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Clock,
  Video,
  MapPin,
  Star,
  Loader2,
  Calendar,
} from 'lucide-react';
import { LearnTeachNav } from '../../components/learnTeach/LearnTeachNav';
import {
  learnTeachApi,
  type LearningSession,
  type SkillItem,
} from '../../api/learnTeachApi';
import { useAuth } from '../../context/AuthContext';
import { ProposeSessionModal } from '../../components/learnTeach/modals/ProposeSessionModal';

export const LearningSessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'PROPOSED' | 'COMPLETED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showProposeModal, setShowProposeModal] = useState(false);

  // Review modal state
  const [reviewingSession, setReviewingSession] = useState<LearningSession | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const [sessionsData, skillsData] = await Promise.all([
        learnTeachApi.getSessions(),
        learnTeachApi.getSkills(),
      ]);
      setSessions(sessionsData);
      setSkills(skillsData);
    } catch (err) {
      console.error('Failed to load learning sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRespond = async (id: string, action: 'CONFIRM' | 'REJECT' | 'CANCEL') => {
    setActionLoadingId(id);
    try {
      await learnTeachApi.respondSession(id, action);
      await loadSessions();
    } catch (err) {
      console.error('Failed to respond to session', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await learnTeachApi.completeSession(id, 'Session marked complete by participant');
      await loadSessions();
    } catch (err) {
      console.error('Failed to complete session', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSession) return;
    setSubmittingReview(true);
    try {
      await learnTeachApi.submitReview({
        sessionId: reviewingSession._id,
        rating,
        feedback,
      });
      alert('Review and rating submitted successfully!');
      setReviewingSession(null);
      setFeedback('');
      setRating(5);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (statusFilter === 'ALL') return true;
    return s.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      <LearnTeachNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center">
              <CalendarCheck className="w-6 h-6 mr-2 text-[#C62828]" />
              Learning Sessions
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Organize, schedule, and attend 1-on-1 peer consultations and mentorship hours.
            </p>
          </div>

          <button
            onClick={() => setShowProposeModal(true)}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-[#C62828] hover:bg-[#8E1717] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Propose Session
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 border-b border-[#E7DADA] pb-3 mb-6">
          {(['ALL', 'CONFIRMED', 'PROPOSED', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#C62828] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab === 'ALL' ? 'All Sessions' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C62828] mb-3" />
            <p className="text-xs text-gray-500">Loading learning sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center max-w-lg mx-auto">
            <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No sessions found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Schedule your first peer mentorship session to begin collaborative learning.
            </p>
            <button
              onClick={() => setShowProposeModal(true)}
              className="mt-5 px-5 py-2.5 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              + Propose a Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((session) => {
              const isTeacher = session.teacherId?._id === user?._id;
              const otherUser = isTeacher ? session.learnerId : session.teacherId;

              return (
                <div
                  key={session._id}
                  className="bg-white rounded-2xl border border-[#E7DADA] hover:border-[#C62828] p-5 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-[#C62828]">
                        {session.skillId?.name}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          session.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : session.status === 'PROPOSED'
                            ? 'bg-amber-100 text-amber-800'
                            : session.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mt-2.5 leading-snug">
                      {session.title}
                    </h3>

                    {/* Participant Info */}
                    <div className="mt-3 flex items-center space-x-2 text-xs text-gray-600">
                      <span className="text-gray-400">
                        {isTeacher ? 'Learner:' : 'Mentor:'}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {otherUser?.fullName || 'User'}
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span>{session.sessionDate}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span>
                          {session.startTime} ({session.durationMinutes} mins)
                        </span>
                      </div>
                      <div className="flex items-center">
                        {session.meetingMode === 'ONLINE' ? (
                          <>
                            <Video className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            {session.meetingLink ? (
                              <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-semibold truncate"
                              >
                                Join Google Meet
                              </a>
                            ) : (
                              <span>Online (Meet Link pending)</span>
                            )}
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                            <span>{session.offlineLocation || 'Chandigarh University Campus'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {session.description && (
                      <p className="mt-3 text-xs text-gray-500 italic line-clamp-2">
                        "{session.description}"
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    {session.status === 'PROPOSED' ? (
                      <div className="flex space-x-2 w-full justify-end">
                        <button
                          onClick={() => handleRespond(session._id, 'CONFIRM')}
                          disabled={actionLoadingId === session._id}
                          className="px-3 py-1.5 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Accept Proposal
                        </button>
                        <button
                          onClick={() => handleRespond(session._id, 'REJECT')}
                          disabled={actionLoadingId === session._id}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    ) : session.status === 'CONFIRMED' ? (
                      <button
                        onClick={() => handleComplete(session._id)}
                        disabled={actionLoadingId === session._id}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    ) : session.status === 'COMPLETED' ? (
                      <button
                        onClick={() => setReviewingSession(session)}
                        className="w-full py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center justify-center cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-500" />
                        Rate & Review
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProposeSessionModal
        isOpen={showProposeModal}
        onClose={() => setShowProposeModal(false)}
        skills={skills}
        onSuccess={loadSessions}
      />

      {/* Review Modal */}
      {reviewingSession && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E7DADA]">
            <h3 className="text-lg font-bold text-gray-900">
              Rate Session with{' '}
              {reviewingSession.teacherId._id === user?._id
                ? reviewingSession.learnerId.fullName
                : reviewingSession.teacherId.fullName}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Provide feedback on academic clarity, responsiveness, and mentorship quality.
            </p>

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className={`p-2 rounded-lg cursor-pointer ${
                        rating >= s ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${rating >= s ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share how the session went..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReviewingSession(null)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-lg"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
