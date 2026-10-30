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
    <div className="fixed inset-0 z-50 bg-[#252525]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-[#FFF7F7] text-[#C62828] border border-[#E7DADA]'
                : variant === 'warning'
                ? 'bg-[#FFF7ED] text-[#C2410C]'
                : 'bg-[#FFF7F7] text-[#C62828] border border-[#E7DADA]'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#252525]">{title}</h3>
            <p className="text-xs text-[#666666] mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {requiresReason && (
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Administrative Reason *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828] transition-all"
              />
              {error && <p className="text-xs text-[#C62828] mt-1 font-semibold">{error}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7DADA]">
            <Button onClick={onClose} variant="outline" size="sm" type="button" disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              variant={variant === 'danger' ? 'primary' : 'primary'}
              size="sm"
              className={
                variant === 'danger'
                  ? 'bg-[#C62828] hover:bg-[#8E1717] text-white shadow-xs'
                  : variant === 'warning'
                  ? 'bg-[#C2410C] hover:bg-[#9a3412] text-white'
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
