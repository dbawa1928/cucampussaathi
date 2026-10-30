import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Globe,
  RotateCcw,
  Target,
} from 'lucide-react';
import { LearnTeachNav } from '../../components/learnTeach/LearnTeachNav';
import {
  learnTeachApi,
  type RecommendationMatch,
  type TeachingListing,
} from '../../api/learnTeachApi';
import { ConnectRequestModal } from '../../components/learnTeach/modals/ConnectRequestModal';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationMatch[]>([]);
  const [myTeachingListings, setMyTeachingListings] = useState<TeachingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectModalData, setConnectModalData] = useState<RecommendationMatch | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const [recs, myListings] = await Promise.all([
        learnTeachApi.getRecommendations(),
        learnTeachApi.getMyListings(),
      ]);
      setRecommendations(recs);
      setMyTeachingListings(myListings);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      <LearnTeachNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-amber-500" />
              Smart Recommendations & Skill Swaps
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              AI-matched mentors and peer exchange opportunities tailored to your active learning goals and teaching skills.
            </p>
          </div>

          <button
            onClick={loadRecommendations}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Refresh Matches
          </button>
        </div>

        {successToast && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-700 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C62828] mb-3" />
            <p className="text-xs text-gray-500">Calculating weighted compatibility scores...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center max-w-lg mx-auto">
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No recommendations found yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              The recommendation engine pairs people based on your active learning goals. Add a goal to discover compatible mentors.
            </p>
            <Link
              to="/learn-teach/my-goals"
              className="inline-flex items-center mt-5 px-5 py-2.5 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Target className="w-4 h-4 mr-1.5" />
              Set a Learning Goal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.map((rec) => {
              const { listing, matchScore, reasons, isMutualExchange, mutualSkillNames } = rec;
              const dept =
                listing.userId?.studentProfile?.department ||
                listing.userId?.teacherProfile?.department;

              return (
                <div
                  key={listing._id}
                  className="bg-white rounded-2xl border border-[#E7DADA] hover:border-[#C62828] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  {isMutualExchange && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold uppercase tracking-wider py-1 px-3 -mx-5 -mt-5 mb-4 flex items-center justify-between">
                      <span className="flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Mutual Skill Exchange Opportunity
                      </span>
                      <span>1:1 Barter</span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#8E1717] to-[#C62828] text-white flex items-center justify-center font-bold text-base shrink-0">
                          {listing.userId.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 leading-tight">
                            {listing.userId.fullName}
                          </h3>
                          <span className="text-[11px] font-semibold text-gray-500">
                            {listing.userId.role === 'TEACHER' ? 'Faculty Mentor' : 'Student Peer'}
                          </span>
                          {dept && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[140px]">
                              {dept}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Score pill */}
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-full ${
                            matchScore >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : matchScore >= 60
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {matchScore}% Match
                        </span>
                      </div>
                    </div>

                    {/* Skill Info */}
                    <div className="mt-4 p-3 bg-red-50/50 rounded-xl border border-red-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#C62828]">
                          Teaches: {listing.skillId.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-gray-700">
                          {listing.skillLevel}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-600">
                        <span className="inline-flex items-center">
                          <Globe className="w-3 h-3 mr-1 text-gray-400" />
                          {listing.preferredMode}
                        </span>
                        <span>•</span>
                        <span>{listing.exchangeType === 'FREE' ? 'Free Mentorship' : 'Skill Swap'}</span>
                      </div>
                    </div>

                    {/* Mutual exchange details */}
                    {isMutualExchange && mutualSkillNames.length > 0 && (
                      <div className="mt-2.5 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                        <span className="font-bold">They want to learn: </span>
                        <span>{mutualSkillNames.join(', ')}</span>
                      </div>
                    )}

                    {/* Explainable reasons */}
                    <div className="mt-3 space-y-1">
                      {reasons.map((r, i) => (
                        <div key={i} className="flex items-center text-[11px] text-gray-600">
                          <CheckCircle2 className="w-3 h-3 mr-1.5 text-emerald-600 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connect Button */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => setConnectModalData(rec)}
                      className="w-full py-2 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                    >
                      Connect & Request Mentorship
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </button>
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
          recipientUser={connectModalData.listing.userId}
          skillDesired={connectModalData.listing.skillId}
          myTeachingListings={myTeachingListings}
          onSuccess={() => {
            setSuccessToast('Connection request sent! You can follow up in Connections.');
            loadRecommendations();
          }}
        />
      )}
    </div>
  );
};
