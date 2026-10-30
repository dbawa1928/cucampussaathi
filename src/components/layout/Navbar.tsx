import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const handleGetStarted = () => {
    if (!user) {
      navigate('/register');
    } else if (user.role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  // Role-specific nav links
  const getNavLinks = () => {
    const common = [
      { name: 'Home', href: '/' },
      { name: 'Directory', href: '/directory' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ];

    if (!user) {
      return [
        { name: 'Home', href: '/' },
        { name: 'Directory', href: '/directory' },
        { name: 'AI Tutor', href: '/ai-tutor' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ];
    }

    if (user.role === 'STUDENT' || user.role === 'TEACHER') {
      return [
        ...common,
        { name: 'AI Tutor', href: '/ai-tutor' },
        { name: 'Dashboard', href: '/dashboard' },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        ...common,
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Admin Console', href: '/admin' },
      ];
    }

    return common;
  };

  const navLinks = getNavLinks();

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 bg-white/95 backdrop-blur-md ${
        scrolled
          ? 'border-b border-[#E7DADA] shadow-xs py-3'
          : 'border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828] rounded-lg"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#FFF7F7] border border-[#C62828]/20 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/0.FAVICON.png"
                alt="CUCampusSaathi Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-[#252525] group-hover:text-[#C62828] transition-colors duration-150 leading-tight">
                CUCampus<span className="text-[#C62828]">Saathi</span>
              </span>
              <span className="text-[10px] font-semibold text-[#666666] tracking-wider uppercase">
                Chandigarh University
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    active
                      ? 'text-[#C62828] bg-[#FFF7F7] font-semibold border border-[#E7DADA]'
                      : 'text-[#666666] hover:text-[#252525] hover:bg-[#FFF7F7]'
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
                  to="/ai-tutor"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    location.pathname === '/ai-tutor'
                      ? 'bg-[#C62828] text-white shadow-xs'
                      : 'bg-[#FFF7F7] text-[#C62828] border border-[#E7DADA] hover:bg-[#ffebee]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C62828] group-hover:text-white" />
                  <span>AI Tutor</span>
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'bg-[#C62828] text-white shadow-xs'
                      : 'bg-[#FFF7F7] text-[#C62828] border border-[#E7DADA] hover:bg-[#ffebee]'
                  }`}
                >
                  Dashboard
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C62828] text-white text-xs font-bold hover:bg-[#8E1717] transition-all shadow-xs"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Console</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E7DADA] hover:border-[#C62828]/40 transition-colors"
                  title="Manage your profile"
                >
                  <div className="w-6 h-6 rounded-full bg-[#C62828] text-white flex items-center justify-center text-xs font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <p className="font-semibold text-[#252525] truncate max-w-[110px]">{user.fullName.split(' ')[0]}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#C62828]">{user.role}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#666666] hover:text-[#C62828] hover:bg-[#FFF7F7] border border-transparent hover:border-[#E7DADA] transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-semibold rounded-lg text-[#252525] hover:text-[#C62828] hover:bg-[#FFF7F7] transition-colors"
                >
                  Sign In
                </Link>
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg text-white bg-[#C62828] hover:bg-[#8E1717] shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
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
                  className="sm:hidden px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FFF7F7] text-[#C62828] border border-[#E7DADA]"
                >
                  {user.role}
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={handleGetStarted}
                className="sm:hidden px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#C62828] text-white hover:bg-[#8E1717]"
              >
                Get Started
              </button>
            )}
            <button
              type="button"
              id="mobile-menu-toggle"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#252525] hover:text-[#C62828] hover:bg-[#FFF7F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer / Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[65px] z-50 bg-[#252525]/40 backdrop-blur-xs flex flex-col">
          <div className="bg-white border-b border-[#E7DADA] shadow-lg max-h-[calc(100vh-65px)] overflow-y-auto px-6 py-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1 pb-4 border-b border-[#E7DADA]">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`px-4 py-3 text-base rounded-lg font-medium transition-colors ${
                      active
                        ? 'text-[#C62828] bg-[#FFF7F7] font-semibold border border-[#E7DADA]'
                        : 'text-[#252525] hover:bg-[#FFF7F7]'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {user ? (
              <div className="flex flex-col gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#252525]">{user.fullName}</p>
                    <p className="text-xs text-[#666666]">{user.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#C62828] border border-[#E7DADA] uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl text-white bg-[#C62828] hover:bg-[#8E1717] transition-all shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>My Dashboard</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl text-white bg-[#8E1717] hover:bg-[#701212] transition-all shadow-xs"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Console</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-[#C62828] border border-[#E7DADA] bg-[#FFF7F7] hover:bg-[#ffebee] transition-colors"
                >
                  My Profile & Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-[#C62828] border border-[#E7DADA] bg-white hover:bg-[#FFF7F7] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-bold rounded-xl border border-[#E7DADA] text-[#252525] hover:bg-[#FFF7F7]"
                >
                  Sign In
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleGetStarted();
                  }}
                  className="w-full py-2.5 text-center text-sm font-bold rounded-xl text-white bg-[#C62828] hover:bg-[#8E1717] shadow-xs cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}

            <div className="pt-2 text-center text-xs text-[#666666]">
              Chandigarh University Knowledge & Collaboration Network
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
