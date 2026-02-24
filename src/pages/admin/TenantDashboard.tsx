import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
    Loader2, Plus, Globe, Database, Store, Users, TrendingUp,
    ShoppingCart, Search, Eye, Trash2, Calendar, Activity, Copy, Check, Pencil,
    Download, Megaphone
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, Legend
} from 'recharts';
import { exportToExcel } from '@/lib/exportUtils';

interface OverviewStats {
    totalShops: number;
    activeShops: number;
    totalUsers: number;
    totalRevenue: number;
    totalSales: number;
}

interface Tenant {
    id: string;
    name: string;
    slug: string;
    dbName: string;
    isActive: boolean;
    createdAt: string;
    domains: Array<{ domain: string }>;
    userCount?: number;
    lastActivity?: string;
    ownerName?: string;
    monthlyRevenue?: number;
    plan?: string;
    expiresAt?: string | null;
}

export default function TenantDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        domain: '',
        ownerName: '',
    });
    const [createdUser, setCreatedUser] = useState<{ username: string, password: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', ownerName: '', plan: 'free', expiresAt: '' });
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [broadcastOpen, setBroadcastOpen] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastTenantId, setBroadcastTenantId] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);

    const fetchData = async () => {
        try {
            const [statsData, tenantsData] = await Promise.all([
                api.getAdminStats(),
                api.getTenants(),
            ]);
            setStats(statsData);
            setTenants(tenantsData);
            setFilteredTenants(tenantsData);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = tenants;
        if (statusFilter === 'active') filtered = filtered.filter((t) => t.isActive);
        else if (statusFilter === 'inactive') filtered = filtered.filter((t) => !t.isActive);
        if (searchQuery) {
            filtered = filtered.filter(
                (t) =>
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.domains[0]?.domain.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredTenants(filtered);
    }, [searchQuery, statusFilter, tenants]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.slug || !formData.domain || !formData.ownerName) {
            toast.error('Please fill in all fields');
            return;
        }

        setCreating(true);
        try {
            const response = await api.createTenant(formData);
            if (response && response.initialUser) {
                setCreatedUser(response.initialUser);
                setFormData({ name: '', slug: '', domain: '', ownerName: '' });
                fetchData();
            } else {
                toast.success('Tenant created successfully');
                setFormData({ name: '', slug: '', domain: '', ownerName: '' });
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to create tenant');
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = () => {
        if (createdUser) {
            navigator.clipboard.writeText(createdUser.password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Password copied to clipboard');
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await api.updateTenant(id, { isActive: !currentStatus });
            toast.success(`Tenant ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update tenant');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.deleteTenant(id);
            toast.success('Tenant deleted successfully');
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete tenant');
        }
    };

    const openEditDialog = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setEditForm({
            name: tenant.name,
            ownerName: tenant.ownerName || '',
            plan: tenant.plan || 'free',
            expiresAt: tenant.expiresAt ? tenant.expiresAt.slice(0, 10) : '',
        });
    };

    const handleExport = () => {
        exportToExcel({
            filename: `tenants_export_${new Date().toISOString().slice(0, 10)}`,
            title: 'All Tenants',
            columns: [
                { header: 'Shop Name', key: 'name', width: 20 },
                { header: 'Slug', key: 'slug', width: 16 },
                { header: 'Domain', key: 'domain', width: 24 },
                { header: 'Owner', key: 'ownerName', width: 20 },
                { header: 'Users', key: 'userCount', width: 8 },
                { header: 'Plan', key: 'plan', width: 10 },
                { header: 'Expires At', key: 'expiresAt', width: 16 },
                { header: 'Status', key: 'status', width: 10 },
                { header: 'Created At', key: 'createdAt', width: 18 },
            ],
            data: tenants.map(t => ({
                name: t.name,
                slug: t.slug,
                domain: t.domains[0]?.domain || '',
                ownerName: t.ownerName || '',
                userCount: t.userCount ?? 0,
                plan: t.plan || 'free',
                expiresAt: t.expiresAt ? new Date(t.expiresAt).toLocaleDateString('th-TH') : 'ไม่มีวันหมดอายุ',
                status: t.isActive ? 'Active' : 'Inactive',
                createdAt: new Date(t.createdAt).toLocaleDateString('th-TH'),
            })),
        });
        toast.success('Export successful');
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastMessage.trim()) {
            toast.error('Message is required');
            return;
        }
        setBroadcasting(true);
        try {
            const result = await api.broadcastAnnouncement({
                title: broadcastTitle || 'Admin Announcement',
                message: broadcastMessage,
                tenantId: broadcastTenantId || undefined,
            });
            toast.success(result.message);
            setBroadcastOpen(false);
            setBroadcastTitle('');
            setBroadcastMessage('');
            setBroadcastTenantId('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send announcement');
        } finally {
            setBroadcasting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant || !editForm.name.trim()) {
            toast.error('Shop name is required');
            return;
        }
        setEditSaving(true);
        try {
            await api.updateTenant(editingTenant.id, {
                name: editForm.name,
                ownerName: editForm.ownerName,
                plan: editForm.plan,
                expiresAt: editForm.expiresAt || null,
            });
            toast.success('Shop updated successfully');
            setEditingTenant(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update shop');
        } finally {
            setEditSaving(false);
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
            month: 'short',
            day: 'numeric',
        });
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
        return formatDate(dateString);
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Super Admin Portal
                    </h1>
                    <p className="text-muted-foreground">Manage your shops and tenants</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={tenants.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button size="sm" onClick={() => setBroadcastOpen(true)}>
                        <Megaphone className="mr-2 h-4 w-4" />
                        Broadcast
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : stats ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
                            <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalShops}</div>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                {stats.activeShops} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
                            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.activeShops}</div>
                            <p className="text-xs text-green-600 dark:text-green-400">
                                {((stats.activeShops / stats.totalShops) * 100).toFixed(0)}% of total
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalUsers}</div>
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                                Across all shops
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                {formatCurrency(stats.totalRevenue)}
                            </div>
                            <p className="text-xs text-orange-600 dark:text-orange-400">
                                All time
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">{stats.totalSales}</div>
                            <p className="text-xs text-pink-600 dark:text-pink-400">
                                Transactions
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : null}

            {/* Revenue Comparison Chart */}
            {!loading && tenants.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Monthly Revenue by Shop (30 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={tenants.map(t => ({ name: t.name, revenue: t.monthlyRevenue || 0 }))} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'Revenue']} />
                                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                    {tenants.map((_, i) => (
                                        <Cell key={i} fill={[
                                            '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'
                                        ][i % 6]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Create Tenant Form */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Provision New Shop
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Shop Name</label>
                                <Input
                                    placeholder="e.g. Green Day Shop"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug (ID)</label>
                                <Input
                                    placeholder="e.g. green-day"
                                    value={formData.slug}
                                    onChange={(e) => {
                                        const slug = e.target.value;
                                        setFormData({
                                            ...formData,
                                            slug,
                                            domain: slug ? `${slug}.local` : ''
                                        });
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">This ID is used for the database name and URL.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">ชื่อเจ้าของร้าน</label>
                                <Input
                                    placeholder="เช่น สมชาย รักดี"
                                    value={formData.ownerName}
                                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                />
                            </div>

                            {/* Hidden Domain Input (Auto-generated) */}
                            <input type="hidden" value={formData.domain} />
                            <Button type="submit" className="w-full" disabled={creating}>
                                {creating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Provisioning...
                                    </>
                                ) : (
                                    'Create Shop'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Tenants List */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                All Tenants ({filteredTenants.length})
                            </CardTitle>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tenants..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                            {(['all', 'active', 'inactive'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                                        statusFilter === f
                                            ? f === 'active'
                                                ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700'
                                                : f === 'inactive'
                                                ? 'bg-slate-200 border-slate-400 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                                : 'bg-primary text-primary-foreground border-primary'
                                            : 'border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    {f === 'all' ? `All (${tenants.length})` : f === 'active' ? `Active (${tenants.filter(t => t.isActive).length})` : `Inactive (${tenants.filter(t => !t.isActive).length})`}
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>เจ้าของร้าน</TableHead>
                                            <TableHead>Users</TableHead>
                                            <TableHead className="hidden lg:table-cell">Last Activity</TableHead>
                                            <TableHead className="hidden sm:table-cell">Plan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTenants.map((tenant) => (
                                            <TableRow key={tenant.id}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <div className="font-semibold">{tenant.name}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Database className="h-3 w-3" />
                                                            {tenant.dbName}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">
                                                            {tenant.ownerName || `admin@${tenant.slug}`}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span>{tenant.userCount || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {tenant.lastActivity ? (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            {formatRelativeTime(tenant.lastActivity)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No activity</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <div className="space-y-1">
                                                        <Badge variant="outline" className={{
                                                            enterprise: 'border-purple-400 text-purple-600',
                                                            pro: 'border-blue-400 text-blue-600',
                                                            free: 'border-gray-300 text-gray-500',
                                                        }[tenant.plan || 'free'] || 'border-gray-300 text-gray-500'}>
                                                            {(tenant.plan || 'free').toUpperCase()}
                                                        </Badge>
                                                        {tenant.expiresAt && (
                                                            <div className={`text-xs ${
                                                                new Date(tenant.expiresAt) < new Date()
                                                                    ? 'text-red-500'
                                                                    : new Date(tenant.expiresAt) < new Date(Date.now() + 7 * 86400000)
                                                                    ? 'text-orange-500'
                                                                    : 'text-muted-foreground'
                                                            }`}>
                                                                {new Date(tenant.expiresAt) < new Date() ? '⚠ Expired ' : ''}Exp: {new Date(tenant.expiresAt).toLocaleDateString('th-TH')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={tenant.isActive}
                                                            onCheckedChange={() => handleToggle(tenant.id, tenant.isActive)}
                                                        />
                                                        <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
                                                            {tenant.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(tenant)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(tenant.id, tenant.name)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredTenants.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    {searchQuery ? 'No tenants found matching your search' : 'No tenants found'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>


            <Dialog open={!!createdUser} onOpenChange={(open) => !open && setCreatedUser(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <Check className="h-6 w-6" />
                            Shop Created Successfully!
                        </DialogTitle>
                        <DialogDescription>
                            Your new shop is ready. Please save these admin credentials.
                            <br /><span className="text-red-500 font-bold">IMPORTANT: The password is shown only once!</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Admin Username</label>
                            <div className="p-3 bg-muted rounded-md font-mono text-sm select-all">
                                {createdUser?.username}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Password</label>
                            <div className="flex gap-2">
                                <div className="p-3 bg-muted rounded-md font-mono text-sm flex-1 select-all">
                                    {createdUser?.password}
                                </div>
                                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Login URL</label>
                            <div className="p-3 bg-muted rounded-md font-mono text-sm select-all">
                                {window.location.origin}
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => setCreatedUser(null)} className="w-full">
                        Done
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Edit Shop Dialog */}
            <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5" />
                            Edit Shop
                        </DialogTitle>
                        <DialogDescription>
                            Update the shop name or owner name. Slug and database name cannot be changed.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Shop Name</label>
                                <Input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    placeholder="e.g. Green Day Shop"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">ชื่อเจ้าของร้าน</label>
                                <Input
                                    value={editForm.ownerName}
                                    onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                                    placeholder="เช่น สมชาย รักดี"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Slug (read-only)</label>
                                <div className="p-2 bg-muted rounded-md font-mono text-sm">
                                    {editingTenant?.slug}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Plan</label>
                                <select
                                    value={editForm.plan}
                                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                                >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Expires At (วันหมดอายุ)</label>
                                <Input
                                    type="date"
                                    value={editForm.expiresAt}
                                    onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">เว้นว่างไว้ถ้าไม่มีวันหมดอายุ</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingTenant(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editSaving}>
                                {editSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Broadcast Announcement Dialog */}
            <Dialog open={broadcastOpen} onOpenChange={(open) => setBroadcastOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5" />
                            Broadcast Announcement
                        </DialogTitle>
                        <DialogDescription>
                            ส่งข้อความแจ้งเตือนไปยังทุกร้านหรือร้านที่เลือก (แสดงผ่าน notification ใน app)
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBroadcast}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">หัวข้อ (Title)</label>
                                <Input
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    placeholder="Admin Announcement"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">ข้อความ <span className="text-destructive">*</span></label>
                                <textarea
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    placeholder="ข้อความที่ต้องการส่ง..."
                                    rows={3}
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">ส่งไปยัง</label>
                                <select
                                    value={broadcastTenantId}
                                    onChange={(e) => setBroadcastTenantId(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                                >
                                    <option value="">ทุกร้าน (All Active Shops)</option>
                                    {tenants.filter(t => t.isActive).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setBroadcastOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={broadcasting || !broadcastMessage.trim()}>
                                {broadcasting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Announcement'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
}
