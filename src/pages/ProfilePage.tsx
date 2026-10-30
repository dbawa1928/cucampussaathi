import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Briefcase,
  Mail,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Lock,
  Plus,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { apiClient, type ApiResponse } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

interface StudentProfileData {
  course: string;
  semester: number;
  bio: string;
  skills: string[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  privacyLevel: 'PUBLIC' | 'CAMPUS_ONLY' | 'PRIVATE';
}

interface TeacherProfileData {
  designation: string;
  department: string;
  researchDomains: string[];
  officeLocation: string;
  bookingPreference: string;
  maxDailySlots: number;
  isAcceptingBookings: boolean;
}

export const ProfilePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Student State
  const [studentForm, setStudentForm] = useState<StudentProfileData>({
    course: '',
    semester: 1,
    bio: '',
    skills: [],
    socialLinks: { github: '', linkedin: '', portfolio: '' },
    privacyLevel: 'CAMPUS_ONLY',
  });
  const [skillInput, setSkillInput] = useState<string>('');

  // Teacher State
  const [teacherForm, setTeacherForm] = useState<TeacherProfileData>({
    designation: '',
    department: '',
    researchDomains: [],
    officeLocation: '',
    bookingPreference: 'WEEKLY_OFFICE_HOURS',
    maxDailySlots: 4,
    isAcceptingBookings: true,
  });
  const [domainInput, setDomainInput] = useState<string>('');

  // Fetch initial profile data
  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setApiError('');

    try {
      if (user.role === 'STUDENT') {
        const res = await apiClient.get<ApiResponse<{ profile: any; user: any }>>('/users/profile/student');
        if (res.data?.profile) {
          const p = res.data.profile;
          setStudentForm({
            course: p.course || '',
            semester: p.semester || 1,
            bio: p.bio || '',
            skills: p.skills || [],
            socialLinks: {
              github: p.socialLinks?.github || '',
              linkedin: p.socialLinks?.linkedin || '',
              portfolio: p.socialLinks?.portfolio || '',
            },
            privacyLevel: p.privacyLevel || 'CAMPUS_ONLY',
          });
        }
      } else if (user.role === 'TEACHER') {
        const res = await apiClient.get<ApiResponse<{ profile: any; user: any }>>('/users/profile/teacher');
        if (res.data?.profile) {
          const p = res.data.profile;
          setTeacherForm({
            designation: p.designation || '',
            department: p.department || user.department || '',
            researchDomains: p.researchDomains || [],
            officeLocation: p.officeLocation || '',
            bookingPreference: p.bookingPreference || 'WEEKLY_OFFICE_HOURS',
            maxDailySlots: p.maxDailySlots || 4,
            isAcceptingBookings: p.isAcceptingBookings !== undefined ? p.isAcceptingBookings : true,
          });
        } else {
          setTeacherForm((prev) => ({ ...prev, department: user.department }));
        }
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to load profile data from server.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Skill tag handlers
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (studentForm.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setStudentForm((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setStudentForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Research domain tag handlers
  const handleAddDomain = () => {
    const trimmed = domainInput.trim();
    if (!trimmed) return;
    if (teacherForm.researchDomains.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setDomainInput('');
      return;
    }
    setTeacherForm((prev) => ({
      ...prev,
      researchDomains: [...prev.researchDomains, trimmed],
    }));
    setDomainInput('');
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setTeacherForm((prev) => ({
      ...prev,
      researchDomains: prev.researchDomains.filter((d) => d !== domainToRemove),
    }));
  };

  // Submit student form
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const res = await apiClient.put<ApiResponse<{ profile: any }>>('/users/profile/student', studentForm);
      if (res.success) {
        setSuccessMessage('Student profile updated successfully in MongoDB Atlas.');
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to update student profile.');
    } finally {
      setSaving(false);
    }
  };

  // Submit teacher form
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const res = await apiClient.put<ApiResponse<{ profile: any }>>('/users/profile/teacher', teacherForm);
      if (res.success) {
        setSuccessMessage('Faculty profile updated successfully in MongoDB Atlas.');
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to update faculty profile.');
    } finally {
      setSaving(false);
    }
  };

  // Unauthenticated Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF7F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C62828] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF7F7] py-16 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-[#E7DADA] p-8 sm:p-10 max-w-md w-full text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/25 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#252525] mb-2">Authentication Required</h2>
          <p className="text-xs sm:text-sm text-[#666666] mb-6 leading-relaxed">
            Please sign in with your Chandigarh University credentials to access and manage your
            profile settings.
          </p>
          <Button to="/login" variant="primary" size="md" className="w-full">
            Sign In to CUCampusSaathi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7F7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7DADA]">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold ${
                  user.role === 'TEACHER'
                    ? 'bg-[#FFF7F7] text-[#8E1717] border border-[#8E1717]/25'
                    : user.role === 'ADMIN'
                    ? 'bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/25'
                    : 'bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/25'
                }`}
              >
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525]">
                  {user.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-[#666666] flex items-center gap-2 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-[#C62828]" /> {user.email} • UID: <strong>{user.uid}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  user.role === 'TEACHER'
                    ? 'bg-[#FFF7F7] text-[#8E1717] border border-[#8E1717]/25'
                    : user.role === 'ADMIN'
                    ? 'bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/25'
                    : 'bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/25'
                }`}
              >
                {user.role}
              </span>
              <Button to="/directory" variant="outline" size="sm" icon={<Globe className="w-3.5 h-3.5" />}>
                View Directory
              </Button>
            </div>
          </div>

