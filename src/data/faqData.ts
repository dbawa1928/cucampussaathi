export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const FAQ_CATEGORIES = [
  "All",
  "Getting Started",
  "Profiles & Skills",
  "Project Team Builder",
  "AI Document Tutor",
  "FacultyConnect & Appointments",
  "Teacher Features",
  "Account & Security",
  "Privacy & Data",
];

export const FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    id: "gs-1",
    category: "Getting Started",
    question: "Who can register on CUCampusSaathi?",
    answer: "CUCampusSaathi is designed exclusively for university students, faculty members, and academic departments. During registration, users select their role (Student or Faculty) and provide their university-issued identification and department credentials.",
  },
  {
    id: "gs-2",
    category: "Getting Started",
    question: "Is CUCampusSaathi free to use for university students and teachers?",
    answer: "Yes, all public core features—including skill profiles, peer matching, the AI Document Tutor prototype, and FacultyConnect appointment bookings—are provided free for authenticated university community members.",
  },
  {
    id: "gs-3",
    category: "Getting Started",
    question: "How do I verify my campus account?",
    answer: "Once you register with your official university email and UID, an institutional verification link is issued to confirm your active campus enrollment or faculty tenure.",
  },

  // Profiles & Skills
  {
    id: "ps-1",
    category: "Profiles & Skills",
    question: "What is the AI SkillGraph and how does it map my proficiencies?",
    answer: "The AI SkillGraph dynamically clusters related competencies (such as Python, PyTorch, Linear Algebra, and Data Engineering) into an interactive semantic map. It highlights adjacent competencies you can acquire next and identifies peers who complement your strengths.",
  },
  {
    id: "ps-2",
    category: "Profiles & Skills",
    question: "How does the Verifiable Skill Passport work?",
    answer: "Rather than relying on unverified claims, your Skill Passport links to tangible evidence: submitted course assignments, peer endorsements, hackathon achievements, and faculty project approvals.",
  },
  {
    id: "ps-3",
    category: "Profiles & Skills",
    question: "Can I hide certain profile details or keep my skill endorsements private?",
    answer: "Yes. In your profile settings, you can toggle public visibility between campus-wide visibility, batch-only visibility, or private mode where only your project collaborators and professors can view your profile.",
  },

  // Project Team Builder
  {
    id: "pt-1",
    category: "Project Team Builder",
    question: "How does the AI Project Team Builder assemble groups?",
    answer: "When you launch or search for a project, the AI evaluates project requirements (e.g. 1 Frontend Dev, 1 ML Engineer, 1 UI Designer) against candidate availability, current semester load, and complementary skills to suggest well-rounded team compositions.",
  },
  {
    id: "pt-2",
    category: "Project Team Builder",
    question: "Can we use CUCampusSaathi for semester capstone projects?",
    answer: "Absolutely. The Project Collaboration Workspace includes milestone logs, repository links, document sharing, and faculty mentor progress check-ins tailored specifically for semester capstone and thesis workflows.",
  },

  // AI Document Tutor
  {
    id: "dt-1",
    category: "AI Document Tutor",
    question: "What file formats can be uploaded to the AI Document Tutor?",
    answer: "The platform supports PDF lecture notes, PowerPoint/Keynote presentation slides (.pptx), text documents (.txt, .md), and syllabus curriculum guidelines. Files are processed locally and securely indexed.",
  },
  {
    id: "dt-2",
    category: "AI Document Tutor",
    question: "Does the AI Document Tutor invent answers or hallucinate citations?",
    answer: "No. The AI Document Tutor uses strict Retrieval-Augmented Generation (RAG). Responses cite exact slide numbers, page citations, and chapter excerpts from your uploaded course materials. If the answer is not in the material, the assistant explicitly states so.",
  },
  {
    id: "dt-3",
    category: "AI Document Tutor",
    question: "Can I share my course revision summaries with classmates?",
    answer: "Yes, you can generate an AI study guide or flashcard deck and publish it directly to your course section's Peer Learning Exchange board.",
  },

  // FacultyConnect & Appointments
  {
    id: "fc-1",
    category: "FacultyConnect & Appointments",
    question: "How does the FacultyConnect appointment booking process work?",
    answer: "Students browse teacher profiles by subject or research topic, select an open consultation slot from the teacher's availability calendar, submit a brief discussion agenda, and receive a confirmation notification once the professor accepts.",
  },
  {
    id: "fc-2",
    category: "FacultyConnect & Appointments",
    question: "Are appointment requests guaranteed immediately upon submission?",
    answer: "No. In accordance with academic guidelines, all appointment requests remain pending until accepted or rescheduled by the faculty member. You can review current booking statuses in your user dashboard.",
  },
  {
    id: "fc-3",
    category: "FacultyConnect & Appointments",
    question: "How do I cancel or reschedule a booked appointment?",
    answer: "Students or faculty can cancel or request a reschedule at least two hours prior to the slot through the appointments tab. A polite notification is automatically sent to both parties.",
  },

  // Teacher Features
  {
    id: "tf-1",
    category: "Teacher Features",
    question: "How do faculty members configure office consultation hours?",
    answer: "Faculty can define recurring weekly office hours, set meeting duration caps (e.g., 15 or 30 minutes), specify meeting locations (physical office room number or university video link), and block out exam grading periods.",
  },
  {
    id: "tf-2",
    category: "Teacher Features",
    question: "Can professors host group doubt-clearing sessions?",
    answer: "Yes. Faculty can create group consultation slots for up to 25 students prior to exams, allowing students with similar course doubts to attend simultaneously without booking redundant individual slots.",
  },
  {
    id: "tf-3",
    category: "Teacher Features",
    question: "Do teachers have access to student project collaboration milestones?",
    answer: "Yes. When appointed as project mentors, teachers can inspect deliverables, comment directly on project milestones, and submit mid-term evaluation logs inside the platform.",
  },

  // Account & Security
  {
    id: "as-1",
    category: "Account & Security",
    question: "How do I reset my password if I forget it?",
    answer: "Navigate to the Forgot Password page (/forgot-password), enter your registered university email address, and follow the password recovery instructions provided.",
  },
  {
    id: "as-2",
    category: "Account & Security",
    question: "Can public users grant themselves administrator privileges?",
    answer: "Never. Administrator roles are strictly managed through central institutional authorization and cannot be selected or activated through public registration forms.",
  },

  // Privacy & Data
  {
    id: "pd-1",
    category: "Privacy & Data",
    question: "Who owns the copyright of documents uploaded to CUCampusSaathi?",
    answer: "Students and faculty retain full ownership of their intellectual property, lecture materials, and research notes. CUCampusSaathi processes documents solely to provide the requested AI tutoring and search services.",
  },
  {
    id: "pd-2",
    category: "Privacy & Data",
    question: "Are student grades or disciplinary records stored on this platform?",
    answer: "No. CUCampusSaathi focuses purely on learning collaboration, peer matchmaking, and mentorship. It does not replace official university grading systems or store confidential disciplinary data.",
  },
];
