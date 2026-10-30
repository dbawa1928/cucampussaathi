import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  GraduationCap,
  Target,
  Users,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { LearnTeachNav } from '../../components/learnTeach/LearnTeachNav';
import { learnTeachApi, type SkillItem } from '../../api/learnTeachApi';
import { AddTeachingSkillModal } from '../../components/learnTeach/modals/AddTeachingSkillModal';
import { AddLearningGoalModal } from '../../components/learnTeach/modals/AddLearningGoalModal';

export const ExploreSkillsPage: React.FC = () => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddTeaching, setShowAddTeaching] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  useEffect(() => {
    loadCatalogue();
  }, []);

  const loadCatalogue = async () => {
    setLoading(true);
    try {
      const [skillsData, catsData] = await Promise.all([
        learnTeachApi.getSkills(),
        learnTeachApi.getSkillCategories(),
      ]);
      setSkills(skillsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Failed to load catalogue', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skills.filter((skill) => {
    const matchesCategory =
      selectedCategory === 'ALL' || skill.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      <LearnTeachNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center">
              <Compass className="w-6 h-6 mr-2 text-[#C62828]" />
              Explore University Skill Catalogue
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Search curated academic and industry skills across engineering, data science, and sciences at Chandigarh University.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddTeaching(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#C62828] hover:bg-[#8E1717] rounded-xl shadow-xs transition-all flex items-center cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
              + Teach a Skill
            </button>
            <button
              onClick={() => setShowAddGoal(true)}
              className="px-3.5 py-2 text-xs font-bold text-[#C62828] bg-white border border-red-200 hover:bg-red-50 rounded-xl shadow-xs transition-all flex items-center cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 mr-1.5" />
              + Add Goal
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E7DADA] shadow-xs mb-6 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by skill name, framework, subject or description (e.g. React, Python, DSA, Machine Learning)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C62828] outline-none"
            />
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-[#C62828] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories ({skills.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#C62828] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C62828] mb-3" />
            <p className="text-xs text-gray-500">Loading university skills catalogue...</p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <Compass className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No skills found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              We couldn't find any skills matching your search query or category filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => (
              <div
                key={skill._id}
                className="bg-white rounded-xl border border-[#E7DADA] hover:border-[#C62828] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-[#C62828] border border-red-200">
                      {skill.category}
                    </span>
                    {skill.popular && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center">
                        <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                        Popular
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mt-2.5">
                    {skill.name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">
                    {skill.description || `Academic and industry curriculum skill in ${skill.category}.`}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/learn-teach/discover?skillId=${skill._id}`)}
                    className="inline-flex items-center text-xs font-bold text-[#C62828] hover:text-[#8E1717] hover:underline cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 mr-1" />
                    Find Teachers & Peers
                  </button>
                  <button
                    onClick={() => setShowAddGoal(true)}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 hover:underline cursor-pointer"
                  >
                    + Add Goal
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTeachingSkillModal
        isOpen={showAddTeaching}
        onClose={() => setShowAddTeaching(false)}
        onSuccess={loadCatalogue}
      />

      <AddLearningGoalModal
        isOpen={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};
