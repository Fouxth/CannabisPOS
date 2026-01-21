import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Notification, CreateNotificationDto, UnreadCountResponse } from '@/types/notification';
import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'x-tenant-domain': window.location.hostname,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

export const useNotifications = (userId: string | undefined) => {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !userId) return;

        const handleNotification = (notification: any) => {
            console.log('🔔 Real-time notification received:', notification);

            // Show toast
            toast(notification.title, {
                description: notification.message,
                icon: notification.type === 'low_stock' ? '📦' : '🎉',
            });

            // Invalidate queries to fetch fresh data
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });
        };

        socket.on('notification_received', handleNotification);

        return () => {
            socket.off('notification_received', handleNotification);
        };
    }, [socket, userId, queryClient]);

    return useQuery({
        queryKey: ['notifications', userId],
        queryFn: async () => {
            if (!userId) return [];
            const response = await fetch(`${API_URL}/notifications?userId=${userId}`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return response.json() as Promise<Notification[]>;
        },
        enabled: !!userId,
    });
};

export const useUnreadCount = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['notifications', 'unread-count', userId],
        queryFn: async () => {
            if (!userId) return { count: 0 };
            const response = await fetch(`${API_URL}/notifications/unread-count?userId=${userId}`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch unread count');
            return response.json() as Promise<UnreadCountResponse>;
        },
        enabled: !!userId,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: getAuthHeaders(),
            });
            if (!response.ok) throw new Error('Failed to mark notification as read');
            return response.json() as Promise<Notification>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ userId }),
            });
            if (!response.ok) throw new Error('Failed to mark all as read');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useCreateNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateNotificationDto) => {
            const response = await fetch(`${API_URL}/notifications`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to create notification');
            return response.json() as Promise<Notification>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!response.ok) throw new Error('Failed to delete notification');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
