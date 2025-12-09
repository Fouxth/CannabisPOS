import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Users, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ROLE_NAMES, ROLE_COLORS } from '@/hooks/useAuth';

interface TenantUser {
    id: string;
    employeeCode: string;
    email: string;
    fullName: string;
    nickname?: string;
    phone?: string;
    role: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
}

export default function TenantUsers() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantName, setTenantName] = useState('');

    const fetchData = async () => {
        if (!id) return;

        try {
            const [usersData, tenantData] = await Promise.all([
                api.getTenantUsers(id),
                api.getTenantDetails(id),
            ]);
            setUsers(usersData);
            setTenantName(tenantData.name);
        } catch (error) {
            toast.error('Failed to fetch users');
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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

    const getRoleBadgeColor = (role: string) => {
        return ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'bg-gray-500';
    };

    const getRoleName = (role: string) => {
        return ROLE_NAMES[role as keyof typeof ROLE_NAMES] || role;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/tenants/${id}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground">{tenantName}</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {users.filter((u) => u.isActive).length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {users.filter((u) => ['OWNER', 'ADMIN'].includes(u.role)).length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Staff</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {users.filter((u) => ['MANAGER', 'CASHIER'].includes(u.role)).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        All Users ({users.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-semibold">{user.fullName}</div>
                                                {user.nickname && (
                                                    <div className="text-xs text-muted-foreground">
                                                        ({user.nickname})
                                                    </div>
                                                )}
                                                <div className="text-xs text-muted-foreground">
                                                    {user.employeeCode}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {user.email}
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                                        {user.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getRoleBadgeColor(user.role)}>
                                                {getRoleName(user.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.lastLoginAt ? (
                                                <div className="text-sm">
                                                    {formatRelativeTime(user.lastLoginAt)}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Never</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {formatDate(user.createdAt)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
