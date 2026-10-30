import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles, LogOut, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';

interface NavLinkItem {
  name: string;
  href: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Directory', href: '/directory' },
  { name: 'FacultyConnect', href: '/appointments' },
  { name: 'About Us', href: '/about' },
  { name: 'Features', href: '/features' },
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'Help Center', href: '/help' },
  { name: 'Contact', href: '/contact' },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 bg-white/95 backdrop-blur-md ${
        scrolled
          ? 'border-b border-[#E2E8F0] shadow-xs py-3'
          : 'border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3157D5] rounded-lg"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#EAF1FF] border border-[#3157D5]/20 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/0.FAVICON.png"
                alt="CUCampusSaathi Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback in case image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-[#17233B] group-hover:text-[#3157D5] transition-colors duration-150 leading-tight">
                CUCampus<span className="text-[#3157D5]">Saathi</span>
              </span>
              <span className="text-[10px] font-semibold text-[#64748B] tracking-wider uppercase">
                University Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    active
                      ? 'text-[#3157D5] bg-[#EAF1FF] font-semibold'
                      : 'text-[#64748B] hover:text-[#17233B] hover:bg-[#F6F8FC]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2.5">
                <NotificationBell />
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'bg-[#3157D5] text-white shadow-xs'
                      : 'bg-[#EAF1FF] text-[#3157D5] hover:bg-[#dbe6ff]'
                  }`}
                >
                  Dashboard
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3157D5] text-white text-xs font-bold hover:bg-[#2544ad] transition-all shadow-xs"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F6F8FC] border border-[#E2E8F0] hover:border-[#3157D5]/40 transition-colors"
                  title="Manage your profile"
                >
                  <div className="w-6 h-6 rounded-full bg-[#3157D5] text-white flex items-center justify-center text-xs font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <p className="font-semibold text-[#17233B] truncate max-w-[110px]">{user.fullName.split(' ')[0]}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#3157D5]">{user.role}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FCA5A5] transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm">
                  Log In
                </Button>
                <Button
                  to="/register"
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {user ? (
              <>
                <NotificationBell />
                <Link
                  to="/profile"
                  className="sm:hidden px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#EAF1FF] text-[#3157D5] border border-[#3157D5]/30"
                >
                  {user.role}
                </Link>
              </>
            ) : (
              <Link
                to="/register"
                className="sm:hidden px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#3157D5] text-white hover:bg-[#2546b5]"
              >
                Sign Up
              </Link>
            )}
            <button
              type="button"
              id="mobile-menu-toggle"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#17233B] hover:text-[#3157D5] hover:bg-[#F6F8FC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3157D5]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer / Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[65px] z-50 bg-[#17233B]/40 backdrop-blur-xs flex flex-col">
          <div className="bg-white border-b border-[#E2E8F0] shadow-lg max-h-[calc(100vh-65px)] overflow-y-auto px-6 py-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1 pb-4 border-b border-[#E2E8F0]">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`px-4 py-3 text-base rounded-lg font-medium transition-colors ${
                      active
                        ? 'text-[#3157D5] bg-[#EAF1FF] font-semibold'
                        : 'text-[#17233B] hover:bg-[#F6F8FC]'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {user ? (
              <div className="flex flex-col gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-[#F6F8FC] border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#17233B]">{user.fullName}</p>
                    <p className="text-xs text-[#64748B]">{user.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF1FF] text-[#3157D5] uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl text-white bg-[#3157D5] hover:bg-[#2544ad] transition-all shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>My Dashboard</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl text-white bg-[#EF4444] hover:bg-[#dc2626] transition-all shadow-xs"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Console</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-[#3157D5] border border-[#3157D5]/30 bg-[#EAF1FF]/60 hover:bg-[#EAF1FF] transition-colors"
                >
                  My Profile & Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-[#EF4444] border border-[#FCA5A5] bg-[#FEF2F2]/50 hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 pt-2">
                <Button to="/login" variant="outline" size="md" className="w-full">
                  Log In
                </Button>
                <Button
                  to="/register"
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Sign Up for Free
                </Button>
              </div>
            )}

            <div className="pt-2 text-center text-xs text-[#64748B]">
              Chandigarh University AI Learning & Collaboration
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
