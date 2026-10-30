import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { apiClient, type ApiResponse } from '../api/client';

export interface NotificationItem {
  _id: string;
  recipient: string;
  type: string;
  title: string;
  message: string;
  relatedAppointment?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  notifications: NotificationItem[];
  loadingNotifications: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // FIX: Use user?.id (string primitive) as dependency, NOT the full user object.
  // Using the full object causes a new reference on every auth check → reconnect loop.
  // Declared before fetchNotifications to prevent TS2448 / TS2454 TDZ error.
  const userId = user?.id || user?._id || null;

  // Fetch notifications from REST API
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadingNotifications(true);
      const [notifsRes, unreadRes] = await Promise.all([
        apiClient.get<ApiResponse<{ notifications: NotificationItem[] }>>('/notifications?limit=20'),
        apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
      ]);

      if (notifsRes.success && notifsRes.data?.notifications) {
        setNotifications(notifsRes.data.notifications);
      }
      if (unreadRes.success && unreadRes.data?.count !== undefined) {
        setUnreadCount(unreadRes.data.count);
      }
    } catch {
      // Gracefully handle network/API errors
    } finally {
      setLoadingNotifications(false);
    }
  }, [userId]);

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await apiClient.patch<ApiResponse<{ notification: NotificationItem }>>(
        `/notifications/${notificationId}/read`
      );
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {}
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await apiClient.patch<ApiResponse<any>>('/notifications/read-all');
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch {}
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await apiClient.delete<ApiResponse<any>>(`/notifications/${notificationId}`);
      if (res.success) {
        setNotifications((prev) => {
          const target = prev.find((n) => n._id === notificationId);
          if (target && !target.isRead) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n._id !== notificationId);
        });
      }
    } catch {}
  };

  // Manage real-time Socket.IO connection
  // Using userId (string primitive) as dependency, NOT the full user object.
  // Using the full object causes a new reference on every auth check → reconnect loop.
  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch of notifications
    fetchNotifications();

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_BASE_URL
        ? (import.meta.env.VITE_API_BASE_URL as string).replace(/\/api\/v1\/?$/, '')
        : (typeof window !== 'undefined' && import.meta.env.PROD ? window.location.origin : 'http://localhost:5000'));

    // Connect to WebSocket server using HttpOnly credentials
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    // Real-time event listeners
    socket.on('notification:new', (newNotification: NotificationItem) => {
      setNotifications((prev) => [newNotification, ...prev.filter((n) => n._id !== newNotification._id)]);
      setUnreadCount((c) => c + 1);
    });

    socket.on('notification:unread-count', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    socket.on('notification:read', ({ notificationId }: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, fetchNotifications]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        unreadCount,
        notifications,
        loadingNotifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
