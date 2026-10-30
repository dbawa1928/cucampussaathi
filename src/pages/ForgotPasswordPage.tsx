import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient, type ApiResponse } from '../api/client';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your registered university email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid email format.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<any>>('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.message || 'Unable to process recovery request.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit recovery request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FFF7F7]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Badge variant="primary" size="sm" dot>
            Password Recovery
          </Badge>
        </div>

        <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-sm p-8 sm:p-10">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#FFF7F7] border border-[#C62828]/20 flex items-center justify-center mx-auto shadow-xs">
                <img
                  src="/0.FAVICON.png"
                  alt="CUCampusSaathi"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            <h1 className="text-2xl font-extrabold text-[#252525] tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] mt-1.5 leading-relaxed">
              Enter your registered university email to receive password reset guidance
            </p>
          </div>

          {isSuccess ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FFF7F7] text-[#C62828] flex items-center justify-center mx-auto mb-3 border border-[#C62828]/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#252525] mb-2">
                Recovery Request Submitted
              </h3>
              <p className="text-xs text-[#666666] mb-4 leading-relaxed">
                If the email <strong className="text-[#252525]">{email}</strong> exists in our Chandigarh University academic records, a secure password recovery instruction token has been generated.
              </p>
              <div className="p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] text-[11px] text-[#666666] mb-6">
                <Info className="w-3.5 h-3.5 text-[#C62828] inline mr-1" />
                Please check your university and backup inboxes. Password reset tokens remain active for 60 minutes.
              </div>
              <Button to="/login" variant="primary" size="md" className="w-full">
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-[#FFF1F1] border border-[#C62828]/30 text-xs text-[#C62828] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="resetEmail"
                  className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-2"
                >
                  University Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8E1717]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    id="resetEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname.24bcs@cuchd.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E7DADA] text-sm text-[#252525] placeholder:text-[#999999] focus:border-[#C62828] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                  icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {isSubmitting ? 'Verifying...' : 'Request Reset Link'}
                </Button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C62828] hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
