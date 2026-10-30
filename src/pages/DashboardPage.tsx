import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  Shield,
  Calendar,
  MapPin,
  Video,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Users,
  Settings,
  Sparkles,
  Activity,
  ChevronRight,
  Download,
  TrendingUp,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth, isStudentProfileComplete } from '../context/AuthContext';
import { apiClient, API_BASE_URL, type ApiResponse } from '../api/client';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface StudentProfile {
  course?: string;
  semester?: number;
  bio?: string;
  skills?: string[];
  privacyLevel?: string;
  personalEmail?: string;
  contactNumber?: string;
  isOnboardingCompleted?: boolean;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    twitter?: string;
  };
}

interface TeacherProfile {
  designation?: string;
  department?: string;
  officeLocation?: string;
  researchDomains?: string[];
  isAcceptingBookings?: boolean;
}

interface AppointmentItem {
  _id: string;
  student?: {
    _id: string;
    fullName: string;
    email: string;
    department: string;
    uid: string;
  };
  teacherProfile?: {
    _id: string;
    designation: string;
    department: string;
    officeLocation: string;
    user?: {
      _id: string;
      fullName: string;
      email: string;
    };
  };
  slot?: {
    startTime: string;
    endTime: string;
    durationMinutes: number;
    locationType: 'CABIN' | 'VIRTUAL_MEET';
    locationDetails?: string;
  };
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED';
  meetingLink?: string;
  studentNotes?: string;
  createdAt: string;
}

