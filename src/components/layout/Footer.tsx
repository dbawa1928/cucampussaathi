import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#F6F8FC] border-t border-[#E2E8F0] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#E2E8F0]">
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white border border-[#E2E8F0] flex items-center justify-center shadow-xs shrink-0">
                <img
                  src="/0.FAVICON.png"
                  alt="CUCampusSaathi"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-extrabold text-[#17233B]">
                CUCampus<span className="text-[#3157D5]">Saathi</span>
              </span>
            </Link>

            <p className="text-sm font-semibold text-[#3157D5] tracking-wide">
              Learn • Share • Teach • Build • Grow Together
            </p>

            <p className="text-sm text-[#64748B] leading-relaxed max-w-sm">
              An AI-powered academic knowledge and collaboration ecosystem connecting students, faculty, and administration to turn academic potential into collaborative projects.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#17233B] w-fit shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#16845B]" />
              <span>Dedicated for University Community</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-[#17233B] tracking-wider uppercase">
              Platform
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-[#64748B]">
              <li>
                <Link to="/" className="hover:text-[#3157D5] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-[#3157D5] transition-colors">
                  Features & Services
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#3157D5] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#3157D5] transition-colors">
                  About the Platform
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-[#17233B] tracking-wider uppercase">
              Support & Connect
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-[#64748B]">
              <li>
                <Link to="/help" className="hover:text-[#3157D5] transition-colors">
                  Help Center / FAQs
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#3157D5] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#3157D5] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#3157D5] transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Information */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-[#17233B] tracking-wider uppercase">
              Compliance & Legal
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-[#64748B]">
              <li>
                <Link to="/privacy" className="hover:text-[#3157D5] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#3157D5] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-[#3157D5] transition-colors">
                  Password Recovery
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <p>
            © {currentYear} CUCampusSaathi. All rights reserved. Designed for university excellence.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              Built with <Heart className="w-3.5 h-3.5 text-[#3157D5] fill-[#3157D5]" /> by Chandigarh University Students
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
