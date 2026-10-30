import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { LearnTeachNav } from '../../components/learnTeach/LearnTeachNav';
import { learnTeachApi, type LearningGoal } from '../../api/learnTeachApi';
import { AddLearningGoalModal } from '../../components/learnTeach/modals/AddLearningGoalModal';

export const MyLearningGoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await learnTeachApi.getMyGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to load learning goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this learning goal?')) return;
    setActionLoadingId(id);
    try {
      await learnTeachApi.deleteGoal(id);
      await loadGoals();
    } catch (err) {
      console.error('Failed to delete goal', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (goal: LearningGoal) => {
    setActionLoadingId(goal._id);
    const newStatus = goal.status === 'ACHIEVED' ? 'ACTIVE' : 'ACHIEVED';
    try {
      await learnTeachApi.updateGoal(goal._id, { status: newStatus });
      await loadGoals();
    } catch (err) {
      console.error('Failed to update goal', err);
    } finally {
      setActionLoadingId(null);
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
              <Target className="w-6 h-6 mr-2 text-[#C62828]" />
              My Learning Goals
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Skills you are targeting to learn, master, or prepare for university placements.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-[#C62828] hover:bg-[#8E1717] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Add Learning Goal
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C62828] mb-3" />
            <p className="text-xs text-gray-500">Loading your learning roadmap...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center max-w-lg mx-auto">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No learning goals defined yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Define target skills (like Cloud Computing, Machine Learning, DSA) to get smart AI recommendations of matching mentors.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 px-5 py-2.5 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              + Add First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((goal) => (
              <div
                key={goal._id}
                className="bg-white rounded-2xl border border-[#E7DADA] hover:border-[#C62828] p-5 shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                        {goal.skillId?.category}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-2">
                        {goal.skillId?.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        goal.status === 'ACHIEVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>

                  {/* Level Transition Pill */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-500">{goal.currentLevel}</span>
                      <ArrowRight className="w-4 h-4 text-[#C62828]" />
                      <span className="text-[#C62828] font-bold">{goal.targetLevel}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      <span>{goal.targetDurationWeeks} Weeks</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          goal.urgency === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {goal.urgency} Urgency
                      </span>
                    </div>
                  </div>

                  {goal.notes && (
                    <p className="mt-3 text-xs text-gray-500 italic line-clamp-2">
                      "{goal.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/learn-teach/discover?skillId=${goal.skillId._id}`)}
                    className="text-xs font-bold text-[#C62828] hover:underline flex items-center cursor-pointer"
                  >
                    Find Mentors <ArrowRight className="w-3 h-3 ml-0.5" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(goal)}
                      disabled={actionLoadingId === goal._id}
                      className="text-[11px] font-semibold text-gray-500 hover:text-emerald-700 cursor-pointer"
                    >
                      {goal.status === 'ACHIEVED' ? 'Mark Active' : 'Mark Achieved'}
                    </button>
                    <button
                      onClick={() => handleDelete(goal._id)}
                      disabled={actionLoadingId === goal._id}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddLearningGoalModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadGoals}
      />
    </div>
  );
};
