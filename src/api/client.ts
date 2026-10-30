/**
 * CUCampusSaathi API Client
 * Configured with credentialed requests for secure HttpOnly cookie authentication.
 */

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

export class ApiError extends Error {
  public statusCode: number;
  public data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((failed: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (failed: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(failed: boolean) {
  refreshSubscribers.forEach((cb) => cb(failed));
  refreshSubscribers = [];
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: 'include', // Crucial for HttpOnly cookies
  };

  try {
    const response = await fetch(url, config);

    // If 401 Unauthorized occurs on protected routes, attempt silent token refresh
    if (
      response.status === 401 &&
      !isRetry &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/register') &&
      !endpoint.includes('/auth/refresh')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (refreshRes.ok) {
            isRefreshing = false;
            onRefreshed(false);
            return request<T>(endpoint, options, true);
          } else {
            isRefreshing = false;
            onRefreshed(true);
          }
        } catch {
          isRefreshing = false;
          onRefreshed(true);
        }
      } else {
        // Wait for active refresh to complete
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((failed) => {
            if (failed) {
              reject(new ApiError('Session expired. Please sign in.', 401));
            } else {
              resolve(request<T>(endpoint, options, true));
            }
          });
        });
      }
    }

    const data: ApiResponse<T> = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Network connection to university backend failed.',
      0
    );
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
