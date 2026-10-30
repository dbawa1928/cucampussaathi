import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  CheckCircle2,
  Circle,
  Star,
  Award,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { LearnTeachNav } from '../../components/learnTeach/LearnTeachNav';
import {
  learnTeachApi,
  type SkillProgress,
  type LearningReview,
  type SkillItem,
} from '../../api/learnTeachApi';
import { useAuth } from '../../context/AuthContext';

export const LearningProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [progressList, setProgressList] = useState<SkillProgress[]>([]);
  const [reviews, setReviews] = useState<LearningReview[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Progress Tracker Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [proficiency, setProficiency] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('BEGINNER');
  const [milestonesInput, setMilestonesInput] = useState('Core Syntax & Setup\nBasic Mini-project\nAdvanced Concepts\nFinal Assessment');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progData, skillsData, reviewsData] = await Promise.all([
        learnTeachApi.getProgress(),
        learnTeachApi.getSkills(),
        user?._id || user?.id
          ? learnTeachApi.getUserReviews(String(user._id || user.id))
          : Promise.resolve([]),
      ]);
      setProgressList(progData);
      setSkills(skillsData);
      setReviews(reviewsData);
      if (skillsData.length > 0 && !selectedSkillId) {
        setSelectedSkillId(skillsData[0]._id);
      }
    } catch (err) {
      console.error('Failed to load progress data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleToggleMilestone = async (
    progressId: string,
    index: number,
    currentStatus: boolean
  ) => {
    try {
      await learnTeachApi.toggleMilestone(progressId, index, !currentStatus);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle milestone', err);
    }
  };

  const handleCreateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    setCreating(true);
    try {
      const milestones = milestonesInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((title) => ({ title }));

      await learnTeachApi.createProgress({
        skillId: selectedSkillId,
        overallProficiency: proficiency,
        milestones,
      });

      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to initialize progress tracker');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      <LearnTeachNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-[#C62828]" />
              Learning Progress & Verified Reviews
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Track milestones for skills you are mastering and review verified session feedback from campus mentors.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-[#C62828] hover:bg-[#8E1717] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Track Skill Progress
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C62828] mb-3" />
            <p className="text-xs text-gray-500">Loading progress tracker & reviews...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Skill Progress Trackers Section */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-[#C62828]" />
                Active Skill Milestones
              </h2>

              {progressList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center max-w-md mx-auto">
                  <p className="text-xs text-gray-500">No active progress trackers yet.</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-3 text-xs font-bold text-[#C62828] hover:underline"
                  >
                    + Track a skill milestone
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {progressList.map((prog) => {
                    const completedCount = prog.milestones.filter((m) => m.completed).length;
                    const percent =
                      prog.milestones.length > 0
                        ? Math.round((completedCount / prog.milestones.length) * 100)
                        : 0;

                    return (
                      <div
                        key={prog._id}
                        className="bg-white rounded-2xl border border-[#E7DADA] p-5 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-[#C62828]">
                              {prog.skillId?.category}
                            </span>
                            <span className="text-xs font-black text-emerald-600">
                              {percent}% Complete
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-gray-900 mt-2">
                            {prog.skillId?.name}
                          </h3>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                            <div
                              className="bg-[#C62828] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          {/* Milestones checklist */}
                          <div className="mt-4 space-y-2">
                            {prog.milestones.map((m, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleToggleMilestone(prog._id, idx, m.completed)}
                                className="w-full flex items-start text-left p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                              >
                                {m.completed ? (
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="w-4 h-4 mr-2 text-gray-300 group-hover:text-gray-400 shrink-0 mt-0.5" />
                                )}
                                <span
                                  className={`text-xs ${
                                    m.completed
                                      ? 'line-through text-gray-400'
                                      : 'text-gray-700 font-medium'
                                  }`}
                                >
                                  {m.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between">
                          <span>Proficiency: {prog.overallProficiency}</span>
                          <span>{prog.completedSessionsCount} Sessions completed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Verified Reviews Received Section */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                <Star className="w-4 h-4 mr-2 text-amber-500 fill-amber-500" />
                Verified Reviews Received ({reviews.length})
              </h2>

              {reviews.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center max-w-md mx-auto">
                  <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No verified reviews received yet.</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Conduct completed 1-on-1 learning sessions to receive ratings from peers.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="bg-white rounded-xl border border-[#E7DADA] p-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                rev.rating >= s
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {rev.feedback && (
                        <p className="mt-2.5 text-xs text-gray-700 italic">
                          "{rev.feedback}"
                        </p>
                      )}

                      <div className="mt-3 text-[11px] text-gray-500 font-medium">
                        — {rev.reviewerId?.fullName} ({rev.reviewerId?.role === 'TEACHER' ? 'Faculty' : 'Student'})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Track Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E7DADA]">
            <h3 className="text-lg font-bold text-gray-900">Track Skill Progress</h3>
            <p className="text-xs text-gray-500 mt-1">
              Add a checklist of milestones to track your progress systematically.
            </p>

            <form onSubmit={handleCreateProgress} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Skill
                </label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Current Target Proficiency
                </label>
                <select
                  value={proficiency}
                  onChange={(e) => setProficiency(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Milestones Checklist (One per line)
                </label>
                <textarea
                  rows={4}
                  required
                  value={milestonesInput}
                  onChange={(e) => setMilestonesInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Start Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
