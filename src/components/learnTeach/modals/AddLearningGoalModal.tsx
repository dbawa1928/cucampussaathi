import React, { useState, useEffect } from 'react';
import { X, Target, AlertCircle, Loader2 } from 'lucide-react';
import { learnTeachApi, type SkillItem } from '../../../api/learnTeachApi';

interface AddLearningGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddLearningGoalModal: React.FC<AddLearningGoalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [currentLevel, setCurrentLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [targetLevel, setTargetLevel] = useState<'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('ADVANCED');
  const [preferredMode, setPreferredMode] = useState<'ONLINE' | 'OFFLINE' | 'BOTH'>('BOTH');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [targetDurationWeeks, setTargetDurationWeeks] = useState(4);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSkills, setFetchingSkills] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFetchingSkills(true);
      learnTeachApi
        .getSkills()
        .then((data) => {
          setSkills(data);
          if (data.length > 0) setSelectedSkillId(data[0]._id);
        })
        .catch(() => setError('Failed to load university skills catalogue'))
        .finally(() => setFetchingSkills(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) {
      setError('Please select a skill');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await learnTeachApi.createGoal({
        skillId: selectedSkillId,
        currentLevel,
        targetLevel,
        preferredMode,
        urgency,
        targetDurationWeeks: Number(targetDurationWeeks),
        notes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create learning goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E7DADA] relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-50 text-[#C62828] rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Add Learning Goal</h3>
              <p className="text-xs text-gray-500">
                Define what you want to master and get matched with mentors or peers.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Skill from University Catalogue
            </label>
            {fetchingSkills ? (
              <div className="flex items-center text-xs text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#C62828]" />
                Loading catalogue...
              </div>
            ) : (
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              >
                {skills.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Current Level
              </label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              >
                <option value="BEGINNER">Beginner (Zero Knowledge)</option>
                <option value="INTERMEDIATE">Intermediate (Basics clear)</option>
                <option value="ADVANCED">Advanced (Looking to master)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Target Level
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              >
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert / Industry Ready</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Priority / Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              >
                <option value="LOW">Low (Casual)</option>
                <option value="MEDIUM">Medium (Regular pace)</option>
                <option value="HIGH">High (Urgent / Exams soon)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Target Timeline (Weeks)
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={targetDurationWeeks}
                onChange={(e) => setTargetDurationWeeks(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Preferred Learning Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['ONLINE', 'OFFLINE', 'BOTH'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPreferredMode(m)}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    preferredMode === m
                      ? 'bg-[#C62828] text-white border-[#C62828]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {m === 'BOTH' ? 'Both (Hybrid)' : m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Specific Goal Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Aiming to clear coding rounds in upcoming campus placements."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              Save Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
