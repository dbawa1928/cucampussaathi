import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Calendar,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Network,
} from 'lucide-react';


export const HeroDashboardMockup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'skillgraph' | 'teams' | 'appointments'>('overview');

  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_20px_50px_rgba(49,87,213,0.12)] overflow-hidden">
      {/* Top OS Window Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F6F8FC] border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#EF4444]/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#10B981]/80 inline-block" />
          <span className="ml-2 text-xs font-medium text-[#64748B] hidden sm:inline">
            cucampussaathi.internal/portal/dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F5EF] text-[#16845B] border border-[#16845B]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16845B] animate-pulse" />
            Live Campus Network
          </span>
        </div>
      </div>

      {/* Main Internal Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#EAF1FF] text-[#3157D5] font-bold text-sm flex items-center justify-center border border-[#3157D5]/20">
            CU
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-[#17233B]">
                Student Workspace
              </h4>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#EAF1FF] text-[#3157D5]">
                CSE • Sem 6
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Verified Skill Passport: Level 3 Advanced
            </p>
          </div>
        </div>

        {/* Mock Search Input */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            readOnly
            value="Search skills, teammates, mentors..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-[#F6F8FC] border border-[#E2E8F0] text-[#64748B] cursor-default focus:outline-none"
          />
        </div>
      </div>

      {/* Interactive Feature Filter Tabs */}
      <div className="px-4 sm:px-6 pt-3 bg-[#F6F8FC] border-b border-[#E2E8F0] flex gap-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Platform Hub' },
          { id: 'skillgraph', label: 'AI SkillGraph' },
          { id: 'teams', label: 'Team Builder Match' },
          { id: 'appointments', label: 'FacultyConnect Booking' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#3157D5] text-[#3157D5] bg-white'
                : 'border-transparent text-[#64748B] hover:text-[#17233B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mockup Body Content */}
      <div className="p-4 sm:p-6 bg-[#FAFCFF] min-h-[360px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: SkillGraph Preview */}
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#3157D5] uppercase tracking-wider flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5" />
                    AI Skill Passport
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#E6F5EF] text-[#16845B] font-semibold">
                    Verified
                  </span>
                </div>
                <h5 className="font-semibold text-sm text-[#17233B] mb-2">
                  Active Competencies
                </h5>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {['PyTorch', 'FastAPI', 'React 19', 'Tailwind', 'Docker'].map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded text-[11px] bg-[#EAF1FF] text-[#3157D5] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                Suggested next: <span className="font-semibold text-[#17233B]">Vector DBs & RAG</span>
              </div>
            </div>

            {/* Card 2: AI Team Match */}
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#3157D5] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    AI Match Engine
                  </span>
                  <span className="text-xs font-bold text-[#3157D5]">
                    96% Compatibility
                  </span>
                </div>
                <h5 className="font-semibold text-sm text-[#17233B] mb-1">
                  Autonomous Campus Rover
                </h5>
                <p className="text-xs text-[#64748B] mb-3">
                  Capstone Project • Needs 1 Computer Vision Lead
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {['D', 'RG', 'TB'].map((initials, i) => (
                      <div
                        key={i}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#3157D5] text-white text-[10px] font-bold text-center leading-6"
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#64748B] font-medium">
                    3/4 members ready
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-[#16845B] font-semibold flex items-center gap-1 pt-2 border-t border-[#E2E8F0]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Match recommended by AI
              </div>
            </div>

            {/* Card 3: Faculty Appointment */}
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#3157D5] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    FacultyConnect
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAF1FF] text-[#3157D5] font-semibold">
                    Confirmed
                  </span>
                </div>
                <h5 className="font-semibold text-sm text-[#17233B] mb-0.5">
                  Dr. Rajesh Sharma
                </h5>
                <p className="text-xs text-[#64748B] mb-2">
                  Head of AI & Robotics Lab
                </p>
                <div className="p-2 rounded-lg bg-[#F6F8FC] border border-[#E2E8F0] text-xs text-[#17233B] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#3157D5]" />
                  <span>Tomorrow, 03:30 PM (Cabin 402)</span>
                </div>
              </div>
              <div className="text-[11px] text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                Agenda: Capstone Architecture Review
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skillgraph' && (
          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h5 className="font-bold text-base text-[#17233B]">
                  Interactive AI SkillGraph Visualizer
                </h5>
                <p className="text-xs text-[#64748B]">
                  Semantic clustering of engineering competencies and related campus collaborators
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#EAF1FF] text-[#3157D5]">
                Clustering Algorithm Active
              </span>
            </div>

            {/* Visual Node Diagram */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
              {[
                { title: 'Machine Learning', score: '98%', peers: '42 Peers', tag: 'Core Strength' },
                { title: 'Fullstack React', score: '92%', peers: '88 Peers', tag: 'High Demand' },
                { title: 'Cloud DevOps', score: '74%', peers: '29 Peers', tag: 'Growing' },
                { title: 'Embedded IoT', score: '85%', peers: '19 Peers', tag: 'Niche Specialization' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F6F8FC]">
                  <span className="text-[10px] font-semibold text-[#3157D5] uppercase tracking-wide">
                    {item.tag}
                  </span>
                  <div className="font-bold text-sm text-[#17233B] mt-1">{item.title}</div>
                  <div className="text-xs text-[#64748B] mt-1">{item.peers} available</div>
                  <div className="mt-2 text-xs font-bold text-[#16845B]">Proficiency: {item.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <h5 className="font-bold text-base text-[#17233B] mb-1">
              Active Project Team Matchmaking
            </h5>
            <p className="text-xs text-[#64748B] mb-4">
              AI evaluates skill complementarities to avoid skill overlaps and missing roles.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Fintech Micro-Lending Portal',
                  dept: 'CSE & Management Studies',
                  missing: 'UI/UX Designer Needed',
                  compatibility: '95% Fit',
                },
                {
                  title: 'Campus Solar Energy Monitor',
                  dept: 'Electrical & IoT Research',
                  missing: 'Cloud Backend Lead Needed',
                  compatibility: '92% Fit',
                },
              ].map((proj, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F6F8FC]"
                >
                  <div>
                    <h6 className="font-bold text-sm text-[#17233B]">{proj.title}</h6>
                    <div className="text-xs text-[#64748B]">{proj.dept}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#C2410C]/20">
                      {proj.missing}
                    </span>
                    <div className="text-xs font-bold text-[#16845B] mt-1">
                      {proj.compatibility}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <h5 className="font-bold text-base text-[#17233B] mb-1">
              FacultyConnect Appointment Engine
            </h5>
            <p className="text-xs text-[#64748B] mb-4">
              Real-time faculty consultation slots with agenda submission and automated calendar sync.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F6F8FC]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#17233B]">Dr. Priya Verma</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#EAF1FF] text-[#3157D5] font-semibold">
                    Available Today
                  </span>
                </div>
                <div className="text-xs text-[#64748B] mb-2">Subject: Distributed Systems</div>
                <div className="text-xs font-medium text-[#16845B]">Next slot: 04:00 PM – 04:30 PM</div>
              </div>
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F6F8FC]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#17233B]">Prof. Amit Saxena</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#EAF1FF] text-[#3157D5] font-semibold">
                    Available Tomorrow
                  </span>
                </div>
                <div className="text-xs text-[#64748B] mb-2">Subject: Natural Language Processing</div>
                <div className="text-xs font-medium text-[#16845B]">Next slot: 11:30 AM – 12:00 PM</div>
              </div>
            </div>
          </div>
        )}

        {/* AI Tutor Chat Snippet */}
        <div className="mt-4 p-4 rounded-xl bg-white border border-[#3157D5]/20 shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EAF1FF] text-[#3157D5] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[#17233B]">AI Document Tutor • RAG Verified</span>
              <span className="text-[11px] text-[#64748B]">Just now</span>
            </div>
            <p className="text-[#17233B] leading-relaxed">
              "Gradient Descent convergence in non-convex loss functions is mitigated via Momentum and Adam optimizers by incorporating running averages of past gradients."
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#3157D5] font-medium">
              <FileText className="w-3.5 h-3.5" />
              <span>Cited from: Machine_Learning_Lecture_06.pdf (Slide 19, Section 4.2)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
