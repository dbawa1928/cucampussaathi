import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Badge } from '../components/ui/Badge';

export const TermsPage: React.FC = () => {
  const sections = [
    { id: 'term-1', num: '1', title: 'Introduction' },
    { id: 'term-2', num: '2', title: 'Eligibility' },
    { id: 'term-3', num: '3', title: 'Account Registration' },
    { id: 'term-4', num: '4', title: 'Account Security' },
    { id: 'term-5', num: '5', title: 'Acceptable Use' },
    { id: 'term-6', num: '6', title: 'User Profiles and Skill Claims' },
    { id: 'term-7', num: '7', title: 'AI-Generated Content' },
    { id: 'term-8', num: '8', title: 'Uploaded Documents and Intellectual Property' },
    { id: 'term-9', num: '9', title: 'Faculty Appointment Requests' },
    { id: 'term-10', num: '10', title: 'Project Collaboration' },
    { id: 'term-11', num: '11', title: 'Content Moderation' },
    { id: 'term-12', num: '12', title: 'Service Availability' },
    { id: 'term-13', num: '13', title: 'Limitations of Responsibility' },
    { id: 'term-14', num: '14', title: 'Account Suspension and Termination' },
    { id: 'term-15', num: '15', title: 'Terms Updates' },
    { id: 'term-16', num: '16', title: 'Contact Information' },
  ];

  return (
    <div className="flex flex-col w-full bg-[#FFFFFF]">
      {/* Header */}
      <section className="pt-14 pb-14 bg-[#F6F8FC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge variant="primary" size="md" className="mb-3">
            Institutional Agreement
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17233B] tracking-tight">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Last updated: October 2026 • Document Version 1.0 (Draft For Institutional Review)
          </p>

          {/* Draft Notice Banner */}
          <div className="mt-6 p-4 rounded-xl bg-[#FFF7ED] border border-[#C2410C]/20 text-xs text-[#C2410C] flex items-start gap-3 max-w-3xl">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Draft Document Notice:</strong> These Terms and Conditions represent a proposed operating framework formulated for institutional academic review before production deployment. Users must observe all university conduct codes.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content & Table of Contents */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Table of Contents Sticky Sidebar */}
            <aside className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-24 p-5 rounded-2xl bg-[#F6F8FC] border border-[#E2E8F0] max-h-[calc(100vh-120px)] overflow-y-auto">
                <h3 className="text-xs font-bold text-[#17233B] uppercase tracking-wider mb-3">
                  Table of Contents
                </h3>
                <nav className="space-y-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block py-1.5 px-2 rounded-lg text-xs text-[#64748B] hover:text-[#3157D5] hover:bg-white transition-colors"
                    >
                      {s.num}. {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Terms Body */}
            <article className="lg:col-span-3 prose prose-slate max-w-none text-sm text-[#17233B] leading-relaxed space-y-10">
              <section id="term-1" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  1. Introduction
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Welcome to <strong>CUCampusSaathi</strong>. By accessing or registering for this university platform, you agree to comply with and be bound by these Terms and Conditions along with relevant university rules of academic conduct.
                </p>
              </section>

              <section id="term-2" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  2. Eligibility
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Access is granted exclusively to currently enrolled university students, active faculty instructors, research fellows, and authorized administrative staff of the institution.
                </p>
              </section>

              <section id="term-3" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  3. Account Registration
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Users agree to provide accurate, up-to-date, and genuine academic information during onboarding, including valid University UIDs, institutional email addresses, and departmental affiliations. Impersonation of other students or faculty is strictly prohibited.
                </p>
              </section>

              <section id="term-4" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  4. Account Security
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Users are responsible for safeguarding login credentials. You agree never to share your account password with peers or third parties and to immediately notify university support if unauthorized account access is suspected.
                </p>
              </section>

              <section id="term-5" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  5. Acceptable Use
                </h2>
                <p className="mt-3 text-[#64748B]">
                  CUCampusSaathi is dedicated to educational study, peer mentorship, research cooperation, and academic collaboration. Unacceptable use includes harassment, spamming peers, distributing unauthorized exam solutions, or attempting unauthorized system access.
                </p>
              </section>

              <section id="term-6" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  6. User Profiles and Skill Claims
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Users must represent their abilities, completed projects, and technical skills honestly. The Verifiable Skill Passport attaches verification badges based upon submitted evidence, peer endorsements, and faculty mentor confirmations.
                </p>
              </section>

              <section id="term-7" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  7. AI-Generated Content & Recommendations
                </h2>
                <p className="mt-3 text-[#64748B]">
                  CUCampusSaathi provides AI-assisted document explanations, flashcards, and team matchmaking recommendations. <strong>Users acknowledge that AI recommendations may occasionally be incomplete or inaccurate</strong>, and AI outputs should be verified against primary course textbooks and professor guidance.
                </p>
              </section>

              <section id="term-8" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  8. Uploaded Documents and Intellectual Property
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Users retain copyright over original notes and research uploaded to the platform. Users must ensure that any documents uploaded for AI indexing do not violate third-party academic copyright or proprietary institutional examination rules.
                </p>
              </section>

              <section id="term-9" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  9. Faculty Appointment Requests
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Submission of an appointment request through FacultyConnect does not create a guaranteed booking. <strong>Appointment requests remain unconfirmed until explicitly accepted by the faculty member</strong>. Faculty reserve the right to reschedule or modify consultation slots based on academic schedules.
                </p>
              </section>

              <section id="term-10" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  10. Project Collaboration
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Collaborative workspaces are provided as organizational utilities for student teams. Individual group members remain responsible for equitable division of labor, meeting university capstone guidelines, and preserving academic integrity.
                </p>
              </section>

              <section id="term-11" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  11. Content Moderation
                </h2>
                <p className="mt-3 text-[#64748B]">
                  University moderators reserve the right to review reported content, remove offensive or infringing materials, and take corrective action against accounts that breach institutional guidelines.
                </p>
              </section>

              <section id="term-12" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  12. Service Availability
                </h2>
                <p className="mt-3 text-[#64748B]">
                  We strive to maintain continuous platform availability. However, occasional scheduled maintenance windows, network upgrades, or unforeseen disruptions may occur without prior notice.
                </p>
              </section>

              <section id="term-13" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  13. Limitations of Responsibility
                </h2>
                <p className="mt-3 text-[#64748B]">
                  CUCampusSaathi is provided on an "as-is" and "as-available" basis for educational assistance. The platform is not liable for indirect damages, lost study files, or project grading outcomes derived from platform collaboration.
                </p>
              </section>

              <section id="term-14" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  14. Account Suspension and Termination
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Accounts found in violation of these Terms, university disciplinary standards, or academic ethics codes may be suspended or permanently revoked upon investigation by university authorities.
                </p>
              </section>

              <section id="term-15" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  15. Terms Updates
                </h2>
                <p className="mt-3 text-[#64748B]">
                  These terms may be periodically amended to align with university policies. Continued usage following published modifications constitutes agreement to the updated Terms and Conditions.
                </p>
              </section>

              <section id="term-16" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  16. Contact Information
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Questions concerning these terms may be forwarded via our{' '}
                  <a href="/contact" className="text-[#3157D5] underline">
                    Contact Us
                  </a>{' '}
                  page or directed to the campus platform coordinators.
                </p>
              </section>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};
