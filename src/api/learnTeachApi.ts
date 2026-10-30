import { apiClient, type ApiResponse } from './client';

export interface SkillItem {
  _id: string;
  name: string;
  category: string;
  description?: string;
  popular?: boolean;
}

export interface TeachingListing {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    avatarUrl?: string;
    studentProfile?: {
      department?: string;
      currentSemester?: number;
    };
    teacherProfile?: {
      department?: string;
      designation?: string;
    };
  };
  skillId: SkillItem;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  exchangeType: 'FREE' | 'SKILL_SWAP';
  preferredMode: 'ONLINE' | 'OFFLINE' | 'BOTH';
  preferredLanguages: string[];
  availabilitySlots?: {
    dayOfWeek: string;
    timeRanges: string[];
  }[];
  description?: string;
  isActive: boolean;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
}

export interface LearningGoal {
  _id: string;
  userId: string;
  skillId: SkillItem;
  currentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  targetLevel: 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  preferredMode: 'ONLINE' | 'OFFLINE' | 'BOTH';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  targetDurationWeeks: number;
  notes?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ACHIEVED';
  createdAt: string;
}

export interface RecommendationMatch {
  listing: TeachingListing;
  matchScore: number;
  reasons: string[];
  isMutualExchange: boolean;
  mutualSkillNames: string[];
}

export interface SkillConnection {
  _id: string;
  requesterId: {
    _id: string;
    fullName: string;
    email: string;
    role: 'STUDENT' | 'TEACHER';
    avatarUrl?: string;
  };
  recipientId: {
    _id: string;
    fullName: string;
    email: string;
    role: 'STUDENT' | 'TEACHER';
    avatarUrl?: string;
  };
  skillOffered?: SkillItem;
  skillDesired?: SkillItem;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'COMPLETED' | 'CANCELLED';
  introMessage?: string;
  preferredMode?: 'ONLINE' | 'OFFLINE' | 'BOTH';
  createdAt: string;
  updatedAt: string;
}

export interface LearningSession {
  _id: string;
  connectionId?: string;
  teacherId: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  learnerId: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  skillId: SkillItem;
  title: string;
  description?: string;
  sessionDate: string;
  startTime: string;
  durationMinutes: number;
  meetingMode: 'ONLINE' | 'OFFLINE';
  meetingLink?: string;
  offlineLocation?: string;
  status: 'PROPOSED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  completedNotes?: string;
  createdAt: string;
}

export interface LearningGroup {
  _id: string;
  title: string;
  description: string;
  skillId: SkillItem;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  maxMembers: number;
  memberCount: number;
  preferredMode: 'ONLINE' | 'OFFLINE' | 'BOTH';
  meetingSchedule?: string;
  status: 'OPEN' | 'FULL' | 'ARCHIVED';
  isMember?: boolean;
  membershipStatus?: 'PENDING' | 'ACCEPTED';
  createdAt: string;
}

export interface LearningMessage {
  _id: string;
  connectionId?: string;
  groupId?: string;
  senderId: {
    _id: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
  };
  message: string;
  createdAt: string;
}

export interface SkillProgress {
  _id: string;
  userId: string;
  skillId: SkillItem;
  completedSessionsCount: number;
  notes?: string;
  milestones: {
    title: string;
    completed: boolean;
    completedAt?: string;
  }[];
  overallProficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  updatedAt: string;
}

export interface LearningReview {
  _id: string;
  sessionId: string;
  reviewerId: {
    _id: string;
    fullName: string;
    role: string;
  };
  targetUserId: string;
  rating: number;
  feedback?: string;
  skillsDemonstrated: string[];
  createdAt: string;
}

export interface DashboardStats {
  skillsICanTeachCount: number;
  skillsIWantToLearnCount: number;
  pendingRequestsCount: number;
  activeConnectionsCount: number;
  upcomingSessionsCount: number;
  completedSessionsCount: number;
  activeGroupsCount: number;
  upcomingSessions: LearningSession[];
  recentConnections: SkillConnection[];
  topRecommendations: RecommendationMatch[];
}

