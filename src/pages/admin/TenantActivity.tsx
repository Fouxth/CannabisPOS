import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, ShoppingCart, User, Clock, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActivityItem {
    type: 'sale' | 'login' | 'stock' | 'system';
    tenantId: string;
    tenantName: string;
    description: string;
    amount?: number;
    user: string;
    createdAt: string;
}

export default function TenantActivity() {
    const navigate = useNavigate();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchActivity = async () => {
        try {
            const data = await api.getAdminActivity(50);
            setActivities(data);
        } catch (error) {
            console.error('Failed to fetch activity', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(fetchActivity, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'sale':
                return <ShoppingCart className="h-4 w-4 text-green-500" />;
            case 'login':
                return <User className="h-4 w-4 text-blue-500" />;
            case 'stock':
                return <Store className="h-4 w-4 text-orange-500" />;
            default:
                return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Activity</h1>
                    <p className="text-muted-foreground">Real-time monitoring across all shops</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Events
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activities.map((item, index) => (
                                <div key={index} className="flex items-start gap-4 pb-6 border-b last:border-0 last:pb-0">
                                    <div className="mt-1 bg-muted rounded-full p-2">
                                        {getActivityIcon(item.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-sm">
                                                <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate(`/admin/tenants/${item.tenantId}`)}>
                                                    [{item.tenantName}]
                                                </span>{' '}
                                                {item.description}
                                            </p>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Clock className="mr-1 h-3 w-3" />
                                                {formatTime(item.createdAt)}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {item.user}
                                                </span>
                                            </div>
                                            {item.amount && (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                    ฿{item.amount.toLocaleString()}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No recent activity found
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
