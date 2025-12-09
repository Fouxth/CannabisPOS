import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    Loader2, ArrowLeft, Store, Users, Package, TrendingUp,
    ShoppingCart, Calendar, Globe, Database, Trash2, Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface TenantDetails {
    id: string;
    name: string;
    slug: string;
    dbName: string;
    isActive: boolean;
    createdAt: string;
    domains: Array<{ domain: string }>;
    metrics: {
        userCount: number;
        productCount: number;
        categoryCount: number;
        sales: {
            today: { count: number; revenue: number };
            week: { count: number; revenue: number };
            month: { count: number; revenue: number };
        };
    };
}

interface TenantStats {
    dailyStats: Array<{ date: string; revenue: number; count: number }>;
    totalRevenue: number;
    totalSales: number;
}

export default function TenantDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState<TenantDetails | null>(null);
    const [stats, setStats] = useState<TenantStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsPeriod, setStatsPeriod] = useState(30);

    const fetchData = async () => {
        if (!id) return;

        try {
            const [tenantData, statsData] = await Promise.all([
                api.getTenantDetails(id),
                api.getTenantStats(id, statsPeriod),
            ]);
            setTenant(tenantData);
            setStats(statsData);
        } catch (error) {
            toast.error('Failed to fetch tenant details');
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, statsPeriod]);

    const handleDelete = async () => {
        if (!tenant) return;

        if (!confirm(`Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.deleteTenant(tenant.id);
            toast.success('Tenant deleted successfully');
            navigate('/admin');
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete tenant');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!tenant) {
        return null;
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">{tenant.name}</h1>
                            <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
                                {tenant.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">Created on {formatDate(tenant.createdAt)}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/admin/tenants/${tenant.id}/users`)}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        Manage Users
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Shop
                    </Button>
                </div>
            </div>

            {/* Shop Info */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Domain</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{tenant.domains[0]?.domain}</div>
                        <p className="text-xs text-muted-foreground">Slug: {tenant.slug}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Database</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{tenant.dbName}</div>
                        <p className="text-xs text-muted-foreground">PostgreSQL</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{tenant.isActive ? 'Active' : 'Inactive'}</div>
                        <p className="text-xs text-muted-foreground">
                            {tenant.metrics.userCount} users
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Metrics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Users</CardTitle>
                        <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            {tenant.metrics.userCount}
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400">Total employees</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products</CardTitle>
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {tenant.metrics.productCount}
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            {tenant.metrics.categoryCount} categories
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {tenant.metrics.sales.month.count}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400">Last 30 days</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                            {formatCurrency(tenant.metrics.sales.month.revenue)}
                        </div>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Last 30 days</p>
                    </CardContent>
                </Card>
            </div>

            {/* Sales Performance */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(tenant.metrics.sales.today.revenue)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {tenant.metrics.sales.today.count} transactions
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(tenant.metrics.sales.week.revenue)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {tenant.metrics.sales.week.count} transactions
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(tenant.metrics.sales.month.revenue)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {tenant.metrics.sales.month.count} transactions
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            {stats && stats.dailyStats.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Revenue Trend</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant={statsPeriod === 7 ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatsPeriod(7)}
                                >
                                    7 Days
                                </Button>
                                <Button
                                    variant={statsPeriod === 30 ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatsPeriod(30)}
                                >
                                    30 Days
                                </Button>
                                <Button
                                    variant={statsPeriod === 90 ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatsPeriod(90)}
                                >
                                    90 Days
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.dailyStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis tickFormatter={(value) => `฿${value.toLocaleString()}`} />
                                <Tooltip
                                    formatter={(value: any) => [`฿${value.toLocaleString()}`, 'Revenue']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('th-TH')}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={{ fill: '#8b5cf6' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
