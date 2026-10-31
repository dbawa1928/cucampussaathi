import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  FileText,
  Save,
  Loader2,
  History,
} from 'lucide-react';
import { apiClient, type ApiResponse } from '../../api/client';
import { StatusBadge } from './StatusBadge';
import { Button } from '../ui/Button';

interface UserDetailsDrawerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuspend: (user: any) => void;
  onReactivate: (user: any) => void;
}

export const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  userId,
  isOpen,
  onClose,
  onSuspend,
  onReactivate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'consultations' | 'learnTeach' | 'security'>('overview');
  const [dossier, setDossier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Admin notes state
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesSuccess, setNotesSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!userId || !isOpen) {
      setDossier(null);
      setError(null);
      return;
    }

    const fetchDossier = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<ApiResponse<any>>(`/admin/users/${userId}`);
        if (res.data) {
          setDossier(res.data);
          setAdminNotes(res.data.user?.adminNotes || '');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load user dossier.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDossier();
  }, [userId, isOpen]);

  const handleSaveNotes = async () => {
    if (!userId) return;
    setIsSavingNotes(true);
    setNotesSuccess(false);
    try {
      await apiClient.patch(`/admin/users/${userId}/notes`, { notes: adminNotes });
      setNotesSuccess(true);
      setTimeout(() => setNotesSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (!isOpen) return null;

  const user = dossier?.user;
  const profile = dossier?.profile;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-[#E7DADA] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7DADA] bg-[#FFF7F7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#C62828] text-white flex items-center justify-center font-black text-lg shadow-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#252525]">{user?.fullName || 'Loading...'}</h2>
                {user?.role && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      user.role === 'TEACHER'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : user.role === 'ADMIN'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#666666] font-mono">{user?.email} • UID: {user?.uid}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              user.accountStatus === 'ACTIVE' ? (
                <button
                  onClick={() => onSuspend(user)}
                  className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Suspend Account
                </button>
              ) : (
                <button
                  onClick={() => onReactivate(user)}
                  className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Reactivate Account
                </button>
              )
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#666666] hover:bg-white hover:text-[#252525] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-[#E7DADA] bg-white">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#C62828] text-[#C62828]'
                : 'border-transparent text-[#666666] hover:text-[#252525]'
            }`}
          >
            Overview & Profile
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'consultations'
                ? 'border-[#C62828] text-[#C62828]'
                : 'border-transparent text-[#666666] hover:text-[#252525]'
            }`}
          >
            Consultations ({dossier?.appointments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('learnTeach')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'learnTeach'
                ? 'border-[#C62828] text-[#C62828]'
                : 'border-transparent text-[#666666] hover:text-[#252525]'
            }`}
          >
            Learn & Teach
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#C62828] text-[#C62828]'
                : 'border-transparent text-[#666666] hover:text-[#252525]'
            }`}
          >
            Notes & Audit
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#666666]">
              <Loader2 className="w-8 h-8 animate-spin text-[#C62828]" />
              <p className="text-sm font-medium">Retrieving 360° student and faculty dossier...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : !user ? null : (
            <>
              {/* TAB 1: OVERVIEW & PROFILE */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl border border-[#E7DADA] bg-white">
                      <span className="block text-[10px] font-bold text-[#666666] uppercase">Account Status</span>
                      <span className="mt-1 inline-block">
                        <StatusBadge status={user.accountStatus} />
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-[#E7DADA] bg-white">
                      <span className="block text-[10px] font-bold text-[#666666] uppercase">Department</span>
                      <span className="text-xs font-bold text-[#252525] block truncate mt-1">
                        {user.department || 'Not Assigned'}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-[#E7DADA] bg-white">
                      <span className="block text-[10px] font-bold text-[#666666] uppercase">Verification</span>
                      <span className="text-xs font-bold text-[#252525] block mt-1">
                        {user.role === 'TEACHER' ? (
                          profile?.verificationStatus === 'VERIFIED' ? (
                            <span className="text-emerald-700 font-bold">Verified Faculty</span>
                          ) : profile?.verificationStatus === 'REJECTED' ? (
                            <span className="text-red-700 font-bold">Rejected</span>
                          ) : (
                            <span className="text-amber-700 font-bold">Pending Approval</span>
                          )
                        ) : (
                          <span className="text-[#666666]">Standard Student</span>
                        )}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-[#E7DADA] bg-white">
                      <span className="block text-[10px] font-bold text-[#666666] uppercase">Joined On</span>
                      <span className="text-xs font-bold text-[#252525] block mt-1 font-mono">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Suspension Notice if Suspended */}
                  {user.accountStatus === 'SUSPENDED' && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                        <AlertCircle className="w-4 h-4" /> Account Currently Suspended
                      </div>
                      <p><strong>Reason:</strong> {user.suspensionReason || 'No reason provided'}</p>
                      {user.suspendedAt && (
                        <p className="text-[11px] text-amber-700">
                          Suspended on: {new Date(user.suspendedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Role Specific Details */}
                  {user.role === 'STUDENT' ? (
                    <div className="rounded-2xl border border-[#E7DADA] p-5 space-y-4">
                      <h3 className="text-xs font-black text-[#252525] uppercase tracking-wider flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#C62828]" /> Academic Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[#666666] block">Course / Degree</span>
                          <span className="font-bold text-[#252525]">{profile?.course || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-[#666666] block">Current Semester</span>
                          <span className="font-bold text-[#252525]">
                            {profile?.semester ? `Semester ${profile.semester}` : 'Not provided'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#666666] block">CGPA</span>
                          <span className="font-bold text-[#252525] font-mono">{profile?.cgpa || 'Not disclosed'}</span>
                        </div>
                        <div>
                          <span className="text-[#666666] block">Section / Group</span>
                          <span className="font-bold text-[#252525]">{profile?.section || 'N/A'}</span>
                        </div>
                      </div>

                      {profile?.skills && profile.skills.length > 0 && (
                        <div className="pt-2 border-t border-[#E7DADA]">
                          <span className="text-[11px] font-bold text-[#666666] block mb-2">Declared Skills:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.skills.map((s: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-[#FFF7F7] border border-[#E7DADA] text-xs font-medium text-[#252525]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#E7DADA] p-5 space-y-4">
                      <h3 className="text-xs font-black text-[#252525] uppercase tracking-wider flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#C62828]" /> Faculty & Research Profile
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[#666666] block">Designation</span>
                          <span className="font-bold text-[#252525]">{profile?.designation || 'Faculty Member'}</span>
                        </div>
                        <div>
                          <span className="text-[#666666] block">Cabin / Office Location</span>
                          <span className="font-bold text-[#252525]">{profile?.officeLocation || 'Campus Office'}</span>
                        </div>
                        <div>
                          <span className="text-[#666666] block">Experience</span>
                          <span className="font-bold text-[#252525]">
                            {profile?.experienceYears ? `${profile.experienceYears} Years` : 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#666666] block">Consultation Mode</span>
                          <span className="font-bold text-[#252525]">{profile?.consultationMode || 'Hybrid'}</span>
                        </div>
                      </div>

                      {profile?.researchDomains && profile.researchDomains.length > 0 && (
                        <div className="pt-2 border-t border-[#E7DADA]">
                          <span className="text-[11px] font-bold text-[#666666] block mb-2">Research Domains:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.researchDomains.map((d: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CONSULTATIONS */}
              {activeTab === 'consultations' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-[#252525] uppercase tracking-wider">
                    Recent FacultyConnect Appointments
                  </h3>
                  {(!dossier?.appointments || dossier.appointments.length === 0) ? (
                    <div className="p-8 text-center border border-dashed border-[#E7DADA] rounded-2xl text-[#666666] text-xs">
                      No consultation records found for this university account.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {dossier.appointments.map((appt: any) => (
                        <div
                          key={appt._id}
                          className="p-3.5 rounded-2xl border border-[#E7DADA] bg-white flex items-center justify-between hover:border-[#C62828]/40 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#252525] line-clamp-1">
                                {appt.agenda || 'Academic Guidance'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  appt.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : appt.status === 'CANCELLED'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {appt.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#666666] flex items-center gap-3">
                              <span>Mode: {appt.meetingMode}</span>
                              {appt.attendanceStatus && (
                                <span className="font-semibold text-[#252525]">
                                  Attendance: {appt.attendanceStatus}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-[#666666]">
                            {new Date(appt.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: LEARN & TEACH */}
              {activeTab === 'learnTeach' && (
                <div className="space-y-6">
                  {/* Teaching Listings */}
                  <div>
                    <h3 className="text-xs font-black text-[#252525] uppercase tracking-wider mb-2.5">
                      Teaching Listings ({dossier?.learnTeach?.listings?.length || 0})
                    </h3>
                    {(!dossier?.learnTeach?.listings || dossier.learnTeach.listings.length === 0) ? (
                      <p className="text-xs text-[#666666] italic">No published teaching listings.</p>
                    ) : (
                      <div className="space-y-2">
                        {dossier.learnTeach.listings.map((l: any) => (
                          <div
                            key={l._id}
                            className="p-3 rounded-xl border border-[#E7DADA] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#252525] block">{l.skillName || 'Skill'}</span>
                              <span className="text-[11px] text-[#666666]">{l.category} • {l.expertiseLevel}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF7F7] text-[#C62828] border border-[#E7DADA]">
                              {l.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Learning Goals */}
                  <div className="pt-4 border-t border-[#E7DADA]">
                    <h3 className="text-xs font-black text-[#252525] uppercase tracking-wider mb-2.5">
                      Learning Goals ({dossier?.learnTeach?.goals?.length || 0})
                    </h3>
                    {(!dossier?.learnTeach?.goals || dossier.learnTeach.goals.length === 0) ? (
                      <p className="text-xs text-[#666666] italic">No active learning goals.</p>
                    ) : (
                      <div className="space-y-2">
                        {dossier.learnTeach.goals.map((g: any) => (
                          <div
                            key={g._id}
                            className="p-3 rounded-xl border border-[#E7DADA] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#252525] block">{g.skillName || 'Skill'}</span>
                              <span className="text-[11px] text-[#666666]">{g.category} • Target: {g.targetLevel}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                              {g.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: NOTES & AUDIT */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Internal Admin Notes */}
                  <div className="rounded-2xl border border-[#E7DADA] p-5 bg-[#FFF7F7] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#252525] uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#C62828]" /> Confidential Admin Notes
                      </span>
                      {notesSuccess && (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Notes Saved!
                        </span>
                      )}
                    </div>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      placeholder="Add confidential administrative notes, disciplinary history, or verification comments (visible only to platform administrators)..."
                      className="w-full text-xs p-3 rounded-xl border border-[#E7DADA] bg-white text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="cursor-pointer"
                      >
                        {isSavingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                        Save Admin Notes
                      </Button>
                    </div>
                  </div>

                  {/* Audit History for this User */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-[#252525] uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-[#C62828]" /> Activity & Moderation Audit Trail
                    </h3>
                    {(!dossier?.auditHistory || dossier.auditHistory.length === 0) ? (
                      <p className="text-xs text-[#666666] italic">No administrative actions recorded for this user.</p>
                    ) : (
                      <div className="space-y-2">
                        {dossier.auditHistory.map((log: any) => (
                          <div
                            key={log._id}
                            className="p-3 rounded-xl border border-[#E7DADA] text-xs space-y-1 bg-white"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#C62828] font-mono text-[11px]">{log.action}</span>
                              <span className="text-[10px] text-[#666666] font-mono">
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[#252525]">{log.reason || 'No description logged.'}</p>
                            <span className="text-[10px] text-[#666666] block">
                              By Admin: {log.adminUser?.fullName || 'System Administrator'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
