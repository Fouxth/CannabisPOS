import { useState } from 'react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, Trash2, AlertTriangle, Info, Package, DollarSign, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/types/notification';

export default function Notifications() {
    const { user } = useAuth();
    const { data: notifications = [], isLoading } = useNotifications(user?.id);
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();
    const deleteNotification = useDeleteNotification();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        return true;
    });

    const handleMarkAllRead = () => {
        if (user?.id) {
            markAllAsRead.mutate(user.id);
        }
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'low_stock': return <Package className="h-5 w-5 text-orange-500" />;
            case 'sales_milestone': return <DollarSign className="h-5 w-5 text-green-500" />;
            case 'system_message': return <Settings className="h-5 w-5 text-blue-500" />;
            case 'stock_adjustment': return <Package className="h-5 w-5 text-purple-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default: return <Info className="h-5 w-5 text-gray-500" />;
        }
    };

    const getBgColor = (type: NotificationType) => {
        switch (type) {
            case 'low_stock': return 'bg-orange-500/10';
            case 'sales_milestone': return 'bg-green-500/10';
            case 'system_message': return 'bg-blue-500/10';
            case 'stock_adjustment': return 'bg-purple-500/10';
            case 'warning': return 'bg-yellow-500/10';
            case 'error': return 'bg-red-500/10';
            default: return 'bg-gray-500/10';
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">กำลังโหลด...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <div className="flex-1 lg:max-w-4xl mx-auto w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">การแจ้งเตือน</h2>
                            <p className="text-muted-foreground">
                                จัดการและดูประวัติการแจ้งเตือนทั้งหมดของคุณ
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                                <Check className="mr-2 h-4 w-4" />
                                อ่านทั้งหมด
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="all" className="space-y-4" onValueChange={(v) => setFilter(v as any)}>
                        <TabsList>
                            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                            <TabsTrigger value="unread">ยังไม่อ่าน</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-4">
                            <Card>
                                <CardContent className="p-0">
                                    <ScrollArea className="h-[400px] sm:h-[600px]">
                                        {filteredNotifications.length > 0 ? (
                                            <div className="divide-y">
                                                {filteredNotifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={cn(
                                                            "flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors",
                                                            !notification.isRead && "bg-muted/30"
                                                        )}
                                                    >
                                                        <div className={cn("p-2 rounded-full shrink-0", getBgColor(notification.type))}>
                                                            {getIcon(notification.type)}
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className={cn("text-sm font-medium leading-none", !notification.isRead && "font-bold")}>
                                                                    {notification.title}
                                                                </p>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {format(new Date(notification.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {notification.message}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {!notification.isRead && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                    onClick={() => markAsRead.mutate(notification.id)}
                                                                    title="ทำเครื่องหมายว่าอ่านแล้ว"
                                                                >
                                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() => deleteNotification.mutate(notification.id)}
                                                                title="ลบ"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                                                <Bell className="h-12 w-12 mb-4 opacity-20" />
                                                <p>ไม่มีการแจ้งเตือน</p>
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="unread">
                            {/* Same content structure but filtered (handled by state) */}
                            <Card>
                                <CardContent className="p-0">
                                    <ScrollArea className="h-[400px] sm:h-[600px]">
                                        {filteredNotifications.length > 0 ? (
                                            <div className="divide-y">
                                                {filteredNotifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={cn(
                                                            "flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors",
                                                            !notification.isRead && "bg-muted/30"
                                                        )}
                                                    >
                                                        <div className={cn("p-2 rounded-full shrink-0", getBgColor(notification.type))}>
                                                            {getIcon(notification.type)}
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className={cn("text-sm font-medium leading-none", !notification.isRead && "font-bold")}>
                                                                    {notification.title}
                                                                </p>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {format(new Date(notification.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {notification.message}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                onClick={() => markAsRead.mutate(notification.id)}
                                                                title="ทำเครื่องหมายว่าอ่านแล้ว"
                                                            >
                                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() => deleteNotification.mutate(notification.id)}
                                                                title="ลบ"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                                                <Bell className="h-12 w-12 mb-4 opacity-20" />
                                                <p>ไม่มีการแจ้งเตือนที่ยังไม่อ่าน</p>
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
