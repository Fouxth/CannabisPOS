import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
    Loader2, Plus, Globe, Database, Store, Users, TrendingUp,
    ShoppingCart, Search, Eye, Trash2, Calendar, Activity, Copy, Check
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

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
        if (searchQuery) {
            const filtered = tenants.filter(
                (t) =>
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.domains[0]?.domain.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredTenants(filtered);
        } else {
            setFilteredTenants(tenants);
        }
    }, [searchQuery, tenants]);

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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Super Admin Portal
                    </h1>
                    <p className="text-muted-foreground">Manage your shops and tenants</p>
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
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                All Tenants ({filteredTenants.length})
                            </CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tenants..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
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
                                            <TableHead>Last Activity</TableHead>
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
                                                <TableCell>
                                                    {tenant.lastActivity ? (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            {formatRelativeTime(tenant.lastActivity)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No activity</span>
                                                    )}
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
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
        </div >
    );
}
