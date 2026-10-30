import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  ShieldCheck,
  CalendarCheck,
  TrendingUp,
  History,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Eye,
  UserX,
  XCircle,
  Download,
  Clock,
  FileText,
  Sparkles,
  BookOpen,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { apiClient, API_BASE_URL, type ApiResponse } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar, type AdminTab } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { StatCard } from '../../components/admin/StatCard';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { Button } from '../../components/ui/Button';

export const AdminDashboardPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = (searchParams.get('tab') as AdminTab) || 'overview';
  const setActiveTab = (tab: AdminTab) => {
    setSearchParams({ tab });
  };

  // Global state
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Overview state
  const [overview, setOverview] = useState<any>(null);

  // 2. Students state
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // 3. Faculty state
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherVerifFilter, setTeacherVerifFilter] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  // 4. Verifications state
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verifStatusFilter, setVerifStatusFilter] = useState('PENDING');

  // 5. Appointments state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptStatusFilter, setApptStatusFilter] = useState('');
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  // 6. Analytics state
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // 7. Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // 8. Documents state
  const [adminDocs, setAdminDocs] = useState<any[]>([]);
  const [adminDocsMetrics, setAdminDocsMetrics] = useState<any>(null);
  const [docsSearch, setDocsSearch] = useState('');
  const [docsStatusFilter, setDocsStatusFilter] = useState('');

  // Modal states
  const [actionModal, setActionModal] = useState<{
    type: 'SUSPEND_STUDENT' | 'SUSPEND_TEACHER' | 'VERIFY_APPROVE' | 'VERIFY_REJECT' | 'CANCEL_APPT';
    id: string;
    title: string;
    description: string;
    requiresReason: boolean;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Helper date formatter
  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

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

  // Fetch Admin Documents & Storage Metrics
  const fetchAdminDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>('/documents/admin/all');
      if (res.success && res.data) {
        setAdminDocs(res.data.documents || []);
        setAdminDocsMetrics(res.data.metrics || null);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to load campus documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data based on current tab
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    setApiError('');
    setSuccessMessage('');

    switch (currentTab) {
      case 'overview':
        fetchOverview();
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
      case 'documents':
        fetchAdminDocuments();
        break;
      case 'analytics':
        fetchAnalytics();
        break;
      case 'audit-logs':
        fetchAuditLogs();
        break;
      case 'reports':
        // Static export cards
        break;
    }
  }, [
    user,
    currentTab,
    fetchOverview,
    fetchStudents,
    fetchTeachers,
    fetchVerifications,
    fetchAppointments,
    fetchAdminDocuments,
    fetchAnalytics,
    fetchAuditLogs,
  ]);

  // Handle Modal Execution (Suspension, Verification, Cancellation)
  const handleExecuteModalAction = async (reason?: string) => {
    if (!actionModal) return;
    setModalLoading(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const { type, id } = actionModal;

      if (type === 'SUSPEND_STUDENT') {
        await apiClient.patch(`/admin/students/${id}/status`, {
          status: 'SUSPENDED',
          reason,
        });
        setSuccessMessage('Student account suspended successfully.');
        fetchStudents();
      } else if (type === 'SUSPEND_TEACHER') {
        await apiClient.patch(`/admin/teachers/${id}/status`, {
          status: 'SUSPENDED',
          reason,
        });
        setSuccessMessage('Faculty account suspended successfully.');
        fetchTeachers();
      } else if (type === 'VERIFY_APPROVE') {
        await apiClient.post(`/admin/verifications/${id}`, {
          decision: 'APPROVE',
        });
        setSuccessMessage('Faculty verification officially approved.');
        fetchVerifications();
        fetchOverview();
      } else if (type === 'VERIFY_REJECT') {
        await apiClient.post(`/admin/verifications/${id}`, {
          decision: 'REJECT',
          reason,
        });
        setSuccessMessage('Faculty verification declined.');
        fetchVerifications();
        fetchOverview();
      } else if (type === 'CANCEL_APPT') {
        await apiClient.post(`/admin/appointments/${id}/cancel`, {
          reason,
        });
        setSuccessMessage('Appointment administratively cancelled and slot restored.');
        fetchAppointments();
      }

      setActionModal(null);
    } catch (err: any) {
      setApiError(err.message || 'Administrative operation failed.');
    } finally {
      setModalLoading(false);
    }
  };

  // Reactivate User (Student or Teacher)
  const handleReactivateUser = async (id: string, role: 'STUDENT' | 'TEACHER') => {
    setLoading(true);
    setApiError('');
    setSuccessMessage('');
    try {
      const endpoint = role === 'STUDENT' ? `/admin/students/${id}/status` : `/admin/teachers/${id}/status`;
      await apiClient.patch(endpoint, { status: 'ACTIVE' });
      setSuccessMessage(`${role === 'STUDENT' ? 'Student' : 'Faculty'} account restored to active.`);
      if (role === 'STUDENT') fetchStudents();
      else fetchTeachers();
    } catch (err: any) {
      setApiError(err.message || 'Failed to reactivate account.');
    } finally {
      setLoading(false);
    }
  };

  // Export CSV Report Trigger
  const handleExportReport = async (reportType: string) => {
    setLoading(true);
    setApiError('');
    try {
      const response = await fetch(`http://localhost:5000/api/v1/admin/reports?type=${reportType}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download CSV report from server.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cucampus-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage(`Exported ${reportType} report successfully.`);
    } catch (err: any) {
      setApiError(err.message || 'Report export failed.');
    } finally {
      setLoading(false);
    }
  };

  // Access Control Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF7F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C62828] animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#FFF7F7] py-16 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-[#E7DADA] p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#252525] mb-2">Access Restricted</h2>
          <p className="text-xs text-[#666666] mb-6 leading-relaxed">
            The University Administration Console is restricted to authorized Chandigarh University
            administrators.
          </p>
          <Button onClick={() => navigate('/')} variant="primary" size="md" className="w-full">
            Return to Campus Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7F7] flex flex-col">
      <AdminHeader
        title={
          currentTab === 'overview'
            ? 'Executive Overview'
            : currentTab === 'students'
            ? 'Student Management'
            : currentTab === 'teachers'
            ? 'Faculty Management'
            : currentTab === 'verifications'
            ? 'Faculty Verification Queue'
            : currentTab === 'appointments'
            ? 'Campus Consultations'
            : currentTab === 'documents'
            ? 'Campus AI Study Documents & Storage'
            : currentTab === 'analytics'
            ? 'Platform Analytics & Trends'
            : currentTab === 'reports'
            ? 'Data Exports & Reports'
            : 'Administrative Audit Logs'
        }
        subtitle="Chandigarh University Platform Operations & Governance"
      />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <AdminSidebar
          activeTab={currentTab}
          onTabChange={setActiveTab}
          pendingVerificationsCount={overview?.verification?.pendingVerifications || 0}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl overflow-x-hidden">
          {/* Feedback Banners */}
          {apiError && (
            <div className="mb-6 p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-[#991B1B]">
                <strong className="font-bold">Error: </strong> {apiError}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-[#E6F5EF] border border-[#16845B]/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#16845B] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-[#16845B]">
                <strong className="font-bold">Success: </strong> {successMessage}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 1. OVERVIEW TAB */}
          {/* ---------------------------------------------------- */}
          {currentTab === 'overview' && (
            <div className="space-y-8">
              {loading && !overview ? (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#E7DADA]">
                  <Loader2 className="w-8 h-8 text-[#C62828] animate-spin mb-3" />
                  <p className="text-sm font-semibold text-[#252525]">Loading live metrics...</p>
                </div>
              ) : (
                <>
                  {/* KPI Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Enrolled Students"
                      value={overview?.users?.totalStudents || 0}
                      subtitle="Registered campus learners"
                      icon={Users}
                      variant="primary"
                    />
                    <StatCard
                      title="Verified Faculty"
                      value={overview?.verification?.verifiedTeachers || 0}
                      subtitle={`${overview?.users?.totalTeachers || 0} Total registered teachers`}
                      icon={Briefcase}
                      variant="success"
                    />
                    <StatCard
                      title="Pending Verifications"
                      value={overview?.verification?.pendingVerifications || 0}
                      subtitle="Awaiting administrative review"
                      icon={ShieldCheck}
                      variant={overview?.verification?.pendingVerifications > 0 ? 'warning' : 'neutral'}
                    />
                    <StatCard
                      title="Total Consultations"
                      value={overview?.appointments?.total || 0}
                      subtitle={`${overview?.appointments?.completionRate || 0}% completion rate`}
                      icon={CalendarCheck}
                      variant="primary"
                    />
                  </div>

                  {/* Summary Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Consultation Status Distribution */}
                    <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E7DADA] p-6 shadow-xs">
                      <h3 className="text-sm font-bold text-[#252525] mb-4 flex items-center justify-between">
                        <span>Consultation Booking Breakdown</span>
                        <span className="text-xs text-[#666666]">All Time</span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] text-xs">
                          <span className="font-semibold text-[#16845B]">Completed Guidance Sessions</span>
                          <span className="font-bold">{overview?.appointments?.completed || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] text-xs">
                          <span className="font-semibold text-[#C62828]">Confirmed / Accepted</span>
                          <span className="font-bold">{overview?.appointments?.accepted || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] text-xs">
                          <span className="font-semibold text-[#C2410C]">Pending Faculty Review</span>
                          <span className="font-bold">{overview?.appointments?.pending || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] text-xs">
                          <span className="font-semibold text-[#666666]">Cancelled Sessions</span>
                          <span className="font-bold">{overview?.appointments?.cancelled || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Department Distribution */}
                    <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E7DADA] p-6 shadow-xs">
                      <h3 className="text-sm font-bold text-[#252525] mb-4 flex items-center justify-between">
                        <span>Most Active Academic Departments</span>
                        <span className="text-xs text-[#666666]">Users Enrolled</span>
                      </h3>
                      <div className="space-y-2">
                        {overview?.departments?.map((dept: any) => (
                          <div
                            key={dept.department}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FFF7F7] transition-colors text-xs"
                          >
                            <span className="font-medium text-[#252525] truncate max-w-[260px]">
                              {dept.department}
                            </span>
                            <span className="font-bold text-[#C62828] bg-[#FFF7F7] px-2.5 py-0.5 rounded-md font-mono">
                              {dept.userCount} users
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Administrative Activity Feed */}
                  <div className="bg-white rounded-3xl border border-[#E7DADA] p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-[#252525] mb-4 flex items-center gap-2">
                      <History className="w-4 h-4 text-[#C62828]" />
                      Recent Administrative Activity Audit Log
                    </h3>
                    {overview?.recentActivity?.length === 0 ? (
                      <p className="text-xs text-[#666666] text-center py-6">
                        No administrative operations recorded yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#E7DADA]">
                        {overview?.recentActivity?.map((log: any) => (
                          <div key={log._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                            <div>
                              <span className="font-bold text-[#252525]">{log.action}</span>
                              {log.reason && (
                                <span className="text-[#666666] block text-[11px] mt-0.5">
                                  Reason: {log.reason}
                                </span>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[#94A3B8] font-mono text-[11px]">
                                {formatDate(log.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 2. STUDENTS TAB */}
          {/* ---------------------------------------------------- */}
          {currentTab === 'students' && (
            <div className="space-y-6">
              {/* Search & Filter Header */}
              <div className="p-4 rounded-2xl bg-white border border-[#E7DADA] shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[240px] relative">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by student name, email, or university UID..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={studentStatusFilter}
                    onChange={(e) => setStudentStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]"
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DEACTIVATED">Deactivated</option>
                  </select>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-3xl border border-[#E7DADA] overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[11px] font-bold text-[#666666]">
                      <th className="p-4">Student</th>
                      <th className="p-4">University UID</th>
                      <th className="p-4">Department & Course</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Enrolled</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA] text-xs text-[#252525]">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-[#666666]">
                          No students matching current filters.
                        </td>
                      </tr>
                    ) : (
                      students.map((s) => (
                        <tr key={s._id} className="hover:bg-[#FFF7F7]/60 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-[#252525] block">{s.fullName}</span>
                            <span className="text-[11px] text-[#666666]">{s.email}</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-[#C62828]">{s.uid}</td>
                          <td className="p-4">
                            <span className="block font-medium">{s.department}</span>
                            <span className="text-[11px] text-[#666666]">
                              {s.profile?.course ? `${s.profile.course} (Sem ${s.profile.semester})` : 'Profile pending'}
                            </span>
                          </td>
                          <td className="p-4">
                            <StatusBadge status={s.accountStatus} type="account" />
                          </td>
                          <td className="p-4 text-[11px] text-[#666666]">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <Button
                              onClick={() => setSelectedStudent(s)}
                              variant="outline"
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Inspect
                            </Button>
                            {s.accountStatus === 'SUSPENDED' ? (
                              <Button
                                onClick={() => handleReactivateUser(s._id, 'STUDENT')}
                                variant="primary"
                                size="sm"
                                className="bg-[#16845B] hover:bg-[#126b4a]"
                              >
                                Reactivate
                              </Button>
                            ) : (
                              <Button
                                onClick={() =>
                                  setActionModal({
                                    type: 'SUSPEND_STUDENT',
                                    id: s._id,
                                    title: `Suspend Student: ${s.fullName}`,
                                    description: `Are you sure you want to suspend UID ${s.uid}? The student will be blocked from logging in or booking consultations.`,
                                    requiresReason: true,
                                  })
                                }
                                variant="outline"
                                size="sm"
                                className="text-[#EF4444] border-[#FCA5A5] hover:bg-[#FEF2F2]"
                                icon={<UserX className="w-3.5 h-3.5" />}
                              >
                                Suspend
                              </Button>
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

          {/* ---------------------------------------------------- */}
          {/* 3. FACULTY MANAGEMENT TAB */}
          {/* ---------------------------------------------------- */}
          {currentTab === 'teachers' && (
            <div className="space-y-6">
              {/* Search & Filter Header */}
              <div className="p-4 rounded-2xl bg-white border border-[#E7DADA] shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[240px] relative">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Search by faculty name, email, or department..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={teacherVerifFilter}
                    onChange={(e) => setTeacherVerifFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]"
                  >
                    <option value="">All Verifications</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="REJECTED">Declined</option>
                  </select>
                </div>
              </div>

              {/* Faculty Table */}
              <div className="bg-white rounded-3xl border border-[#E7DADA] overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[11px] font-bold text-[#666666]">
                      <th className="p-4">Faculty Member</th>
                      <th className="p-4">Department & Designation</th>
                      <th className="p-4">Cabin Location</th>
                      <th className="p-4">Verification</th>
                      <th className="p-4">Account</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA] text-xs text-[#252525]">
                    {teachers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-[#666666]">
                          No faculty members matching current filters.
                        </td>
                      </tr>
                    ) : (
                      teachers.map((t) => (
                        <tr key={t._id} className="hover:bg-[#FFF7F7]/60 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-[#252525] block">{t.fullName}</span>
                            <span className="text-[11px] text-[#666666]">{t.email}</span>
                          </td>
                          <td className="p-4">
                            <span className="block font-medium">{t.department}</span>
                            <span className="text-[11px] text-[#666666]">
                              {t.profile?.designation || 'Faculty'}
                            </span>
                          </td>
                          <td className="p-4 text-[11px]">
                            {t.profile?.officeLocation || 'Campus Office'}
                          </td>
                          <td className="p-4">
                            <StatusBadge
                              status={t.profile?.verificationStatus || 'PENDING'}
                              type="verification"
                            />
                          </td>
                          <td className="p-4">
                            <StatusBadge status={t.accountStatus} type="account" />
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <Button
                              onClick={() => setSelectedTeacher(t)}
                              variant="outline"
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Details
                            </Button>
                            {t.accountStatus === 'SUSPENDED' ? (
                              <Button
                                onClick={() => handleReactivateUser(t._id, 'TEACHER')}
                                variant="primary"
                                size="sm"
                                className="bg-[#16845B] hover:bg-[#126b4a]"
                              >
                                Reactivate
                              </Button>
                            ) : (
                              <Button
                                onClick={() =>
                                  setActionModal({
                                    type: 'SUSPEND_TEACHER',
                                    id: t._id,
                                    title: `Suspend Faculty: ${t.fullName}`,
                                    description: `Are you sure you want to suspend ${t.fullName}? Published availability slots will be deactivated.`,
                                    requiresReason: true,
                                  })
                                }
                                variant="outline"
                                size="sm"
                                className="text-[#EF4444] border-[#FCA5A5] hover:bg-[#FEF2F2]"
                                icon={<UserX className="w-3.5 h-3.5" />}
                              >
                                Suspend
                              </Button>
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

          {/* ---------------------------------------------------- */}
          {/* 4. FACULTY VERIFICATION QUEUE TAB */}
          {/* ---------------------------------------------------- */}
          {currentTab === 'verifications' && (
            <div className="space-y-6">
              {/* Tab Filters */}
              <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-[#E7DADA] shadow-2xs w-fit">
                <button
                  type="button"
                  onClick={() => setVerifStatusFilter('PENDING')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    verifStatusFilter === 'PENDING'
                      ? 'bg-[#C62828] text-white shadow-xs'
                      : 'text-[#666666] hover:text-[#252525]'
                  }`}
                >
                  Pending Review ({overview?.verification?.pendingVerifications || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setVerifStatusFilter('VERIFIED')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    verifStatusFilter === 'VERIFIED'
                      ? 'bg-[#C62828] text-white shadow-xs'
                      : 'text-[#666666] hover:text-[#252525]'
                  }`}
                >
                  Approved
                </button>
                <button
                  type="button"
                  onClick={() => setVerifStatusFilter('REJECTED')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    verifStatusFilter === 'REJECTED'
                      ? 'bg-[#C62828] text-white shadow-xs'
                      : 'text-[#666666] hover:text-[#252525]'
                  }`}
                >
                  Declined
                </button>
              </div>

              {/* Verification Cards List */}
              <div className="grid grid-cols-1 gap-4">
                {verifications.length === 0 ? (
                  <div className="py-16 text-center bg-white rounded-3xl border border-[#E7DADA] text-xs text-[#666666]">
                    No faculty applications in {verifStatusFilter.toLowerCase()} queue.
                  </div>
                ) : (
                  verifications.map((v) => (
                    <div
                      key={v._id}
                      className="bg-white rounded-2xl border border-[#E7DADA] p-6 shadow-xs hover:border-[#C62828]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-base text-[#252525]">
                            {v.user?.fullName}
                          </span>
                          <span className="text-xs font-mono text-[#666666] bg-[#E7DADA] px-2 py-0.5 rounded">
                            {v.user?.uid}
                          </span>
                          <StatusBadge status={v.verificationStatus} type="verification" />
                        </div>

                        <div className="text-xs text-[#666666] space-x-3">
                          <span>
                            <strong>Department: </strong> {v.department}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Designation: </strong> {v.designation}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Cabin: </strong> {v.officeLocation}
                          </span>
                        </div>

                        {v.researchDomains?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {v.researchDomains.map((d: string) => (
                              <span
                                key={d}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-[#FFF7F7] text-[#C62828] font-semibold"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        )}

                        {v.rejectionReason && (
                          <div className="text-xs text-[#EF4444] bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FCA5A5]">
                            <strong>Decline Reason: </strong> {v.rejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {v.verificationStatus === 'PENDING' && (
                          <>
                            <Button
                              onClick={() =>
                                setActionModal({
                                  type: 'VERIFY_APPROVE',
                                  id: v._id,
                                  title: `Approve Faculty: ${v.user?.fullName}`,
                                  description: `Verify ${v.user?.fullName} as authorized faculty member in ${v.department}? They will be notified and permitted to publish office consultation slots.`,
                                  requiresReason: false,
                                })
                              }
                              variant="primary"
                              size="sm"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              className="bg-[#16845B] hover:bg-[#126b4a]"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() =>
                                setActionModal({
                                  type: 'VERIFY_REJECT',
                                  id: v._id,
                                  title: `Decline Faculty Verification: ${v.user?.fullName}`,
                                  description: 'Provide an explanatory reason for declining this faculty member verification request.',
                                  requiresReason: true,
                                })
                              }
                              variant="outline"
                              size="sm"
                              className="text-[#EF4444] border-[#FCA5A5] hover:bg-[#FEF2F2]"
                              icon={<XCircle className="w-3.5 h-3.5" />}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 5. APPOINTMENTS MONITORING TAB */}
          {/* ---------------------------------------------------- */}
          {currentTab === 'appointments' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="p-4 rounded-2xl bg-white border border-[#E7DADA] shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={apptStatusFilter}
                    onChange={(e) => setApptStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]"
                  >
                    <option value="">All Appointment Statuses</option>
                    <option value="ACCEPTED">Confirmed</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Appointments Table */}
              <div className="bg-white rounded-3xl border border-[#E7DADA] overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[11px] font-bold text-[#666666]">
                      <th className="p-4">Student</th>
                      <th className="p-4">Faculty Mentor</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Format / Mode</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA] text-xs text-[#252525]">
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-[#666666]">
                          No consultations matching current filters.
                        </td>
                      </tr>
                    ) : (
                      appointments.map((a) => (
                        <tr key={a._id} className="hover:bg-[#FFF7F7]/60 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-[#252525] block">{a.student?.fullName}</span>
                            <span className="text-[11px] text-[#666666] font-mono">{a.student?.uid}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-[#252525] block">
                              {a.teacherProfile?.user?.fullName || 'Faculty'}
                            </span>
                            <span className="text-[11px] text-[#666666]">{a.teacherProfile?.department}</span>
                          </td>
                          <td className="p-4 text-[11px]">
                            {a.slot?.startTime ? formatDate(a.slot.startTime) : 'N/A'}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                a.meetingMode === 'ONLINE'
                                  ? 'bg-[#FFF7F7] text-[#C62828]'
                                  : 'bg-[#E6F5EF] text-[#16845B]'
                              }`}
                            >
                              {a.meetingMode === 'ONLINE' ? 'Virtual Video' : 'In Cabin'}
                            </span>
                          </td>
                          <td className="p-4">
                            <StatusBadge status={a.status} type="appointment" />
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <Button
                              onClick={() => setSelectedAppt(a)}
                              variant="outline"
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Details
                            </Button>
                            {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                              <Button
                                onClick={() =>
                                  setActionModal({
                                    type: 'CANCEL_APPT',
                                    id: a._id,
                                    title: 'Cancel Appointment Administratively',
                                    description:
                                      'Provide a campus administrative reason for cancelling this appointment. Both student and faculty will be notified and the slot will be released.',
                                    requiresReason: true,
                                  })
                                }
                                variant="outline"
                                size="sm"
                                className="text-[#EF4444] border-[#FCA5A5] hover:bg-[#FEF2F2]"
                              >
                                Cancel
                              </Button>
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

          {/* ---------------------------------------------------- */}
          {/* 6. ANALYTICS & TRENDS TAB */}
          {/* ---------------------------------------------------- */}
          {currentTab === 'analytics' && (
            <div className="space-y-6">
              {/* Timeframe selector */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E7DADA] shadow-xs">
                <span className="text-xs font-bold text-[#252525]">Select Analysis Timeframe:</span>
                <div className="flex gap-2">
                  {(['7d', '30d', '90d', 'all'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setAnalyticsTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        analyticsTimeframe === tf
                          ? 'bg-[#C62828] text-white shadow-xs'
                          : 'text-[#666666] hover:text-[#252525] bg-[#FFF7F7]'
                      }`}
                    >
                      {tf === '7d' ? 'Last 7 Days' : tf === '30d' ? 'Last 30 Days' : tf === '90d' ? 'Last 90 Days' : 'All Time'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Rate Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Consultations"
                  value={analyticsData?.summary?.totalAppointments || 0}
                  subtitle={`In selected ${analyticsTimeframe} timeframe`}
                  icon={CalendarCheck}
                  variant="primary"
                />
                <StatCard
                  title="Completed Sessions"
                  value={analyticsData?.summary?.completedAppointments || 0}
                  subtitle={`${analyticsData?.summary?.completionRate || 0}% completion success`}
                  icon={CheckCircle2}
                  variant="success"
                />
                <StatCard
                  title="Cancelled Sessions"
                  value={analyticsData?.summary?.cancelledAppointments || 0}
                  subtitle={`${analyticsData?.summary?.cancellationRate || 0}% cancellation rate`}
                  icon={XCircle}
                  variant="danger"
                />
                <StatCard
                  title="Active Confirmed"
                  value={analyticsData?.summary?.acceptedAppointments || 0}
                  subtitle="Scheduled upcoming"
                  icon={Clock}
                  variant="warning"
                />
              </div>

              {/* Timeline Trends Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E7DADA] p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-[#252525] mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#C62828]" />
                    Registration Volume Over Time
                  </h3>
                  {analyticsData?.userTimeline?.length === 0 ? (
                    <p className="text-xs text-[#666666] py-8 text-center">No registration records in this timeframe.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {analyticsData?.userTimeline?.map((item: any) => (
                        <div key={item.date} className="flex items-center justify-between p-2 rounded-xl bg-[#FFF7F7] text-xs">
                          <span className="font-mono text-[#666666]">{item.date}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#C62828] font-semibold">+{item.student} Students</span>
                            <span className="text-[#16845B] font-semibold">+{item.teacher} Faculty</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E7DADA] p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-[#252525] mb-3 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-[#C62828]" />
                    Consultation Trends Over Time
                  </h3>
                  {analyticsData?.appointmentTimeline?.length === 0 ? (
                    <p className="text-xs text-[#666666] py-8 text-center">No consultation records in this timeframe.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {analyticsData?.appointmentTimeline?.map((item: any) => (
                        <div key={item.date} className="flex items-center justify-between p-2 rounded-xl bg-[#FFF7F7] text-xs">
                          <span className="font-mono text-[#666666]">{item.date}</span>
                          <span className="font-bold text-[#252525]">{item.total} Booked</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* CAMPUS AI STUDY DOCUMENTS & STORAGE TAB */}
          {/* ---------------------------------------------------- */}
          {currentTab === 'documents' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Study Documents"
                  value={adminDocsMetrics?.totalDocuments || adminDocs.length || 0}
                  subtitle="Uploaded academic PDFs"
                  icon={FileText}
                  variant="primary"
                />
                <StatCard
                  title="Campus Storage Used"
                  value={`${adminDocsMetrics?.totalStorageMB || 0} MB`}
                  subtitle="Encrypted document storage"
                  icon={Layers}
                  variant="neutral"
                />
                <StatCard
                  title="Indexed Text Pages"
                  value={adminDocsMetrics?.totalPages || 0}
                  subtitle="Extracted & parsed pages"
                  icon={BookOpen}
                  variant="success"
                />
                <StatCard
                  title="Indexed Chunks"
                  value={adminDocsMetrics?.totalChunks || 0}
                  subtitle="Searchable retrieval units"
                  icon={Sparkles}
                  variant="primary"
                />
              </div>

              {/* Filter & Search Bar */}
              <div className="p-4 rounded-2xl bg-white border border-[#E7DADA] shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by title, original filename, student name, or email..."
                      value={docsSearch}
                      onChange={(e) => setDocsSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]"
                    />
                  </div>
                  <select
                    value={docsStatusFilter}
                    onChange={(e) => setDocsStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]"
                  >
                    <option value="">All Statuses</option>
                    <option value="COMPLETED">Indexed / Completed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>

                <div className="text-xs text-[#666666]">
                  Showing <strong className="text-[#252525]">
                    {adminDocs.filter((doc) => {
                      const matchesStatus = !docsStatusFilter || doc.processingStatus === docsStatusFilter;
                      const q = docsSearch.toLowerCase();
                      const matchesQuery =
                        !q ||
                        doc.title?.toLowerCase().includes(q) ||
                        doc.originalFilename?.toLowerCase().includes(q) ||
                        doc.owner?.fullName?.toLowerCase().includes(q) ||
                        doc.owner?.email?.toLowerCase().includes(q);
                      return matchesStatus && matchesQuery;
                    }).length}
                  </strong> documents
                </div>
              </div>

              {/* Documents Table */}
              <div className="bg-white rounded-3xl border border-[#E7DADA] overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[11px] font-bold text-[#666666]">
                      <th className="p-4">Document Title</th>
                      <th className="p-4">Owner (Student)</th>
                      <th className="p-4">Pages & Size</th>
                      <th className="p-4">Chunks & Engine</th>
                      <th className="p-4">Processing Status</th>
                      <th className="p-4">Uploaded</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA] text-xs text-[#252525]">
                    {adminDocs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs text-[#666666]">
                          No campus documents found.
                        </td>
                      </tr>
                    ) : (
                      adminDocs
                        .filter((doc) => {
                          const matchesStatus = !docsStatusFilter || doc.processingStatus === docsStatusFilter;
                          const q = docsSearch.toLowerCase();
                          const matchesQuery =
                            !q ||
                            doc.title?.toLowerCase().includes(q) ||
                            doc.originalFilename?.toLowerCase().includes(q) ||
                            doc.owner?.fullName?.toLowerCase().includes(q) ||
                            doc.owner?.email?.toLowerCase().includes(q);
                          return matchesStatus && matchesQuery;
                        })
                        .map((doc) => (
                          <tr key={doc._id} className="hover:bg-[#FFF7F7]/60 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#FFF7F7] text-[#C62828] flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#252525] truncate max-w-[200px]">
                                    {doc.title || doc.originalFilename}
                                  </p>
                                  <p className="text-[10px] text-[#666666] font-mono truncate max-w-[200px]">
                                    {doc.originalFilename}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-bold block text-[#252525]">{doc.owner?.fullName || 'Student'}</span>
                              <span className="text-[11px] text-[#666666] block">{doc.owner?.email}</span>
                              <span className="text-[10px] text-slate-400">{doc.owner?.department}</span>
                            </td>
                            <td className="p-4 text-xs">
                              <span className="font-semibold">{doc.pageCount || 0} Pages</span>
                              <span className="text-[11px] text-[#666666] block">
                                {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                              </span>
                            </td>
                            <td className="p-4 text-xs">
                              <span className="font-semibold">{doc.chunkCount || 0} Chunks</span>
                              <span className="text-[10px] text-[#C62828] font-mono block">
                                {doc.embeddingProvider || 'bm25-lexical'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  doc.processingStatus === 'COMPLETED'
                                    ? 'bg-[#E6F5EF] text-[#16845B]'
                                    : doc.processingStatus === 'PROCESSING'
                                    ? 'bg-[#FEF3C7] text-[#D97706] animate-pulse'
                                    : 'bg-[#FEF2F2] text-[#EF4444]'
                                }`}
                              >
                                {doc.processingStatus}
                              </span>
                            </td>
                            <td className="p-4 text-[11px] text-[#666666]">
                              {formatDate(doc.createdAt)}
                            </td>
                            <td className="p-4 text-right">
                              <a
                                href={`${API_BASE_URL}/documents/${doc._id}/file`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF7F7] border border-[#E7DADA] hover:border-[#C62828]/40 text-xs font-semibold text-[#C62828] transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect PDF</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 7. DATA EXPORTS & REPORTS TAB */}
          {/* ---------------------------------------------------- */}
          {currentTab === 'reports' && (
            <div className="space-y-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-[#252525]">Administrative Data Reports</h2>
                <p className="text-xs text-[#666666]">
                  Download verified university CSV spreadsheets. Data includes formula injection
                  sanitization and strict exclusion of credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Students Master CSV */}
                <div className="p-6 rounded-3xl bg-white border border-[#E7DADA] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF7F7] text-[#C62828] flex items-center justify-center mb-3">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-[#252525] mb-1">Student Master Report</h3>
                    <p className="text-xs text-[#666666] leading-relaxed mb-4">
                      Complete roster of registered campus students, enrolled courses, current semester, and account status.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleExportReport('students')}
                    disabled={loading}
                    variant="primary"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Students CSV
                  </Button>
                </div>

                {/* Faculty Directory CSV */}
                <div className="p-6 rounded-3xl bg-white border border-[#E7DADA] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#E6F5EF] text-[#16845B] flex items-center justify-center mb-3">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-[#252525] mb-1">Faculty Directory Report</h3>
                    <p className="text-xs text-[#666666] leading-relaxed mb-4">
                      Complete list of faculty members, departments, cabin locations, and official verification status.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleExportReport('teachers')}
                    disabled={loading}
                    variant="primary"
                    size="sm"
                    className="bg-[#16845B] hover:bg-[#126b4a]"
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Faculty CSV
                  </Button>
                </div>

                {/* Faculty Verifications CSV */}
                <div className="p-6 rounded-3xl bg-white border border-[#E7DADA] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-[#252525] mb-1">Faculty Verification Audit</h3>
                    <p className="text-xs text-[#666666] leading-relaxed mb-4">
                      Audit report of faculty verification decisions, approving administrators, and recorded decline reasons.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleExportReport('verifications')}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Verifications CSV
                  </Button>
                </div>

                {/* Consultations CSV */}
                <div className="p-6 rounded-3xl bg-white border border-[#E7DADA] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF7F7] text-[#C62828] flex items-center justify-center mb-3">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-[#252525] mb-1">Campus Consultations Log</h3>
                    <p className="text-xs text-[#666666] leading-relaxed mb-4">
                      Log of all booked office and virtual consultations, meeting format, discussion agendas, and statuses.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleExportReport('appointments')}
                    disabled={loading}
                    variant="primary"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Consultations CSV
                  </Button>
                </div>

                {/* Platform Summary CSV */}
                <div className="p-6 rounded-3xl bg-white border border-[#E7DADA] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#E7DADA] text-[#475569] flex items-center justify-center mb-3">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-[#252525] mb-1">Platform Executive Summary</h3>
                    <p className="text-xs text-[#666666] leading-relaxed mb-4">
                      High-level snapshot of platform adoption, completion ratios, active user populations, and engagement.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleExportReport('platform-summary')}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Summary CSV
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 8. AUDIT LOGS TAB */}
          {/* ---------------------------------------------------- */}
          {currentTab === 'audit-logs' && (
            <div className="space-y-6">
              {/* Filter */}
              <div className="p-4 rounded-2xl bg-white border border-[#E7DADA] shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[#E7DADA] bg-[#FFF7F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C62828]"
                  >
                    <option value="">All Actions</option>
                    <option value="FACULTY_APPROVED">Faculty Approved</option>
                    <option value="FACULTY_REJECTED">Faculty Rejected</option>
                    <option value="STUDENT_SUSPENDED">Student Suspended</option>
                    <option value="STUDENT_REACTIVATED">Student Reactivated</option>
                    <option value="TEACHER_SUSPENDED">Faculty Suspended</option>
                    <option value="TEACHER_REACTIVATED">Faculty Reactivated</option>
                    <option value="APPOINTMENT_ADMIN_CANCELLED">Appointment Cancelled</option>
                    <option value="REPORT_EXPORTED">Report Exported</option>
                  </select>
                </div>
              </div>

              {/* Audit Logs Table */}
              <div className="bg-white rounded-3xl border border-[#E7DADA] overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FFF7F7] border-b border-[#E7DADA] text-[11px] font-bold text-[#666666]">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Admin User</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target Entity</th>
                      <th className="p-4">Reason / Notes</th>
                      <th className="p-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DADA] text-xs text-[#252525]">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-[#666666]">
                          No audit log entries matching current criteria.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-[#FFF7F7]/60 transition-colors">
                          <td className="p-4 text-[11px] font-mono text-[#666666]">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-[#252525] block">
                              {log.adminUser?.fullName || 'Admin'}
                            </span>
                            <span className="text-[11px] text-[#666666]">{log.adminUser?.email}</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-[11px] text-[#C62828]">
                            {log.action}
                          </td>
                          <td className="p-4">
                            {log.targetUser ? (
                              <div>
                                <span className="font-semibold block">{log.targetUser.fullName}</span>
                                <span className="text-[10px] text-[#666666] font-mono">
                                  {log.targetUser.uid} ({log.targetUser.role})
                                </span>
                              </div>
                            ) : log.targetAppointment ? (
                              <span className="text-[11px] text-[#666666]">
                                Appt: {log.targetAppointment?.agenda?.slice(0, 30)}...
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#94A3B8]">{log.entityType}</span>
                            )}
                          </td>
                          <td className="p-4 text-xs italic text-[#475569]">
                            {log.reason || 'None specified'}
                          </td>
                          <td className="p-4 font-mono text-[11px] text-[#94A3B8]">
                            {log.ipAddress || 'Internal'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* INSPECT MODALS */}
          {/* ---------------------------------------------------- */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50 bg-[#252525]/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#252525]">Student Profile Inspection</h3>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-[#666666] hover:text-[#252525] text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-sm text-[#252525]">{selectedStudent.fullName}</span>
                    <span className="text-[#666666] block">{selectedStudent.email}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#FFF7F7]">
                    <div>
                      <strong>UID: </strong> {selectedStudent.uid}
                    </div>
                    <div>
                      <strong>Department: </strong> {selectedStudent.department}
                    </div>
                    <div>
                      <strong>Course: </strong> {selectedStudent.profile?.course || 'N/A'}
                    </div>
                    <div>
                      <strong>Semester: </strong> {selectedStudent.profile?.semester || 'N/A'}
                    </div>
                    <div>
                      <strong>Account Status: </strong> {selectedStudent.accountStatus}
                    </div>
                    <div>
                      <strong>Privacy Level: </strong> {selectedStudent.profile?.privacyLevel || 'CAMPUS_ONLY'}
                    </div>
                  </div>
                  {selectedStudent.profile?.bio && (
                    <div className="p-3 rounded-xl border border-[#E7DADA]">
                      <strong>Bio: </strong> {selectedStudent.profile.bio}
                    </div>
                  )}
                  {selectedStudent.profile?.skills?.length > 0 && (
                    <div>
                      <strong className="block mb-1">Registered Skills:</strong>
                      <div className="flex flex-wrap gap-1">
                        {selectedStudent.profile.skills.map((sk: string) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded bg-[#FFF7F7] text-[#C62828] text-[10px] font-semibold"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-4 border-t border-[#E7DADA] mt-4">
                  <Button onClick={() => setSelectedStudent(null)} variant="outline" size="sm">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {selectedTeacher && (
            <div className="fixed inset-0 z-50 bg-[#252525]/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#252525]">Faculty Profile Inspection</h3>
                  <button
                    onClick={() => setSelectedTeacher(null)}
                    className="text-[#666666] hover:text-[#252525] text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-sm text-[#252525]">{selectedTeacher.fullName}</span>
                    <span className="text-[#666666] block">{selectedTeacher.email}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#FFF7F7]">
                    <div>
                      <strong>UID / Faculty ID: </strong> {selectedTeacher.uid}
                    </div>
                    <div>
                      <strong>Department: </strong> {selectedTeacher.department}
                    </div>
                    <div>
                      <strong>Designation: </strong> {selectedTeacher.profile?.designation || 'Faculty'}
                    </div>
                    <div>
                      <strong>Cabin Location: </strong> {selectedTeacher.profile?.officeLocation || 'Campus Office'}
                    </div>
                    <div>
                      <strong>Verification: </strong> {selectedTeacher.profile?.verificationStatus || 'PENDING'}
                    </div>
                    <div>
                      <strong>Account Status: </strong> {selectedTeacher.accountStatus}
                    </div>
                  </div>
                  {selectedTeacher.profile?.researchDomains?.length > 0 && (
                    <div>
                      <strong className="block mb-1">Research Domains:</strong>
                      <div className="flex flex-wrap gap-1">
                        {selectedTeacher.profile.researchDomains.map((d: string) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 rounded bg-[#FFF7F7] text-[#C62828] text-[10px] font-semibold"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-4 border-t border-[#E7DADA] mt-4">
                  <Button onClick={() => setSelectedTeacher(null)} variant="outline" size="sm">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {selectedAppt && (
            <div className="fixed inset-0 z-50 bg-[#252525]/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#252525]">Consultation Details</h3>
                  <button
                    onClick={() => setSelectedAppt(null)}
                    className="text-[#666666] hover:text-[#252525] text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FFF7F7]">
                    <div>
                      <strong>Student: </strong> {selectedAppt.student?.fullName} ({selectedAppt.student?.uid})
                    </div>
                    <div>
                      <strong>Faculty: </strong> {selectedAppt.teacherProfile?.user?.fullName}
                    </div>
                    <div>
                      <strong>Status: </strong> {selectedAppt.status}
                    </div>
                    <div>
                      <strong>Format: </strong> {selectedAppt.meetingMode}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-[#E7DADA]">
                    <strong>Discussion Agenda: </strong> "{selectedAppt.agenda}"
                  </div>
                  {selectedAppt.meetingLink && (
                    <div className="p-3 rounded-xl bg-[#FFF7F7]/40 border border-[#C62828]/20">
                      <strong>Meeting Link: </strong>
                      <a
                        href={selectedAppt.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#C62828] underline ml-1"
                      >
                        {selectedAppt.meetingLink}
                      </a>
                    </div>
                  )}
                  {selectedAppt.teacherNotes && (
                    <div className="p-3 rounded-xl bg-[#E6F5EF] border border-[#16845B]/20 text-[#16845B]">
                      <strong>Faculty Notes: </strong> {selectedAppt.teacherNotes}
                    </div>
                  )}
                  {selectedAppt.rejectionReason && (
                    <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4444]">
                      <strong>Cancellation / Decline Reason: </strong> {selectedAppt.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-4 border-t border-[#E7DADA] mt-4">
                  <Button onClick={() => setSelectedAppt(null)} variant="outline" size="sm">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* CONFIRMATION DIALOG MODAL */}
          {/* ---------------------------------------------------- */}
          {actionModal && (
            <ConfirmationModal
              isOpen={Boolean(actionModal)}
              title={actionModal.title}
              description={actionModal.description}
              requiresReason={actionModal.requiresReason}
              isLoading={modalLoading}
              variant={
                actionModal.type === 'VERIFY_APPROVE'
                  ? 'primary'
                  : actionModal.type === 'VERIFY_REJECT'
                  ? 'warning'
                  : 'danger'
              }
              confirmLabel={
                actionModal.type === 'VERIFY_APPROVE'
                  ? 'Confirm Approval'
                  : actionModal.type === 'VERIFY_REJECT'
                  ? 'Confirm Decline'
                  : actionModal.type === 'CANCEL_APPT'
                  ? 'Confirm Cancellation'
                  : 'Confirm Suspension'
              }
              onConfirm={handleExecuteModalAction}
              onClose={() => setActionModal(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
};
