import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  CheckCircle,
  PauseCircle,
  Loader2,
} from 'lucide-react';
import { LearnTeachNav } from '../../components/learnTeach/LearnTeachNav';
import { learnTeachApi, type TeachingListing } from '../../api/learnTeachApi';
import { AddTeachingSkillModal } from '../../components/learnTeach/modals/AddTeachingSkillModal';

export const MyTeachingSkillsPage: React.FC = () => {
  const [listings, setListings] = useState<TeachingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await learnTeachApi.getMyListings();
      setListings(data);
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleToggleStatus = async (item: TeachingListing) => {
    setActionLoadingId(item._id);
    try {
      await learnTeachApi.updateListing(item._id, {
        isActive: !item.isActive,
      });
      await loadListings();
    } catch (err) {
      console.error('Failed to toggle listing status', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this teaching skill listing?')) return;
    setActionLoadingId(id);
    try {
      await learnTeachApi.deleteListing(id);
      await loadListings();
    } catch (err) {
      console.error('Failed to delete listing', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      <LearnTeachNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center">
              <GraduationCap className="w-6 h-6 mr-2 text-[#C62828]" />
              My Teaching Skills
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Skills you have published to mentor peers or faculty across Chandigarh University.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-[#C62828] hover:bg-[#8E1717] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Add Teaching Skill
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C62828] mb-3" />
            <p className="text-xs text-gray-500">Loading your teaching portfolio...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center max-w-lg mx-auto">
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">You haven't published any skills yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Whether you are good at React, Data Structures, Calculus, or Public Speaking, publish a listing to help your university fellows.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 px-5 py-2.5 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              + Publish First Skill
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-[#E7DADA] hover:border-[#C62828] p-5 shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-[#C62828]">
                        {item.skillId?.category}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-2">
                        {item.skillId?.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center ${
                        item.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.isActive ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                          Active
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3 h-3 mr-1 text-gray-500" />
                          Paused
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Level:</span>
                      <span className="font-semibold text-gray-800">{item.skillLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Exchange:</span>
                      <span className="font-semibold text-gray-800">
                        {item.exchangeType === 'FREE' ? 'Free Mentorship' : 'Skill Swap'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mode:</span>
                      <span className="font-semibold text-gray-800">{item.preferredMode}</span>
                    </div>
                  </div>

                  {item.description && (
                    <p className="mt-3 text-xs text-gray-600 italic line-clamp-2">
                      "{item.description}"
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    disabled={actionLoadingId === item._id}
                    className="text-xs font-semibold text-gray-600 hover:text-[#C62828] cursor-pointer"
                  >
                    {item.isActive ? 'Pause Listing' : 'Activate Listing'}
                  </button>

                  <button
                    onClick={() => handleDelete(item._id)}
                    disabled={actionLoadingId === item._id}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTeachingSkillModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadListings}
      />
    </div>
  );
};
