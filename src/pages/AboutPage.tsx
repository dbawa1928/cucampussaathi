import React from 'react';
import {
  Compass,
  Target,
  Users,
  Lightbulb,
  HeartHandshake,
  Layers,
  CheckCircle2,
  Network,
  Share2,
  FileText,
  Award,
  Calendar,
} from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SectionHeading } from '../components/ui/SectionHeading';
import { TeamCard } from '../components/ui/TeamCard';
import { TEAM_MEMBERS } from '../data/teamData';
import { useAuth } from '../context/AuthContext';

export const AboutPage: React.FC = () => {
  const { user } = useAuth();
  const ctaUrl = user ? (user.role === 'ADMIN' ? '/admin' : '/dashboard') : '/register';
  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="pt-14 pb-18 bg-[#FFF7F7] border-b border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="primary" size="md" className="mb-4">
            About CUCampusSaathi
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#252525] tracking-tight max-w-3xl mx-auto">
            Bridging Campus Knowledge, Talent & Mentorship
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[#666666] max-w-2xl mx-auto leading-relaxed">
            An intelligent university initiative created to connect student ambition with faculty guidance and peer collaboration.
          </p>
        </div>
      </section>

      {/* 2. ABOUT CUCAMPUSSAATHI & 3. THE PROBLEM WE ARE SOLVING */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-[#C62828] uppercase tracking-wider">
                Our Genesis
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#252525] tracking-tight mt-2 mb-4">
                What is CUCampusSaathi?
              </h2>
              <p className="text-sm sm:text-base text-[#666666] leading-relaxed mb-4">
                Universities house exceptional diversity of thought, technical capability, and scholarly expertise. Yet, much of this potential remains siloed inside individual lecture halls, batch sections, and departmental floors.
              </p>
              <p className="text-sm sm:text-base text-[#666666] leading-relaxed mb-6">
                <strong>CUCampusSaathi</strong> was conceived as a centralized, AI-powered collaboration network that brings transparent discovery to university life—enabling students to identify mentors, form balanced cross-disciplinary project teams, interact with their course documents, and schedule dedicated faculty consultations without organizational friction.
              </p>

              <div className="p-4 rounded-xl bg-[#FFF7F7] border border-[#E7DADA]">
                <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider mb-2">
                  Key Campus Objectives
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#252525]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C62828]" /> Eliminate skill fragmentation
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C62828]" /> Streamline teacher booking
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C62828]" /> Grounded AI document learning
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C62828]" /> Verifiable student credentials
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] shadow-xs">
              <span className="text-xs font-bold text-[#8E1717] uppercase tracking-wider">
                The Core Challenge
              </span>
              <h3 className="text-xl font-bold text-[#252525] mt-2 mb-3">
                The Problem We Are Solving
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Currently, students struggle to find peers outside their immediate friend circles who have complementary technical proficiencies for hackathons, research publications, or capstone projects.
              </p>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                At the same time, faculty members receive hundreds of ad-hoc emails and corridor queries for doubts and appointment bookings, causing scheduling bottlenecks and missed mentorship opportunities.
              </p>
              <div className="p-4 rounded-lg bg-white border border-[#E7DADA] text-xs text-[#252525] font-medium leading-relaxed">
                "CUCampusSaathi replaces disjointed WhatsApp groups and random email chains with an organized, verified academic ecosystem."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MISSION & 5. VISION */}
      <section className="py-20 bg-[#FFF7F7] border-y border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Guiding North Star"
            title="Our Mission & Long-Term Vision"
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission Box */}
            <div className="p-8 rounded-2xl bg-white border border-[#E7DADA] shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center mb-5">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#C62828] uppercase tracking-wider">
                  Our Mission
                </span>
                <h3 className="text-xl font-bold text-[#252525] mt-1 mb-4">
                  Democratizing Knowledge & Opportunity
                </h3>
                <blockquote className="text-base text-[#252525] font-medium italic border-l-4 border-[#C62828] pl-4 py-1 leading-relaxed">
                  "To make campus knowledge, academic guidance, and student talent more accessible by connecting people, learning resources, and opportunities through one intelligent platform."
                </blockquote>
              </div>
            </div>

            {/* Vision Box */}
            <div className="p-8 rounded-2xl bg-white border border-[#E7DADA] shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#FFF7F7] text-[#8E1717] border border-[#8E1717]/20 flex items-center justify-center mb-5">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#8E1717] uppercase tracking-wider">
                  Our Vision
                </span>
                <h3 className="text-xl font-bold text-[#252525] mt-1 mb-4">
                  Cultivating Connected Learning Communities
                </h3>
                <blockquote className="text-base text-[#252525] font-medium italic border-l-4 border-[#8E1717] pl-4 py-1 leading-relaxed">
                  "To help universities create connected learning communities where students discover expertise, faculty support learning effectively, and promising ideas become collaborative projects."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CORE PRINCIPLES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Foundational Values"
            title="Core Principles"
            description="The four philosophical standards that steer every feature and interaction inside CUCampusSaathi."
          />

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Learn Together',
                desc: 'Collaborative revision, peer exchange, and open inquiry create deeper comprehension than studying in complete isolation.',
                icon: Users,
              },
              {
                title: 'Discover Talent',
                desc: 'Unearth hidden campus proficiencies, research inclinations, and technical strengths with verifiable, transparent skill mapping.',
                icon: Lightbulb,
              },
              {
                title: 'Collaborate Meaningfully',
                desc: 'Form teams built on mutual alignment, balanced capability, and shared work ethics rather than random assignment.',
                icon: HeartHandshake,
              },
              {
                title: 'Build With Purpose',
                desc: 'Transform classroom theoretical understanding into deployable software, published research, and tangible student prototypes.',
                icon: Layers,
              },
            ].map((principle, idx) => {
              const Icon = principle.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#E7DADA] text-[#C62828] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#252525] mb-2">
                      {principle.title}
                    </h3>
                    <p className="text-sm text-[#666666] leading-relaxed">
                      {principle.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. MEET THE TEAM */}
      <section className="py-20 bg-[#FFF7F7] border-y border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Leadership & Core Contributors"
            title="Meet the Team"
            description="The dedicated students behind the design, architecture, and realization of CUCampusSaathi."
          />

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <TeamCard key={member.uid} member={member} />
            ))}
          </div>

          <div className="mt-8 text-center text-xs text-[#666666]">
            All team members are active undergraduate contributors representing Chandigarh University engineering batches.
          </div>
        </div>
      </section>

      {/* 8. PLATFORM PILLARS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Architecture"
            title="The Six Platform Pillars"
            description="The structural pillars engineering a frictionless university collaboration framework."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                num: '1',
                title: 'AI SkillGraph',
                desc: 'Dynamically clusters campus engineering, design, and research proficiencies into a transparent semantic network.',
                icon: Network,
              },
              {
                num: '2',
                title: 'Peer Learning Engine',
                desc: 'Enables students to book structured peer study sessions and exchange high-yield course revision guides.',
                icon: Share2,
              },
              {
                num: '3',
                title: 'AI Document Tutor',
                desc: 'Local RAG pipeline processing lecture slides and syllabus notes to answer academic queries with source citations.',
                icon: FileText,
              },
              {
                num: '4',
                title: 'AI Project Team Builder',
                desc: 'Intelligent matchmaking engine analyzing role needs to assemble balanced hackathon and capstone squads.',
                icon: Users,
              },
              {
                num: '5',
                title: 'Verifiable Skill Passport',
                desc: 'Evidence-backed student credentials linking verified course projects, peer endorsements, and faculty sign-offs.',
                icon: Award,
              },
              {
                num: '6',
                title: 'FacultyConnect',
                desc: 'Comprehensive faculty directory and appointment booking system enabling structured 1-on-1 consultations.',
                icon: Calendar,
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.num}
                  className="p-6 rounded-xl bg-white border border-[#E7DADA] shadow-xs flex flex-col justify-between hover:border-[#C62828]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-[#666666] px-2 py-0.5 rounded bg-[#FFF7F7] border border-[#E7DADA]">
                        Pillar 0{pillar.num}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#252525] mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-[#666666] leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-20 bg-[#FFF7F7] border-t border-[#E7DADA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#252525]">
            Collaborate With Your Campus Peers Today
          </h2>
          <p className="mt-3 text-base text-[#666666] max-w-xl mx-auto">
            Get started in minutes with your university credentials and explore what your campus is building.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button to={ctaUrl} variant="primary" size="lg">
              {user ? 'Go to Dashboard' : 'Create University Account'}
            </Button>
            <Button to="/how-it-works" variant="outline" size="lg">
              Explore How It Works
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
