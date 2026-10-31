import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  CalendarCheck,
  TrendingUp,
  FileDown,
  History,
  Sparkles,
  UserX,
  Calendar,
  MessageSquare,
  BookOpen,
  Settings,
  FileCheck2,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'students'
  | 'teachers'
  | 'verifications'
  | 'appointments'
  | 'attendance'
  | 'restrictions'
  | 'learn-teach'
  | 'events'
  | 'documents'
  | 'communication'
  | 'analytics'
  | 'reports'
  | 'audit-logs'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingVerificationsCount?: number;
  pendingReportsCount?: number;
  pendingMessagesCount?: number;
  pendingAppealsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  pendingVerificationsCount = 0,
  pendingReportsCount = 0,
  pendingMessagesCount = 0,
  pendingAppealsCount = 0,
}) => {
  const navSections = [
    {
      title: 'Operations',
      items: [
        { id: 'overview' as AdminTab, label: 'Overview', icon: LayoutDashboard },
        { id: 'users' as AdminTab, label: 'All Users', icon: Users },
        { id: 'students' as AdminTab, label: 'Students', icon: GraduationCap },
        { id: 'teachers' as AdminTab, label: 'Faculty Directory', icon: Briefcase },
        {
          id: 'verifications' as AdminTab,
          label: 'Faculty Verification',
          icon: ShieldCheck,
          badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        },
      ],
    },
    {
      title: 'Consultations',
      items: [
        { id: 'appointments' as AdminTab, label: 'Appointments', icon: CalendarCheck },
        {
          id: 'attendance' as AdminTab,
          label: 'Attendance & Appeals',
          icon: FileCheck2,
          badge: pendingAppealsCount > 0 ? pendingAppealsCount : undefined,
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        },
        { id: 'restrictions' as AdminTab, label: 'Faculty Restrictions', icon: UserX },
      ],
    },
    {
      title: 'Campus Life & Modules',
      items: [
        {
          id: 'learn-teach' as AdminTab,
          label: 'Learn & Teach Network',
          icon: BookOpen,
          badge: pendingReportsCount > 0 ? pendingReportsCount : undefined,
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
        },
        { id: 'events' as AdminTab, label: 'Campus Events', icon: Calendar },
        { id: 'documents' as AdminTab, label: 'AI Study Docs', icon: Sparkles },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          id: 'communication' as AdminTab,
          label: 'Contact Messages',
          icon: MessageSquare,
          badge: pendingMessagesCount > 0 ? pendingMessagesCount : undefined,
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        },
        { id: 'analytics' as AdminTab, label: 'Analytics & Insights', icon: TrendingUp },
        { id: 'reports' as AdminTab, label: 'Reports & Export', icon: FileDown },
        { id: 'audit-logs' as AdminTab, label: 'Activity Audit Trail', icon: History },
        { id: 'settings' as AdminTab, label: 'Platform Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E7DADA] min-h-[calc(100vh-65px)] flex flex-col p-4 shrink-0 shadow-xs">
      {/* Admin Portal Header */}
      <div className="mb-4 px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-[#C62828] text-white flex items-center justify-center font-black text-xs shadow-xs">
            CU
          </div>
          <span className="font-extrabold text-sm text-[#252525]">Administration</span>
        </div>
        <p className="text-[11px] text-[#666666]">Chandigarh University Platform Operations</p>
      </div>

      {/* Nav List Grouped */}
      <nav className="space-y-4 flex-1 overflow-y-auto pr-1">
        {navSections.map((sec, secIdx) => (
          <div key={secIdx} className="space-y-1">
            <span className="px-3 text-[10px] font-black uppercase tracking-wider text-[#888888]">
              {sec.title}
            </span>
            <div className="space-y-1 pt-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#C62828] text-white shadow-xs'
                        : 'text-[#666666] hover:text-[#252525] hover:bg-[#FFF7F7]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#666666]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 border ${
                          isActive
                            ? 'bg-white text-[#C62828] border-white'
                            : item.badgeColor || 'bg-[#FFF7F7] text-[#C62828] border-[#E7DADA]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer System Indicator */}
      <div className="pt-4 border-t border-[#E7DADA] px-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-bold text-[#666666]">Production Cluster Online</span>
        </div>
        <span className="text-[10px] font-mono text-[#888888] block mt-0.5">v2.4.0 • Enterprise ERP</span>
      </div>
    </aside>
  );
};
