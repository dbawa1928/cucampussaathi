import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { RouteMetaUpdater } from './components/common/RouteMetaUpdater';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Page Imports
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ContactPage } from './pages/ContactPage';
import { HelpPage } from './pages/HelpPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DirectoryPage } from './pages/DirectoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AiTutorPage } from './pages/AiTutorPage';
import { StudentOnboardingPage } from './pages/StudentOnboardingPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Learn & Teach Network
import { LearnTeachDashboardPage } from './pages/learnTeach/LearnTeachDashboardPage';
import { ExploreSkillsPage } from './pages/learnTeach/ExploreSkillsPage';
import { DiscoverPeoplePage } from './pages/learnTeach/DiscoverPeoplePage';
import { MyTeachingSkillsPage } from './pages/learnTeach/MyTeachingSkillsPage';
import { MyLearningGoalsPage } from './pages/learnTeach/MyLearningGoalsPage';
import { RecommendationsPage } from './pages/learnTeach/RecommendationsPage';
import { ConnectionsPage } from './pages/learnTeach/ConnectionsPage';
import { LearningSessionsPage } from './pages/learnTeach/LearningSessionsPage';
import { LearningGroupsPage } from './pages/learnTeach/LearningGroupsPage';
import { LearningProgressPage } from './pages/learnTeach/LearningProgressPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <RouteMetaUpdater />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/student/onboarding" element={<StudentOnboardingPage />} />
              <Route path="/ai-tutor" element={<AiTutorPage />} />

              {/* Learn & Teach Network Routes */}
              <Route path="/learn-teach" element={<LearnTeachDashboardPage />} />
              <Route path="/learn-teach/explore" element={<ExploreSkillsPage />} />
              <Route path="/learn-teach/discover" element={<DiscoverPeoplePage />} />
              <Route path="/learn-teach/my-skills" element={<MyTeachingSkillsPage />} />
              <Route path="/learn-teach/my-goals" element={<MyLearningGoalsPage />} />
              <Route path="/learn-teach/recommendations" element={<RecommendationsPage />} />
              <Route path="/learn-teach/connections" element={<ConnectionsPage />} />
              <Route path="/learn-teach/sessions" element={<LearningSessionsPage />} />
              <Route path="/learn-teach/groups" element={<LearningGroupsPage />} />
              <Route path="/learn-teach/progress" element={<LearningProgressPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
