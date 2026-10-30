import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-[#E7DADA] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#E7DADA]">
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#FFF7F7] border border-[#E7DADA] flex items-center justify-center shadow-xs shrink-0">
                <img
                  src="/0.FAVICON.png"
                  alt="CUCampusSaathi"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-extrabold text-[#252525]">
                CUCampus<span className="text-[#C62828]">Saathi</span>
              </span>
            </Link>

            <p className="text-sm font-semibold text-[#C62828] tracking-wide">
              Learn • Share • Teach • Build • Grow Together
            </p>

            <p className="text-sm text-[#666666] leading-relaxed max-w-sm">
              An AI-powered academic knowledge and collaboration ecosystem connecting students, faculty, and administration to turn academic potential into collaborative projects.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFF7F7] border border-[#E7DADA] text-xs text-[#252525] w-fit shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#16845B]" />
              <span>Dedicated for University Community</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-[#252525] tracking-wider uppercase">
              Platform
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-[#666666]">
              <li>
                <Link to="/" className="hover:text-[#C62828] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/ai-tutor" className="hover:text-[#C62828] transition-colors">
                  AI Document Tutor
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-[#C62828] transition-colors">
                  Features & Services
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#C62828] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#C62828] transition-colors">
                  About the Platform
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-[#252525] tracking-wider uppercase">
              Support & Connect
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-[#666666]">
              <li>
                <Link to="/help" className="hover:text-[#C62828] transition-colors">
                  Help Center / FAQs
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#C62828] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#C62828] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#C62828] transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Information */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-[#252525] tracking-wider uppercase">
              Compliance & Legal
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-[#666666]">
              <li>
                <Link to="/privacy" className="hover:text-[#C62828] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#C62828] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-[#C62828] transition-colors">
                  Password Recovery
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666666]">
          <p>
            © {currentYear} CUCampusSaathi. All rights reserved. Designed for university excellence.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              Built with <Heart className="w-3.5 h-3.5 text-[#C62828] fill-[#C62828]" /> by Chandigarh University Students
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
