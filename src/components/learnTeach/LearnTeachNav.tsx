import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Users,
  GraduationCap,
  Target,
  Sparkles,
  UserCheck,
  CalendarCheck,
  UsersRound,
  TrendingUp,
} from 'lucide-react';

interface LearnTeachNavProps {
  pendingConnectionsCount?: number;
  upcomingSessionsCount?: number;
}

export const LearnTeachNav: React.FC<LearnTeachNavProps> = ({
  pendingConnectionsCount = 0,
  upcomingSessionsCount = 0,
}) => {
  const navItems = [
    { label: 'Overview', to: '/learn-teach', icon: LayoutDashboard, end: true },
    { label: 'Explore Skills', to: '/learn-teach/explore', icon: Compass },
    { label: 'Discover People', to: '/learn-teach/discover', icon: Users },
    { label: 'My Teaching Skills', to: '/learn-teach/my-skills', icon: GraduationCap },
    { label: 'My Learning Goals', to: '/learn-teach/my-goals', icon: Target },
    { label: 'Recommendations', to: '/learn-teach/recommendations', icon: Sparkles },
    {
      label: 'Connections',
      to: '/learn-teach/connections',
      icon: UserCheck,
      badge: pendingConnectionsCount > 0 ? pendingConnectionsCount : undefined,
    },
    {
      label: 'Sessions',
      to: '/learn-teach/sessions',
      icon: CalendarCheck,
      badge: upcomingSessionsCount > 0 ? upcomingSessionsCount : undefined,
    },
    { label: 'Groups', to: '/learn-teach/groups', icon: UsersRound },
    { label: 'Progress & Reviews', to: '/learn-teach/progress', icon: TrendingUp },
  ];

  return (
    <div className="bg-white border-b border-[#E7DADA] sticky top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-[#C62828] text-white shadow-sm shadow-[#C62828]/20'
                      : 'text-gray-600 hover:text-[#C62828] hover:bg-[#FFF7F7]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      item.badge > 0
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

