import React, { useState } from 'react';
import {
  UserCheck,
  Cpu,
  Search,
  Users,
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Award,
  FileCheck,
  BookOpen,
  ShieldCheck,
  BarChart,
  Bot,
} from 'lucide-react';

import { SectionHeading } from '../components/ui/SectionHeading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const HowItWorksPage: React.FC = () => {
  const { user } = useAuth();
  const ctaUrl = user ? (user.role === 'ADMIN' ? '/admin' : '/dashboard') : '/register';
  const [activeWorkflow, setActiveWorkflow] = useState<'students' | 'teachers' | 'admin'>('students');

  const studentSteps = [
    {
      num: '01',
      title: 'Create Your Student Profile',
      desc: 'Register using your university email and student UID to verify your campus identity.',
      icon: UserCheck,
    },
    {
      num: '02',
      title: 'Add Skills & Academic Interests',
      desc: 'Input programming languages, software tools, coursework domains, and hackathon interests into your AI SkillGraph.',
      icon: Cpu,
    },
    {
      num: '03',
      title: 'Discover Resources & Peers',
      desc: 'Search for high-yield lecture summaries, practice flashcards, and student talent across various engineering departments.',
      icon: Search,
    },
    {
      num: '04',
      title: 'Find Teammates or Book Faculty',
      desc: 'Let the AI Team Builder match you for semester projects, or browse faculty availability to book office consultation hours.',
      icon: Users,
    },
    {
      num: '05',
      title: 'Collaborate, Revise & Learn',
      desc: 'Work in shared team collaboration workspaces and upload course slide decks to the AI Document Tutor for grounded answers.',
      icon: Layers,
    },
    {
      num: '06',
      title: 'Showcase Skills & Portfolio',
      desc: 'Build your cryptographic Verifiable Skill Passport with endorsed project milestones ready to present to internship recruiters.',
      icon: Award,
    },
  ];

  const teacherSteps = [
    {
      num: '01',
      title: 'Create Faculty Profile',
      desc: 'Set up your academic profile highlighting research domains, published papers, department, and office room location.',
      icon: GraduationCap,
    },
    {
      num: '02',
      title: 'Set Expertise & Consultation Hours',
      desc: 'Define recurring weekly office hours, maximum consultation duration, and meeting modes (physical cabin or virtual).',
      icon: Calendar,
    },
    {
      num: '03',
      title: 'Manage Appointment Requests',
      desc: 'Receive organized student meeting requests complete with discussion agendas, and accept, reschedule, or bundle into group slots.',
      icon: FileCheck,
    },
    {
      num: '04',
      title: 'Organize Course Resources',
      desc: 'Upload reference materials and syllabus outlines to provide course students with verified grounding for AI study queries.',
      icon: BookOpen,
    },
    {
      num: '05',
      title: 'Mentor Students & Projects',
      desc: 'Review capstone progress milestones, provide structured feedback on thesis papers, and sign off on project deliverables.',
      icon: Sparkles,
    },
    {
      num: '06',
      title: 'Review Learning Insights',
      desc: 'Gain anonymized analytics on recurring topic doubts, helping adjust upcoming lecture explanations to target confusion areas.',
      icon: BarChart,
    },
  ];

  const adminSteps = [
    {
      num: '01',
      title: 'Verify Users & Manage Permissions',
      desc: 'Confirm institutional faculty rosters, student batch enrollments, and ensure role-based permissions remain strictly segregated.',
      icon: ShieldCheck,
    },
    {
      num: '02',
      title: 'Manage Academic Categories',
      desc: 'Structure campus schools, departments, specialized minors, and official course curriculum codes across semesters.',
      icon: Building2,
    },
    {
      num: '03',
      title: 'Oversee Authorized Activities',
      desc: 'Monitor campus collaboration integrity, enforce community guidelines, and ensure respectful academic interactions.',
      icon: UserCheck,
    },
    {
      num: '04',
      title: 'Review Aggregate Engagement',
      desc: 'Track cross-departmental collaboration rates, appointment utilization, and active learning material engagement in real-time.',
      icon: BarChart,
    },
    {
      num: '05',
      title: 'Evaluate Innovation Outcomes',
      desc: 'Collate tangible student patents, research papers, and startup prototypes for university accreditation and ranking portfolios.',
      icon: Award,
    },
  ];

  const currentSteps =
    activeWorkflow === 'students'
      ? studentSteps
      : activeWorkflow === 'teachers'
      ? teacherSteps
      : adminSteps;

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="pt-14 pb-16 bg-[#FFF7F7] border-b border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="primary" size="md" className="mb-4">
            Workflow Architecture
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#252525] tracking-tight max-w-3xl mx-auto">
            How CUCampusSaathi Works
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#666666] max-w-2xl mx-auto leading-relaxed">
            Step-by-step guidance on how students, faculty members, and university administrators leverage the platform to achieve academic goals.
          </p>

          {/* Workflow Toggle Buttons */}
          <div className="mt-8 inline-flex p-1.5 rounded-xl bg-white border border-[#E7DADA] shadow-xs">
            <button
              type="button"
              onClick={() => setActiveWorkflow('students')}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                activeWorkflow === 'students'
                  ? 'bg-[#C62828] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#252525]'
              }`}
            >
              For Students (6 Steps)
            </button>
            <button
              type="button"
              onClick={() => setActiveWorkflow('teachers')}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                activeWorkflow === 'teachers'
                  ? 'bg-[#C62828] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#252525]'
              }`}
            >
              For Teachers (6 Steps)
            </button>
            <button
              type="button"
              onClick={() => setActiveWorkflow('admin')}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                activeWorkflow === 'admin'
                  ? 'bg-[#C62828] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#252525]'
              }`}
            >
              For Administration (5 Steps)
            </button>
          </div>
        </div>
      </section>

      {/* Dynamic Workflow Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-[#252525]">
              {activeWorkflow === 'students' && 'The Complete Student Journey'}
              {activeWorkflow === 'teachers' && 'The Faculty Consultation & Mentorship Flow'}
              {activeWorkflow === 'admin' && 'The Institutional Oversight & Analytics Protocol'}
            </h2>
            <p className="text-sm text-[#666666] mt-1">
              Seamlessly executed inside a single, intuitive interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-7 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] shadow-xs flex flex-col justify-between hover:border-[#C62828]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-[#C62828]/20 text-[#C62828] flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-2xl font-black text-[#8E1717]/30">
                        {step.num}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#252525] mb-2.5">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#666666] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Accessible Explanation of AI Architecture */}
      <section className="py-20 bg-[#FFF7F7] border-y border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Under the Hood"
            title="How AI Powers CUCampusSaathi Safely & Accurately"
            description="A transparent look at the machine learning mechanics running behind skill matching, document retrieval, and project team formation."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-[#E7DADA] shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#252525] mb-2">
                Semantic Skill Matching
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-3">
                Rather than primitive keyword searching, our AI clusters related competencies using embeddings. It understands that a student proficient in PyTorch and OpenCV naturally complements an IoT developer working on camera feeds.
              </p>
              <div className="text-xs font-semibold text-[#C62828]">
                ✓ Prevents duplicate skill silos in hackathon teams
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E7DADA] shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-[#FFF7F7] text-[#8E1717] border border-[#8E1717]/20 flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#252525] mb-2">
                Grounded Document Retrieval (RAG)
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-3">
                The AI Document Tutor converts course slides and PDFs into high-dimensional vector chunks. When students ask questions, the model retrieves the exact excerpt before generating a response, providing slide numbers and citations.
              </p>
              <div className="text-xs font-semibold text-[#8E1717]">
                ✓ Eliminates hallucinations; strictly course-grounded
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E7DADA] shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#252525] mb-2">
                Balanced Team Recommendations
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-3">
                Our constraint-satisfaction matchmaking balances three parameters: complementary skill requirements (frontend, backend, design), semester credit load, and compatible working time slots to optimize team stability.
              </p>
              <div className="text-xs font-semibold text-[#C62828]">
                ✓ High team completion and low dropout rates
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-[#252525]">
            Start Your Campus Collaboration Today
          </h3>
          <p className="mt-2 text-sm text-[#666666]">
            Join the students and teachers currently building our connected university network.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button to={ctaUrl} variant="primary" size="md">
              {user ? 'Go to Dashboard' : 'Create Account'}
            </Button>
            <Button to="/contact" variant="outline" size="md">
              Speak with Campus Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
