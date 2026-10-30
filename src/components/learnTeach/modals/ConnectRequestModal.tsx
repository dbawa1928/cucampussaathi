import React, { useState } from 'react';
import { X, Send, AlertCircle, Loader2 } from 'lucide-react';
import { learnTeachApi, type SkillItem } from '../../../api/learnTeachApi';

interface ConnectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recipientUser: {
    _id: string;
    fullName: string;
    role: string;
  } | null;
  skillDesired?: SkillItem;
  myTeachingListings?: { skillId: SkillItem }[];
}

export const ConnectRequestModal: React.FC<ConnectRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  recipientUser,
  skillDesired,
  myTeachingListings = [],
}) => {
  const [skillOfferedId, setSkillOfferedId] = useState('');
  const [preferredMode, setPreferredMode] = useState<'ONLINE' | 'OFFLINE' | 'BOTH'>('BOTH');
  const [introMessage, setIntroMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !recipientUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await learnTeachApi.sendConnectionRequest({
        recipientId: recipientUser._id,
        skillDesiredId: skillDesired?._id,
        skillOfferedId: skillOfferedId || undefined,
        preferredMode,
        introMessage,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to send connection request');
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
          <h3 className="text-lg font-bold text-gray-900">Connect with {recipientUser.fullName}</h3>
          <p className="text-xs text-gray-500 mt-1">
            Send an introduction request to establish a learning mentorship or mutual skill exchange.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-xs text-red-700">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {skillDesired && (
            <div className="p-3 bg-red-50/60 rounded-xl border border-red-100">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Skill You Want To Learn
              </span>
              <p className="text-sm font-bold text-[#C62828] mt-0.5">{skillDesired.name}</p>
            </div>
          )}

          {myTeachingListings.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Skill You Can Offer In Return (Skill Swap - Optional)
              </label>
              <select
                value={skillOfferedId}
                onChange={(e) => setSkillOfferedId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              >
                <option value="">None (Mentorship / Free)</option>
                {myTeachingListings.map((l) => (
                  <option key={l.skillId._id} value={l.skillId._id}>
                    {l.skillId.name} ({l.skillId.category})
                  </option>
                ))}
              </select>
            </div>
          )}

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
                  {m === 'BOTH' ? 'Both' : m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Introduction Message
            </label>
            <textarea
              rows={3}
              required
              placeholder="Hi! I noticed your listing on CUCampusSaathi and would love to learn from you..."
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
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
              disabled={loading || !introMessage.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#C62828] hover:bg-[#8E1717] rounded-lg shadow-sm flex items-center disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
