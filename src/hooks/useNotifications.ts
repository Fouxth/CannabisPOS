import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Notification, CreateNotificationDto, UnreadCountResponse } from '@/types/notification';

const API_URL = 'http://localhost:3000/api';

export const useNotifications = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['notifications', userId],
        queryFn: async () => {
            if (!userId) return [];
            const response = await fetch(`${API_URL}/notifications?userId=${userId}`);
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
            const response = await fetch(`${API_URL}/notifications/unread-count?userId=${userId}`);
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
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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
            });
            if (!response.ok) throw new Error('Failed to delete notification');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
