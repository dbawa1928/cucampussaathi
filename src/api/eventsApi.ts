import { apiClient, type ApiResponse } from './client';

export type EventCategory =
  | 'Workshops'
  | 'Seminars'
  | 'Guest Lectures'
  | 'Webinars'
  | 'Hackathons'
  | 'Competitions'
  | 'Technical Events'
  | 'Cultural Events'
  | 'Sports Events'
  | 'Placement & Career Events'
  | 'Club Activities'
  | 'Faculty Events'
  | 'Other';

export type EventMode = 'ONLINE' | 'OFFLINE';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface SpeakerDetails {
  name: string;
  designation?: string;
  organization?: string;
}

export interface CampusEventItem {
  _id: string;
  title: string;
  slug: string;
  category: EventCategory;
  shortDescription: string;
  description: string;
  bannerUrl?: string;

  startDateTime: string;
  endDateTime: string;
  timezone: string;

  mode: EventMode;
  campusBlock?: string;
  venue?: string;
  roomNumber?: string;
  onlinePlatform?: string;
  publicMeetingUrl?: string;

  organizerName: string;
  organizerDepartment?: string;
  speakerDetails?: SpeakerDetails;

  registrationEnabled: boolean;
  registrationUrl?: string;
  registrationDeadline?: string;
  capacity: number;
  registeredCount: number;

  contactEmail?: string;
  contactPhone?: string;
  additionalInstructions?: string;

  status: EventStatus;
  isFeatured?: boolean;
  publishedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  createdBy: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };

  isRegistered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventRegistrationItem {
  _id: string;
  event: CampusEventItem | string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    uid?: string;
    role: string;
    department?: string;
    avatarUrl?: string;
  };
  status: 'REGISTERED' | 'CANCELLED';
  registeredAt: string;
  cancelledAt?: string;
}

export interface EventStats {
  totalEvents: number;
  publishedCount: number;
  draftCount: number;
  cancelledCount: number;
  upcomingCount: number;
  totalRegistrations: number;
}

export const eventsApi = {
  // Public Events
  getPublicEvents: async (params?: {
    category?: string;
    mode?: string;
    timeframe?: string;
    search?: string;
    month?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
      });
    }
    const res = await apiClient.get<ApiResponse<CampusEventItem[]>>(`/events?${q.toString()}`);
    return {
      events: res.data || [],
      pagination: (res as any).pagination || { total: 0, page: 1, totalPages: 1 },
    };
  },

  getFeaturedEvents: async () => {
    const res = await apiClient.get<ApiResponse<CampusEventItem[]>>('/events/featured');
    return res.data || [];
  },

  getEventById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<CampusEventItem>>(`/events/${id}`);
    return res.data;
  },

  // Teacher & Admin Management
  createEvent: async (data: any) => {
    const res = await apiClient.post<ApiResponse<CampusEventItem>>('/events', data);
    return res.data;
  },

  updateEvent: async (id: string, data: any) => {
    const res = await apiClient.patch<ApiResponse<CampusEventItem>>(`/events/${id}`, data);
    return res.data;
  },

  publishEvent: async (id: string) => {
    const res = await apiClient.post<ApiResponse<CampusEventItem>>(`/events/${id}/publish`);
    return res.data;
  },

  cancelEvent: async (id: string, reason: string) => {
    const res = await apiClient.post<ApiResponse<CampusEventItem>>(`/events/${id}/cancel`, { reason });
    return res.data;
  },

  deleteDraft: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<any>>(`/events/${id}`);
    return res;
  },

  getMyEvents: async (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    const res = await apiClient.get<ApiResponse<CampusEventItem[]>>(`/events/manage/mine?${q.toString()}`);
    return {
      events: res.data || [],
      stats: (res as any).stats as EventStats,
    };
  },

  // Event Registrations
  registerForEvent: async (eventId: string) => {
    const res = await apiClient.post<ApiResponse<EventRegistrationItem>>(`/events/${eventId}/register`);
    return res.data;
  },

  unregisterFromEvent: async (eventId: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/events/${eventId}/unregister`);
    return res;
  },

  getEventRegistrations: async (eventId: string) => {
    const res = await apiClient.get<ApiResponse<EventRegistrationItem[]>>(`/events/${eventId}/registrations`);
    return {
      registrations: res.data || [],
      total: (res as any).total || 0,
    };
  },

  getMyRegistrations: async () => {
    const res = await apiClient.get<ApiResponse<EventRegistrationItem[]>>('/events/my/registrations');
    return res.data || [];
  },
};
