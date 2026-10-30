export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  benefit: string;
  iconName: string;
  badge?: string;
}

export interface FeatureCategory {
  id: string;
  title: string;
  subtitle: string;
  features: FeatureItem[];
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "student-learning",
    title: "Student Learning",
    subtitle: "AI-enhanced academic comprehension, personalized revision tools, and verifiable mastery.",
    features: [
      {
        id: "doc-tutor",
        title: "AI Document Tutor",
        description: "Upload lecture slides, syllabus PDFs, and academic papers to ask contextual doubts with cited sources.",
        benefit: "Get instant, verified conceptual clarifications 24/7 grounded strictly in course material.",
        iconName: "FileText",
        badge: "AI Core",
      },
      {
        id: "summaries-notes",
        title: "AI Summaries & Notes",
        description: "Transform lengthy research papers and semester lecture transcripts into structured, digestible cheat-sheets.",
        benefit: "Cut exam prep time in half by focusing on key takeaways, formulas, and definitions.",
        iconName: "BookOpen",
      },
      {
        id: "quiz-flashcards",
        title: "AI Quiz & Flashcard Generator",
        description: "Generate spaced-repetition flashcards and adaptive multi-choice quizzes directly from course modules.",
        benefit: "Reinforce active recall and retain core technical concepts before midterms and finals.",
        iconName: "BrainCircuit",
        badge: "Adaptive",
      },
      {
        id: "learning-progress",
        title: "Learning Progress Tracking",
        description: "Visual dashboards detailing subject mastery, active study streaks, and topic completion percentages.",
        benefit: "Identify knowledge gaps early and maintain steady academic momentum across semesters.",
        iconName: "TrendingUp",
      },
      {
        id: "skill-passport",
        title: "Verifiable Skill Passport",
        description: "A cryptographic and portfolio-backed profile showcasing validated proficiencies, projects, and endorsements.",
        benefit: "Stand out to campus recruiters and internship panels with tangible proof of abilities.",
        iconName: "Award",
        badge: "Verifiable",
      },
    ],
  },
  {
    id: "student-collaboration",
    title: "Student Collaboration",
    subtitle: "Discover peers with complementary strengths, form balanced teams, and co-create impactful projects.",
    features: [
      {
        id: "skill-graph",
        title: "AI SkillGraph",
        description: "A semantic map of campus skills showing how programming languages, design tools, and research domains interconnect.",
        benefit: "Discover adjacent capabilities to learn and locate peers possessing rare technical proficiencies.",
        iconName: "Network",
        badge: "AI Core",
      },
      {
        id: "team-builder",
        title: "AI Project Team Builder",
        description: "Matches students for hackathons, capstone projects, and research papers based on complementary skillsets and availability.",
        benefit: "Eliminates mismatched groups by assembling balanced teams with front-end, backend, and research leads.",
        iconName: "Users",
        badge: "Matchmaking",
      },
      {
        id: "peer-learning",
        title: "Peer Learning Exchange",
        description: "Connect with senior students who excelled in your current courses for structured 1-on-1 peer mentoring sessions.",
        benefit: "Receive practical course-specific advice, lab guidance, and assignment best practices.",
        iconName: "Share2",
      },
      {
        id: "project-workspace",
        title: "Project Collaboration Workspace",
        description: "Unified hubs with milestone tracking, task boards, resource repositories, and shared notes for campus teams.",
        benefit: "Keep student teams organized from initial ideation through to final academic submission.",
        iconName: "Layers",
      },
      {
        id: "student-discovery",
        title: "Student Talent Discovery",
        description: "Search and filter university peers by department, year, tech stack, hackathon interests, and club affiliations.",
        benefit: "Expand your campus network beyond your immediate branch and batch.",
        iconName: "Compass",
      },
    ],
  },
  {
    id: "faculty-connectivity",
    title: "Faculty Connectivity",
    subtitle: "Bridge the gap between students and professors with organized consultations and mentorship.",
    features: [
      {
        id: "faculty-profiles",
        title: "Faculty Profiles",
        description: "Comprehensive academic pages displaying faculty research interests, publication domains, office locations, and courses taught.",
        benefit: "Enables students to find professors whose research aligned precisely with their thesis or interests.",
        iconName: "GraduationCap",
      },
      {
        id: "faculty-booking",
        title: "Faculty Appointment Booking",
        description: "A streamlined calendar booking engine allowing students to reserve office hours with specific agendas.",
        benefit: "Eliminates chaotic email exchanges and long hallway waiting queues for consultation.",
        iconName: "Calendar",
        badge: "FacultyConnect",
      },
      {
        id: "availability-mgmt",
        title: "Faculty Availability Management",
        description: "Intuitive calendar management tools for professors to set consultation slots, buffer times, and recurring office hours.",
        benefit: "Protects faculty teaching and research time while ensuring fair student access.",
        iconName: "Clock",
      },
      {
        id: "group-doubts",
        title: "Group Doubt Sessions",
        description: "Professors can schedule topic-focused group office hours for recurring complex assignment queries.",
        benefit: "Addresses common questions collectively, saving dozens of hours each semester.",
        iconName: "MessageSquare",
      },
      {
        id: "project-mentoring",
        title: "Project Mentoring Hub",
        description: "Formal progress tracking and review channels for semester capstone projects and research paper guidance.",
        benefit: "Transparent milestone approvals, feedback documentation, and thesis progress tracking.",
        iconName: "CheckCircle2",
      },
    ],
  },
  {
    id: "university-admin",
    title: "University Administration",
    subtitle: "Real-time visibility into campus skills, collaboration trends, and research outputs for leadership.",
    features: [
      {
        id: "campus-analytics",
        title: "Campus Skill Analytics",
        description: "Aggregated, privacy-safe heatmaps showing prevailing student skills, emerging technology adoption, and curriculum gaps.",
        benefit: "Informs academic curriculum adjustments and industry training partnership decisions.",
        iconName: "BarChart3",
        badge: "Insights",
      },
      {
        id: "innovation-tracking",
        title: "Project & Innovation Tracking",
        description: "A central registry of campus patents, prototypes, hackathon prototypes, and startup initiatives.",
        benefit: "Showcase institutional innovation index for accreditation (NAAC/NIRF) and grant proposals.",
        iconName: "Lightbulb",
      },
      {
        id: "mentorship-analytics",
        title: "Mentorship Analytics",
        description: "Metrics covering consultation completion rates, student satisfaction scores, and teacher-student engagement ratios.",
        benefit: "Recognizes high-impact faculty mentors and identifies departments needing advisory support.",
        iconName: "PieChart",
      },
      {
        id: "resource-insights",
        title: "Learning Resource Insights",
        description: "Analysis of which course materials, lecture notes, and document repositories receive highest student engagement.",
        benefit: "Enables library and academic councils to allocate instructional resources effectively.",
        iconName: "Library",
      },
      {
        id: "admin-reporting",
        title: "Administrative Reporting",
        description: "Automated compliance reports, department-wise collaboration metrics, and executive summaries with one-click export.",
        benefit: "Saves administrative staff countless hours during university accreditation audits.",
        iconName: "ShieldAlert",
      },
    ],
  },
];
