import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { learnTeachApi, type SkillItem } from '../../../api/learnTeachApi';

interface AddTeachingSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTeachingSkillModal: React.FC<AddTeachingSkillModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillLevel, setSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('INTERMEDIATE');
  const [exchangeType, setExchangeType] = useState<'FREE' | 'SKILL_SWAP'>('FREE');
  const [preferredMode, setPreferredMode] = useState<'ONLINE' | 'OFFLINE' | 'BOTH'>('BOTH');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [langInput, setLangInput] = useState('');
  const [description, setDescription] = useState('');
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

  const handleAddLanguage = () => {
    if (langInput.trim() && !languages.includes(langInput.trim())) {
      setLanguages([...languages, langInput.trim()]);
      setLangInput('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) {
      setError('Please select a skill');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await learnTeachApi.createListing({
        skillId: selectedSkillId,
        skillLevel,
        exchangeType,
        preferredMode,
        preferredLanguages: languages.length > 0 ? languages : ['English'],
        description,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to publish teaching skill');
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
          <h3 className="text-xl font-bold text-gray-900">Add Skill You Can Teach</h3>
          <p className="text-xs text-gray-500 mt-1">
            Share your expertise with fellow Chandigarh University peers and juniors.
          </p>
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] focus:border-transparent outline-none"
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
                Your Expertise Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Exchange Type
              </label>
              <select
                value={exchangeType}
                onChange={(e) => setExchangeType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              >
                <option value="FREE">Free Mentorship</option>
                <option value="SKILL_SWAP">Skill Swap (Barter)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Preferred Mode
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
              Instruction Languages
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                placeholder="e.g. English, Hindi, Punjabi"
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLanguage();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#C62828]"
              />
              <button
                type="button"
                onClick={handleAddLanguage}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-50 text-[#C62828] border border-red-200"
                >
                  {lang}
                  <button
                    type="button"
                    onClick={() => handleRemoveLanguage(lang)}
                    className="ml-1 text-red-400 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Short Note or Bio (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Can help with lab assignments, LeetCode patterns, or end-sem exam prep."
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
              Publish Skill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
