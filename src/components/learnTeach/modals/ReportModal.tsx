import React, { useState } from 'react';
import { X, Flag, AlertCircle, Loader2 } from 'lucide-react';
import { learnTeachApi } from '../../../api/learnTeachApi';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'TEACHING_LISTING' | 'USER' | 'LEARNING_GROUP' | 'MESSAGE';
  targetId: string;
  reportedUserId: string;
  targetTitle?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  reportedUserId,
  targetTitle,
}) => {
  const [reason, setReason] = useState('Inappropriate behavior / language');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await learnTeachApi.reportListingOrUser({
        reportedUserId,
        targetType,
        targetId,
        reason,
        details,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report');
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
            <div className="p-2 bg-red-100 text-[#C62828] rounded-lg">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Report Content</h3>
              <p className="text-xs text-gray-500">
                {targetTitle ? `Report regarding "${targetTitle}"` : 'Submit an anonymous report to campus moderators.'}
              </p>
            </div>
          </div>
        </div>

        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium text-center">
            Report submitted successfully. University moderators will review it promptly.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-xs text-red-700">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
              >
                <option value="Inappropriate behavior / language">Inappropriate behavior / language</option>
                <option value="Spam / Commercial solicitation">Spam / Commercial solicitation</option>
                <option value="Academic dishonesty / Exam fraud">Academic dishonesty / Exam fraud</option>
                <option value="Harassment or unwelcome advances">Harassment or unwelcome advances</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Please describe what happened..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
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
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

