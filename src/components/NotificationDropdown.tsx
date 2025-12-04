import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function NotificationDropdown() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: notifications = [] } = useNotifications(user?.id);
    const { data: unreadData } = useUnreadCount(user?.id);
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    const unreadCount = unreadData?.count || 0;
    const recentNotifications = notifications.slice(0, 5);

    const handleNotificationClick = (id: string, isRead: boolean) => {
        if (!isRead) {
            markAsRead.mutate(id);
        }
    };

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (user?.id) {
            markAllAsRead.mutate(user.id);
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'low_stock': return 'text-orange-500 bg-orange-500/10';
            case 'sales_milestone': return 'text-green-500 bg-green-500/10';
            case 'error': return 'text-red-500 bg-red-500/10';
            case 'warning': return 'text-yellow-500 bg-yellow-500/10';
            default: return 'text-blue-500 bg-blue-500/10';
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-destructive text-[9px] sm:text-[10px] font-bold text-destructive-foreground animate-in zoom-in duration-300">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96">
                <div className="flex items-center justify-between px-4 py-2">
                    <DropdownMenuLabel className="p-0">การแจ้งเตือน</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:text-primary"
                            onClick={handleMarkAllRead}
                        >
                            อ่านทั้งหมด
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {recentNotifications.length > 0 ? (
                        <div className="py-1">
                            {recentNotifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-accent",
                                        !notification.isRead && "bg-accent/50"
                                    )}
                                    onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                                >
                                    <div className="flex w-full gap-3">
                                        <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", !notification.isRead ? "bg-primary" : "bg-transparent")} />
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-sm font-medium leading-none", !notification.isRead && "font-semibold")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: th })}
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="w-full cursor-pointer justify-center text-center text-sm font-medium text-primary focus:text-primary"
                    onClick={() => navigate('/notifications')}
                >
                    ดูทั้งหมด
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
