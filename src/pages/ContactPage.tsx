import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  Info,
} from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { apiClient, type ApiResponse } from '../api/client';

interface FormData {
  fullName: string;
  email: string;
  subject: string;
  userType: 'Student' | 'Faculty' | 'Other';
  message: string;
  privacyConsent: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  subject?: string;
  message?: string;
  privacyConsent?: string;
}

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    subject: '',
    userType: 'Student',
    message: '',
    privacyConsent: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ticketId, setTicketId] = useState('');

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid university email address.';
    }

    if (!formData.subject.trim()) {
      errs.subject = 'Subject is required.';
    }

    if (!formData.message.trim()) {
      errs.message = 'Message cannot be empty.';
    } else if (formData.message.trim().length < 15) {
      errs.message = 'Please provide at least 15 characters describing your query.';
    }

    if (!formData.privacyConsent) {
      errs.privacyConsent = 'You must acknowledge the privacy guidelines.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await apiClient.post<ApiResponse<{ ticketId: string }>>('/contact', formData);
      if (res.success) {
        if (res.data?.ticketId) {
          setTicketId(res.data.ticketId);
        }
        setIsSubmitted(true);
      } else {
        setSubmitError(res.message || 'Failed to submit contact query.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error while submitting your query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      subject: '',
      userType: 'Student',
      message: '',
      privacyConsent: false,
    });
    setErrors({});
    setSubmitError('');
    setIsSubmitted(false);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="pt-14 pb-16 bg-[#FFF7F7] border-b border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="primary" size="md" className="mb-4">
            Connect With Us
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#252525] tracking-tight max-w-3xl mx-auto">
            Contact University Support
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#666666] max-w-2xl mx-auto leading-relaxed">
            Have questions about student onboarding, faculty appointment setup, or project collaboration? We are here to assist.
          </p>
        </div>
      </section>

      {/* Main Form and Support Links */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Quick Links & Info */}
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA]">
                <h3 className="text-lg font-bold text-[#252525] mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#C62828]" />
                  Self-Service Support
                </h3>
                <p className="text-sm text-[#666666] mb-5 leading-relaxed">
                  Most common queries regarding skill verification, booking appointments, and team builder matchmaking are answered in our knowledge base.
                </p>

                <div className="space-y-3">
                  <Link
                    to="/help"
                    className="block p-3 rounded-xl bg-white border border-[#E7DADA] hover:border-[#C62828] text-sm font-semibold text-[#C62828] transition-colors"
                  >
                    Browse Help Center / FAQs →
                  </Link>
                  <Link
                    to="/how-it-works"
                    className="block p-3 rounded-xl bg-white border border-[#E7DADA] hover:border-[#C62828] text-sm font-semibold text-[#252525] transition-colors"
                  >
                    View Role-Based Workflows →
                  </Link>
                </div>
              </div>

              {/* Campus Support Notice */}
              <div className="p-5 rounded-2xl bg-[#FFF7F7] border border-[#C62828]/25 text-xs text-[#252525] leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-[#C62828] mb-1.5">
                  <Info className="w-4 h-4" />
                  <span>Institutional Helpdesk</span>
                </div>
                Inquiries are encrypted and routed directly to the Chandigarh University Academic & Technical Operations helpdesk. You will receive email tracking updates.
              </div>

              <div className="p-6 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] text-xs text-[#666666] space-y-2">
                <div className="font-bold text-[#252525] text-sm">
                  Campus Administration
                </div>
                <p>Chandigarh University Knowledge Systems Initiative</p>
                <p>National Highway 05, Punjab, India</p>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-2">
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E7DADA] shadow-sm">
                {isSubmitted ? (
                  <div className="py-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-[#E6F5EF] text-[#16845B] flex items-center justify-center mb-5 border border-[#16845B]/20">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#252525] mb-2">
                      Inquiry Logged Successfully!
                    </h3>
                    <p className="text-sm text-[#666666] max-w-md mx-auto mb-3 leading-relaxed">
                      Thank you, <strong className="text-[#252525]">{formData.fullName}</strong>. Your inquiry regarding <em>"{formData.subject}"</em> has been recorded.
                    </p>
                    {ticketId && (
                      <div className="mb-6 px-3.5 py-1.5 rounded-lg bg-[#FFF7F7] border border-[#E7DADA] text-xs font-mono text-[#C62828]">
                        Ticket Ref: #{ticketId.slice(-8).toUpperCase()}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button onClick={handleReset} variant="outline" size="md">
                        Submit Another Inquiry
                      </Button>
                      <Button to="/" variant="primary" size="md">
                        Return to Home
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    {submitError && (
                      <div className="p-3.5 rounded-xl bg-[#FFF1F1] border border-[#C62828]/30 text-xs text-[#C62828] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}
                    <div className="border-b border-[#E7DADA] pb-4">
                      <h2 className="text-xl font-bold text-[#252525]">
                        Send a Message to Support
                      </h2>
                      <p className="text-xs text-[#666666] mt-1">
                        Fill in your details below and our campus team will review your inquiry.
                      </p>
                    </div>

                    {/* Full Name & Email Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-2"
                        >
                          Full Name <span className="text-[#C62828]">*</span>
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({ ...formData, fullName: e.target.value })
                          }
                          placeholder="e.g. Deepak Sharma"
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm text-[#252525] placeholder:text-[#999999] transition-colors focus:outline-none ${
                            errors.fullName
                              ? 'border-[#C62828] bg-[#FFF1F1]'
                              : 'border-[#E7DADA] bg-white focus:border-[#C62828]'
                          }`}
                        />
                        {errors.fullName && (
                          <p className="mt-1.5 text-xs text-[#C62828] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {errors.fullName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-2"
                        >
                          University Email <span className="text-[#C62828]">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="e.g. deepak.24bcs@cuchd.in"
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm text-[#252525] placeholder:text-[#999999] transition-colors focus:outline-none ${
                            errors.email
                              ? 'border-[#C62828] bg-[#FFF1F1]'
                              : 'border-[#E7DADA] bg-white focus:border-[#C62828]'
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1.5 text-xs text-[#C62828] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* User Type & Subject Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="userType"
                          className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-2"
                        >
                          User Role
                        </label>
                        <select
                          id="userType"
                          name="userType"
                          value={formData.userType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              userType: e.target.value as any,
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-[#E7DADA] bg-white text-sm text-[#252525] focus:border-[#C62828] focus:outline-none"
                        >
                          <option value="Student">Student</option>
                          <option value="Faculty">Faculty Member</option>
                          <option value="Other">University Administration / Other</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="subject"
                          className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-2"
                        >
                          Subject <span className="text-[#C62828]">*</span>
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({ ...formData, subject: e.target.value })
                          }
                          placeholder="e.g. Question regarding Capstone Matchmaking"
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm text-[#252525] placeholder:text-[#999999] transition-colors focus:outline-none ${
                            errors.subject
                              ? 'border-[#C62828] bg-[#FFF1F1]'
                              : 'border-[#E7DADA] bg-white focus:border-[#C62828]'
                          }`}
                        />
                        {errors.subject && (
                          <p className="mt-1.5 text-xs text-[#C62828] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {errors.subject}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Message Area */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-2"
                      >
                        Message <span className="text-[#C62828]">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Please elaborate on your question, issue, or feedback..."
                        className={`w-full px-4 py-3 rounded-lg border text-sm text-[#252525] placeholder:text-[#999999] transition-colors focus:outline-none resize-none ${
                          errors.message
                            ? 'border-[#C62828] bg-[#FFF1F1]'
                            : 'border-[#E7DADA] bg-white focus:border-[#C62828]'
                        }`}
                      />
                      {errors.message && (
                        <p className="mt-1.5 text-xs text-[#C62828] flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.message}
                        </p>
                      )}
                    </div>

                    {/* Privacy Checkbox */}
                    <div>
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          id="privacyConsent"
                          name="privacyConsent"
                          checked={formData.privacyConsent}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              privacyConsent: e.target.checked,
                            })
                          }
                          className="mt-1 w-4 h-4 rounded border-[#E7DADA] text-[#C62828] focus:ring-[#C62828]"
                        />
                        <span className="text-xs text-[#666666] leading-relaxed">
                          I acknowledge that this contact request is handled in accordance with the university platform{' '}
                          <Link
                            to="/privacy"
                            className="text-[#C62828] underline hover:text-[#8E1717]"
                          >
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </label>
                      {errors.privacyConsent && (
                        <p className="mt-1 text-xs text-[#C62828] flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.privacyConsent}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto min-w-[200px]"
                        icon={
                          isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )
                        }
                      >
                        {isSubmitting ? 'Sending Request...' : 'Submit Inquiry'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
