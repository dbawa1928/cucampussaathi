import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Globe,
  Flag,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { LearnTeachNav } from '../../components/learnTeach/LearnTeachNav';
import {
  learnTeachApi,
  type TeachingListing,
  type SkillItem,
} from '../../api/learnTeachApi';
import { useAuth } from '../../context/AuthContext';
import { ConnectRequestModal } from '../../components/learnTeach/modals/ConnectRequestModal';
import { ReportModal } from '../../components/learnTeach/modals/ReportModal';

export const DiscoverPeoplePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSkillId = searchParams.get('skillId') || '';

  const [listings, setListings] = useState<TeachingListing[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [myTeachingListings, setMyTeachingListings] = useState<TeachingListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSkillId, setSelectedSkillId] = useState(initialSkillId);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [connectModalData, setConnectModalData] = useState<{
    recipient: any;
    skill: SkillItem;
  } | null>(null);
  const [reportModalData, setReportModalData] = useState<{
    targetId: string;
    reportedUserId: string;
    title: string;
  } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    // Load skills & user's own teaching listings for skill swap options
    Promise.all([
      learnTeachApi.getSkills(),
      learnTeachApi.getMyListings(),
    ]).then(([sData, myListings]) => {
      setSkills(sData);
      setMyTeachingListings(myListings);
    });
  }, []);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const data = await learnTeachApi.discoverPeople({
        skillId: selectedSkillId || undefined,
        role: selectedRole || undefined,
        mode: selectedMode || undefined,
        language: selectedLanguage || undefined,
        search: searchQuery || undefined,
      });
      setListings(data.listings);
    } catch (err) {
      console.error('Failed to discover teachers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [selectedSkillId, selectedRole, selectedMode, selectedLanguage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPeople();
  };

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      <LearnTeachNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-[#C62828]" />
            Discover People & Mentors
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Connect with verified students and faculty willing to mentor, teach, or swap skills across Chandigarh University.
          </p>
        </div>

        {successToast && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E7DADA] shadow-xs mb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by mentor name, department, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C62828] outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-semibold rounded-lg"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Filter Skill
              </label>
              <select
                value={selectedSkillId}
                onChange={(e) => {
                  setSelectedSkillId(e.target.value);
                  setSearchParams(e.target.value ? { skillId: e.target.value } : {});
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#C62828]"
              >
                <option value="">All Skills</option>
                {skills.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#C62828]"
              >
                <option value="">All Roles (Students & Faculty)</option>
                <option value="STUDENT">Students Only</option>
                <option value="TEACHER">Faculty Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Mode
              </label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#C62828]"
              >
                <option value="">Any Mode</option>
                <option value="ONLINE">Online Only</option>
                <option value="OFFLINE">Offline (Campus)</option>
                <option value="BOTH">Hybrid / Both</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#C62828]"
              >
                <option value="">Any Language</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Punjabi">Punjabi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Result */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C62828] mb-3" />
            <p className="text-xs text-gray-500">Searching peer mentors & faculty...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No teachers found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No published listings currently match your filter criteria. Be the first to publish this skill!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((item) => {
              const isCurrentUser = item.userId?._id === user?._id;
              const dept =
                item.userId?.studentProfile?.department ||
                item.userId?.teacherProfile?.department;
              const title =
                item.userId?.role === 'TEACHER'
                  ? item.userId?.teacherProfile?.designation || 'Faculty Member'
                  : `Student${
                      item.userId?.studentProfile?.currentSemester
                        ? ` (Sem ${item.userId?.studentProfile?.currentSemester})`
                        : ''
                    }`;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-[#E7DADA] hover:border-[#C62828] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: User avatar & details */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#8E1717] to-[#C62828] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                          {item.userId?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 leading-tight">
                            {item.userId?.fullName}
                          </h3>
                          <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
                            {title}
                          </p>
                          {dept && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[150px]">
                              {dept}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.userId?.role === 'TEACHER'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.userId?.role === 'TEACHER' ? 'Faculty' : 'Peer'}
                      </span>
                    </div>

                    {/* Skill Info */}
                    <div className="mt-4 p-3 bg-red-50/40 rounded-xl border border-red-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#C62828]">
                          {item.skillId?.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-gray-700 border border-red-200">
                          {item.skillLevel}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-600">
                        <span className="inline-flex items-center">
                          <Globe className="w-3 h-3 mr-1 text-gray-400" />
                          {item.preferredMode}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-gray-800">
                          {item.exchangeType === 'FREE' ? 'Free Mentorship' : 'Skill Swap'}
                        </span>
                      </div>
                    </div>

                    {/* Bio / Description */}
                    {item.description && (
                      <p className="mt-3 text-xs text-gray-600 italic line-clamp-2">
                        "{item.description}"
                      </p>
                    )}

                    {/* Languages */}
                    {item.preferredLanguages && item.preferredLanguages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.preferredLanguages.map((lang) => (
                          <span
                            key={lang}
                            className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() =>
                        setReportModalData({
                          targetId: item._id,
                          reportedUserId: item.userId._id,
                          title: `${item.userId.fullName} - ${item.skillId.name}`,
                        })
                      }
                      title="Report inappropriate listing"
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>

                    {isCurrentUser ? (
                      <span className="text-xs text-gray-400 font-medium italic">
                        Your Listing
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          setConnectModalData({
                            recipient: item.userId,
                            skill: item.skillId,
                          })
                        }
                        className="px-4 py-2 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        Connect Request
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {connectModalData && (
        <ConnectRequestModal
          isOpen={true}
          onClose={() => setConnectModalData(null)}
          recipientUser={connectModalData.recipient}
          skillDesired={connectModalData.skill}
          myTeachingListings={myTeachingListings}
          onSuccess={() => {
            setSuccessToast('Connection request sent successfully! You can track it under Connections.');
            fetchPeople();
          }}
        />
      )}

      {reportModalData && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportModalData(null)}
          targetType="TEACHING_LISTING"
          targetId={reportModalData.targetId}
          reportedUserId={reportModalData.reportedUserId}
          targetTitle={reportModalData.title}
        />
      )}
    </div>
  );
};
