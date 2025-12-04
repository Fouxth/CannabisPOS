import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/hooks/useAuth';

const API_URL = 'http://localhost:3000/api';

interface UpdateProfileDto {
    fullName?: string;
    nickname?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
}

interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, data }: { userId: string; data: UpdateProfileDto }) => {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }

            return response.json() as Promise<User>;
        },
        onSuccess: (data) => {
            // Update the user in the auth cache if needed, or just invalidate
            // For now, we might rely on the auth context to refresh or manual invalidation
            // But since useAuth usually stores user in local state/context, we might need to handle that there.
            // However, if we invalidate 'users' query, it might help if we fetch user data via query.
            // Assuming useAuth might need a reload or we just return the data to the component to update local state.
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: async ({ userId, data }: { userId: string; data: ChangePasswordDto }) => {
            const response = await fetch(`${API_URL}/users/${userId}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to change password');
            }

            return response.json();
        },
    });
};