          {/* Read-Only University Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
            <div>
              <span className="text-[#666666] block">Academic Dept</span>
              <span className="font-semibold text-[#252525]">{user.department}</span>
            </div>
            <div>
              <span className="text-[#666666] block">Campus UID</span>
              <span className="font-mono font-bold text-[#252525]">{user.uid}</span>
            </div>
            <div>
              <span className="text-[#666666] block">Verification</span>
              <span
                className={`font-semibold inline-flex items-center gap-1 ${
                  user.isVerified ? 'text-[#8E1717]' : 'text-[#666666]'
                }`}
              >
                {user.isVerified ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-[#8E1717]" /> Verified Campus ID
                  </>
                ) : (
                  'Pending Official Token'
                )}
              </span>
            </div>
            <div>
              <span className="text-[#666666] block">Security Role</span>
              <span className="font-semibold text-[#252525]">{user.role} Protected</span>
            </div>
          </div>
        </div>

        {/* Feedback Banners */}
        {apiError && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FFF1F1] border border-[#C62828]/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C62828] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[#C62828]">
              <strong className="font-bold">Error: </strong> {apiError}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FFF7F7] border border-[#8E1717]/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#8E1717] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[#8E1717]">
              <strong className="font-bold">Saved: </strong> {successMessage}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#E7DADA]">
            <Loader2 className="w-8 h-8 text-[#C62828] animate-spin mb-3" />
            <p className="text-sm font-semibold text-[#252525]">Loading profile records...</p>
          </div>
        ) : user.role === 'STUDENT' ? (
          /* ==================================================================== */
          /* STUDENT PROFILE FORM */
          /* ==================================================================== */
          <form onSubmit={handleStudentSubmit} className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#C62828]" /> Academic Information
              </h2>
              <p className="text-xs text-[#666666] mb-6">
                Your enrolled degree program and current semester level at Chandigarh University.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Enrolled Degree / Course *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.course}
                    onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Current Semester (1-8) *
                  </label>
                  <select
                    value={studentForm.semester}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, semester: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-[#252525]">
                      Student Biography & Collaboration Goals
                    </label>
                    <span className="text-[11px] text-[#999999]">
                      {studentForm.bio.length} / 500 characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={studentForm.bio}
                    onChange={(e) => setStudentForm({ ...studentForm, bio: e.target.value })}
                    placeholder="Briefly introduce your academic interests, hackathons, open-source work, or peer study goals..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  />
                </div>
              </div>
            </div>

            {/* Skills & Technologies */}
            <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C62828]" /> Skills & Technologies
              </h2>
              <p className="text-xs text-[#666666] mb-4">
                Add skills to help fellow students and faculty find you for peer collaboration and
                mentorship.
              </p>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g. React, Python, Cloud, UI/UX (Press Enter or click Add)"
                  className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                />
                <Button
                  type="button"
                  onClick={handleAddSkill}
                  variant="outline"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add
                </Button>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA]">
                {studentForm.skills.length > 0 ? (
                  studentForm.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-[#E7DADA] text-[#252525] shadow-2xs"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-[#666666] hover:text-[#C62828] transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#999999] italic my-auto">
                    No skills added yet. Type a skill above and press Enter.
                  </span>
                )}
              </div>
            </div>

            {/* Social & Portfolio Links */}
            <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#C62828]" /> Social & Portfolio Links
              </h2>
              <p className="text-xs text-[#666666] mb-6">
                Optionally showcase your verified professional URLs (must begin with http:// or https://).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={studentForm.socialLinks.github || ''}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        socialLinks: { ...studentForm.socialLinks, github: e.target.value },
                      })
                    }
                    placeholder="https://github.com/yourhandle"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={studentForm.socialLinks.linkedin || ''}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        socialLinks: { ...studentForm.socialLinks, linkedin: e.target.value },
                      })
                    }
                    placeholder="https://linkedin.com/in/yourhandle"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Portfolio / Website
                  </label>
                  <input
                    type="url"
                    value={studentForm.socialLinks.portfolio || ''}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        socialLinks: { ...studentForm.socialLinks, portfolio: e.target.value },
                      })
                    }
                    placeholder="https://yourportfolio.dev"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#C62828]" /> Profile Privacy Level
              </h2>
              <p className="text-xs text-[#666666] mb-4">
                Control who can view your profile and skills in the university directory.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    level: 'CAMPUS_ONLY',
                    title: 'Campus Only (Default)',
                    desc: 'Visible only to verified, logged-in CU students and teachers.',
                  },
                  {
                    level: 'PUBLIC',
                    title: 'Public Directory',
                    desc: 'Discoverable in the open directory and peer mentor searches.',
                  },
                  {
                    level: 'PRIVATE',
                    title: 'Private (Confidential)',
                    desc: 'Strictly hidden from all directory searches and public listings.',
                  },
                ].map((item) => (
                  <label
                    key={item.level}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      studentForm.privacyLevel === item.level
                        ? 'border-[#C62828] bg-[#FFF7F7] shadow-xs'
                        : 'border-[#E7DADA] hover:bg-[#FFF7F7]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[#252525]">{item.title}</span>
                        <input
                          type="radio"
                          name="privacyLevel"
                          value={item.level}
                          checked={studentForm.privacyLevel === item.level}
                          onChange={() =>
                            setStudentForm({ ...studentForm, privacyLevel: item.level as any })
                          }
                          className="w-4 h-4 text-[#C62828] focus:ring-[#C62828]"
                        />
                      </div>
                      <p className="text-[11px] text-[#666666] leading-relaxed">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={saving}
                icon={
                  saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )
                }
              >
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        ) : user.role === 'TEACHER' ? (
          /* ==================================================================== */
          /* TEACHER PROFILE FORM */
          /* ==================================================================== */
          <form onSubmit={handleTeacherSubmit} className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#8E1717]" /> Faculty Appointment & Office
              </h2>
              <p className="text-xs text-[#666666] mb-6">
                Your faculty designation and physical office consultation location.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Academic Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.designation}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, designation: e.target.value })
                    }
                    placeholder="e.g. Associate Professor, HOD, Assistant Professor"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Academic Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.department}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, department: e.target.value })
                    }
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Office / Cabin Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.officeLocation}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, officeLocation: e.target.value })
                    }
                    placeholder="e.g. Academic Block 3, Cabin 402, Faculty Wing"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  />
                </div>
              </div>
            </div>

            {/* Research Domains */}
            <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8E1717]" /> Research Domains & Specializations
              </h2>
              <p className="text-xs text-[#666666] mb-4">
                Research areas and specialized subjects for thesis guidance and student projects.
              </p>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDomain();
                    }
                  }}
                  placeholder="e.g. Natural Language Processing, Computer Vision (Press Enter or Add)"
                  className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                />
                <Button
                  type="button"
                  onClick={handleAddDomain}
                  variant="outline"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA]">
                {teacherForm.researchDomains.length > 0 ? (
                  teacherForm.researchDomains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white text-[#8E1717] border border-[#8E1717]/25 shadow-2xs"
                    >
                      {domain}
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        className="text-[#8E1717] hover:text-[#C62828] transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#999999] italic my-auto">
                    No research domains added yet. Type a domain above and press Enter.
                  </span>
                )}
              </div>
            </div>

            {/* Consultation Preferences */}
            <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#252525] mb-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#8E1717]" /> Consultation & Booking Preferences
              </h2>
              <p className="text-xs text-[#666666] mb-6">
                Define your consultation frequency and maximum daily appointment capacity.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Booking Schedule Preference
                  </label>
                  <select
                    value={teacherForm.bookingPreference}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, bookingPreference: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  >
                    <option value="WEEKLY_OFFICE_HOURS">Weekly Office Hours</option>
                    <option value="BIWEEKLY_SLOTS">Bi-Weekly Consultation</option>
                    <option value="BY_APPOINTMENT_ONLY">By Appointment Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                    Max Daily Consultation Slots (1-16)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={teacherForm.maxDailySlots}
                    onChange={(e) =>
                      setTeacherForm({
                        ...teacherForm,
                        maxDailySlots: parseInt(e.target.value, 10) || 4,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all text-[#252525]"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teacherForm.isAcceptingBookings}
                      onChange={(e) =>
                        setTeacherForm({ ...teacherForm, isAcceptingBookings: e.target.checked })
                      }
                      className="w-4 h-4 text-[#8E1717] rounded focus:ring-[#8E1717]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#252525] block">
                        Accepting Student Consultations
                      </span>
                      <span className="text-[11px] text-[#666666]">
                        Allow students to view your availability and request appointments during
                        office hours.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={saving}
                icon={
                  saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )
                }
              >
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        ) : (
          /* ==================================================================== */
          /* ADMIN PROFILE CARD */
          /* ==================================================================== */
          <div className="bg-white rounded-3xl border border-[#E7DADA] p-8 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/25 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#252525] mb-2">
              University System Administration
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] max-w-lg mx-auto mb-6 leading-relaxed">
              Your account possesses elevated administrative authority over campus security, user
              roles, and directory configurations.
            </p>
            <div className="flex justify-center gap-3">
              <Button to="/directory" variant="primary" size="sm">
                Browse Campus Directory
              </Button>
              <Button to="/" variant="outline" size="sm">
                Return to Homepage
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
