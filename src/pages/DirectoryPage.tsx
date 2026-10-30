import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  GraduationCap,
  Briefcase,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Globe,
  Lock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { apiClient, type ApiResponse } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface DirectoryMember {
  id: string;
  profileId: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER';
  department: string;
  // Student fields
  course?: string;
  semester?: number;
  bio?: string;
  skills?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  privacyLevel?: 'PUBLIC' | 'CAMPUS_ONLY' | 'PRIVATE';
  // Teacher fields
  designation?: string;
  researchDomains?: string[];
  officeLocation?: string;
  bookingPreference?: string;
  maxDailySlots?: number;
  isAcceptingBookings?: boolean;
}

interface DirectoryResponseData {
  items: DirectoryMember[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  viewer: {
    isCampusUser: boolean;
  };
}

const DEPARTMENTS = [
  'All Departments',
  'Computer Science & Engineering',
  'Artificial Intelligence & ML',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'University Administration',
];

export const DirectoryPage: React.FC = () => {
  const { user } = useAuth();

  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All Departments');
  const [skillsQuery, setSkillsQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchDirectory = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params: Record<string, string> = {
        type: roleFilter,
        page: page.toString(),
        limit: '12',
      };

      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }

      if (departmentFilter !== 'All Departments') {
        params.department = departmentFilter;
      }

      if (skillsQuery.trim()) {
        params.skills = skillsQuery.trim();
      }

      const queryString = new URLSearchParams(params).toString();
      const res = await apiClient.get<ApiResponse<DirectoryResponseData>>(`/directory?${queryString}`);

      if (res.data) {
        setMembers(res.data.items || []);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load campus directory. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, departmentFilter, searchQuery, skillsQuery, page]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDirectory();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setDepartmentFilter('All Departments');
    setSkillsQuery('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center max-w-3xl mx-auto">
          <div className="mb-3 flex justify-center">
            <Badge variant="primary" size="sm" dot>
              Privacy-Aware Campus Network
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17233B] tracking-tight">
            CU Campus Directory & Peer Mentors
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#64748B] leading-relaxed">
            Discover student mentors, project collaborators, and distinguished faculty across
            Chandigarh University departments.
          </p>

          {/* Privacy status banner */}
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#E2E8F0] shadow-xs text-[#64748B]">
            {user ? (
              <>
                <ShieldCheck className="w-4 h-4 text-[#16845B]" />
                <span className="text-[#17233B]">
                  Authenticated as <strong>{user.fullName}</strong>
                </span>
                <span className="text-[#16845B] bg-[#E6F5EF] px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Full Campus Access
                </span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 text-[#3157D5]" />
                <span>Viewing Public Profiles Only.</span>
                <Link
                  to="/login"
                  className="text-[#3157D5] hover:underline font-bold ml-1 inline-flex items-center gap-1"
                >
                  Sign In for Campus Network &rarr;
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs mb-8">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Keyword Search */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, skill, course, or topic..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E2E8F0] bg-[#F6F8FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3157D5] focus:border-transparent transition-all"
                />
              </div>

              {/* Department Dropdown */}
              <div className="md:col-span-4">
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2E8F0] bg-[#F6F8FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3157D5] focus:border-transparent transition-all text-[#17233B]"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <div className="md:col-span-3 flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full flex-1"
                  icon={<Search className="w-4 h-4" />}
                >
                  Search
                </Button>
                {(searchQuery || departmentFilter !== 'All Departments' || skillsQuery || roleFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F6F8FC] text-[#64748B] hover:text-[#17233B] transition-colors"
                    title="Clear filters"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9] text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[#64748B] font-semibold flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filter Role:
                </span>
                {(['all', 'student', 'teacher'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRoleFilter(r);
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer capitalize ${
                      roleFilter === r
                        ? 'bg-[#3157D5] text-white shadow-xs'
                        : 'bg-[#F6F8FC] text-[#64748B] hover:text-[#17233B] hover:bg-[#EAF1FF]'
                    }`}
                  >
                    {r === 'all' ? 'All Roles' : r === 'student' ? 'Students' : 'Faculty'}
                  </button>
                ))}
              </div>

              <div className="text-[#64748B]">
                Found <strong className="text-[#17233B]">{totalCount}</strong> verified members
              </div>
            </div>
          </form>
        </div>

        {/* Directory Content States */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#3157D5] animate-spin mb-3" />
            <p className="text-sm font-semibold text-[#17233B]">Loading campus directory...</p>
            <p className="text-xs text-[#64748B] mt-1">Applying privacy filters and query parameters</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-white border border-[#FCA5A5] shadow-xs text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
            <h3 className="text-base font-bold text-[#17233B] mb-1">Failed to Load Directory</h3>
            <p className="text-xs text-[#64748B] mb-4">{error}</p>
            <Button onClick={() => fetchDirectory()} variant="outline" size="sm">
              Retry Connection
            </Button>
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 px-6 bg-white rounded-3xl border border-[#E2E8F0] text-center max-w-xl mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF1FF] text-[#3157D5] flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#17233B] mb-1">No Campus Members Found</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto mb-6 leading-relaxed">
              We couldn't find any profiles matching your search criteria. Try modifying your search
              keywords or clearing the applied filters.
            </p>
            <Button onClick={handleResetFilters} variant="primary" size="sm">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {members.map((member) => (
                <div
                  key={member.profileId || member.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs hover:shadow-md hover:border-[#3157D5]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Header Card */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-extrabold ${
                            member.role === 'TEACHER'
                              ? 'bg-[#E6F5EF] text-[#16845B] border border-[#16845B]/20'
                              : 'bg-[#EAF1FF] text-[#3157D5] border border-[#3157D5]/20'
                          }`}
                        >
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[#17233B] leading-tight">
                            {member.fullName}
                          </h3>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            {member.role === 'TEACHER'
                              ? member.designation || 'Faculty Member'
                              : member.course
                              ? `${member.course} • Sem ${member.semester}`
                              : 'Student'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          member.role === 'TEACHER'
                            ? 'bg-[#E6F5EF] text-[#16845B]'
                            : 'bg-[#EAF1FF] text-[#3157D5]'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>

                    {/* Department Tag */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#475569] bg-[#F1F5F9] px-2.5 py-0.5 rounded-md">
                        {member.role === 'TEACHER' ? (
                          <Briefcase className="w-3 h-3 text-[#64748B]" />
                        ) : (
                          <GraduationCap className="w-3 h-3 text-[#64748B]" />
                        )}
                        {member.department}
                      </span>
                    </div>

                    {/* Bio or Office Location */}
                    {member.role === 'TEACHER' && member.officeLocation && (
                      <p className="text-xs text-[#64748B] flex items-center gap-1.5 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-[#3157D5] shrink-0" />
                        <span>{member.officeLocation}</span>
                      </p>
                    )}

                    {member.role === 'STUDENT' && member.bio && (
                      <p className="text-xs text-[#475569] mb-4 line-clamp-2 leading-relaxed">
                        {member.bio}
                      </p>
                    )}

                    {/* Skills or Research Domains */}
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                        {member.role === 'TEACHER' ? 'Research Domains' : 'Skills & Technologies'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {member.role === 'TEACHER' && member.researchDomains?.length
                          ? member.researchDomains.slice(0, 4).map((d) => (
                              <span
                                key={d}
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#E6F5EF] text-[#16845B]"
                              >
                                {d}
                              </span>
                            ))
                          : null}

                        {member.role === 'STUDENT' && member.skills?.length
                          ? member.skills.slice(0, 5).map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F1F5F9] text-[#17233B] border border-[#E2E8F0]"
                              >
                                {s}
                              </span>
                            ))
                          : null}

                        {(!member.skills?.length && !member.researchDomains?.length) && (
                          <span className="text-[11px] text-[#94A3B8] italic">No skills listed yet</span>
                        )}
                      </div>
                    </div>

                    {/* Book Consultation CTA for Teachers */}
                    {member.role === 'TEACHER' && (
                      <div className="mb-3">
                        <Link
                          to={`/appointments?teacherId=${member.profileId}&teacherName=${encodeURIComponent(member.fullName)}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#EAF1FF] text-[#3157D5] hover:bg-[#3157D5] hover:text-white transition-all border border-[#3157D5]/20 shadow-2xs"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Book Consultation</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom / Social Links */}
                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
                    {/* Privacy indicator */}
                    <div className="flex items-center gap-1 text-[11px]">
                      {member.privacyLevel === 'PUBLIC' ? (
                        <>
                          <Globe className="w-3 h-3 text-[#16845B]" />
                          <span>Public</span>
                        </>
                      ) : member.privacyLevel === 'CAMPUS_ONLY' ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-[#3157D5]" />
                          <span>Campus Only</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-[#64748B]" />
                          <span>Confidential</span>
                        </>
                      )}
                    </div>

                    {/* Social links */}
                    {member.socialLinks && (
                      <div className="flex items-center gap-2">
                        {member.socialLinks.github && (
                          <a
                            href={member.socialLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#64748B] hover:text-[#17233B] transition-colors"
                            title="GitHub Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {member.socialLinks.linkedin && (
                          <a
                            href={member.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#64748B] hover:text-[#3157D5] transition-colors"
                            title="LinkedIn Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {member.socialLinks.portfolio && (
                          <a
                            href={member.socialLinks.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#64748B] hover:text-[#16845B] transition-colors"
                            title="Portfolio Link"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  variant="outline"
                  size="sm"
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <span className="text-xs text-[#64748B] px-3 font-semibold">
                  Page <strong className="text-[#17233B]">{page}</strong> of{' '}
                  <strong className="text-[#17233B]">{totalPages}</strong>
                </span>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  variant="outline"
                  size="sm"
                  icon={<ChevronRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
