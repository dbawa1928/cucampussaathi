import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Phone,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ArrowRight,
  ShieldCheck,
  User,
  Loader2,
} from 'lucide-react';
import { useAuth, isStudentProfileComplete } from '../context/AuthContext';
import { apiClient, type ApiResponse } from '../api/client';
import { Button } from '../components/ui/Button';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const POPULAR_SKILLS = [
  'Python',
  'React',
  'Java',
  'C++',
  'Data Structures & Algorithms',
  'Machine Learning',
  'Node.js',
  'SQL',
  'Tailwind CSS',
  'Artificial Intelligence',
  'Cloud Computing',
  'Git & GitHub',
];

export const StudentOnboardingPage: React.FC = () => {
  const { user, updateUser, isLoading: authLoading, checkAuth } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [personalEmail, setPersonalEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [course, setCourse] = useState('B.Tech CSE');
  const [semester, setSemester] = useState<number>(5);
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // If already onboarded, or not a student, redirect to dashboard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      if (user.role !== 'STUDENT') {
        navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
        return;
      }

      // If already complete, go to dashboard
      if (isStudentProfileComplete(user)) {
        navigate('/dashboard');
        return;
      }

      // Prepopulate existing profile data if present
      if (user.profile) {
        if (user.profile.personalEmail) setPersonalEmail(user.profile.personalEmail);
        if (user.profile.contactNumber) setContactNumber(user.profile.contactNumber);
        if (user.profile.course) setCourse(user.profile.course);
        if (user.profile.semester) setSemester(user.profile.semester);
        if (user.profile.bio) setBio(user.profile.bio);
        if (Array.isArray(user.profile.skills) && user.profile.skills.length > 0) {
          setSkills(user.profile.skills);
        }
        if (user.profile.socialLinks?.github) setGithub(user.profile.socialLinks.github);
        if (user.profile.socialLinks?.linkedin) setLinkedin(user.profile.socialLinks.linkedin);
      }
      setLoadingInitial(false);
    }
  }, [user, authLoading, navigate]);

  // Skill tag add/remove
  const handleAddSkill = (skillToAdd?: string) => {
    const s = (skillToAdd || skillInput).trim();
    if (!s) return;
    if (skills.some((existing) => existing.toLowerCase() === s.toLowerCase())) {
      setSkillInput('');
      return;
    }
    if (skills.length >= 25) {
      setError('You can add up to 25 skills.');
      return;
    }
    setSkills([...skills, s]);
    setSkillInput('');
    setError('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Strict Validation
    if (!personalEmail.trim()) {
      setError('Personal Email is mandatory. Please provide a valid email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalEmail.trim())) {
      setError('Please enter a valid personal email format.');
      return;
    }

    if (!github.trim()) {
      setError('GitHub Profile URL is mandatory.');
      return;
    }
    if (!github.startsWith('http://') && !github.startsWith('https://')) {
      setError('GitHub URL must start with https:// (e.g. https://github.com/username).');
      return;
    }

    if (!linkedin.trim()) {
      setError('LinkedIn Profile URL is mandatory.');
      return;
    }
    if (!linkedin.startsWith('http://') && !linkedin.startsWith('https://')) {
      setError('LinkedIn URL must start with https:// (e.g. https://linkedin.com/in/username).');
      return;
    }

    if (!bio.trim() || bio.trim().length < 15) {
      setError('Intro / Bio is mandatory and must be at least 15 characters.');
      return;
    }

    if (skills.length === 0) {
      setError('Please add at least 1 technical skill or academic interest.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        course: course.trim() || 'B.Tech CSE',
        semester: Number(semester) || 5,
        bio: bio.trim(),
        skills,
        personalEmail: personalEmail.trim().toLowerCase(),
        contactNumber: contactNumber.trim(),
        socialLinks: {
          github: github.trim(),
          linkedin: linkedin.trim(),
        },
        isOnboardingCompleted: true,
        privacyLevel: 'CAMPUS_ONLY',
      };

      const res = await apiClient.put<ApiResponse<any>>('/users/profile/student', payload);

      if (res.success && res.data?.profile) {
        setSuccess('Profile completed successfully! Redirecting to Dashboard...');
        if (user) {
          updateUser({
            ...user,
            profile: res.data.profile,
          });
        }
        await checkAuth();
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setError(res.message || 'Failed to save profile. Please check all fields.');
      }
    } catch (err: any) {
      setError(err.message || 'Could not complete onboarding. Please ensure all mandatory fields are valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingInitial) {
    return (
      <div className="min-h-screen bg-[#FFF7F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C62828] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7F7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E7DADA] shadow-xs mb-3">
            <Sparkles className="w-4 h-4 text-[#C62828]" />
            <span className="text-xs font-bold text-[#C62828] uppercase tracking-wider">
              Student Onboarding & Profile Setup
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#252525] tracking-tight">
            Complete Your Student Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] max-w-xl mx-auto mt-2 leading-relaxed">
            Please fill in your academic background and professional profiles. This information is mandatory to unlock your <strong>Student Dashboard</strong>, book faculty consultations, and connect with peers.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-md p-6 sm:p-10 relative">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#C62828] mt-0.5" />
              <div className="flex-1 font-semibold">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <div className="flex-1 font-bold">{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Identity & Emails */}
            <div className="pb-6 border-b border-[#E7DADA] space-y-4">
              <h3 className="text-sm font-bold text-[#252525] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#C62828]" />
                <span>1. Academic Identity & Contact</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">
                    Student Full Name <span className="text-[#666666] font-normal">(Verified)</span>
                  </label>
                  <input
                    type="text"
                    value={user?.fullName || ''}
                    disabled
                    className="w-full bg-[#FFF7F7] border border-[#E7DADA] rounded-xl px-3.5 py-2.5 text-xs text-[#252525] font-semibold cursor-not-allowed opacity-90"
                  />
                </div>

                {/* University UID */}
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">
                    University UID <span className="text-[#666666] font-normal">(Verified)</span>
                  </label>
                  <input
                    type="text"
                    value={user?.uid || ''}
                    disabled
                    className="w-full bg-[#FFF7F7] border border-[#E7DADA] rounded-xl px-3.5 py-2.5 text-xs text-[#252525] font-semibold cursor-not-allowed opacity-90"
                  />
                </div>

                {/* University Email */}
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1 flex items-center justify-between">
                    <span>University Email *</span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Mandatory / Locked
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-[#FFF7F7] border border-[#E7DADA] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#252525] font-semibold cursor-not-allowed opacity-90"
                    />
                  </div>
                </div>

                {/* Personal Email (Mandatory) */}
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">
                    Personal Email Address <span className="text-[#C62828]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#C62828] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full bg-white border border-[#E7DADA] focus:border-[#C62828] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#252525] focus:outline-none shadow-xs"
                    />
                  </div>
                  <span className="text-[10px] text-[#666666] mt-1 block">
                    Used for backup notifications and appointment reminders.
                  </span>
                </div>

                {/* Contact Number (Optional) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#252525] mb-1 flex items-center justify-between">
                    <span>Contact / WhatsApp Number</span>
                    <span className="text-[11px] font-semibold text-[#666666]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+91 98765 43210 (Optional)"
                      className="w-full bg-white border border-[#E7DADA] focus:border-[#C62828] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#252525] focus:outline-none shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Academic Program & Year */}
            <div className="pb-6 border-b border-[#E7DADA] space-y-4">
              <h3 className="text-sm font-bold text-[#252525] uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#C62828]" />
                <span>2. Academic Program</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">
                    Enrolled Course / Degree <span className="text-[#C62828]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                    className="w-full bg-white border border-[#E7DADA] focus:border-[#C62828] rounded-xl px-3.5 py-2.5 text-xs text-[#252525] focus:outline-none shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">
                    Current Semester <span className="text-[#C62828]">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full bg-white border border-[#E7DADA] focus:border-[#C62828] rounded-xl px-3.5 py-2.5 text-xs text-[#252525] focus:outline-none shadow-xs font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Professional Profiles (GitHub & LinkedIn) */}
            <div className="pb-6 border-b border-[#E7DADA] space-y-4">
              <h3 className="text-sm font-bold text-[#252525] uppercase tracking-wider flex items-center gap-2">
                <GithubIcon className="w-4 h-4 text-[#C62828]" />
                <span>3. Professional Profiles (Mandatory)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* GitHub URL */}
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">
                    GitHub Profile URL <span className="text-[#C62828]">*</span>
                  </label>
                  <div className="relative">
                    <GithubIcon className="w-4 h-4 text-[#252525] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      required
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="w-full bg-white border border-[#E7DADA] focus:border-[#C62828] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#252525] focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                {/* LinkedIn URL */}
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">
                    LinkedIn Profile URL <span className="text-[#C62828]">*</span>
                  </label>
                  <div className="relative">
                    <LinkedinIcon className="w-4 h-4 text-[#0A66C2] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      required
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/yourusername"
                      className="w-full bg-white border border-[#E7DADA] focus:border-[#C62828] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#252525] focus:outline-none shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Skills & Bio */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#252525] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C62828]" />
                <span>4. Skills & Personal Introduction</span>
              </h3>

              {/* Skills */}
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1 flex items-center justify-between">
                  <span>Technical Skills & Areas of Interest *</span>
                  <span className="text-[10px] text-[#666666]">Press Enter or Comma to add</span>
                </label>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleKeyDownSkill}
                    placeholder="Type a skill (e.g. Python, React, Machine Learning)..."
                    className="flex-1 bg-white border border-[#E7DADA] focus:border-[#C62828] rounded-xl px-3.5 py-2 text-xs text-[#252525] focus:outline-none shadow-xs"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddSkill()}
                    className="gap-1 text-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </Button>
                </div>

                {/* Popular suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="text-[11px] text-[#666666] font-semibold">Suggested:</span>
                  {POPULAR_SKILLS.map((pop) => (
                    <button
                      key={pop}
                      type="button"
                      onClick={() => handleAddSkill(pop)}
                      disabled={skills.includes(pop)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                        skills.includes(pop)
                          ? 'bg-red-50 text-[#C62828] border-red-200 opacity-60 cursor-default'
                          : 'bg-white text-[#666666] border-[#E7DADA] hover:border-[#C62828] hover:text-[#C62828]'
                      }`}
                    >
                      + {pop}
                    </button>
                  ))}
                </div>

                {/* Selected Skills Chips */}
                <div className="min-h-[44px] p-2 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] flex flex-wrap items-center gap-1.5">
                  {skills.length === 0 ? (
                    <span className="text-xs text-[#666666] italic px-2">
                      No skills added yet. Please add at least one skill.
                    </span>
                  ) : (
                    skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#C62828] text-white shadow-xs"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s)}
                          className="hover:opacity-75 focus:outline-none cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Bio / Intro of Person */}
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1 flex items-center justify-between">
                  <span>Personal Introduction / Academic Bio *</span>
                  <span className="text-[10px] text-[#666666]">
                    {bio.length}/500 characters (min 15)
                  </span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Introduce yourself! Write about your academic background, passions, projects you have built or want to build, and areas where you seek faculty guidance..."
                  className="w-full bg-white border border-[#E7DADA] focus:border-[#C62828] rounded-xl p-3.5 text-xs text-[#252525] focus:outline-none shadow-xs leading-relaxed"
                />
              </div>
            </div>

            {/* Submission Section */}
            <div className="pt-6 border-t border-[#E7DADA] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#666666] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C62828]" />
                <span>All fields except contact number are mandatory.</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full sm:w-auto gap-2 px-8 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
