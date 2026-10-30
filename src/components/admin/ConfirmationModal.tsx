import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  requiresReason?: boolean;
  reasonPlaceholder?: string;
  isLoading?: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  requiresReason = false,
  reasonPlaceholder = 'Please enter reason for this administrative action...',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresReason && reason.trim().length < 3) {
      setError('Please provide a reason of at least 3 characters.');
      return;
    }
    setError('');
    onConfirm(reason.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#17233B]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-[#FEF2F2] text-[#EF4444]'
                : variant === 'warning'
                ? 'bg-[#FFF7ED] text-[#C2410C]'
                : 'bg-[#EAF1FF] text-[#3157D5]'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#17233B]">{title}</h3>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {requiresReason && (
            <div>
              <label className="block text-xs font-semibold text-[#17233B] mb-1.5">
                Administrative Reason *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E2E8F0] bg-[#F6F8FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3157D5] transition-all"
              />
              {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
            <Button onClick={onClose} variant="outline" size="sm" type="button" disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              variant={variant === 'danger' ? 'outline' : 'primary'}
              size="sm"
              className={
                variant === 'danger'
                  ? 'text-[#EF4444] border-[#FCA5A5] hover:bg-[#FEF2F2]'
                  : variant === 'warning'
                  ? 'bg-[#C2410C] hover:bg-[#9a3412]'
                  : ''
              }
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
