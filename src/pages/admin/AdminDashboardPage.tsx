import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  CalendarCheck,
  History,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Eye,
  Download,
  Sparkles,
  BookOpen,
  Layers,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { apiClient, API_BASE_URL, type ApiResponse } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar, type AdminTab } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { StatCard } from '../../components/admin/StatCard';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { UserDetailsDrawer } from '../../components/admin/UserDetailsDrawer';
import { Button } from '../../components/ui/Button';

export const AdminDashboardPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = (searchParams.get('tab') as AdminTab) || 'overview';
  const setActiveTab = (tab: AdminTab) => {
    setSearchParams({ tab });
  };

  // Role Guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Global state
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // User details drawer state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 1. Overview state
  const [overview, setOverview] = useState<any>(null);

  // 2. Universal Users state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allUsersTotal, setAllUsersTotal] = useState(0);
  const [allUsersPage, setAllUsersPage] = useState(1);
  const [allUsersTotalPages, setAllUsersTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userDeptFilter, setUserDeptFilter] = useState('');

  // 3. Students state
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('');

  // 4. Faculty state
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherVerifFilter, setTeacherVerifFilter] = useState('');

  // 5. Verifications state
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verifStatusFilter, setVerifStatusFilter] = useState('PENDING');

  // 6. Appointments state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptStatusFilter, setApptStatusFilter] = useState('');

  // 7. Attendance & Appeals state
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceMetrics, setAttendanceMetrics] = useState<any>(null);
  const [attendanceFilter, setAttendanceFilter] = useState('ALL');

  // 8. Restrictions state
  const [restrictions, setRestrictions] = useState<any[]>([]);

  // 9. Learn & Teach state
  const [learnTeachTab, setLearnTeachTab] = useState<'listings' | 'groups' | 'reports'>('listings');
  const [learnTeachListings, setLearnTeachListings] = useState<any[]>([]);
  const [learnTeachGroups, setLearnTeachGroups] = useState<any[]>([]);
  const [learnTeachReports, setLearnTeachReports] = useState<any[]>([]);

  // 10. Campus Events state
  const [campusEvents, setCampusEvents] = useState<any[]>([]);
  const [eventStatusFilter, setEventStatusFilter] = useState('ALL');
  const [eventSearch, setEventSearch] = useState('');

  // 11. Documents state
  const [adminDocs, setAdminDocs] = useState<any[]>([]);
  const [adminDocsMetrics, setAdminDocsMetrics] = useState<any>(null);

  // 12. Contact Messages state
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [contactStatusFilter, setContactStatusFilter] = useState('ALL');

  // 13. Analytics state
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // 14. Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // 15. Platform Settings state
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Modal states
  const [actionModal, setActionModal] = useState<{
    type:
      | 'SUSPEND_USER'
      | 'REACTIVATE_USER'
      | 'VERIFY_APPROVE'
      | 'VERIFY_REJECT'
      | 'CANCEL_APPT'
      | 'RESOLVE_APPEAL'
      | 'REJECT_APPEAL'
      | 'OVERRIDE_RESTRICTION'
      | 'HIDE_LISTING'
      | 'RESTORE_LISTING'
      | 'RESOLVE_REPORT'
      | 'DISMISS_REPORT'
      | 'UNPUBLISH_EVENT'
      | 'RESTORE_EVENT';
    id: string;
    title: string;
    description: string;
    requiresReason: boolean;
    confirmLabel?: string;
    variant?: 'danger' | 'primary' | 'warning';
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch Overview Data
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>('/admin/dashboard');
      if (res.data) setOverview(res.data);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load dashboard overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch All Users
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/admin/users?page=${allUsersPage}&limit=20`;
      if (userSearch) url += `&search=${encodeURIComponent(userSearch)}`;
      if (userRoleFilter && userRoleFilter !== 'ALL') url += `&role=${encodeURIComponent(userRoleFilter)}`;
      if (userStatusFilter && userStatusFilter !== 'ALL') url += `&accountStatus=${encodeURIComponent(userStatusFilter)}`;
      if (userDeptFilter && userDeptFilter !== 'ALL') url += `&department=${encodeURIComponent(userDeptFilter)}`;

      const res = await apiClient.get<ApiResponse<any>>(url);
      if (res.data) {
        setAllUsers(res.data.users || []);
        setAllUsersTotal(res.data.total || 0);
        setAllUsersTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  }, [allUsersPage, userSearch, userRoleFilter, userStatusFilter, userDeptFilter]);

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/students?limit=50';
      if (studentSearch) url += `&search=${encodeURIComponent(studentSearch)}`;
      if (studentStatusFilter) url += `&accountStatus=${encodeURIComponent(studentStatusFilter)}`;
      const res = await apiClient.get<ApiResponse<any>>(url);
      if (res.data) setStudents(res.data.students || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load students list.');
    } finally {
      setLoading(false);
    }
  }, [studentSearch, studentStatusFilter]);

  // Fetch Faculty
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/teachers?limit=50';
      if (teacherSearch) url += `&search=${encodeURIComponent(teacherSearch)}`;
      if (teacherVerifFilter) url += `&verificationStatus=${encodeURIComponent(teacherVerifFilter)}`;
      const res = await apiClient.get<ApiResponse<any>>(url);
      if (res.data) setTeachers(res.data.teachers || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load faculty list.');
    } finally {
      setLoading(false);
    }
  }, [teacherSearch, teacherVerifFilter]);

  // Fetch Verifications
  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/verifications?limit=50';
      if (verifStatusFilter) url += `&status=${encodeURIComponent(verifStatusFilter)}`;
      const res = await apiClient.get<ApiResponse<any>>(url);
      if (res.data) setVerifications(res.data.verifications || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load faculty verifications.');
    } finally {
      setLoading(false);
    }
  }, [verifStatusFilter]);

  // Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/appointments?limit=50';
      if (apptStatusFilter) url += `&status=${encodeURIComponent(apptStatusFilter)}`;
      const res = await apiClient.get<ApiResponse<any>>(url);
      if (res.data) setAppointments(res.data.appointments || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load campus appointments.');
    } finally {
      setLoading(false);
    }
  }, [apptStatusFilter]);

  // Fetch Attendance & Appeals
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/attendance?limit=50';
      if (attendanceFilter === 'APPEALS') url += '&hasAppeal=true';
      else if (attendanceFilter !== 'ALL') url += `&status=${encodeURIComponent(attendanceFilter)}`;

      const res = await apiClient.get<ApiResponse<any>>(url);
      if (res.data) {
        setAttendanceRecords(res.data.appointments || []);
        setAttendanceMetrics(res.data.metrics || null);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [attendanceFilter]);

  // Fetch Restrictions
  const fetchRestrictions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>('/admin/restrictions');
      if (res.data) setRestrictions(res.data.restrictions || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load faculty restrictions.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Learn & Teach Network
  const fetchLearnTeach = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/admin/learn-teach?tab=${learnTeachTab}&limit=50`);
      if (res.data) {
        if (learnTeachTab === 'listings') setLearnTeachListings(res.data.listings || []);
        else if (learnTeachTab === 'groups') setLearnTeachGroups(res.data.groups || []);
        else setLearnTeachReports(res.data.reports || []);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to load learn & teach administration.');
    } finally {
      setLoading(false);
    }
  }, [learnTeachTab]);

  // Fetch Campus Events
  const fetchCampusEvents = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/events?limit=50';
      if (eventStatusFilter !== 'ALL') url += `&status=${encodeURIComponent(eventStatusFilter)}`;
      if (eventSearch) url += `&search=${encodeURIComponent(eventSearch)}`;
      const res = await apiClient.get<ApiResponse<any>>(url);
      if (res.data) setCampusEvents(res.data.events || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load campus events.');
    } finally {
      setLoading(false);
    }
  }, [eventStatusFilter, eventSearch]);

  // Fetch Admin Documents
  const fetchAdminDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>('/documents/admin/all');
      if (res.success && res.data) {
        setAdminDocs(res.data.documents || []);
        setAdminDocsMetrics(res.data.metrics || null);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to load campus study documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Contact Messages
  const fetchContactMessages = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/contact-messages?limit=50';
      if (contactStatusFilter !== 'ALL') url += `&status=${encodeURIComponent(contactStatusFilter)}`;
      const res = await apiClient.get<ApiResponse<any>>(url);
      if (res.data) setContactMessages(res.data.messages || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load contact messages.');
    } finally {
      setLoading(false);
    }
  }, [contactStatusFilter]);

  // Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>(
        `/admin/analytics?timeframe=${analyticsTimeframe}`
      );
      if (res.data) setAnalyticsData(res.data);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load platform analytics.');
    } finally {
      setLoading(false);
    }
  }, [analyticsTimeframe]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/audit-logs?limit=50';
      if (auditActionFilter) url += `&action=${encodeURIComponent(auditActionFilter)}`;
      const res = await apiClient.get<ApiResponse<any>>(url);
      if (res.data) setAuditLogs(res.data.logs || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  }, [auditActionFilter]);

  // Fetch Platform Settings
  const fetchPlatformSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>('/admin/settings');
      if (res.data) setPlatformSettings(res.data);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load platform settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save Platform Settings
  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformSettings) return;
    setIsSavingSettings(true);
    setApiError('');
    setSuccessMessage('');
    try {
      await apiClient.patch('/admin/settings', platformSettings);
      setSuccessMessage('Platform operational settings saved successfully.');
    } catch (err: any) {
      setApiError(err.message || 'Failed to update platform settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Open 360 User Dossier Drawer
  const handleOpenUserDrawer = (userId: string) => {
    setSelectedUserId(userId);
    setIsDrawerOpen(true);
  };

  // Handle Tab Switch & Load Data
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    setApiError('');
    setSuccessMessage('');

    switch (currentTab) {
      case 'overview':
        fetchOverview();
        break;
      case 'users':
        fetchAllUsers();
        break;
      case 'students':
        fetchStudents();
        break;
      case 'teachers':
        fetchTeachers();
        break;
      case 'verifications':
        fetchVerifications();
        break;
      case 'appointments':
        fetchAppointments();
        break;
      case 'attendance':
        fetchAttendance();
        break;
      case 'restrictions':
        fetchRestrictions();
        break;
      case 'learn-teach':
        fetchLearnTeach();
        break;
      case 'events':
        fetchCampusEvents();
        break;
      case 'documents':
        fetchAdminDocuments();
        break;
      case 'communication':
        fetchContactMessages();
        break;
      case 'analytics':
        fetchAnalytics();
        break;
      case 'audit-logs':
        fetchAuditLogs();
        break;
      case 'settings':
        fetchPlatformSettings();
        break;
      case 'reports':
        // Reports tab uses direct CSV export triggers
        break;
    }
  }, [
    user,
    currentTab,
    fetchOverview,
    fetchAllUsers,
    fetchStudents,
    fetchTeachers,
    fetchVerifications,
    fetchAppointments,
    fetchAttendance,
    fetchRestrictions,
    fetchLearnTeach,
    fetchCampusEvents,
    fetchAdminDocuments,
    fetchContactMessages,
    fetchAnalytics,
    fetchAuditLogs,
    fetchPlatformSettings,
  ]);

  // Execute Confirmed Modal Actions
  const handleExecuteModalAction = async (reason?: string) => {
    if (!actionModal) return;
    setModalLoading(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const { type, id } = actionModal;

      if (type === 'SUSPEND_USER') {
        await apiClient.patch(`/admin/users/${id}/status`, { status: 'SUSPENDED', reason });
        setSuccessMessage('User account successfully suspended.');
        fetchAllUsers();
        fetchStudents();
        fetchTeachers();
        setIsDrawerOpen(false);
      } else if (type === 'REACTIVATE_USER') {
        await apiClient.patch(`/admin/users/${id}/status`, { status: 'ACTIVE', reason });
        setSuccessMessage('User account successfully reactivated.');
        fetchAllUsers();
        fetchStudents();
        fetchTeachers();
        setIsDrawerOpen(false);
      } else if (type === 'VERIFY_APPROVE') {
        await apiClient.post(`/admin/verifications/${id}`, { decision: 'APPROVE' });
        setSuccessMessage('Faculty member verification officially approved.');
        fetchVerifications();
        fetchOverview();
      } else if (type === 'VERIFY_REJECT') {
        await apiClient.post(`/admin/verifications/${id}`, { decision: 'REJECT', reason });
        setSuccessMessage('Faculty verification declined.');
        fetchVerifications();
        fetchOverview();
      } else if (type === 'CANCEL_APPT') {
        await apiClient.post(`/admin/appointments/${id}/cancel`, { reason });
        setSuccessMessage('Appointment cancelled by university administration.');
        fetchAppointments();
      } else if (type === 'RESOLVE_APPEAL') {
        await apiClient.post(`/admin/appointments/${id}/review-appeal`, {
          decision: 'APPROVE',
          adminNotes: reason,
        });
        setSuccessMessage('No-show appeal approved; attendance adjusted.');
        fetchAttendance();
      } else if (type === 'REJECT_APPEAL') {
        await apiClient.post(`/admin/appointments/${id}/review-appeal`, {
          decision: 'REJECT',
          adminNotes: reason,
        });
        setSuccessMessage('No-show appeal declined.');
        fetchAttendance();
      } else if (type === 'OVERRIDE_RESTRICTION') {
        await apiClient.post(`/admin/restrictions/${id}/override`, { reason });
        setSuccessMessage('Faculty restriction lifted by administration.');
        fetchRestrictions();
      } else if (type === 'HIDE_LISTING') {
        await apiClient.post(`/admin/learn-teach/listings/${id}/moderate`, { action: 'HIDE', reason });
        setSuccessMessage('Teaching listing hidden from public discovery.');
        fetchLearnTeach();
      } else if (type === 'RESTORE_LISTING') {
        await apiClient.post(`/admin/learn-teach/listings/${id}/moderate`, { action: 'RESTORE', reason });
        setSuccessMessage('Teaching listing restored.');
        fetchLearnTeach();
      } else if (type === 'RESOLVE_REPORT') {
        await apiClient.post(`/admin/learn-teach/reports/${id}/resolve`, {
          action: 'RESOLVE',
          resolutionNotes: reason,
        });
        setSuccessMessage('Learn & Teach report resolved.');
        fetchLearnTeach();
      } else if (type === 'DISMISS_REPORT') {
        await apiClient.post(`/admin/learn-teach/reports/${id}/resolve`, {
          action: 'DISMISS',
          resolutionNotes: reason,
        });
        setSuccessMessage('Report dismissed.');
        fetchLearnTeach();
      } else if (type === 'UNPUBLISH_EVENT') {
        await apiClient.post(`/admin/events/${id}/moderate`, { action: 'UNPUBLISH', reason });
        setSuccessMessage('Campus event unpublished.');
        fetchCampusEvents();
      } else if (type === 'RESTORE_EVENT') {
        await apiClient.post(`/admin/events/${id}/moderate`, { action: 'RESTORE', reason });
        setSuccessMessage('Campus event restored.');
        fetchCampusEvents();
      }

      setActionModal(null);
    } catch (err: any) {
      setApiError(err.message || 'Administrative operation failed.');
    } finally {
      setModalLoading(false);
    }
  };

  // CSV Report Downloader
  const handleDownloadCsv = (type: string) => {
    window.open(`${API_BASE_URL}/admin/reports?type=${type}`, '_blank');
  };

  // Quick Stats Badges
  const pendingVerificationsCount = overview?.verification?.pendingVerifications || 0;
  const pendingReportsCount = overview?.learnTeach?.pendingReports || 0;
  const pendingMessagesCount = overview?.communication?.pendingContactMessages || 0;
  const pendingTotal = pendingVerificationsCount + pendingReportsCount + pendingMessagesCount;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* 1. Left Grouped Sidebar */}
      <AdminSidebar
        activeTab={currentTab}
        onTabChange={setActiveTab}
        pendingVerificationsCount={pendingVerificationsCount}
        pendingReportsCount={pendingReportsCount}
        pendingMessagesCount={pendingMessagesCount}
      />

      {/* 2. Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar with Global Instant Search & Profile */}
        <AdminHeader
          title={
            currentTab === 'overview'
              ? 'Platform Overview'
              : currentTab === 'users'
              ? 'User Administration'
              : currentTab === 'students'
              ? 'Student Records'
              : currentTab === 'teachers'
              ? 'Faculty Directory'
              : currentTab === 'verifications'
              ? 'Faculty Verifications'
              : currentTab === 'appointments'
              ? 'Consultation Appointments'
              : currentTab === 'attendance'
              ? 'Attendance & Appeals'
              : currentTab === 'restrictions'
              ? 'Faculty Restrictions'
              : currentTab === 'learn-teach'
              ? 'Learn & Teach Network'
              : currentTab === 'events'
              ? 'Campus Events Calendar'
              : currentTab === 'documents'
              ? 'AI Study Docs'
              : currentTab === 'communication'
              ? 'Contact Inquiries'
              : currentTab === 'analytics'
              ? 'Platform Analytics'
              : currentTab === 'reports'
              ? 'Reports & Data Export'
              : currentTab === 'audit-logs'
              ? 'Activity Audit Trail'
              : 'Platform Settings'
          }
          subtitle="Real-time Chandigarh University System Operations"
          onSelectUser={handleOpenUserDrawer}
          onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
          pendingTotal={pendingTotal}
        />

        {/* Alerts Container */}
        {apiError && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button onClick={() => setApiError('')} className="text-red-500 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {/* ============================================================== */}
          {currentTab === 'overview' && (
            <div className="space-y-6">
              {/* Primary KPI Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Registered Users"
                  value={overview?.users?.totalUsers || 0}
                  subtitle={`${overview?.users?.totalStudents || 0} Students • ${overview?.users?.totalTeachers || 0} Faculty`}
                  icon={Users}
                  variant="primary"
                />
                <StatCard
                  title="Verified Faculty"
                  value={overview?.verification?.verifiedTeachers || 0}
                  subtitle={`${overview?.verification?.pendingVerifications || 0} Pending Verification`}
                  icon={ShieldCheck}
                />
                <StatCard
                  title="Consultation Bookings"
                  value={overview?.appointments?.total || 0}
                  subtitle={`${overview?.appointments?.completionRate || 0}% Completed Rate`}
                  icon={CalendarCheck}
                />
                <StatCard
                  title="Campus Events"
                  value={overview?.events?.published || 0}
                  subtitle={`${overview?.events?.total || 0} Total Campus Events`}
                  icon={Calendar}
                />
              </div>

              {/* Secondary Modular KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-[#E7DADA] bg-white flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#666666] block">Learn & Teach Network</span>
                    <span className="text-xl font-black text-[#252525]">
                      {overview?.learnTeach?.activeListings || 0}
                    </span>
                    <span className="text-[11px] text-[#666666] block mt-0.5">
                      Active Skills • {overview?.learnTeach?.connections || 0} Connections
                    </span>
                  </div>
                  <BookOpen className="w-8 h-8 text-[#C62828] opacity-80" />
                </div>

                <div className="p-4 rounded-2xl border border-[#E7DADA] bg-white flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#666666] block">AI Study Documents</span>
                    <span className="text-xl font-black text-[#252525]">
                      {overview?.aiTutor?.totalDocuments || 0}
                    </span>
                    <span className="text-[11px] text-[#666666] block mt-0.5">Ingested PDF/DOCX Tutors</span>
                  </div>
                  <Sparkles className="w-8 h-8 text-purple-600 opacity-80" />
                </div>

                <div className="p-4 rounded-2xl border border-[#E7DADA] bg-white flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#666666] block">Pending Action Items</span>
                    <span className="text-xl font-black text-[#C62828]">{pendingTotal}</span>
                    <span className="text-[11px] text-[#666666] block mt-0.5">
                      {pendingVerificationsCount} Verifications • {pendingReportsCount} Reports
                    </span>
                  </div>
                  <AlertCircle className="w-8 h-8 text-amber-500 opacity-80" />
                </div>
              </div>

              {/* Two Column Layout: Department Distribution & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Distribution */}
                <div className="rounded-3xl border border-[#E7DADA] bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-[#252525] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#C62828]" /> Department Population
                    </h3>
                    <span className="text-[11px] text-[#666666]">Top Chandigarh University Branches</span>
                  </div>
                  <div className="space-y-3">
                    {overview?.departments?.map((dept: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#252525] truncate max-w-xs">{dept.department}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#C62828] h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (dept.userCount / (overview?.users?.totalUsers || 1)) * 100 * 2
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[#666666] w-8 text-right">
                            {dept.userCount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Platform Activity */}
                <div className="rounded-3xl border border-[#E7DADA] bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-[#252525] flex items-center gap-2">
                      <History className="w-4 h-4 text-[#C62828]" /> Recent Administrative Audit Trail
                    </h3>
                    <button
                      onClick={() => setActiveTab('audit-logs')}
                      className="text-[11px] font-bold text-[#C62828] hover:underline cursor-pointer"
                    >
                      View All Logs
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {overview?.recentActivity?.slice(0, 6).map((log: any) => (
                      <div
                        key={log._id}
                        className="p-2.5 rounded-xl border border-[#E7DADA] text-xs flex items-center justify-between bg-[#FFF7F7]"
                      >
                        <div className="truncate mr-2">
                          <span className="font-bold text-[#C62828] font-mono text-[11px] block">
                            {log.action}
                          </span>
                          <span className="text-[11px] text-[#666666] truncate block">{log.reason}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#888888] shrink-0">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: UNIVERSAL USER MANAGEMENT */}
          {/* ============================================================== */}
          {currentTab === 'users' && (
            <div className="space-y-4">
              {/* Header Filters & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E7DADA]">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by full name, university email, UID..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs focus:outline-none focus:border-[#C62828]"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs bg-white text-[#252525] focus:outline-none"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="STUDENT">Students</option>
                    <option value="TEACHER">Faculty</option>
                    <option value="ADMIN">Administrators</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs bg-white text-[#252525] focus:outline-none"
                  >
                    <option value="ALL">All Account Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DEACTIVATED">Deactivated</option>
                  </select>

                  <select
                    value={userDeptFilter}
                    onChange={(e) => setUserDeptFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs bg-white text-[#252525] focus:outline-none"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                    <option value="Business & Management">Management</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadCsv('students')}
                    className="cursor-pointer text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
                  </Button>
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                      <tr>
                        <th className="p-3.5">User</th>
                        <th className="p-3.5">UID</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Department</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Registered</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7DADA]">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[#666666]">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C62828] mb-2" />
                            Loading users...
                          </td>
                        </tr>
                      ) : allUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[#666666]">
                            No user accounts matching the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        allUsers.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5 font-bold text-[#252525]">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-[#C62828] text-white flex items-center justify-center font-black text-xs shrink-0">
                                  {u.fullName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <span className="block">{u.fullName}</span>
                                  <span className="text-[11px] font-normal text-[#666666]">{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-[#666666]">{u.uid}</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.role === 'TEACHER'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : u.role === 'ADMIN'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3.5 text-[#252525] truncate max-w-[150px]">{u.department}</td>
                            <td className="p-3.5">
                              <StatusBadge status={u.accountStatus} />
                            </td>
                            <td className="p-3.5 font-mono text-[#666666]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3.5 text-right space-x-1">
                              <button
                                onClick={() => handleOpenUserDrawer(u._id)}
                                className="px-2.5 py-1 rounded-lg border border-[#E7DADA] hover:bg-[#FFF7F7] text-xs font-semibold text-[#252525] cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3 text-[#C62828]" /> 360° Dossier
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-3 border-t border-[#E7DADA] flex items-center justify-between text-xs text-[#666666]">
                  <span>Total {allUsersTotal} users</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAllUsersPage((p) => Math.max(1, p - 1))}
                      disabled={allUsersPage === 1}
                      className="p-1 rounded-lg border border-[#E7DADA] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono">
                      Page {allUsersPage} of {allUsersTotalPages}
                    </span>
                    <button
                      onClick={() => setAllUsersPage((p) => Math.min(allUsersTotalPages, p + 1))}
                      disabled={allUsersPage >= allUsersTotalPages}
                      className="p-1 rounded-lg border border-[#E7DADA] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: STUDENTS MANAGEMENT */}
          {/* ============================================================== */}
          {currentTab === 'students' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E7DADA]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search students by name, email, or UID..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs focus:outline-none"
                  />
                </div>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs bg-white text-[#252525]"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCsv('students')}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Export Students
                </Button>
              </div>

              <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">UID</th>
                      <th className="p-3.5">Course & Sem</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA]">
                    {students.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-[#252525]">
                          {s.fullName}
                          <span className="block text-[11px] font-normal text-[#666666]">{s.email}</span>
                        </td>
                        <td className="p-3.5 font-mono">{s.uid}</td>
                        <td className="p-3.5">{s.profile?.course || 'B.Tech'} Sem {s.profile?.semester || 1}</td>
                        <td className="p-3.5">{s.department}</td>
                        <td className="p-3.5"><StatusBadge status={s.accountStatus} /></td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenUserDrawer(s._id)}
                            className="px-2.5 py-1 rounded-lg border border-[#E7DADA] hover:bg-[#FFF7F7] font-semibold text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-[#C62828]" /> Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: FACULTY DIRECTORY & TAB 5: VERIFICATION QUEUE */}
          {/* ============================================================== */}
          {(currentTab === 'teachers' || currentTab === 'verifications') && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E7DADA]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Search faculty by name, email, or UID..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs focus:outline-none"
                  />
                </div>
                {currentTab === 'verifications' ? (
                  <select
                    value={verifStatusFilter}
                    onChange={(e) => setVerifStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs bg-white text-[#252525]"
                  >
                    <option value="PENDING">Pending Verification</option>
                    <option value="VERIFIED">Verified Faculty</option>
                    <option value="REJECTED">Declined</option>
                  </select>
                ) : (
                  <select
                    value={teacherVerifFilter}
                    onChange={(e) => setTeacherVerifFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs bg-white text-[#252525]"
                  >
                    <option value="">All Verification Statuses</option>
                    <option value="VERIFIED">Verified Only</option>
                    <option value="PENDING">Pending Verification</option>
                  </select>
                )}
              </div>

              {currentTab === 'verifications' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-700" />
                    <span>
                      Faculty Verification Queue: Review faculty documentation and approve verified educator credentials.
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-800">
                    {verifications.filter((v) => v.verificationStatus === 'PENDING').length} Pending Requests
                  </span>
                </div>
              )}

              <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                    <tr>
                      <th className="p-3.5">Faculty Member</th>
                      <th className="p-3.5">UID</th>
                      <th className="p-3.5">Designation</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Verification</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA]">
                    {(currentTab === 'verifications' ? verifications : teachers).map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-[#252525]">
                          {t.user?.fullName || t.fullName}
                          <span className="block text-[11px] font-normal text-[#666666]">
                            {t.user?.email || t.email}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono">{t.user?.uid || t.uid}</td>
                        <td className="p-3.5">{t.designation || 'Professor'}</td>
                        <td className="p-3.5">{t.department}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              (t.verificationStatus || t.profile?.verificationStatus) === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : (t.verificationStatus || t.profile?.verificationStatus) === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {t.verificationStatus || t.profile?.verificationStatus || 'PENDING'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {currentTab === 'verifications' && (t.verificationStatus === 'PENDING') && (
                            <>
                              <button
                                onClick={() =>
                                  setActionModal({
                                    type: 'VERIFY_APPROVE',
                                    id: t._id,
                                    title: 'Approve Faculty Verification',
                                    description: `Are you sure you want to approve ${t.user?.fullName || 'this faculty member'} as verified university educator?`,
                                    requiresReason: false,
                                    variant: 'primary',
                                    confirmLabel: 'Approve Faculty',
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setActionModal({
                                    type: 'VERIFY_REJECT',
                                    id: t._id,
                                    title: 'Decline Faculty Verification',
                                    description: 'Please specify the reason for rejecting this verification request.',
                                    requiresReason: true,
                                    variant: 'danger',
                                    confirmLabel: 'Reject Verification',
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold hover:bg-red-100 cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleOpenUserDrawer(t.user?._id || t._id)}
                            className="px-2.5 py-1 rounded-lg border border-[#E7DADA] hover:bg-[#FFF7F7] font-semibold text-xs cursor-pointer"
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: CONSULTATION APPOINTMENTS & TAB 7: ATTENDANCE & APPEALS */}
          {/* ============================================================== */}
          {currentTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E7DADA]">
                <div className="flex items-center gap-2">
                  <select
                    value={apptStatusFilter}
                    onChange={(e) => setApptStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs bg-white text-[#252525]"
                  >
                    <option value="">All Appointment Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDownloadCsv('appointments')}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Export Appointments CSV
                </Button>
              </div>

              <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Faculty</th>
                      <th className="p-3.5">Agenda</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Attendance</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA]">
                    {appointments.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-[#252525]">
                          {a.student?.fullName || 'Student'}
                          <span className="block text-[11px] font-normal text-[#666666]">{a.student?.uid}</span>
                        </td>
                        <td className="p-3.5 font-bold text-[#252525]">
                          {a.teacherProfile?.user?.fullName || 'Faculty'}
                        </td>
                        <td className="p-3.5 max-w-xs truncate">{a.agenda}</td>
                        <td className="p-3.5 font-mono">{a.meetingMode}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : a.status === 'CANCELLED'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {a.attendanceStatus ? (
                            <span className="font-semibold text-[#252525]">{a.attendanceStatus}</span>
                          ) : (
                            <span className="text-[#888888] italic">Not marked</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'CANCEL_APPT',
                                  id: a._id,
                                  title: 'Admin Cancel Consultation',
                                  description: 'Provide an administrative reason for cancelling this consultation.',
                                  requiresReason: true,
                                  variant: 'danger',
                                  confirmLabel: 'Cancel Appointment',
                                })
                              }
                              className="px-2 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 font-bold text-[11px] cursor-pointer"
                            >
                              Admin Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ATTENDANCE & NO-SHOW APPEALS */}
          {currentTab === 'attendance' && (
            <div className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E7DADA]">
                  <span className="text-[11px] font-bold text-[#666666] block">Total Marked Sessions</span>
                  <span className="text-xl font-black text-[#252525]">{attendanceMetrics?.totalAttendanceMarked || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#E7DADA]">
                  <span className="text-[11px] font-bold text-[#666666] block">No-Show Violations</span>
                  <span className="text-xl font-black text-red-700">{attendanceMetrics?.totalNoShows || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#E7DADA]">
                  <span className="text-[11px] font-bold text-[#666666] block">Appeals Awaiting Review</span>
                  <span className="text-xl font-black text-amber-700">{attendanceMetrics?.pendingAppeals || 0}</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 p-3 bg-white border border-[#E7DADA] rounded-2xl">
                <button
                  onClick={() => setAttendanceFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    attendanceFilter === 'ALL' ? 'bg-[#C62828] text-white' : 'text-[#666666] hover:bg-[#FFF7F7]'
                  }`}
                >
                  All Records
                </button>
                <button
                  onClick={() => setAttendanceFilter('APPEALS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    attendanceFilter === 'APPEALS' ? 'bg-[#C62828] text-white' : 'text-[#666666] hover:bg-[#FFF7F7]'
                  }`}
                >
                  Pending Appeals ({attendanceMetrics?.pendingAppeals || 0})
                </button>
                <button
                  onClick={() => setAttendanceFilter('NO_SHOW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    attendanceFilter === 'NO_SHOW' ? 'bg-[#C62828] text-white' : 'text-[#666666] hover:bg-[#FFF7F7]'
                  }`}
                >
                  No-Shows Only
                </button>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Faculty</th>
                      <th className="p-3.5">Attendance</th>
                      <th className="p-3.5">No-Show Reason</th>
                      <th className="p-3.5">Student Appeal</th>
                      <th className="p-3.5 text-right">Appeal Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA]">
                    {attendanceRecords.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-[#252525]">
                          {rec.student?.fullName}
                          <span className="block text-[11px] font-normal text-[#666666]">{rec.student?.uid}</span>
                        </td>
                        <td className="p-3.5">{rec.teacherProfile?.user?.fullName}</td>
                        <td className="p-3.5 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              rec.attendanceStatus === 'ATTENDED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {rec.attendanceStatus}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-[#666666]">{rec.noShowReason || 'None'}</td>
                        <td className="p-3.5 max-w-xs">
                          {rec.noShowAppeal ? (
                            <div>
                              <span className="font-bold text-[#252525] block truncate">
                                {rec.noShowAppeal.reason}
                              </span>
                              <span className="text-[10px] text-amber-700 font-bold">
                                Status: {rec.noShowAppeal.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#888888] italic">No appeal submitted</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {rec.noShowAppeal?.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() =>
                                  setActionModal({
                                    type: 'RESOLVE_APPEAL',
                                    id: rec._id,
                                    title: 'Approve Student Appeal',
                                    description: 'Approve this student appeal and adjust the attendance record to Attended.',
                                    requiresReason: true,
                                    variant: 'primary',
                                    confirmLabel: 'Approve Appeal',
                                  })
                                }
                                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setActionModal({
                                    type: 'REJECT_APPEAL',
                                    id: rec._id,
                                    title: 'Decline Student Appeal',
                                    description: 'Decline this appeal and maintain no-show penalty.',
                                    requiresReason: true,
                                    variant: 'danger',
                                    confirmLabel: 'Reject Appeal',
                                  })
                                }
                                className="px-2 py-1 rounded-lg bg-red-50 text-red-700 font-bold text-[11px] cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 8: FACULTY-STUDENT RESTRICTIONS */}
          {/* ============================================================== */}
          {currentTab === 'restrictions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                Faculty Restriction Policy: Faculty members can restrict individual students from booking their slots due to repeated no-shows. Administrators may review and override these restrictions when justified.
              </div>

              <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Faculty Member</th>
                      <th className="p-3.5">Restriction Reason</th>
                      <th className="p-3.5">Date Imposed</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA]">
                    {restrictions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#666666]">
                          No active faculty restrictions recorded on campus.
                        </td>
                      </tr>
                    ) : (
                      restrictions.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-bold text-[#252525]">
                            {r.student?.fullName}
                            <span className="block text-[11px] font-normal text-[#666666]">{r.student?.uid}</span>
                          </td>
                          <td className="p-3.5 font-bold text-[#252525]">{r.teacher?.fullName}</td>
                          <td className="p-3.5 max-w-xs">{r.reason}</td>
                          <td className="p-3.5 font-mono text-[#666666]">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.isActive ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r.isActive ? 'ACTIVE BLOCK' : 'LIFTED'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {r.isActive && (
                              <button
                                onClick={() =>
                                  setActionModal({
                                    type: 'OVERRIDE_RESTRICTION',
                                    id: r._id,
                                    title: 'Admin Override Restriction',
                                    description: 'Lift this restriction so the student may book appointments with this faculty member again.',
                                    requiresReason: true,
                                    variant: 'primary',
                                    confirmLabel: 'Lift Restriction',
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs cursor-pointer"
                              >
                                Override
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 9: LEARN & TEACH NETWORK ADMINISTRATION */}
          {/* ============================================================== */}
          {currentTab === 'learn-teach' && (
            <div className="space-y-4">
              {/* Sub-tabs */}
              <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-[#E7DADA]">
                <button
                  onClick={() => setLearnTeachTab('listings')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    learnTeachTab === 'listings' ? 'bg-[#C62828] text-white' : 'text-[#666666] hover:bg-[#FFF7F7]'
                  }`}
                >
                  Teaching Listings ({overview?.learnTeach?.activeListings || 0})
                </button>
                <button
                  onClick={() => setLearnTeachTab('groups')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    learnTeachTab === 'groups' ? 'bg-[#C62828] text-white' : 'text-[#666666] hover:bg-[#FFF7F7]'
                  }`}
                >
                  Learning Groups ({overview?.learnTeach?.activeGroups || 0})
                </button>
                <button
                  onClick={() => setLearnTeachTab('reports')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    learnTeachTab === 'reports' ? 'bg-[#C62828] text-white' : 'text-[#666666] hover:bg-[#FFF7F7]'
                  }`}
                >
                  Reported Content ({overview?.learnTeach?.pendingReports || 0})
                </button>
              </div>

              {/* Tab: Listings */}
              {learnTeachTab === 'listings' && (
                <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                      <tr>
                        <th className="p-3.5">Instructor</th>
                        <th className="p-3.5">Skill</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Expertise</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7DADA]">
                      {learnTeachListings.map((l) => (
                        <tr key={l._id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-bold text-[#252525]">{l.user?.fullName}</td>
                          <td className="p-3.5 font-bold text-[#C62828]">{l.skillName || l.skill?.name}</td>
                          <td className="p-3.5">{l.category}</td>
                          <td className="p-3.5">{l.expertiseLevel}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                l.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {l.status === 'ACTIVE' ? (
                              <button
                                onClick={() =>
                                  setActionModal({
                                    type: 'HIDE_LISTING',
                                    id: l._id,
                                    title: 'Hide Teaching Listing',
                                    description: 'Hide this teaching listing from student peer discovery.',
                                    requiresReason: true,
                                    variant: 'warning',
                                    confirmLabel: 'Hide Listing',
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-[11px] cursor-pointer"
                              >
                                Hide
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setActionModal({
                                    type: 'RESTORE_LISTING',
                                    id: l._id,
                                    title: 'Restore Teaching Listing',
                                    description: 'Restore this listing to active status.',
                                    requiresReason: false,
                                    variant: 'primary',
                                    confirmLabel: 'Restore Listing',
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-[11px] cursor-pointer"
                              >
                                Restore
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab: Groups */}
              {learnTeachTab === 'groups' && (
                <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                      <tr>
                        <th className="p-3.5">Group Name</th>
                        <th className="p-3.5">Creator</th>
                        <th className="p-3.5">Skill Focus</th>
                        <th className="p-3.5">Members</th>
                        <th className="p-3.5">Privacy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7DADA]">
                      {learnTeachGroups.map((g) => (
                        <tr key={g._id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-bold text-[#252525]">{g.name}</td>
                          <td className="p-3.5">{g.createdBy?.fullName}</td>
                          <td className="p-3.5 font-bold text-[#C62828]">{g.skill?.name || 'General'}</td>
                          <td className="p-3.5 font-mono">{g.membersCount || 1} members</td>
                          <td className="p-3.5">{g.isPrivate ? 'Invite Only' : 'Public'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab: Reports */}
              {learnTeachTab === 'reports' && (
                <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                      <tr>
                        <th className="p-3.5">Reporter</th>
                        <th className="p-3.5">Reported User / Target</th>
                        <th className="p-3.5">Reason</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7DADA]">
                      {learnTeachReports.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-bold">{r.reporter?.fullName}</td>
                          <td className="p-3.5 font-bold text-red-700">{r.reportedUser?.fullName || r.targetType}</td>
                          <td className="p-3.5 max-w-xs">{r.reason}</td>
                          <td className="p-3.5 font-bold">{r.status}</td>
                          <td className="p-3.5 text-right space-x-1.5">
                            {r.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() =>
                                    setActionModal({
                                      type: 'RESOLVE_REPORT',
                                      id: r._id,
                                      title: 'Resolve User Report',
                                      description: 'Mark report as action taken with moderation note.',
                                      requiresReason: true,
                                      variant: 'primary',
                                      confirmLabel: 'Mark Action Taken',
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] cursor-pointer"
                                >
                                  Resolve
                                </button>
                                <button
                                  onClick={() =>
                                    setActionModal({
                                      type: 'DISMISS_REPORT',
                                      id: r._id,
                                      title: 'Dismiss Report',
                                      description: 'Dismiss this report as invalid or unverified.',
                                      requiresReason: true,
                                      variant: 'warning',
                                      confirmLabel: 'Dismiss Report',
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] cursor-pointer"
                                >
                                  Dismiss
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 10: CAMPUS EVENTS CALENDAR */}
          {/* ============================================================== */}
          {currentTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E7DADA]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="Search campus events..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs focus:outline-none"
                  />
                </div>
                <select
                  value={eventStatusFilter}
                  onChange={(e) => setEventStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs bg-white text-[#252525]"
                >
                  <option value="ALL">All Event Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Drafts</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                    <tr>
                      <th className="p-3.5">Event Title</th>
                      <th className="p-3.5">Organizer</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5">Registrations</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA]">
                    {campusEvents.map((ev) => (
                      <tr key={ev._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-[#252525]">
                          <Link to={`/events/${ev._id}`} className="hover:text-[#C62828] hover:underline">
                            {ev.title}
                          </Link>
                          <span className="block text-[11px] font-normal text-[#666666]">
                            {new Date(ev.startDateTime).toLocaleDateString()} • {ev.venue || 'Online'}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">{ev.organizerName}</td>
                        <td className="p-3.5">{ev.category}</td>
                        <td className="p-3.5 font-mono">{ev.mode}</td>
                        <td className="p-3.5 font-mono font-bold text-[#C62828]">
                          {ev.registeredCount || 0} registered
                        </td>
                        <td className="p-3.5 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              ev.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : ev.status === 'CANCELLED'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {ev.status === 'PUBLISHED' ? (
                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'UNPUBLISH_EVENT',
                                  id: ev._id,
                                  title: 'Unpublish Campus Event',
                                  description: 'Unpublish and cancel this event across the university calendar.',
                                  requiresReason: true,
                                  variant: 'danger',
                                  confirmLabel: 'Unpublish Event',
                                })
                              }
                              className="px-2.5 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 font-bold text-[11px] cursor-pointer"
                            >
                              Unpublish
                            </button>
                          ) : ev.status === 'CANCELLED' ? (
                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'RESTORE_EVENT',
                                  id: ev._id,
                                  title: 'Restore Campus Event',
                                  description: 'Restore this event to published status.',
                                  requiresReason: false,
                                  variant: 'primary',
                                  confirmLabel: 'Restore Event',
                                })
                              }
                              className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-[11px] cursor-pointer"
                            >
                              Restore
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 11: AI STUDY DOCS */}
          {/* ============================================================== */}
          {currentTab === 'documents' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E7DADA]">
                  <span className="text-[11px] font-bold text-[#666666] block">Total Ingested Documents</span>
                  <span className="text-xl font-black text-[#252525]">{adminDocsMetrics?.totalDocuments || adminDocs.length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#E7DADA]">
                  <span className="text-[11px] font-bold text-[#666666] block">Processed Successfully</span>
                  <span className="text-xl font-black text-emerald-700">{adminDocsMetrics?.readyDocuments || adminDocs.length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#E7DADA]">
                  <span className="text-[11px] font-bold text-[#666666] block">Active Tutor Vector Index</span>
                  <span className="text-xl font-black text-purple-700">Healthy</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                    <tr>
                      <th className="p-3.5">Document Title</th>
                      <th className="p-3.5">Owner</th>
                      <th className="p-3.5">File Format</th>
                      <th className="p-3.5">Uploaded On</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA]">
                    {adminDocs.map((doc) => (
                      <tr key={doc._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-[#252525]">{doc.title}</td>
                        <td className="p-3.5">{doc.owner?.fullName || 'Student'}</td>
                        <td className="p-3.5 font-mono uppercase">{doc.fileType || 'PDF'}</td>
                        <td className="p-3.5 font-mono">{new Date(doc.createdAt).toLocaleDateString()}</td>
                        <td className="p-3.5 font-bold text-emerald-700">{doc.status || 'READY'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 12: COMMUNICATION & CONTACT INQUIRIES */}
          {/* ============================================================== */}
          {currentTab === 'communication' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E7DADA]">
                <span className="text-xs font-bold text-[#252525]">
                  Support & Contact Messages from University Portal
                </span>
                <select
                  value={contactStatusFilter}
                  onChange={(e) => setContactStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs bg-white text-[#252525]"
                >
                  <option value="ALL">All Message Statuses</option>
                  <option value="NEW">New Inquiries</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                    <tr>
                      <th className="p-3.5">Sender</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Subject & Preview</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA]">
                    {contactMessages.map((msg) => (
                      <tr key={msg._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-[#252525]">
                          {msg.fullName}
                          <span className="block text-[11px] font-normal text-[#666666]">{msg.email}</span>
                        </td>
                        <td className="p-3.5 font-mono">{msg.userType}</td>
                        <td className="p-3.5 max-w-sm">
                          <span className="font-bold text-[#252525] block truncate">{msg.subject}</span>
                          <span className="text-[11px] text-[#666666] line-clamp-1">{msg.message}</span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              msg.status === 'NEW'
                                ? 'bg-amber-50 text-amber-700'
                                : msg.status === 'RESOLVED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {msg.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          {msg.status !== 'RESOLVED' && (
                            <button
                              onClick={async () => {
                                await apiClient.patch(`/admin/contact-messages/${msg._id}`, { status: 'RESOLVED' });
                                fetchContactMessages();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 cursor-pointer"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 13: PLATFORM ANALYTICS */}
          {/* ============================================================== */}
          {currentTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E7DADA]">
                <div>
                  <h3 className="text-sm font-black text-[#252525]">Platform Growth & Appointment Trends</h3>
                  <p className="text-xs text-[#666666]">Real database aggregates across university terms</p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FFF7F7] p-1 rounded-xl border border-[#E7DADA]">
                  {(['7d', '30d', '90d', 'all'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setAnalyticsTimeframe(tf)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        analyticsTimeframe === tf ? 'bg-[#C62828] text-white shadow-xs' : 'text-[#666666]'
                      }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aggregation summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E7DADA]">
                  <span className="text-[11px] font-bold text-[#666666] block">Consultations In Window</span>
                  <span className="text-xl font-black text-[#252525]">{analyticsData?.summary?.totalAppointments || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#E7DADA]">
                  <span className="text-[11px] font-bold text-[#666666] block">Completed Consultations</span>
                  <span className="text-xl font-black text-emerald-700">{analyticsData?.summary?.completedAppointments || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#E7DADA]">
                  <span className="text-[11px] font-bold text-[#666666] block">Completion Rate</span>
                  <span className="text-xl font-black text-blue-700">{analyticsData?.summary?.completionRate || 0}%</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#E7DADA]">
                  <span className="text-[11px] font-bold text-[#666666] block">Cancellation Rate</span>
                  <span className="text-xl font-black text-red-700">{analyticsData?.summary?.cancellationRate || 0}%</span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 14: REPORTS & CSV EXPORT */}
          {/* ============================================================== */}
          {currentTab === 'reports' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl border border-[#E7DADA] bg-white flex flex-col justify-between space-y-4 shadow-xs">
                  <div>
                    <h3 className="text-sm font-black text-[#252525]">Student Directory CSV</h3>
                    <p className="text-xs text-[#666666] mt-1">Export full student roster including courses, semesters, and account status.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadCsv('students')} className="cursor-pointer">
                    <Download className="w-4 h-4 mr-1.5" /> Download CSV
                  </Button>
                </div>

                <div className="p-5 rounded-3xl border border-[#E7DADA] bg-white flex flex-col justify-between space-y-4 shadow-xs">
                  <div>
                    <h3 className="text-sm font-black text-[#252525]">Faculty Directory CSV</h3>
                    <p className="text-xs text-[#666666] mt-1">Export faculty records, cabin locations, and verification status.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadCsv('faculty')} className="cursor-pointer">
                    <Download className="w-4 h-4 mr-1.5" /> Download CSV
                  </Button>
                </div>

                <div className="p-5 rounded-3xl border border-[#E7DADA] bg-white flex flex-col justify-between space-y-4 shadow-xs">
                  <div>
                    <h3 className="text-sm font-black text-[#252525]">Appointments Report</h3>
                    <p className="text-xs text-[#666666] mt-1">Export all consultation bookings, meeting modes, and attendance status.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadCsv('appointments')} className="cursor-pointer">
                    <Download className="w-4 h-4 mr-1.5" /> Download CSV
                  </Button>
                </div>

                <div className="p-5 rounded-3xl border border-[#E7DADA] bg-white flex flex-col justify-between space-y-4 shadow-xs">
                  <div>
                    <h3 className="text-sm font-black text-[#252525]">Platform Executive Summary</h3>
                    <p className="text-xs text-[#666666] mt-1">Aggregated platform overview metrics formatted for university administration.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadCsv('platform-summary')} className="cursor-pointer">
                    <Download className="w-4 h-4 mr-1.5" /> Download CSV
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 15: ACTIVITY AUDIT TRAIL */}
          {/* ============================================================== */}
          {currentTab === 'audit-logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E7DADA]">
                <span className="text-xs font-bold text-[#252525]">Immutable System Audit Trail</span>
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E7DADA] text-xs bg-white text-[#252525]"
                >
                  <option value="">All Audit Actions</option>
                  <option value="USER_SUSPENDED">User Suspended</option>
                  <option value="USER_REACTIVATED">User Reactivated</option>
                  <option value="FACULTY_APPROVED">Faculty Approved</option>
                  <option value="FACULTY_REJECTED">Faculty Rejected</option>
                  <option value="APPOINTMENT_ADMIN_CANCELLED">Appointment Cancelled</option>
                  <option value="SETTINGS_UPDATED">Settings Updated</option>
                </select>
              </div>
              <div className="rounded-2xl border border-[#E7DADA] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[#666666] font-bold">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Admin Operator</th>
                      <th className="p-3.5">Action Executed</th>
                      <th className="p-3.5">Entity</th>
                      <th className="p-3.5">Target</th>
                      <th className="p-3.5">Reason / Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA]">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono text-[#666666]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3.5 font-bold text-[#252525]">{log.adminUser?.fullName || 'System'}</td>
                        <td className="p-3.5 font-mono font-bold text-[#C62828]">{log.action}</td>
                        <td className="p-3.5">{log.entityType}</td>
                        <td className="p-3.5 font-medium">{log.targetUser?.fullName || log.targetAppointment?._id || 'Platform'}</td>
                        <td className="p-3.5 max-w-xs truncate text-[#666666]">{log.reason || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 16: PLATFORM OPERATIONS SETTINGS */}
          {/* ============================================================== */}
          {currentTab === 'settings' && platformSettings && (
            <form onSubmit={handleSavePlatformSettings} className="space-y-6 max-w-3xl">
              <div className="rounded-3xl border border-[#E7DADA] bg-white p-6 space-y-6 shadow-xs">
                <h3 className="text-sm font-black text-[#252525] uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#C62828]" /> Registration & Access Toggles
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E7DADA] bg-slate-50">
                    <div>
                      <span className="font-bold text-xs text-[#252525] block">Allow Student Registrations</span>
                      <span className="text-[11px] text-[#666666]">Enable new students to register with university email</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformSettings.allowStudentRegistration}
                      onChange={(e) =>
                        setPlatformSettings({ ...platformSettings, allowStudentRegistration: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#C62828] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E7DADA] bg-slate-50">
                    <div>
                      <span className="font-bold text-xs text-[#252525] block">Allow Faculty Registrations</span>
                      <span className="text-[11px] text-[#666666]">Enable new faculty members to sign up</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformSettings.allowTeacherRegistration}
                      onChange={(e) =>
                        setPlatformSettings({ ...platformSettings, allowTeacherRegistration: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#C62828] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-red-200 bg-red-50/50">
                    <div>
                      <span className="font-bold text-xs text-red-900 block">Maintenance Mode</span>
                      <span className="text-[11px] text-red-700">Display maintenance announcement across the university portal</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformSettings.maintenanceMode}
                      onChange={(e) =>
                        setPlatformSettings({ ...platformSettings, maintenanceMode: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#C62828] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E7DADA] space-y-4">
                  <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider">
                    University Contact & Support Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#666666] mb-1">Support Email</label>
                      <input
                        type="email"
                        value={platformSettings.supportEmail || ''}
                        onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-[#E7DADA]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#666666] mb-1">Support Phone</label>
                      <input
                        type="text"
                        value={platformSettings.supportPhone || ''}
                        onChange={(e) => setPlatformSettings({ ...platformSettings, supportPhone: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-[#E7DADA]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" disabled={isSavingSettings} className="cursor-pointer">
                    {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Save Operational Settings
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 360 User Dossier Drawer */}
      <UserDetailsDrawer
        userId={selectedUserId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuspend={(targetUser) =>
          setActionModal({
            type: 'SUSPEND_USER',
            id: targetUser._id,
            title: `Suspend Account: ${targetUser.fullName}`,
            description: `Suspending this account will block access to campus appointments, learn & teach modules, and AI documents.`,
            requiresReason: true,
            variant: 'danger',
            confirmLabel: 'Suspend Account',
          })
        }
        onReactivate={(targetUser) =>
          setActionModal({
            type: 'REACTIVATE_USER',
            id: targetUser._id,
            title: `Reactivate Account: ${targetUser.fullName}`,
            description: 'This will restore full university portal access for this account.',
            requiresReason: false,
            variant: 'primary',
            confirmLabel: 'Reactivate Account',
          })
        }
      />

      {/* Global Administrative Confirmation Modal */}
      {actionModal && (
        <ConfirmationModal
          isOpen={true}
          title={actionModal.title}
          description={actionModal.description}
          confirmLabel={actionModal.confirmLabel}
          variant={actionModal.variant}
          requiresReason={actionModal.requiresReason}
          isLoading={modalLoading}
          onConfirm={handleExecuteModalAction}
          onClose={() => setActionModal(null)}
        />
      )}
    </div>
  );
};
