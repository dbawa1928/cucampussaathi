import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Badge } from '../components/ui/Badge';

export const PrivacyPage: React.FC = () => {
  const sections = [
    { id: 'sec-1', num: '1', title: 'Introduction' },
    { id: 'sec-2', num: '2', title: 'Information We Collect' },
    { id: 'sec-3', num: '3', title: 'Account and Profile Information' },
    { id: 'sec-4', num: '4', title: 'Student Skills and Project Information' },
    { id: 'sec-5', num: '5', title: 'Faculty Profiles and Appointment Data' },
    { id: 'sec-6', num: '6', title: 'Uploaded Documents and AI Processing' },
    { id: 'sec-7', num: '7', title: 'How Information Is Used' },
    { id: 'sec-8', num: '8', title: 'Information Sharing' },
    { id: 'sec-9', num: '9', title: 'Data Storage and Security' },
    { id: 'sec-10', num: '10', title: 'Data Retention' },
    { id: 'sec-11', num: '11', title: 'Third-Party Services' },
    { id: 'sec-12', num: '12', title: 'Cookies' },
    { id: 'sec-13', num: '13', title: 'User Choices and Data Rights' },
    { id: 'sec-14', num: '14', title: "Children's Privacy" },
    { id: 'sec-15', num: '15', title: 'Policy Updates' },
    { id: 'sec-16', num: '16', title: 'Contact Information' },
  ];

  return (
    <div className="flex flex-col w-full bg-[#FFFFFF]">
      {/* Header */}
      <section className="pt-14 pb-14 bg-[#F6F8FC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge variant="primary" size="md" className="mb-3">
            Legal Information
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17233B] tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Last updated: October 2026 • Document Version 1.0 (Draft For Institutional Review)
          </p>

          {/* Draft Notice Banner */}
          <div className="mt-6 p-4 rounded-xl bg-[#FFF7ED] border border-[#C2410C]/20 text-xs text-[#C2410C] flex items-start gap-3 max-w-3xl">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Draft Document Notice:</strong> This privacy document constitutes a proposed institutional policy framework designed for university review prior to final production deployment. It outlines anticipated data handling practices without asserting certified statutory audit guarantees.
            </p>
          </div>
        </div>
      </section>

      {/* Content Layout with Table of Contents */}
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

            {/* Main Policy Body */}
            <article className="lg:col-span-3 prose prose-slate max-w-none text-sm text-[#17233B] leading-relaxed space-y-10">
              <section id="sec-1" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  1. Introduction
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Welcome to <strong>CUCampusSaathi</strong>. This Privacy Policy outlines how our university collaboration network collects, uses, handles, and protects information submitted by students, faculty members, and institutional administrators who utilize our web platform.
                </p>
              </section>

              <section id="sec-2" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  2. Information We Collect
                </h2>
                <p className="mt-3 text-[#64748B]">
                  We collect information strictly necessary to facilitate academic networking, project team matching, appointment booking, and AI document tutoring services. Information is submitted directly by users or derived from interactions within authorized platform tools.
                </p>
              </section>

              <section id="sec-3" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  3. Account and Profile Information
                </h2>
                <p className="mt-3 text-[#64748B]">
                  When registering, users provide their full name, university email address, university identifier (UID or Faculty ID), department affiliation, and relevant academic course or faculty designation. This data establishes identity within our university community.
                </p>
              </section>

              <section id="sec-4" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  4. Student Skills and Project Information
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Students may record technical skills, programming languages, academic project descriptions, and portfolio links. This data populates the AI SkillGraph and enables team matchmaking. Users control visibility settings for their individual profiles.
                </p>
              </section>

              <section id="sec-5" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  5. Faculty Profiles and Appointment Data
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Faculty profiles display designated academic research areas, course assignments, office cabin coordinates, and consultation slot schedules. Appointment records log discussion agendas, reservation statuses, and rescheduling notes for mutual accountability.
                </p>
              </section>

              <section id="sec-6" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  6. Uploaded Documents and AI Processing
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Documents uploaded to the AI Document Tutor (such as lecture slide PDFs and syllabus notes) are processed solely to create local semantic embeddings for conceptual doubt resolution. Documents remain the intellectual property of their owners and are not utilized to train public foundation models.
                </p>
              </section>

              <section id="sec-7" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  7. How Information Is Used
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Information is used to operate core features, match students with complementary collaborators, schedule consultations, recommend study resources, and provide aggregated, anonymized analytics to university leadership.
                </p>
              </section>

              <section id="sec-8" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  8. Information Sharing
                </h2>
                <p className="mt-3 text-[#64748B]">
                  We do not sell, rent, or monetize campus information to commercial advertisers. Information is visible only to authorized peers, mentors, and administrators in accordance with platform privacy permissions.
                </p>
              </section>

              <section id="sec-9" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  9. Data Storage and Security
                </h2>
                <p className="mt-3 text-[#64748B]">
                  The platform uses standard encryption protocols in transit and rests behind institutional access firewalls. Passwords and sensitive authentication tokens are hashed using secure cryptographic functions.
                </p>
              </section>

              <section id="sec-10" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  10. Data Retention
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Account data is retained for the duration of the student's or faculty member's active university tenure. Users may request account deactivation or export of their verified skill portfolio upon graduation.
                </p>
              </section>

              <section id="sec-11" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  11. Third-Party Services
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Where third-party services are utilized (such as university single-sign-on or cloud hosting infrastructure), their operation is strictly governed by institutional data protection agreements.
                </p>
              </section>

              <section id="sec-12" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  12. Cookies
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Essential session cookies are utilized to preserve user login states and interface preferences. No third-party behavioral advertising cookies are deployed on CUCampusSaathi.
                </p>
              </section>

              <section id="sec-13" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  13. User Choices and Data Rights
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Users have the right to inspect their personal profile records, update their academic credentials, modify skill privacy levels, and request deletion of their uploaded study materials.
                </p>
              </section>

              <section id="sec-14" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  14. Children's Privacy
                </h2>
                <p className="mt-3 text-[#64748B]">
                  CUCampusSaathi is designed solely for enrolled university students and faculty members. It is not directed toward individuals under the age of 16.
                </p>
              </section>

              <section id="sec-15" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  15. Policy Updates
                </h2>
                <p className="mt-3 text-[#64748B]">
                  Periodic updates may be introduced to reflect new educational features or regulatory adjustments. Notice of meaningful policy revisions will be prominently communicated across the platform.
                </p>
              </section>

              <section id="sec-16" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-[#17233B] pb-2 border-b border-[#E2E8F0]">
                  16. Contact Information
                </h2>
                <p className="mt-3 text-[#64748B]">
                  For questions or comments regarding this draft privacy statement, please utilize the{' '}
                  <a href="/contact" className="text-[#3157D5] underline">
                    Contact Us
                  </a>{' '}
                  page to reach the campus platform administration.
                </p>
              </section>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};
