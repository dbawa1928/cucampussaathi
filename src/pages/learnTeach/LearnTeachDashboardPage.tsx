import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Target,
  Users,
  CalendarCheck,
  Sparkles,
  ArrowRight,
  Plus,
  Compass,
  Clock,
  Video,
  MapPin,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LearnTeachNav } from '../../components/learnTeach/LearnTeachNav';
import { learnTeachApi, type DashboardStats } from '../../api/learnTeachApi';
import { AddTeachingSkillModal } from '../../components/learnTeach/modals/AddTeachingSkillModal';
import { AddLearningGoalModal } from '../../components/learnTeach/modals/AddLearningGoalModal';

export const LearnTeachDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTeaching, setShowAddTeaching] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await learnTeachApi.getDashboardStats();
      setStats(data || null);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      <LearnTeachNav
        pendingConnectionsCount={stats?.pendingRequestsCount}
        upcomingSessionsCount={stats?.upcomingSessionsCount}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-[#8E1717] via-[#C62828] to-[#EF5350] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden mb-8">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
              University Peer Knowledge Exchange
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.fullName || 'Scholar'}!
            </h1>
            <p className="mt-2 text-white/90 text-sm sm:text-base leading-relaxed">
              Share what you know. Discover what you can learn. Grow together in Chandigarh University's collaborative learning ecosystem.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddTeaching(true)}
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white text-[#C62828] font-bold text-xs sm:text-sm shadow-md hover:bg-gray-50 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                Add Teaching Skill
              </button>
              <button
                onClick={() => setShowAddGoal(true)}
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#8E1717] hover:bg-[#721212] border border-white/20 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Target className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                Add Learning Goal
              </button>
              <Link
                to="/learn-teach/explore"
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-all"
              >
                <Compass className="w-4 h-4 mr-1.5" />
                Explore Catalogue
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#C62828] mb-3" />
            <p className="text-xs text-gray-500 font-medium">Loading your learning workspace...</p>
          </div>
        ) : (
          <>
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link
                to="/learn-teach/my-skills"
                className="bg-white p-5 rounded-xl border border-[#E7DADA] shadow-xs hover:border-[#C62828] hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Skills I Teach
                  </span>
                  <div className="p-2 bg-red-50 text-[#C62828] rounded-lg group-hover:bg-[#C62828] group-hover:text-white transition-colors">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-gray-900">
                    {stats?.skillsICanTeachCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-[#C62828] flex items-center">
                    Manage <ArrowRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </Link>

              <Link
                to="/learn-teach/my-goals"
                className="bg-white p-5 rounded-xl border border-[#E7DADA] shadow-xs hover:border-[#C62828] hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Learning Goals
                  </span>
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Target className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-gray-900">
                    {stats?.skillsIWantToLearnCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-amber-700 flex items-center">
                    Track <ArrowRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </Link>

              <Link
                to="/learn-teach/connections"
                className="bg-white p-5 rounded-xl border border-[#E7DADA] shadow-xs hover:border-[#C62828] hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Connections
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-gray-900">
                      {stats?.activeConnectionsCount ?? 0}
                    </span>
                    {stats && stats.pendingRequestsCount > 0 && (
                      <span className="ml-2 text-xs font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                        {stats.pendingRequestsCount} pending
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-blue-600 flex items-center">
                    Chat <ArrowRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </Link>

              <Link
                to="/learn-teach/sessions"
                className="bg-white p-5 rounded-xl border border-[#E7DADA] shadow-xs hover:border-[#C62828] hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Upcoming Sessions
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-gray-900">
                    {stats?.upcomingSessionsCount ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center">
                    Schedule <ArrowRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </Link>
            </div>

            {/* Split Section: Upcoming Sessions & Smart Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Upcoming Sessions & Recent Connections */}
              <div className="lg:col-span-2 space-y-6">
                {/* Upcoming Learning Sessions */}
                <div className="bg-white rounded-xl border border-[#E7DADA] p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CalendarCheck className="w-5 h-5 text-[#C62828]" />
                      <h2 className="text-base font-bold text-gray-900">Upcoming Sessions</h2>
                    </div>
                    <Link
                      to="/learn-teach/sessions"
                      className="text-xs font-semibold text-[#C62828] hover:underline flex items-center"
                    >
                      View all sessions <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>

                  {!stats?.upcomingSessions || stats.upcomingSessions.length === 0 ? (
                    <div className="py-8 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-500">No upcoming sessions scheduled.</p>
                      <Link
                        to="/learn-teach/discover"
                        className="inline-flex items-center mt-2 text-xs font-bold text-[#C62828] hover:underline"
                      >
                        Find someone to learn with →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.upcomingSessions.slice(0, 3).map((session) => (
                        <div
                          key={session._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50/70 hover:bg-[#FFF7F7]/60 rounded-xl border border-gray-200 transition-colors"
                        >
                          <div className="mb-2 sm:mb-0">
                            <h4 className="text-sm font-bold text-gray-900">{session.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-600">
                              <span className="font-medium text-[#C62828]">
                                {session.skillId?.name}
                              </span>
                              <span>•</span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-gray-400" />
                                {session.sessionDate} at {session.startTime} ({session.durationMinutes}m)
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {session.meetingMode === 'ONLINE' ? (
                              session.meetingLink ? (
                                <a
                                  href={session.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                                >
                                  <Video className="w-3.5 h-3.5 mr-1" />
                                  Join Meet
                                </a>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded">
                                  Online
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                                <MapPin className="w-3 h-3 mr-1" />
                                {session.offlineLocation || 'On Campus'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Connections */}
                <div className="bg-white rounded-xl border border-[#E7DADA] p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-[#C62828]" />
                      <h2 className="text-base font-bold text-gray-900">Recent Connections</h2>
                    </div>
                    <Link
                      to="/learn-teach/connections"
                      className="text-xs font-semibold text-[#C62828] hover:underline flex items-center"
                    >
                      Manage connections <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>

                  {!stats?.recentConnections || stats.recentConnections.length === 0 ? (
                    <div className="py-8 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-500">No active connections yet.</p>
                      <Link
                        to="/learn-teach/discover"
                        className="inline-flex items-center mt-2 text-xs font-bold text-[#C62828] hover:underline"
                      >
                        Discover people to connect →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stats.recentConnections.slice(0, 4).map((conn) => {
                        const otherUser =
                          conn.requesterId._id === user?._id
                            ? conn.recipientId
                            : conn.requesterId;
                        return (
                          <div
                            key={conn._id}
                            className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3 truncate">
                              <div className="w-9 h-9 rounded-full bg-[#C62828] text-white flex items-center justify-center font-bold text-sm shrink-0">
                                {otherUser.fullName.charAt(0)}
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {otherUser.fullName}
                                </p>
                                <span className="text-[11px] text-gray-500">
                                  {otherUser.role === 'TEACHER' ? 'Faculty Member' : 'Student Peer'}
                                </span>
                              </div>
                            </div>
                            <Link
                              to={`/learn-teach/connections?chat=${conn._id}`}
                              className="px-2.5 py-1 text-xs font-semibold text-[#C62828] bg-red-50 hover:bg-red-100 rounded-lg shrink-0 ml-2"
                            >
                              Chat
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Recommended Mentors & Exchanges */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-[#E7DADA] p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h2 className="text-base font-bold text-gray-900">Recommended For You</h2>
                    </div>
                    <Link
                      to="/learn-teach/recommendations"
                      className="text-xs font-semibold text-[#C62828] hover:underline"
                    >
                      See All
                    </Link>
                  </div>

                  {!stats?.topRecommendations || stats.topRecommendations.length === 0 ? (
                    <div className="py-8 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-500">
                        Add learning goals to activate AI recommendations.
                      </p>
                      <button
                        onClick={() => setShowAddGoal(true)}
                        className="mt-2 text-xs font-bold text-[#C62828] hover:underline cursor-pointer"
                      >
                        + Add Learning Goal
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.topRecommendations.slice(0, 3).map((rec) => (
                        <div
                          key={rec.listing._id}
                          className="p-3.5 rounded-xl border border-gray-200 hover:border-[#C62828] bg-gray-50/30 hover:bg-[#FFF7F7]/40 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">
                              {rec.listing.userId.fullName}
                            </span>
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {rec.matchScore}% Match
                            </span>
                          </div>

                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-semibold text-[#C62828]">
                              Teaches: {rec.listing.skillId.name}
                            </span>
                            <span className="text-gray-400 mx-1">•</span>
                            <span>{rec.listing.skillLevel}</span>
                          </div>

                          {rec.isMutualExchange && (
                            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                              <Sparkles className="w-3 h-3 mr-1 text-amber-600" />
                              Mutual Skill Exchange Possible
                            </div>
                          )}

                          <div className="mt-3 flex justify-end">
                            <Link
                              to="/learn-teach/discover"
                              className="text-xs font-bold text-[#C62828] hover:underline flex items-center"
                            >
                              Connect <ArrowRight className="w-3 h-3 ml-0.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Helpful Tip Box */}
                <div className="bg-[#FFF7F7] border border-red-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-[#8E1717] flex items-center uppercase tracking-wide">
                    <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                    University Tip
                  </h4>
                  <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                    Mentorship on CUCampusSaathi is symmetric: faculty can learn from students on emerging web frameworks, and students can seek guidance from faculty or seniors.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AddTeachingSkillModal
        isOpen={showAddTeaching}
        onClose={() => setShowAddTeaching(false)}
        onSuccess={loadData}
      />

      <AddLearningGoalModal
        isOpen={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
