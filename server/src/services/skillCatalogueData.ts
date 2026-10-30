export interface DefaultSkillSeed {
  name: string;
  category: string;
  description: string;
}

export const DEFAULT_UNIVERSITY_SKILLS: DefaultSkillSeed[] = [
  // Programming & Development
  { name: 'Python', category: 'Programming & Development', description: 'Core Python, OOP, scripting, data handling and automation' },
  { name: 'Java', category: 'Programming & Development', description: 'Core Java, Collections, Multithreading, and enterprise development' },
  { name: 'C++', category: 'Programming & Development', description: 'Modern C++, STL, memory management, and high-performance computing' },
  { name: 'C Programming', category: 'Programming & Development', description: 'Pointers, memory allocation, and system level programming' },
  { name: 'TypeScript', category: 'Programming & Development', description: 'Static typing, interfaces, generics, and modern TS features' },
  { name: 'Go (Golang)', category: 'Programming & Development', description: 'Goroutines, channels, microservices and concurrent backend systems' },
  { name: 'Rust', category: 'Programming & Development', description: 'Memory safety, ownership, concurrency, and systems programming' },

  // Web Development
  { name: 'React', category: 'Web Development', description: 'React 19, hooks, state management, component architecture and Virtual DOM' },
  { name: 'Node.js & Express', category: 'Web Development', description: 'Asynchronous event-driven backend APIs and microservices' },
  { name: 'Next.js', category: 'Web Development', description: 'Server-side rendering, App Router, full-stack React and API routes' },
  { name: 'Tailwind CSS', category: 'Web Development', description: 'Utility-first modern responsive CSS styling and design systems' },
  { name: 'HTML5 & CSS3', category: 'Web Development', description: 'Semantic markup, accessibility, modern CSS grid and flexbox' },
  { name: 'Vue.js', category: 'Web Development', description: 'Reactive components, Vuex/Pinia, and single page applications' },

  // App Development
  { name: 'Flutter & Dart', category: 'App Development', description: 'Cross-platform mobile app development for Android and iOS' },
  { name: 'React Native', category: 'App Development', description: 'Cross-platform native mobile applications with React' },
  { name: 'Android (Kotlin)', category: 'App Development', description: 'Modern native Android development with Jetpack Compose and Coroutines' },
  { name: 'iOS (Swift)', category: 'App Development', description: 'Swift, SwiftUI, and native iOS mobile application architecture' },

  // Data Science & AI
  { name: 'Data Analysis with Pandas', category: 'Data Science & AI', description: 'Data wrangling, cleaning, analysis, and exploratory statistics' },
  { name: 'Power BI & Tableau', category: 'Data Science & AI', description: 'Interactive dashboard creation, business intelligence and analytics' },
  { name: 'NumPy & SciPy', category: 'Data Science & AI', description: 'Numerical computing, matrix operations and scientific computation' },
  { name: 'Generative AI & LLMs', category: 'Data Science & AI', description: 'Large Language Models, prompt engineering, RAG, and fine-tuning' },

  // Machine Learning
  { name: 'Machine Learning Fundamentals', category: 'Machine Learning', description: 'Supervised, unsupervised learning, regression, classification and clustering' },
  { name: 'Deep Learning & Neural Networks', category: 'Machine Learning', description: 'CNNs, RNNs, Transformers, and deep neural architectures' },
  { name: 'PyTorch', category: 'Machine Learning', description: 'Tensors, autograd, model training pipelines and custom architectures' },
  { name: 'TensorFlow & Keras', category: 'Machine Learning', description: 'Production model training, evaluation and deployment' },
  { name: 'Computer Vision', category: 'Machine Learning', description: 'OpenCV, image processing, object detection, and visual recognition' },
  { name: 'Natural Language Processing (NLP)', category: 'Machine Learning', description: 'Tokenization, embeddings, text classification, and sentiment analysis' },

  // Cybersecurity
  { name: 'Ethical Hacking & Penetration Testing', category: 'Cybersecurity', description: 'Vulnerability assessment, Kali Linux tools, and security auditing' },
  { name: 'Network Security', category: 'Cybersecurity', description: 'Firewalls, IDS/IPS, VPNs, packet analysis and Wireshark' },
  { name: 'Web Application Security (OWASP)', category: 'Cybersecurity', description: 'OWASP Top 10 prevention, SQLi, XSS, CSRF, and secure coding' },
  { name: 'Cryptography', category: 'Cybersecurity', description: 'Symmetric/asymmetric encryption, hashing, digital signatures and PKI' },

  // Computer Science Fundamentals
  { name: 'Data Structures & Algorithms (DSA)', category: 'Computer Science Fundamentals', description: 'Arrays, Trees, Graphs, Dynamic Programming, and complexity analysis' },
  { name: 'Database Management Systems (DBMS)', category: 'Computer Science Fundamentals', description: 'Relational design, normalization, ACID properties, and transactions' },
  { name: 'Operating Systems', category: 'Computer Science Fundamentals', description: 'Processes, threads, CPU scheduling, synchronization, and paging' },
  { name: 'Computer Networks', category: 'Computer Science Fundamentals', description: 'OSI model, TCP/IP, routing protocols, sockets and HTTP/HTTPS' },
  { name: 'System Design', category: 'Computer Science Fundamentals', description: 'Scalability, load balancing, caching, databases and distributed systems' },

  // Mathematics
  { name: 'Engineering Mathematics', category: 'Mathematics', description: 'Calculus, differential equations, Fourier series and Laplace transforms' },
  { name: 'Linear Algebra', category: 'Mathematics', description: 'Matrices, vector spaces, eigenvalues, eigenvectors and transformations' },
  { name: 'Discrete Mathematics', category: 'Mathematics', description: 'Graph theory, combinatorics, set theory, and propositional logic' },

  // Probability & Statistics
  { name: 'Applied Statistics', category: 'Probability & Statistics', description: 'Descriptive stats, inferential statistics, hypothesis testing and ANOVA' },
  { name: 'Probability Theory', category: 'Probability & Statistics', description: 'Random variables, probability distributions, Bayes theorem, and expectations' },

  // Communication Skills
  { name: 'Technical Presentation Skills', category: 'Communication Skills', description: 'Delivering compelling tech talks, viva defense, and conference talks' },
  { name: 'Professional English & GD Prep', category: 'Communication Skills', description: 'Group discussion strategies, professional emails, and campus placement prep' },
  { name: 'Interview Preparation', category: 'Communication Skills', description: 'Mock technical and HR interview practice with constructive feedback' },

  // Design & Creativity
  { name: 'UI/UX Design with Figma', category: 'Design & Creativity', description: 'Wireframing, interactive prototyping, user research and design systems' },
  { name: 'Graphic Design', category: 'Design & Creativity', description: 'Visual hierarchy, typography, color theory, and branding' },

  // Business & Management
  { name: 'Agile & Scrum Methodologies', category: 'Business & Management', description: 'Sprint planning, user stories, Jira workflows, and team collaboration' },
  { name: 'Product Management', category: 'Business & Management', description: 'Product lifecycle, roadmaps, feature prioritization, and user metrics' },

  // Research & Academic Skills
  { name: 'Research Paper Writing & LaTeX', category: 'Research & Academic Skills', description: 'IEEE/Springer paper formatting, literature reviews, citations, and BibTeX' },
  { name: 'Patent Drafting & IP Basics', category: 'Research & Academic Skills', description: 'Understanding intellectual property, patent claims, and filing processes' },

  // Competitive Programming
  { name: 'Competitive Programming (Codeforces/LeetCode)', category: 'Competitive Programming', description: 'Advanced problem-solving speed, binary search, segment trees, and math' },

  // Other Skills
  { name: 'Git & GitHub Collaboration', category: 'Other Skills', description: 'Branching strategies, pull requests, merge conflict resolution, and CI/CD' },
  { name: 'Docker & Containerization', category: 'Other Skills', description: 'Dockerfiles, container orchestration, Docker Compose, and image optimization' },
];
