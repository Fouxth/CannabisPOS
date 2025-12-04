export type NotificationType =
    | 'low_stock'
    | 'sales_milestone'
    | 'system_message'
    | 'stock_adjustment'
    | 'info'
    | 'warning'
    | 'error';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNotificationDto {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
}

export interface UnreadCountResponse {
    count: number;
}
