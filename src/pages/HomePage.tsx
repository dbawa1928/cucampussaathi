import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Calendar,
  GraduationCap,
  Building2,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
} from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SectionHeading } from '../components/ui/SectionHeading';
import { FeatureCard } from '../components/ui/FeatureCard';
import { HeroDashboardMockup } from '../components/home/HeroDashboardMockup';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const dashboardUrl = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
  const getStartedUrl = user ? dashboardUrl : '/register';
  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-18 md:pb-28 bg-gradient-to-b from-[#FFF7F7] via-white to-white overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FFF7F7] via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Subheading pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E7DADA] shadow-xs text-xs font-semibold text-[#C62828] mb-6">
            <Sparkles className="w-4 h-4 text-[#C62828]" />
            <span>AI-Powered University Knowledge & Collaboration Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#252525] tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Your Campus. Your Community.{' '}
            <span className="text-[#C62828]">Your Next Big Opportunity.</span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-base sm:text-xl text-[#666666] max-w-3xl mx-auto leading-relaxed">
            Discover skills, connect with faculty mentors, find the right teammates, and turn academic knowledge into real-world projects with CUCampusSaathi.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              to={getStartedUrl}
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              className="w-full sm:w-auto"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Button>
            <Button
              to="/features"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Explore Features
            </Button>
          </div>

          {/* Trust points */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#666666] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16845B]" /> Verified Campus Profiles
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16845B]" /> Direct Faculty Appointments
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16845B]" /> AI-Powered Skill Matching
            </span>
          </div>

          {/* SaaS Dashboard Mockup */}
          <div className="mt-14 sm:mt-16">
            <HeroDashboardMockup />
          </div>
        </div>
      </section>

      {/* 2. CAMPUS PROBLEMS & CHALLENGES */}
      <section className="py-20 bg-[#FFF7F7] border-y border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Campus Reality"
            badgeVariant="warning"
            title="The Challenges University Campuses Face Today"
            description="Despite thousands of brilliant minds walking the same hallways, traditional campus structures keep talent, faculty time, and academic resources fragmented."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Siloed Student Talent',
                description:
                  'Computer science coders cannot find UI designers, mechanical engineers lack IoT developers, and project ideas stall before forming balanced teams.',
                icon: AlertCircle,
              },
              {
                title: 'Fragmented Faculty Consultations',
                description:
                  'Chaotic email threads, missed office hours, and crowded department corridors make booking academic guidance unnecessarily stressful.',
                icon: Clock,
              },
              {
                title: 'Unverified Skill Claims',
                description:
                  'Traditional resumes list buzzwords without tangible proof, leaving hackathon leads and campus recruiters guessing true student capability.',
                icon: Award,
              },
              {
                title: 'Static Learning Materials',
                description:
                  'Dense 100-page lecture slides and academic PDFs sit unindexed, making quick doubt resolution and conceptual recall inefficient.',
                icon: BookOpen,
              },
            ].map((problem, i) => {
              const Icon = problem.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white border border-[#E7DADA] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#252525] mb-2">
                      {problem.title}
                    </h3>
                    <p className="text-sm text-[#666666] leading-relaxed">
                      {problem.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. PLATFORM FEATURES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Core Platform Features"
            title="Intelligent Tools Designed for Campus Excellence"
            description="Six integrated pillars that unite learning, peer collaboration, and professor mentorship into one seamless interface."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              iconName="Network"
              title="AI SkillGraph & Skill Passport"
              description="A living semantic graph that maps your programming languages, tools, and research domains, backlinked with verified project work."
              benefit="Prove real proficiencies and discover adjacent skills to learn next."
              badge="AI Core"
            />
            <FeatureCard
              iconName="Users"
              title="AI Project Team Builder"
              description="Match with students across departments based on complementary strengths, project ambitions, and available semester bandwidth."
              benefit="Build balanced hackathon and capstone teams with zero guesswork."
              badge="Matchmaking"
            />
            <FeatureCard
              iconName="FileText"
              title="AI Document Tutor"
              description="Upload course lecture notes, syllabus syllabi, and research PDFs for grounded, cited conceptual doubt-clearing 24/7."
              benefit="Accurate answers citing exact slide and page numbers."
              badge="RAG Powered"
            />
            <FeatureCard
              iconName="Share2"
              title="Peer Learning Exchange"
              description="Connect with high-performing seniors for course revision, lab walkthroughs, and practical exam preparation."
              benefit="Learn directly from students who excelled in your exact subjects."
            />
            <FeatureCard
              iconName="Calendar"
              title="FacultyConnect & Appointments"
              description="Explore faculty research areas and book 1-on-1 office consultation slots with structured agendas in seconds."
              benefit="Structured mentorship without chaotic email back-and-forths."
              badge="FacultyConnect"
            />
            <FeatureCard
              iconName="Layers"
              title="Project Collaboration Workspace"
              description="Shared student hubs equipped with milestone trackers, document repositories, and faculty progress reviews."
              benefit="Maintain seamless execution from initial ideation to submission."
            />
          </div>

          <div className="mt-10 text-center">
            <Button to="/features" variant="secondary" size="md">
              View All 20+ Features & Services →
            </Button>
          </div>
        </div>
      </section>

      {/* 4. HOW THE PLATFORM WORKS */}
      <section className="py-20 bg-[#FFF7F7] border-y border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Simplified Workflow"
            title="How CUCampusSaathi Works"
            description="A clear, structured path from campus onboarding to verified project achievement."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Build Your Profile & Skills',
                desc: 'Sign up with your university ID, select your department, and map your proficiencies into your personal AI SkillGraph.',
              },
              {
                step: '02',
                title: 'Connect & Form Teams',
                desc: 'Use AI matchmaking to assemble capstone groups, find peer mentors, or book consultation slots with professors.',
              },
              {
                step: '03',
                title: 'Build, Learn & Showcase',
                desc: 'Upload course notes to the AI Document Tutor, collaborate on projects, and earn verifiable credentials for your portfolio.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-white border border-[#E7DADA] shadow-xs relative flex flex-col justify-between"
              >
                <div>
                  <span className="text-4xl font-extrabold text-[#C62828]/20">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-bold text-[#252525] mt-2 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#666666] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button to="/how-it-works" variant="outline" size="md">
              Read Detailed Role-Based Workflows →
            </Button>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS FOR STUDENTS, TEACHERS & ADMINISTRATION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Tailored Value"
            title="Empowering Every Stakeholder in University Life"
            description="Designed specifically to support the unique objectives of students, faculty mentors, and university leadership."
          />

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student Column */}
            <div className="p-8 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white text-[#C62828] border border-[#E7DADA] flex items-center justify-center mb-5 shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#252525] mb-2">For Students</h3>
                <p className="text-sm text-[#666666] mb-6">
                  Accelerate your academic learning curve, expand your peer network, and build high-impact portfolio projects.
                </p>

                <ul className="space-y-3 text-sm text-[#252525]">
                  {[
                    'Instant doubt clarification with AI Document Tutor',
                    'Assemble balanced hackathon & capstone teams',
                    'Direct office-hour booking with professors',
                    'Verifiable Skill Passport for recruiters',
                  ].map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#16845B] shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E7DADA]">
                <Link
                  to={user ? dashboardUrl : '/register'}
                  className="text-xs font-bold text-[#C62828] hover:text-[#8E1717] hover:underline flex items-center gap-1"
                >
                  {user ? 'Go to Dashboard →' : 'Join as Student →'}
                </Link>
              </div>
            </div>

            {/* Teacher Column */}
            <div className="p-8 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white text-[#C62828] border border-[#E7DADA] flex items-center justify-center mb-5 shadow-xs">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#252525] mb-2">For Faculty</h3>
                <p className="text-sm text-[#666666] mb-6">
                  Manage student consultations efficiently, mentor promising research projects, and organize course doubts.
                </p>

                <ul className="space-y-3 text-sm text-[#252525]">
                  {[
                    'Customizable office-hour consultation slots',
                    'Review student meeting agendas prior to acceptance',
                    'Track capstone project milestones in one dashboard',
                    'Host group doubt-clearing sessions prior to exams',
                  ].map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#16845B] shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E7DADA]">
                <Link
                  to={user ? dashboardUrl : '/register'}
                  className="text-xs font-bold text-[#C62828] hover:text-[#8E1717] hover:underline flex items-center gap-1"
                >
                  {user ? 'Go to Dashboard →' : 'Join as Faculty →'}
                </Link>
              </div>
            </div>

            {/* Administration Column */}
            <div className="p-8 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white text-[#C62828] border border-[#E7DADA] flex items-center justify-center mb-5 shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#252525] mb-2">For Administration</h3>
                <p className="text-sm text-[#666666] mb-6">
                  Gain aggregate visibility into campus innovation trends, skill distributions, and mentorship health.
                </p>

                <ul className="space-y-3 text-sm text-[#252525]">
                  {[
                    'Campus-wide skill distribution heatmaps',
                    'Track patents, research papers, and startup prototypes',
                    'Measure teacher-student mentorship engagement',
                    'Export accredited compliance metrics (NAAC/NIRF)',
                  ].map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#16845B] shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E7DADA]">
                <Link
                  to="/features"
                  className="text-xs font-bold text-[#C62828] hover:text-[#8E1717] hover:underline flex items-center gap-1"
                >
                  Explore Admin Insights →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FACULTYCONNECT SPOTLIGHT */}
      <section className="py-20 bg-[#FFF7F7] border-y border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E7DADA] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-xl">
              <Badge variant="primary" size="sm" className="mb-3">
                Feature Spotlight
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#252525] tracking-tight">
                FacultyConnect: Academic Mentorship Made Effortless
              </h2>
              <p className="mt-4 text-base text-[#666666] leading-relaxed">
                No more waiting outside faculty cabins or guessing when your professor is available. Browse teacher expertise, inspect consultation schedules, and book 1-on-1 guidance slots with a clear agenda.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-[#252525]">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF7F7] border border-[#E7DADA] text-[#C62828] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span>Real-time availability synced with faculty calendar</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#252525]">
                  <div className="w-8 h-8 rounded-lg bg-[#E6F5EF] text-[#16845B] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Structured agendas ensure productive, focused discussions</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <Button to="/features" variant="primary" size="md">
                  Explore FacultyConnect
                </Button>
                <Button to="/help" variant="outline" size="md">
                  Booking FAQs
                </Button>
              </div>
            </div>

            {/* Visual Booking Preview Card */}
            <div className="w-full lg:w-96 p-5 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] shadow-xs">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#E7DADA]">
                <div className="w-12 h-12 rounded-full bg-white text-[#C62828] font-bold text-lg flex items-center justify-center border border-[#E7DADA] shadow-xs">
                  RS
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#252525]">Dr. Rajesh Sharma</h4>
                  <p className="text-xs text-[#666666]">Associate Professor • Dept of AI</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-[#E7DADA] flex items-center justify-between">
                  <span className="text-[#666666]">Consultation Slot:</span>
                  <span className="font-bold text-[#252525]">Friday, 3:30 PM (30 min)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E7DADA] flex items-center justify-between">
                  <span className="text-[#666666]">Mode:</span>
                  <span className="font-bold text-[#C62828]">In-Person (Cabin 402)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E7DADA]">
                  <span className="text-[#666666] block mb-1">Meeting Agenda:</span>
                  <span className="font-medium text-[#252525]">
                    Reviewing Machine Learning Capstone pipeline & dataset validation
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E7DADA] text-center">
                <span className="text-xs font-semibold text-[#16845B] flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Ready to Book in 2 Clicks
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-[#C62828] to-[#8E1717] text-white text-center shadow-lg relative overflow-hidden">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Accelerate Your Campus Journey?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              Join students and faculty across Chandigarh University who are turning academic curiosity into collaborative excellence.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                to={getStartedUrl}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto bg-white text-[#C62828] hover:bg-[#FFF7F7] font-bold border-transparent"
              >
                {user ? 'Go to Dashboard' : 'Create Free Account'}
              </Button>
              <Button
                to="/contact"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10"
              >
                Contact University Support
              </Button>
            </div>

            <p className="mt-6 text-xs text-white/70">
              Free for all authenticated university students and faculty members.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
