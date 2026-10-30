import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ShieldCheck,
  CalendarCheck,
  TrendingUp,
  FileDown,
  History,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'students'
  | 'teachers'
  | 'verifications'
  | 'appointments'
  | 'analytics'
  | 'reports'
  | 'audit-logs';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingVerificationsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  pendingVerificationsCount = 0,
}) => {
  const navItems = [
    { id: 'overview' as AdminTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'students' as AdminTab, label: 'Students', icon: Users },
    { id: 'teachers' as AdminTab, label: 'Faculty Directory', icon: Briefcase },
    {
      id: 'verifications' as AdminTab,
      label: 'Faculty Verification',
      icon: ShieldCheck,
      badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
    },
    { id: 'appointments' as AdminTab, label: 'Appointments', icon: CalendarCheck },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: TrendingUp },
    { id: 'reports' as AdminTab, label: 'Reports & Export', icon: FileDown },
    { id: 'audit-logs' as AdminTab, label: 'Activity Logs', icon: History },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] min-h-[calc(100vh-65px)] flex flex-col p-4 shrink-0 shadow-xs">
      {/* Admin Portal Header */}
      <div className="mb-6 px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-[#3157D5] text-white flex items-center justify-center font-black text-xs">
            CU
          </div>
          <span className="font-extrabold text-sm text-[#17233B]">Admin Console</span>
        </div>
        <p className="text-[11px] text-[#64748B]">Chandigarh University Platform Operations</p>
      </div>

      {/* Nav List */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#3157D5] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#17233B] hover:bg-[#F6F8FC]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white text-[#3157D5]' : 'bg-[#FFF7ED] text-[#C2410C] border border-[#C2410C]/20'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="pt-4 border-t border-[#F1F5F9] px-2 text-[11px] text-[#94A3B8] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#16845B]" />
        <span>Platform Status: Operational</span>
      </div>
    </aside>
  );
};
