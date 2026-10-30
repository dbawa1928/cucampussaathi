import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  GraduationCap,
  Briefcase,
  IdCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

import { useAuth } from '../context/AuthContext';

interface RegisterForm {
  fullName: string;
  email: string;
  uid: string;
  department: string;
  role: 'Student' | 'Teacher';
  course: string;
  semester: string;
  designation: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

interface RegisterErrors {
  fullName?: string;
  email?: string;
  uid?: string;
  department?: string;
  course?: string;
  semester?: string;
  designation?: string;
  password?: string;
  confirmPassword?: string;
  agreeTerms?: string;
  agreePrivacy?: string;
}

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterForm>({
    fullName: '',
    email: '',
    uid: '',
    department: 'Computer Science & Engineering',
    role: 'Student',
    course: 'B.Tech CSE',
    semester: '6',
    designation: 'Assistant Professor',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const errs: RegisterErrors = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    }

    if (!formData.email.trim()) {
      errs.email = 'University Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid university email format.';
    }

    if (!formData.uid.trim()) {
      errs.uid = 'University UID or Faculty ID is required.';
    }

    if (!formData.department) {
      errs.department = 'Department selection is required.';
    }

    if (formData.role === 'Student') {
      if (!formData.course) errs.course = 'Please select your academic course.';
      if (!formData.semester) errs.semester = 'Please select your current semester.';
    } else {
      if (!formData.designation) errs.designation = 'Please select your faculty designation.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must accept the Terms & Conditions.';
    }

    if (!formData.agreePrivacy) {
      errs.agreePrivacy = 'You must acknowledge the Privacy Policy.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        uid: formData.uid.trim().toUpperCase(),
        department: formData.department,
        role: formData.role.toUpperCase(), // 'STUDENT' or 'TEACHER'
        password: formData.password,
      };

      if (formData.role === 'Student') {
        payload.course = formData.course;
        payload.semester = parseInt(formData.semester, 10);
      } else {
        payload.designation = formData.designation;
      }

      await register(payload);
      setIsSuccess(true);
      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F6F8FC]">
      <div className="w-full max-w-xl">
        {/* Prototype Indicator */}
        <div className="mb-6 flex justify-center">
          <Badge variant="warning" size="sm" dot>
            University Registration Portal
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233B] tracking-tight">
              Create Your Campus Account
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
              Connect with students, peers, and faculty across Chandigarh University
            </p>
          </div>

          {/* Role Selector: Student vs Teacher */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-2">
              Select Your University Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'Student' })}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  formData.role === 'Student'
                    ? 'border-[#3157D5] bg-[#EAF1FF] text-[#3157D5] shadow-xs'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F6F8FC]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'Teacher' })}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  formData.role === 'Teacher'
                    ? 'border-[#3157D5] bg-[#EAF1FF] text-[#3157D5] shadow-xs'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F6F8FC]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Teacher / Faculty</span>
              </button>
            </div>
          </div>

          {isSuccess ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#E6F5EF] text-[#16845B] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#17233B] mb-2">
                Registration Successful!
              </h3>
              <p className="text-sm text-[#64748B] max-w-sm mx-auto mb-6 leading-relaxed">
                Welcome to CUCampusSaathi, <strong className="text-[#17233B]">{formData.fullName}</strong>. Your account as a <strong className="text-[#17233B]">{formData.role}</strong> ({formData.uid}) has been registered in the database.
              </p>
              <div className="flex flex-col gap-2.5 w-full">
                <Button to="/dashboard" variant="primary" size="md" className="w-full">
                  Go to My Dashboard
                </Button>
                <Button to="/profile" variant="outline" size="md" className="w-full">
                  Complete My Profile & Skills
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {apiError && (
                <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}
              {/* Full Name & UID Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-1.5"
                  >
                    Full Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="e.g. Deepak Sharma"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] placeholder:text-[#94A3B8] focus:border-[#3157D5] focus:outline-none"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-[#EF4444]">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="uid"
                    className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-1.5"
                  >
                    {formData.role === 'Student' ? 'University UID' : 'Faculty ID'}{' '}
                    <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      id="uid"
                      value={formData.uid}
                      onChange={(e) =>
                        setFormData({ ...formData, uid: e.target.value })
                      }
                      placeholder={
                        formData.role === 'Student' ? 'e.g. 24bcs10812' : 'e.g. fac10984'
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] placeholder:text-[#94A3B8] focus:border-[#3157D5] focus:outline-none font-mono"
                    />
                  </div>
                  {errors.uid && (
                    <p className="mt-1 text-xs text-[#EF4444]">{errors.uid}</p>
                  )}
                </div>
              </div>

              {/* Email & Department Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="regEmail"
                    className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-1.5"
                  >
                    University Email <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      id="regEmail"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="e.g. name@cuchd.in"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] placeholder:text-[#94A3B8] focus:border-[#3157D5] focus:outline-none"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-[#EF4444]">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-1.5"
                  >
                    Department
                  </label>
                  <select
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] bg-white focus:border-[#3157D5] focus:outline-none"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Artificial Intelligence & ML">Artificial Intelligence & ML</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Biotechnology">Biotechnology</option>
                    <option value="University Business School">University Business School</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Role-Dependent Fields */}
              {formData.role === 'Student' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F6F8FC] border border-[#E2E8F0]">
                  <div>
                    <label
                      htmlFor="course"
                      className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-1.5"
                    >
                      Enrolled Course
                    </label>
                    <select
                      id="course"
                      value={formData.course}
                      onChange={(e) =>
                        setFormData({ ...formData, course: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] bg-white focus:border-[#3157D5] focus:outline-none"
                    >
                      <option value="B.Tech CSE">B.Tech Computer Science</option>
                      <option value="B.Tech AI & Data Science">B.Tech AI & Data Science</option>
                      <option value="BCA">BCA (Computer Applications)</option>
                      <option value="MCA">MCA (Master of Computer Applications)</option>
                      <option value="M.Tech CSE">M.Tech Computer Science</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="semester"
                      className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-1.5"
                    >
                      Current Semester
                    </label>
                    <select
                      id="semester"
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] bg-white focus:border-[#3157D5] focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem.toString()}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F6F8FC] border border-[#E2E8F0]">
                  <label
                    htmlFor="designation"
                    className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-1.5"
                  >
                    Faculty Designation
                  </label>
                  <select
                    id="designation"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] bg-white focus:border-[#3157D5] focus:outline-none"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Head of Department">Head of Department (HOD)</option>
                    <option value="Dean of School">Dean of School</option>
                  </select>
                </div>
              )}

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="regPassword"
                    className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-1.5"
                  >
                    Password <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="regPassword"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Min 8 characters"
                      className="w-full pl-9 pr-9 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] placeholder:text-[#94A3B8] focus:border-[#3157D5] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#17233B] cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-[#EF4444]">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-bold text-[#17233B] uppercase tracking-wider mb-1.5"
                  >
                    Confirm Password <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#17233B] placeholder:text-[#94A3B8] focus:border-[#3157D5] focus:outline-none"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-[#EF4444]">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Legal Checkboxes */}
              <div className="space-y-2 pt-2">
                <div>
                  <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-[#64748B]">
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) =>
                        setFormData({ ...formData, agreeTerms: e.target.checked })
                      }
                      className="mt-0.5 rounded border-[#E2E8F0] text-[#3157D5] focus:ring-[#3157D5]"
                    />
                    <span>
                      I agree to the CUCampusSaathi{' '}
                      <Link
                        to="/terms"
                        className="text-[#3157D5] underline hover:text-[#2546b5]"
                      >
                        Terms & Conditions
                      </Link>
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="text-xs text-[#EF4444] mt-0.5">{errors.agreeTerms}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-[#64748B]">
                    <input
                      type="checkbox"
                      checked={formData.agreePrivacy}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          agreePrivacy: e.target.checked,
                        })
                      }
                      className="mt-0.5 rounded border-[#E2E8F0] text-[#3157D5] focus:ring-[#3157D5]"
                    />
                    <span>
                      I have read and acknowledge the{' '}
                      <Link
                        to="/privacy"
                        className="text-[#3157D5] underline hover:text-[#2546b5]"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.agreePrivacy && (
                    <p className="text-xs text-[#EF4444] mt-0.5">{errors.agreePrivacy}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
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
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>
          )}

          {/* Login Link Footer */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
            Already registered on CUCampusSaathi?{' '}
            <Link
              to="/login"
              className="text-[#3157D5] font-bold hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Admin Restriction Note */}
        <p className="mt-4 text-center text-[11px] text-[#94A3B8] max-w-sm mx-auto">
          Notice: University Administrator roles cannot be registered through this public interface and must be provisioned by authorized IT leadership.
        </p>
      </div>
    </div>
  );
};