export const DashboardPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Student / Teacher State
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  // Admin Specific State
  const [adminOverview, setAdminOverview] = useState<any>(null);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentTeachers, setRecentTeachers] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState<'students' | 'teachers'>('students');

  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Time-based personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (!authLoading && user && user.role === 'STUDENT' && !isStudentProfileComplete(user)) {
      navigate('/student/onboarding');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoadingData(true);
      try {
        if (user.role === 'ADMIN') {
          const [overviewRes, studentsRes, teachersRes] = await Promise.all([
            apiClient.get<ApiResponse<any>>('/admin/dashboard').catch(() => null),
            apiClient.get<ApiResponse<any>>('/admin/students?limit=6').catch(() => null),
            apiClient.get<ApiResponse<any>>('/admin/teachers?limit=6').catch(() => null),
          ]);

          if (overviewRes?.data) setAdminOverview(overviewRes.data);
          if (studentsRes?.data?.students) setRecentStudents(studentsRes.data.students);
          if (teachersRes?.data?.teachers) setRecentTeachers(teachersRes.data.teachers);
        } else {
          if (user.role === 'STUDENT') {
            const profileRes = await apiClient
              .get<ApiResponse<{ profile: StudentProfile }>>('/users/profile/student')
              .catch(() => null);
            if (profileRes?.data?.profile) {
              const p = profileRes.data.profile;
              setStudentProfile(p);

              // Verify mandatory fields are completed
              const isDone = !!(
                p.isOnboardingCompleted ||
                (p.personalEmail &&
                 p.bio && p.bio.trim().length > 0 &&
                 p.skills && p.skills.length > 0 &&
                 p.socialLinks?.github &&
                 p.socialLinks?.linkedin)
              );

              if (!isDone) {
                navigate('/student/onboarding');
                return;
              }
            } else {
              navigate('/student/onboarding');
              return;
            }
          } else if (user.role === 'TEACHER') {
            const profileRes = await apiClient
              .get<ApiResponse<{ profile: TeacherProfile }>>('/users/profile/teacher')
              .catch(() => null);
            if (profileRes?.data?.profile) {
              setTeacherProfile(profileRes.data.profile);
            }
          }

          const appRes = await apiClient
            .get<ApiResponse<{ appointments: AppointmentItem[] }>>('/appointments')
            .catch(() => null);
          if (appRes?.data?.appointments) {
            setAppointments(appRes.data.appointments);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleExport = (type: 'students' | 'teachers' | 'appointments') => {
    window.open(`${API_BASE_URL}/admin/export/${type}`, '_blank');
  };

  if (authLoading || loadingData || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-[#FFF7F7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#C62828] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#666666]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments
    .filter((a) => ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(a.status))
    .slice(0, 3);

  return (
    <div className="flex-1 bg-[#FFF7F7] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Welcome & User Profile Card */}
        <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xs p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-[#FFF7F7] to-transparent rounded-full pointer-events-none opacity-80" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md shrink-0 text-white ${
                  user.role === 'ADMIN'
                    ? 'bg-gradient-to-br from-[#C62828] to-[#8E1717]'
                    : user.role === 'TEACHER'
                    ? 'bg-gradient-to-br from-[#8E1717] to-[#701212]'
                    : 'bg-gradient-to-br from-[#C62828] to-[#8E1717]'
                }`}
              >
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
                    {getGreeting()},
                  </span>
                  <Badge variant="primary" size="sm">
                    {user.role === 'ADMIN'
                      ? 'Administrator'
                      : user.role === 'TEACHER'
                      ? 'Faculty Member'
                      : 'Student'}
                  </Badge>
                  {user.role === 'ADMIN' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C62828] bg-[#FFF7F7] px-2.5 py-0.5 rounded-full border border-[#C62828]/25">
                      <ShieldCheck className="w-3 h-3" />
                      Platform Authority
                    </span>
                  ) : user.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8E1717] bg-[#FFF7F7] px-2 py-0.5 rounded-full border border-[#8E1717]/25">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8E1717] bg-[#FFF7F7] px-2 py-0.5 rounded-full border border-[#8E1717]/25">
                      <AlertCircle className="w-3 h-3" />
                      Pending Verification
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#252525] tracking-tight">
                  {user.fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#666666]">
                  <span>UID: <strong className="text-[#252525]">{user.uid}</strong></span>
                  <span>•</span>
                  <span>Dept: <strong className="text-[#252525]">{user.department}</strong></span>
                  <span>•</span>
                  <span>Email: <strong className="text-[#252525]">{user.email}</strong></span>
                  {user.role === 'STUDENT' && studentProfile?.course && (
                    <>
                      <span>•</span>
                      <span>Course: <strong className="text-[#C62828]">{studentProfile.course} (Sem {studentProfile.semester || 1})</strong></span>
                    </>
                  )}
                  {user.role === 'TEACHER' && teacherProfile?.designation && (
                    <>
                      <span>•</span>
                      <span>Title: <strong className="text-[#8E1717]">{teacherProfile.designation}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              {user.role === 'ADMIN' ? (
                <>
                  <Button
                    to="/admin"
                    variant="primary"
                    size="sm"
                    icon={<Shield className="w-3.5 h-3.5" />}
                    className="flex-1 md:flex-none justify-center shadow-xs"
                  >
                    Open Full Admin Console
                  </Button>
                  <Button
                    to="/profile"
                    variant="outline"
                    size="sm"
                    icon={<Settings className="w-3.5 h-3.5" />}
                    className="flex-1 md:flex-none justify-center"
                  >
                    Security Settings
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    to="/ai-tutor"
                    variant="primary"
                    size="sm"
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                    className="flex-1 md:flex-none justify-center shadow-xs"
                  >
                    AI Document Tutor
                  </Button>
                  <Button
                    to={user.role === 'TEACHER' ? '/appointments?tab=manage_slots' : '/appointments?tab=book_slot'}
                    variant="outline"
                    size="sm"
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    className="flex-1 md:flex-none justify-center"
                  >
                    {user.role === 'TEACHER' ? 'Manage Availability Slots' : 'Book Faculty Slot'}
                  </Button>
                  <Button
                    to="/profile"
                    variant="outline"
                    size="sm"
                    icon={<Settings className="w-3.5 h-3.5" />}
                    className="flex-1 md:flex-none justify-center"
                  >
                    Manage Profile
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* -------------------- ADMIN VIEW -------------------- */}
        {user.role === 'ADMIN' ? (
          <div className="space-y-8">
            {/* Admin Key Metrics */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#252525] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#C62828]" />
                  <span>Campus Platform Overview</span>
                </h2>
                <Link
                  to="/admin?tab=analytics"
                  className="text-xs font-bold text-[#C62828] hover:underline flex items-center gap-1"
                >
                  <span>Detailed Analytics</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Total Students */}
                <Link
                  to="/admin?tab=students"
                  className="bg-white rounded-2xl border border-[#E7DADA] p-5 shadow-xs hover:border-[#C62828]/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Total Students
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#252525]">
                    {adminOverview?.users?.totalStudents ?? 0}
                  </div>
                  <p className="text-xs text-[#8E1717] mt-1 font-medium flex items-center gap-1">
                    <span>Active Campus Enrollees</span>
                  </p>
                </Link>

                {/* 2. Total Faculty */}
                <Link
                  to="/admin?tab=faculty"
                  className="bg-white rounded-2xl border border-[#E7DADA] p-5 shadow-xs hover:border-[#8E1717]/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Faculty Members
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7F7] text-[#8E1717] border border-[#8E1717]/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#252525]">
                    {adminOverview?.users?.totalTeachers ?? 0}
                  </div>
                  <p className="text-xs text-[#8E1717] mt-1 font-medium flex items-center gap-1">
                    <span>Verified Academic Staff</span>
                  </p>
                </Link>

                {/* 3. Pending Verifications */}
                <Link
                  to="/admin?tab=verifications"
                  className="bg-white rounded-2xl border border-[#E7DADA] p-5 shadow-xs hover:border-[#C62828]/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Pending Approvals
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#252525]">
                    {adminOverview?.verifications?.pendingVerifications ?? 0}
                  </div>
                  <p className="text-xs text-[#C62828] mt-1 font-medium flex items-center gap-1">
                    <span>Faculty Verification Queue</span>
                  </p>
                </Link>

                {/* 4. Total Consultations */}
                <Link
                  to="/admin?tab=appointments"
                  className="bg-white rounded-2xl border border-[#E7DADA] p-5 shadow-xs hover:border-[#C62828]/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Total Consultations
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-[#252525]">
                    {adminOverview?.appointments?.totalAppointments ?? 0}
                  </div>
                  <p className="text-xs text-[#C62828] mt-1 font-medium flex items-center gap-1">
                    <span>FacultyConnect Bookings</span>
                  </p>
                </Link>
              </div>
            </div>

            {/* Admin Quick Action Hub */}
            <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#252525] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#C62828]" />
                    <span>Administrative Quick Launch & Tools</span>
                  </h3>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Direct access to manage campus accounts, perform verifications, and download official data reports
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport('students')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7DADA] hover:bg-[#FFF7F7] text-xs font-semibold text-[#252525] transition-colors cursor-pointer"
                    title="Export Student Registry CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C62828]" />
                    <span>Students CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('teachers')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7DADA] hover:bg-[#FFF7F7] text-xs font-semibold text-[#252525] transition-colors cursor-pointer"
                    title="Export Faculty Registry CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8E1717]" />
                    <span>Faculty CSV</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/admin?tab=students"
                  className="p-4 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] hover:border-[#C62828]/40 hover:bg-white transition-all group flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E7DADA] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#252525]">Manage Students</h4>
                    <p className="text-xs text-[#666666] mt-0.5">Filter by course, search UID, suspend or activate accounts.</p>
                  </div>
                </Link>

                <Link
                  to="/admin?tab=faculty"
                  className="p-4 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] hover:border-[#8E1717]/40 hover:bg-white transition-all group flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E7DADA] text-[#8E1717] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#252525]">Manage Faculty</h4>
                    <p className="text-xs text-[#666666] mt-0.5">Review designations, research domains, cabin locations.</p>
                  </div>
                </Link>

                <Link
                  to="/admin?tab=verifications"
                  className="p-4 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] hover:border-[#C62828]/40 hover:bg-white transition-all group flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E7DADA] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#252525]">Verify Accounts</h4>
                    <p className="text-xs text-[#666666] mt-0.5">Approve new faculty sign-ups with official institutional badge.</p>
                  </div>
                </Link>

                <Link
                  to="/admin?tab=analytics"
                  className="p-4 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] hover:border-[#C62828]/40 hover:bg-white transition-all group flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E7DADA] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#252525]">Campus Analytics</h4>
                    <p className="text-xs text-[#666666] mt-0.5">Interactive graphs, consultation trends, and department audits.</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Registered Users Preview Table */}
            <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#252525] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#C62828]" />
                    <span>Registered Campus Users</span>
                  </h3>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Live accounts registered in the Chandigarh University database
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-[#FFF7F7] rounded-xl border border-[#E7DADA] self-start sm:self-auto">
                  <button
                    onClick={() => setAdminTab('students')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      adminTab === 'students'
                        ? 'bg-white text-[#C62828] shadow-xs'
                        : 'text-[#666666] hover:text-[#252525]'
                    }`}
                  >
                    Registered Students ({recentStudents.length})
                  </button>
                  <button
                    onClick={() => setAdminTab('teachers')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      adminTab === 'teachers'
                        ? 'bg-white text-[#8E1717] shadow-xs'
                        : 'text-[#666666] hover:text-[#252525]'
                    }`}
                  >
                    Registered Faculty ({recentTeachers.length})
                  </button>
                </div>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto rounded-2xl border border-[#E7DADA]">
                {adminTab === 'students' ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FFF7F7] text-[#666666] uppercase font-bold border-b border-[#E7DADA]">
                      <tr>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">UID</th>
                        <th className="py-3 px-4">Department & Course</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Verification</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7DADA] bg-white">
                      {recentStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#666666]">
                            No students registered yet.
                          </td>
                        </tr>
                      ) : (
                        recentStudents.map((st) => (
                          <tr key={st._id} className="hover:bg-[#FFF7F7] transition-colors">
                            <td className="py-3.5 px-4 font-bold text-[#252525]">
                              {st.fullName}
                              <div className="text-[11px] font-normal text-[#666666]">{st.email}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-[#C62828]">
                              {st.uid}
                            </td>
                            <td className="py-3.5 px-4 text-[#666666]">
                              <span className="font-medium text-[#252525]">{st.department}</span>
                              <div className="text-[11px] text-[#C62828]">
                                {st.studentProfile?.course || 'B.Tech'} (Sem {st.studentProfile?.semester || 1})
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  st.accountStatus === 'ACTIVE'
                                    ? 'bg-[#FFF7F7] text-[#8E1717] border border-[#8E1717]/20'
                                    : 'bg-[#FFF1F1] text-[#C62828] border border-[#C62828]/20'
                                }`}
                              >
                                {st.accountStatus || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {st.isVerified ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8E1717]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C62828]">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Unverified
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Link
                                to="/admin?tab=students"
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#C62828] hover:underline"
                              >
                                <span>Manage</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FFF7F7] text-[#666666] uppercase font-bold border-b border-[#E7DADA]">
                      <tr>
                        <th className="py-3 px-4">Faculty Name</th>
                        <th className="py-3 px-4">Faculty ID</th>
                        <th className="py-3 px-4">Department & Office</th>
                        <th className="py-3 px-4">Designation</th>
                        <th className="py-3 px-4">Verification</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7DADA] bg-white">
                      {recentTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#666666]">
                            No faculty members registered yet.
                          </td>
                        </tr>
                      ) : (
                        recentTeachers.map((tc) => (
                          <tr key={tc._id} className="hover:bg-[#FFF7F7] transition-colors">
                            <td className="py-3.5 px-4 font-bold text-[#252525]">
                              {tc.fullName}
                              <div className="text-[11px] font-normal text-[#666666]">{tc.email}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-[#8E1717]">
                              {tc.uid}
                            </td>
                            <td className="py-3.5 px-4 text-[#666666]">
                              <span className="font-medium text-[#252525]">{tc.department}</span>
                              <div className="text-[11px] text-[#666666]">
                                Cabin: {tc.teacherProfile?.officeLocation || 'Main Block'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#252525]">
                              {tc.teacherProfile?.designation || 'Faculty Member'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  tc.teacherProfile?.verificationStatus === 'VERIFIED'
                                    ? 'bg-[#FFF7F7] text-[#8E1717] border border-[#8E1717]/20'
                                    : tc.teacherProfile?.verificationStatus === 'REJECTED'
                                    ? 'bg-[#FFF1F1] text-[#C62828] border border-[#C62828]/20'
                                    : 'bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20'
                                }`}
                              >
                                {tc.teacherProfile?.verificationStatus || 'PENDING'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Link
                                to="/admin?tab=faculty"
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#8E1717] hover:underline"
                              >
                                <span>Manage</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* View All in Admin Console Link */}
              <div className="flex justify-end pt-2">
                <Button
                  to={adminTab === 'students' ? '/admin?tab=students' : '/admin?tab=faculty'}
                  variant="outline"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                >
                  View All in Admin Console
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* -------------------- STUDENT / TEACHER VIEW -------------------- */
          <div className="space-y-8">
            {/* Feature Cards Grid Customized by Role */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#252525] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C62828]" />
                  <span>Campus Features & Quick Launch</span>
                </h2>
                <span className="text-xs text-[#666666] font-medium">Tailored for your role</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* FEATURE 0: AI DOCUMENT TUTOR */}
                <div className="bg-white rounded-2xl border border-[#C62828]/40 shadow-xs p-6 hover:shadow-md hover:border-[#C62828] transition-all group flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#C62828] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    New • RAG AI
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-[#252525] mb-1.5">
                      AI Document Tutor
                    </h3>
                    <p className="text-xs text-[#666666] leading-relaxed mb-4">
                      Upload course PDFs and lecture notes. Ask questions grounded strictly in your files with page citations and summaries.
                    </p>
                    <div className="p-3 bg-[#FFF7F7] rounded-xl border border-[#C62828]/20 mb-4 flex items-center justify-between text-xs">
                      <span className="text-[#C62828] font-semibold">Engine:</span>
                      <span className="font-extrabold text-[#252525] px-2 py-0.5 bg-white rounded-md border border-[#C62828]/30">
                        Groq • RAG
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/ai-tutor"
                    className="inline-flex items-center justify-between text-xs font-bold text-[#C62828] hover:text-[#8E1717] pt-2 border-t border-[#E7DADA]"
                  >
                    <span>Launch AI Tutor</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* FEATURE 1: PROFILE MANAGEMENT */}
                <div className="bg-white rounded-2xl border border-[#E7DADA] p-6 hover:shadow-md hover:border-[#C62828]/40 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      {user.role === 'STUDENT' ? (
                        <GraduationCap className="w-6 h-6" />
                      ) : (
                        <Briefcase className="w-6 h-6" />
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#252525] mb-1.5">
                      {user.role === 'STUDENT'
                        ? 'Student Academic Profile'
                        : 'Faculty Academic Profile'}
                    </h3>
                    <p className="text-xs text-[#666666] leading-relaxed mb-4">
                      {user.role === 'STUDENT'
                        ? 'Showcase technical skills, portfolio links, academic bio, and privacy settings.'
                        : 'Configure office cabin location, research domains, student consultation preferences.'}
                    </p>

                    {/* Profile Highlights Preview */}
                    {user.role === 'STUDENT' && studentProfile && (
                      <div className="p-3 bg-[#FFF7F7] rounded-xl border border-[#E7DADA] mb-4 space-y-1.5 text-xs">
                        <div className="flex justify-between text-[#666666]">
                          <span>Course:</span>
                          <strong className="text-[#252525]">{studentProfile.course || 'B.Tech'}</strong>
                        </div>
                        <div className="flex justify-between text-[#666666]">
                          <span>Semester:</span>
                          <strong className="text-[#252525]">{studentProfile.semester || 1}</strong>
                        </div>
                        {studentProfile.skills && studentProfile.skills.length > 0 && (
                          <div className="pt-1.5 flex flex-wrap gap-1">
                            {studentProfile.skills.slice(0, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white text-[#C62828] text-[10px] font-bold border border-[#C62828]/30"
                              >
                                {s}
                              </span>
                            ))}
                            {studentProfile.skills.length > 3 && (
                              <span className="text-[10px] text-[#666666] self-center">
                                +{studentProfile.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {user.role === 'TEACHER' && teacherProfile && (
                      <div className="p-3 bg-[#FFF7F7] rounded-xl border border-[#E7DADA] mb-4 space-y-1.5 text-xs">
                        <div className="flex justify-between text-[#666666]">
                          <span>Office:</span>
                          <strong className="text-[#252525]">{teacherProfile.officeLocation || 'Main Block'}</strong>
                        </div>
                        <div className="flex justify-between text-[#666666]">
                          <span>Bookings:</span>
                          <strong className={teacherProfile.isAcceptingBookings ? 'text-[#8E1717]' : 'text-[#C62828]'}>
                            {teacherProfile.isAcceptingBookings ? 'Accepting Appointments' : 'Paused'}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    className="inline-flex items-center justify-between text-xs font-bold text-[#C62828] hover:text-[#8E1717] pt-2 border-t border-[#E7DADA]"
                  >
                    <span>Edit & Update Profile</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* FEATURE 2: FACULTYCONNECT / APPOINTMENT ENGINE */}
                <div className="bg-white rounded-2xl border border-[#E7DADA] p-6 hover:shadow-md hover:border-[#C62828]/40 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#FFF7F7] text-[#8E1717] border border-[#8E1717]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-[#252525] mb-1.5">
                      {user.role === 'STUDENT'
                        ? 'FacultyConnect Appointments'
                        : 'Consultation Schedule & Slots'}
                    </h3>
                    <p className="text-xs text-[#666666] leading-relaxed mb-4">
                      {user.role === 'STUDENT'
                        ? 'Book 1-on-1 office hour appointments with department professors. Access video meeting links.'
                        : 'Define weekly availability slots, approve/reject student consultation requests, and attach Google Meet links.'}
                    </p>

                    <div className="p-3 bg-[#FFF7F7] rounded-xl border border-[#E7DADA] mb-4 flex items-center justify-between text-xs">
                      <span className="text-[#666666]">Active Consultations:</span>
                      <span className="font-extrabold text-[#252525] px-2.5 py-0.5 bg-white rounded-md border border-[#E7DADA]">
                        {upcomingAppointments.length} upcoming
                      </span>
                    </div>
                  </div>

                  <Link
                    to={user.role === 'TEACHER' ? '/appointments?tab=manage_slots' : '/appointments?tab=book_slot'}
                    className="inline-flex items-center justify-between text-xs font-bold text-[#8E1717] hover:text-[#701212] pt-2 border-t border-[#E7DADA]"
                  >
                    <span>{user.role === 'TEACHER' ? 'Manage Availability Slots' : 'Book / View Consultations'}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* FEATURE 3: CAMPUS DIRECTORY */}
                <div className="bg-white rounded-2xl border border-[#E7DADA] p-6 hover:shadow-md hover:border-[#C62828]/40 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-[#252525] mb-1.5">
                      Campus Directory
                    </h3>
                    <p className="text-xs text-[#666666] leading-relaxed mb-4">
                      Discover verified students and professors across departments. Filter by skills, domains, or designations.
                    </p>
                    <div className="p-3 bg-[#FFF7F7] rounded-xl border border-[#E7DADA] mb-4 text-xs text-[#666666] flex items-center justify-between">
                      <span>Directory Privacy:</span>
                      <strong className="text-[#252525]">Campus Only</strong>
                    </div>
                  </div>

                  <Link
                    to="/directory"
                    className="inline-flex items-center justify-between text-xs font-bold text-[#C62828] hover:text-[#8E1717] pt-2 border-t border-[#E7DADA]"
                  >
                    <span>Browse Directory</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Upcoming Consultations Widget for Students & Teachers */}
            <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#252525] flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#C62828]" />
                    <span>Upcoming Consultations & Meeting Links</span>
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Join live video consultation sessions or view your confirmed academic slots
                  </p>
                </div>
                <Button
                  to="/appointments"
                  variant="outline"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                >
                  View All Appointments
                </Button>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="py-10 text-center rounded-2xl bg-[#FFF7F7] border border-dashed border-[#E7DADA]">
                  <div className="w-12 h-12 rounded-full bg-white text-[#C62828] border border-[#C62828]/20 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#252525] mb-1">
                    No Upcoming Consultations Scheduled
                  </h3>
                  <p className="text-xs text-[#666666] max-w-sm mx-auto mb-4">
                    {user.role === 'STUDENT'
                      ? 'Connect with your professors for academic guidance, project reviews, or thesis consultation.'
                      : 'Configure your weekly availability slots so students can book office hours.'}
                  </p>
                  <Button
                    to={user.role === 'TEACHER' ? '/appointments?tab=manage_slots' : '/appointments?tab=book_slot'}
                    variant="primary"
                    size="sm"
                  >
                    {user.role === 'STUDENT' ? 'Book a Consultation Now' : 'Set Up Availability Slots'}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingAppointments.map((appt) => {
                    const partnerName =
                      user.role === 'STUDENT'
                        ? appt.teacherProfile?.user?.fullName || 'Faculty Member'
                        : appt.student?.fullName || 'Student';

                    const partnerRole =
                      user.role === 'STUDENT'
                        ? appt.teacherProfile?.designation || 'Teacher'
                        : `${appt.student?.department || ''} (${appt.student?.uid || ''})`;

                    const startTime = appt.slot?.startTime
                      ? new Date(appt.slot.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Scheduled';

                    const startDate = appt.slot?.startTime
                      ? new Date(appt.slot.startTime).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '';

                    return (
                      <div
                        key={appt._id}
                        className="p-5 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] flex flex-col justify-between space-y-4 hover:border-[#C62828]/40 transition-colors"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={
                                appt.status === 'CONFIRMED'
                                  ? 'success'
                                  : appt.status === 'PENDING'
                                  ? 'warning'
                                  : 'primary'
                              }
                              size="sm"
                            >
                              {appt.status}
                            </Badge>
                            <span className="text-[11px] font-bold text-[#C62828] bg-white border border-[#C62828]/30 px-2 py-0.5 rounded-md">
                              {appt.slot?.durationMinutes || 30} min
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-[#252525]">{partnerName}</h4>
                            <p className="text-[11px] text-[#666666]">{partnerRole}</p>
                          </div>

                          <div className="space-y-1 text-xs text-[#666666]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#C62828]" />
                              <span>{startDate} at {startTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {appt.slot?.locationType === 'VIRTUAL_MEET' ? (
                                <>
                                  <Video className="w-3.5 h-3.5 text-[#8E1717]" />
                                  <span>Virtual Google Meet / Zoom</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="w-3.5 h-3.5 text-[#C62828]" />
                                  <span>{appt.slot?.locationDetails || 'Faculty Cabin'}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Join Meeting CTA if available */}
                        {appt.meetingLink ? (
                          <a
                            href={appt.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold transition-colors shadow-xs"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Meeting Link</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        ) : (
                          <Button
                            to="/appointments"
                            variant="outline"
                            size="sm"
                            className="w-full justify-center text-xs"
                          >
                            Manage in FacultyConnect
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
