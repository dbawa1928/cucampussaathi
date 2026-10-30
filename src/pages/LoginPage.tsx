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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSessionUser = authenticatedUser || currentUser;

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FFF7F7]">
      <div className="w-full max-w-md">
        {/* Header Pill */}
        <div className="mb-6 flex justify-center">
          <Badge variant="primary" size="sm" dot>
            University Security Portal
          </Badge>
        </div>

        {/* Card Box */}
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
              Welcome to CUCampusSaathi
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] mt-1.5">
              Sign in to your university academic & collaboration account
            </p>
          </div>

          {activeSessionUser ? (
            <div className="py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#FFF7F7] text-[#C62828] flex items-center justify-center mx-auto mb-3 border border-[#C62828]/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#252525] mb-1">
                Authenticated Successfully
              </h3>
              <p className="text-xs text-[#666666] mb-4 leading-relaxed">
                Signed in as <strong className="text-[#252525]">{activeSessionUser.fullName}</strong>
              </p>

              <div className="p-3.5 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] text-xs text-left mb-6 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#666666]">University ID:</span>
                  <span className="font-mono font-bold text-[#252525]">{activeSessionUser.uid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Email:</span>
                  <span className="font-medium text-[#252525]">{activeSessionUser.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#666666]">Role:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#C62828] border border-[#C62828]/30">
                    {activeSessionUser.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Department:</span>
                  <span className="font-medium text-[#252525]">{activeSessionUser.department}</span>
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
                  className="w-full text-[#C62828] hover:bg-[#FFF7F7]"
                  icon={<LogOut className="w-3.5 h-3.5" />}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Role Filter Tabs */}
              <div className="mb-6 grid grid-cols-3 gap-1 p-1 bg-[#FFF7F7] rounded-xl border border-[#E7DADA] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRoleTab('student');
                    setError('');
                  }}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    activeRoleTab === 'student'
                      ? 'bg-white text-[#C62828] shadow-xs font-bold'
                      : 'text-[#666666] hover:text-[#252525]'
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
                      ? 'bg-white text-[#C62828] shadow-xs font-bold'
                      : 'text-[#666666] hover:text-[#252525]'
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
                      ? 'bg-white text-[#C62828] shadow-xs font-bold'
                      : 'text-[#666666] hover:text-[#252525]'
                  }`}
                >
                  Admin
                </button>
              </div>

              {activeRoleTab === 'admin' && (
                <div className="mb-6 p-3.5 rounded-xl bg-[#FFF7F7] border border-[#C62828]/20 text-xs text-[#C62828] flex items-start gap-2 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Administrative privileges are strictly restricted to authorized university coordinators.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-[#FFF1F1] border border-[#C62828]/30 text-xs text-[#C62828] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Identifier Input */}
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-2"
                  >
                    {activeRoleTab === 'student'
                      ? 'Student UID or University Email'
                      : activeRoleTab === 'faculty'
                      ? 'Faculty ID or University Email'
                      : 'System Administrator ID'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8E1717]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E7DADA] text-sm text-[#252525] placeholder:text-[#999999] focus:border-[#C62828] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="text-xs font-bold text-[#252525] uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[#C62828] font-semibold hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8E1717]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#E7DADA] text-sm text-[#252525] placeholder:text-[#999999] focus:border-[#C62828] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E1717]/60 hover:text-[#252525] cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#666666]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#E7DADA] text-[#C62828] focus:ring-[#C62828]"
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
              <div className="mt-6 pt-5 border-t border-[#E7DADA] text-center text-xs text-[#666666]">
                Don't have a campus account yet?{' '}
                <Link
                  to="/register"
                  className="text-[#C62828] font-bold hover:underline"
                >
                  Create Account
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-[11px] text-[#666666] max-w-xs mx-auto">
          Protected by Argon2id password hashing and secure HttpOnly cookie session management.
        </p>
      </div>
    </div>
  );
};
