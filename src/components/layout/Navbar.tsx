import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react';
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

  // Lock body scroll when mobile menu is open
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

  // Strictly compliant navigation list:
  // Home, About, Directory, Contact, Dashboard, Profile, Sign In / Sign Out
  const getNavLinks = () => {
    const links = [
      { name: 'Home', href: '/' },
      { name: 'About', href: '/about' },
      { name: 'Directory', href: '/directory' },
      { name: 'Contact', href: '/contact' },
    ];

    if (user) {
      links.push({
        name: 'Dashboard',
        href: user.role === 'ADMIN' ? '/admin' : '/dashboard',
      });
      links.push({
        name: 'Profile',
        href: '/profile',
      });
    }

    return links;
  };

  const navLinks = getNavLinks();

  const handleSignOut = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 bg-white/95 backdrop-blur-md ${
        scrolled
          ? 'border-b border-[#E7DADA] shadow-xs py-2.5'
          : 'border-b border-transparent py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Brand Title */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828] rounded-lg shrink-0"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#FFF7F7] border border-[#C62828]/20 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
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
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#252525] group-hover:text-[#C62828] transition-colors leading-tight">
                CUCampus<span className="text-[#C62828]">Saathi</span>
              </span>
              <span className="text-[9px] font-semibold text-[#666666] tracking-wider uppercase">
                Chandigarh University
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    active
                      ? 'text-[#C62828] bg-[#FFF7F7] border border-[#E7DADA]'
                      : 'text-[#666666] hover:text-[#252525] hover:bg-[#FFF7F7]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden lg:flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2.5">
                <NotificationBell />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#666666] hover:text-[#C62828] hover:bg-[#FFF7F7] border border-transparent hover:border-[#E7DADA] transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl text-white bg-[#C62828] hover:bg-[#8E1717] transition-all shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Right Controls: Notification (if logged in) + Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {user && <NotificationBell />}
            <button
              type="button"
              id="mobile-menu-toggle"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#252525] hover:text-[#C62828] hover:bg-[#FFF7F7] border border-[#E7DADA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#C62828]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 top-[57px] z-[100] bg-black/50 backdrop-blur-xs flex flex-col justify-start"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-white border-b border-[#E7DADA] shadow-2xl w-full max-h-[calc(100vh-57px)] overflow-y-auto px-5 py-5 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Info Snippet (If logged in) */}
            {user && (
              <div className="p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] flex items-center justify-between mb-1">
                <div className="truncate">
                  <p className="text-xs font-bold text-[#252525] truncate">{user.fullName}</p>
                  <p className="text-[11px] text-[#666666] truncate">{user.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#C62828] border border-[#E7DADA] uppercase tracking-wider shrink-0 ml-2">
                  {user.role}
                </span>
              </div>
            )}

            {/* Strictly Compliant Navigation Links */}
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 text-sm font-bold rounded-xl transition-colors flex items-center justify-between ${
                      active
                        ? 'text-[#C62828] bg-[#FFF7F7] border border-[#E7DADA]'
                        : 'text-[#252525] hover:bg-[#FFF7F7]'
                    }`}
                  >
                    <span>{link.name}</span>
                    {link.name === 'Profile' && <UserIcon className="w-4 h-4 text-[#C62828]" />}
                  </Link>
                );
              })}
            </div>

            {/* Auth Action: Sign In or Sign Out */}
            <div className="pt-2 border-t border-[#E7DADA]">
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#C62828] bg-[#FFF7F7] border border-[#E7DADA] hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white bg-[#C62828] hover:bg-[#8E1717] shadow-xs transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>

            <div className="pt-2 text-center text-[10px] text-[#666666]">
              Chandigarh University • CUCampusSaathi
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
