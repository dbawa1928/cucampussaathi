import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F6F8FC]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Badge variant="warning" size="sm" dot>
            Password Recovery
          </Badge>
        </div>

        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-8 sm:p-10">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#EAF1FF] border border-[#3157D5]/20 flex items-center justify-center mx-auto shadow-xs">
                <img
                  src="/0.FAVICON.png"
                  alt="CUCampusSaathi"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            <h1 className="text-2xl font-extrabold text-[#17233B] tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
              Enter your registered university email to receive password reset guidance
            </p>
          </div>

          {isSuccess ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#E6F5EF] text-[#16845B] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#17233B] mb-2">
                Recovery Request Logged (Demo State)
              </h3>
              <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
                In a live deployment connected to institutional SMTP servers, a secure token would be delivered to <strong className="text-[#17233B]">{email}</strong>.
              </p>
              <div className="p-3 rounded-xl bg-[#F6F8FC] border border-[#E2E8F0] text-[11px] text-[#64748B] mb-6">
                <Info className="w-3.5 h-3.5 text-[#3157D5] inline mr-1" />
                This is a public prototype demonstration. No actual outgoing email has been transmitted.
              </div>
              <Button to="/login" variant="primary" size="md" className="w-full">
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="resetEmail"
                  className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-2"
                >
                  University Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    id="resetEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname.24bcs@cuchd.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] placeholder:text-[#94A3B8] focus:border-[#3157D5] focus:outline-none"
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3157D5] hover:underline"
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