export const learnTeachApi = {
  // Skills
  getSkills: async (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.search) q.append('search', params.search);
    const res = await apiClient.get<ApiResponse<SkillItem[]>>(`/learn-teach/skills?${q.toString()}`);
    return res.data || [];
  },

  getSkillCategories: async () => {
    const res = await apiClient.get<ApiResponse<string[]>>('/learn-teach/skills/categories');
    return res.data || [];
  },

  // Teaching Listings
  getMyListings: async () => {
    const res = await apiClient.get<ApiResponse<TeachingListing[]>>('/learn-teach/teaching-listings/my');
    return res.data || [];
  },

  createListing: async (data: any) => {
    const res = await apiClient.post<ApiResponse<TeachingListing>>('/learn-teach/teaching-listings', data);
    return res.data;
  },

  updateListing: async (id: string, data: any) => {
    const res = await apiClient.put<ApiResponse<TeachingListing>>(`/learn-teach/teaching-listings/${id}`, data);
    return res.data;
  },

  deleteListing: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<any>>(`/learn-teach/teaching-listings/${id}`);
    return res;
  },

  // Learning Goals
  getMyGoals: async () => {
    const res = await apiClient.get<ApiResponse<LearningGoal[]>>('/learn-teach/learning-goals/my');
    return res.data || [];
  },

  createGoal: async (data: any) => {
    const res = await apiClient.post<ApiResponse<LearningGoal>>('/learn-teach/learning-goals', data);
    return res.data;
  },

  updateGoal: async (id: string, data: any) => {
    const res = await apiClient.put<ApiResponse<LearningGoal>>(`/learn-teach/learning-goals/${id}`, data);
    return res.data;
  },

  deleteGoal: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<any>>(`/learn-teach/learning-goals/${id}`);
    return res;
  },

  // Discover & Recommendations
  discoverPeople: async (filters?: {
    skillId?: string;
    role?: string;
    mode?: string;
    language?: string;
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
      });
    }
    const res = await apiClient.get<ApiResponse<{ listings: TeachingListing[]; total: number; page: number; totalPages: number }>>(`/learn-teach/discover?${q.toString()}`);
    return res.data || { listings: [], total: 0, page: 1, totalPages: 1 };
  },

  getRecommendations: async () => {
    const res = await apiClient.get<ApiResponse<RecommendationMatch[]>>('/learn-teach/recommendations');
    return res.data || [];
  },

  // Connections
  getConnections: async (status?: string) => {
    const q = status ? `?status=${status}` : '';
    const res = await apiClient.get<ApiResponse<SkillConnection[]>>(`/learn-teach/connections${q}`);
    return res.data || [];
  },

  sendConnectionRequest: async (data: { recipientId: string; skillDesiredId?: string; skillOfferedId?: string; introMessage?: string; preferredMode?: string }) => {
    const res = await apiClient.post<ApiResponse<SkillConnection>>('/learn-teach/connections', data);
    return res.data;
  },

  respondConnection: async (id: string, action: 'ACCEPT' | 'REJECT' | 'WITHDRAW' | 'COMPLETE' | 'CANCEL', note?: string) => {
    const res = await apiClient.patch<ApiResponse<SkillConnection>>(`/learn-teach/connections/${id}/status`, { action, note });
    return res.data;
  },

  // Sessions
  getSessions: async (status?: string) => {
    const q = status ? `?status=${status}` : '';
    const res = await apiClient.get<ApiResponse<LearningSession[]>>(`/learn-teach/sessions${q}`);
    return res.data || [];
  },

  proposeSession: async (data: {
    connectionId?: string;
    teacherId?: string;
    skillId: string;
    title: string;
    description?: string;
    sessionDate: string;
    startTime: string;
    durationMinutes: number;
    meetingMode: 'ONLINE' | 'OFFLINE';
    meetingLink?: string;
    offlineLocation?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<LearningSession>>('/learn-teach/sessions', data);
    return res.data;
  },

  respondSession: async (id: string, action: 'CONFIRM' | 'REJECT' | 'CANCEL', reason?: string) => {
    const res = await apiClient.patch<ApiResponse<LearningSession>>(`/learn-teach/sessions/${id}/status`, { action, reason });
    return res.data;
  },

  completeSession: async (id: string, notes?: string) => {
    const res = await apiClient.post<ApiResponse<LearningSession>>(`/learn-teach/sessions/${id}/complete`, { completedNotes: notes });
    return res.data;
  },

  // Groups
  getGroups: async (params?: { category?: string; skillId?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.skillId) q.append('skillId', params.skillId);
    if (params?.search) q.append('search', params.search);
    const res = await apiClient.get<ApiResponse<LearningGroup[]>>(`/learn-teach/groups?${q.toString()}`);
    return res.data || [];
  },

  createGroup: async (data: {
    title: string;
    description: string;
    skillId: string;
    maxMembers?: number;
    preferredMode: 'ONLINE' | 'OFFLINE' | 'BOTH';
    meetingSchedule?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<LearningGroup>>('/learn-teach/groups', data);
    return res.data;
  },

  joinGroup: async (groupId: string, joinNote?: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/learn-teach/groups/${groupId}/join`, { joinNote });
    return res.data;
  },

  leaveGroup: async (groupId: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/learn-teach/groups/${groupId}/leave`);
    return res.data;
  },

  // Messages (Chat)
  getMessages: async (params: { connectionId?: string; groupId?: string }) => {
    const q = new URLSearchParams();
    if (params.connectionId) q.append('connectionId', params.connectionId);
    if (params.groupId) q.append('groupId', params.groupId);
    const res = await apiClient.get<ApiResponse<LearningMessage[]>>(`/learn-teach/messages?${q.toString()}`);
    return res.data || [];
  },

  sendMessage: async (data: { connectionId?: string; groupId?: string; message: string }) => {
    const res = await apiClient.post<ApiResponse<LearningMessage>>('/learn-teach/messages', data);
    return res.data;
  },

  // Progress
  getProgress: async () => {
    const res = await apiClient.get<ApiResponse<SkillProgress[]>>('/learn-teach/progress');
    return res.data || [];
  },

  createProgress: async (data: { skillId: string; overallProficiency?: string; notes?: string; milestones?: { title: string }[] }) => {
    const res = await apiClient.post<ApiResponse<SkillProgress>>('/learn-teach/progress', data);
    return res.data;
  },

  toggleMilestone: async (progressId: string, milestoneIndex: number, completed: boolean) => {
    const res = await apiClient.patch<ApiResponse<SkillProgress>>(`/learn-teach/progress/${progressId}/milestone`, { milestoneIndex, completed });
    return res.data;
  },

  // Reviews
  submitReview: async (data: {
    sessionId: string;
    rating: number;
    feedback?: string;
    skillsDemonstrated?: string[];
  }) => {
    const res = await apiClient.post<ApiResponse<LearningReview>>('/learn-teach/reviews', data);
    return res.data;
  },

  getUserReviews: async (userId: string) => {
    const res = await apiClient.get<ApiResponse<LearningReview[]>>(`/learn-teach/reviews/user/${userId}`);
    return res.data || [];
  },

  // Reports
  reportListingOrUser: async (data: {
    reportedUserId: string;
    targetType: 'TEACHING_LISTING' | 'USER' | 'LEARNING_GROUP' | 'MESSAGE';
    targetId: string;
    reason: string;
    details?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<any>>('/learn-teach/reports', data);
    return res.data;
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    const res = await apiClient.get<ApiResponse<DashboardStats>>('/learn-teach/dashboard-stats');
    return res.data;
  },
};
