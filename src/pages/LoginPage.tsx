import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth, type AuthUser } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<'student' | 'faculty' | 'admin'>('student');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please provide your University Email or Student/Faculty UID.');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(identifier.trim(), password);
      setAuthenticatedUser(user);
      // Directly navigate to personalized Dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSessionUser = authenticatedUser || currentUser;

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F6F8FC]">
      <div className="w-full max-w-md">
        {/* Header Pill */}
        <div className="mb-6 flex justify-center">
          <Badge variant="primary" size="sm" dot>
            University Security Portal
          </Badge>
        </div>

        {/* Card Box */}
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
              Welcome to CUCampusSaathi
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
              Sign in to your university academic & collaboration account
            </p>
          </div>

          {activeSessionUser ? (
            <div className="py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#E6F5EF] text-[#16845B] flex items-center justify-center mx-auto mb-3 border border-[#16845B]/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#17233B] mb-1">
                Authenticated Successfully
              </h3>
              <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
                Signed in as <strong className="text-[#17233B]">{activeSessionUser.fullName}</strong>
              </p>

              <div className="p-3.5 rounded-xl bg-[#F6F8FC] border border-[#E2E8F0] text-xs text-left mb-6 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">University ID:</span>
                  <span className="font-mono font-bold text-[#17233B]">{activeSessionUser.uid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Email:</span>
                  <span className="font-medium text-[#17233B]">{activeSessionUser.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Role:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF1FF] text-[#3157D5]">
                    {activeSessionUser.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Department:</span>
                  <span className="font-medium text-[#17233B]">{activeSessionUser.department}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <Button to="/dashboard" variant="primary" size="md" className="w-full">
                  Go to Dashboard
                </Button>
                <Button to="/profile" variant="outline" size="md" className="w-full">
                  Manage My Profile & Skills
                </Button>
                <Button to="/appointments" variant="outline" size="md" className="w-full">
                  FacultyConnect Appointments
                </Button>
                <Button
                  onClick={async () => {
                    await logout();
                    setAuthenticatedUser(null);
                  }}
                  variant="ghost"
                  size="sm"
                  className="w-full text-[#EF4444] hover:bg-[#FEF2F2]"
                  icon={<LogOut className="w-3.5 h-3.5" />}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Role Filter Tabs */}
              <div className="mb-6 grid grid-cols-3 gap-1 p-1 bg-[#F6F8FC] rounded-xl border border-[#E2E8F0] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRoleTab('student');
                    setError('');
                  }}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    activeRoleTab === 'student'
                      ? 'bg-white text-[#3157D5] shadow-xs'
                      : 'text-[#64748B] hover:text-[#17233B]'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRoleTab('faculty');
                    setError('');
                  }}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    activeRoleTab === 'faculty'
                      ? 'bg-white text-[#3157D5] shadow-xs'
                      : 'text-[#64748B] hover:text-[#17233B]'
                  }`}
                >
                  Faculty
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRoleTab('admin');
                    setError('');
                  }}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    activeRoleTab === 'admin'
                      ? 'bg-white text-[#C2410C] shadow-xs'
                      : 'text-[#64748B] hover:text-[#17233B]'
                  }`}
                >
                  Admin
                </button>
              </div>

              {activeRoleTab === 'admin' && (
                <div className="mb-6 p-3.5 rounded-xl bg-[#FFF7ED] border border-[#C2410C]/20 text-xs text-[#C2410C] flex items-start gap-2 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Administrative privileges are strictly restricted to authorized university coordinators.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Identifier Input */}
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-2"
                  >
                    {activeRoleTab === 'student'
                      ? 'Student UID or University Email'
                      : activeRoleTab === 'faculty'
                      ? 'Faculty ID or University Email'
                      : 'System Administrator ID'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      id="identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        activeRoleTab === 'student'
                          ? 'e.g. 24bcs10812@cuchd.in'
                          : activeRoleTab === 'faculty'
                          ? 'e.g. 24bai70494@cuchd.in'
                          : 'e.g. deepakbawa0004@gmail.com'
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] placeholder:text-[#94A3B8] focus:border-[#3157D5] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="text-xs font-bold text-[#17233B] uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[#3157D5] font-semibold hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] placeholder:text-[#94A3B8] focus:border-[#3157D5] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#17233B] cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#64748B]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#E2E8F0] text-[#3157D5] focus:ring-[#3157D5]"
                    />
                    <span>Remember my device</span>
                  </label>
                </div>

                {/* Submit Button */}
                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full"
                    icon={
                      isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )
                    }
                    iconPosition="right"
                  >
                    {isSubmitting ? 'Authenticating...' : 'Sign In'}
                  </Button>
                </div>
              </form>

              {/* Registration Link Footer */}
              <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
                Don't have a campus account yet?{' '}
                <Link
                  to="/register"
                  className="text-[#3157D5] font-bold hover:underline"
                >
                  Create Account
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-[11px] text-[#94A3B8] max-w-xs mx-auto">
          Protected by Argon2id password hashing and secure HttpOnly cookie session management.
        </p>
      </div>
    </div>
  );
};
