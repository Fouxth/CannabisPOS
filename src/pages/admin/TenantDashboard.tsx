import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
    Loader2, Plus, Users, ShoppingCart, Search, Eye, Trash2, Calendar, 
    Copy, Check, Pencil, Megaphone, LogOut, RefreshCw, Layers
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
    userCount?: number;
    billCount?: number;
    lastActivity?: string;
    ownerName?: string;
    monthlyRevenue?: number;
    plan?: string;
    expiresAt?: string | null;
}

const transliterateThaiToEnglish = (thaiText: string): string => {
    const map: Record<string, string> = {
        'ก': 'k', 'ข': 'kh', 'ฦ': 'l', 'ฦๅ': 'lue',
        'ค': 'kh', 'ฅ': 'kh', 'ฆ': 'kh', 'ง': 'ng',
        'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's',
        'ฌ': 'ch', 'ญ': 'y', 'ฎ': 'd', 'ฏ': 't',
        'ฐ': 'th', 'ฑ': 'th', 'ฒ': 'th', 'ณ': 'n',
        'ด': 'd', 'ต': 't', 'ถ': 'th', 'ท': 'th',
        'ธ': 'th', 'น': 'n', 'บ': 'b', 'ป': 'p',
        'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph', 'ฟ': 'f',
        'ภ': 'ph', 'ม': 'm', 'ย': 'y', 'ร': 'r',
        'ฤ': 'rue', 'ฤๅ': 'rue', 'ล': 'l', 'ว': 'w',
        'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h',
        'ฬ': 'l', 'อ': 'o', 'ฮ': 'h',
        'ะ': 'a', 'า': 'a', 'ิ': 'i', 'ี': 'i',
        'ึ': 'ue', 'ื': 'u', 'ุ': 'u', 'ู': 'u',
        'เ': 'e', 'แ': 'ae', 'โ': 'o', 'ใ': 'ai',
        'ไ': 'ai', 'ั': 'a', '็': '', 'ิ์': '',
        '์': '', 'ำ': 'am'
    };

    let result = '';
    for (let i = 0; i < thaiText.length; i++) {
        const char = thaiText[i];
        if (map[char] !== undefined) {
            result += map[char];
        } else if (/[a-zA-Z0-9-]/.test(char)) {
            result += char.toLowerCase();
        } else if (char === ' ') {
            result += '-';
        }
    }
    
    return result
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
};

export default function TenantDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dbConnected, setDbConnected] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
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
            const [statsData, tenantsData, dbStatus] = await Promise.all([
                api.getAdminStats().catch(() => null),
                api.getTenants().catch(() => []),
                api.getDbStatus().catch(() => ({ connected: false })),
            ]);
            if (statsData) setStats(statsData);
            setTenants(tenantsData);
            setFilteredTenants(tenantsData);
            setDbConnected(dbStatus.connected);
        } catch (error) {
            toast.error('ล้มเหลวในการดึงข้อมูลล่าสุด');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Check DB status every 30 seconds
        const interval = setInterval(async () => {
            try {
                const dbStatus = await api.getDbStatus();
                setDbConnected(dbStatus.connected);
            } catch (e) {
                setDbConnected(false);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let filtered = tenants;
        if (statusFilter === 'active') filtered = filtered.filter((t) => t.isActive);
        else if (statusFilter === 'inactive') filtered = filtered.filter((t) => !t.isActive);
        if (searchQuery) {
            filtered = filtered.filter(
                (t) =>
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredTenants(filtered);
    }, [searchQuery, statusFilter, tenants]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const slug = transliterateThaiToEnglish(formData.name);
        const submitData = {
            name: formData.name,
            slug,
            domain: slug ? `${slug}.local` : '',
            ownerName: formData.name ? `${formData.name} Owner` : ''
        };

        if (!submitData.name) {
            toast.error('กรุณากรอกชื่อร้านค้า');
            return;
        }

        setCreating(true);
        try {
            const response = await api.createTenant(submitData);
            if (response && response.initialUser) {
                setCreatedUser(response.initialUser);
                setFormData({ name: '' });
                fetchData();
            } else {
                toast.success('สร้างระบบร้านค้าสำเร็จ');
                setFormData({ name: '' });
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.message || 'สร้างระบบร้านค้าไม่สำเร็จ');
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = () => {
        if (createdUser) {
            navigator.clipboard.writeText(createdUser.password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('คัดลอกรหัสผ่านแล้ว');
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await api.updateTenant(id, { isActive: !currentStatus });
            toast.success(`เปลี่ยนสถานะร้านค้าสำเร็จ`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'เปลี่ยนสถานะล้มเหลว');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบร้านค้า "${name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
            return;
        }

        try {
            await api.deleteTenant(id);
            toast.success('ลบร้านค้าสำเร็จแล้ว');
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'ลบร้านค้าไม่สำเร็จ');
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

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastMessage.trim()) {
            toast.error('กรุณากรอกข้อความแจ้งเตือน');
            return;
        }
        setBroadcasting(true);
        try {
            const result = await api.broadcastAnnouncement({
                title: broadcastTitle || 'ประกาศจากผู้ดูแลระบบ',
                message: broadcastMessage,
                tenantId: broadcastTenantId || undefined,
            });
            toast.success(result.message);
            setBroadcastOpen(false);
            setBroadcastTitle('');
            setBroadcastMessage('');
            setBroadcastTenantId('');
        } catch (error: any) {
            toast.error(error.message || 'ส่งประกาศไม่สำเร็จ');
        } finally {
            setBroadcasting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant || !editForm.name.trim()) {
            toast.error('กรุณากรอกชื่อร้านค้า');
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
            toast.success('แก้ไขข้อมูลร้านค้าสำเร็จ');
            setEditingTenant(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'แก้ไขข้อมูลไม่สำเร็จ');
        } finally {
            setEditSaving(false);
        }
    };

    const formatThaiDate = (dateString: string) => {
        const date = new Date(dateString);
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ย.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = (date.getFullYear() + 543) % 100;
        return `${day} ${month} ${String(year).padStart(2, '0')}`;
    };

    const getAvatarText = (name: string) => {
        if (!name) return 'ระ';
        const cleaned = name.replace(/ระบบผู้ดูแลระบบสูงสุด/g, 'ระ').trim();
        return cleaned.slice(0, 2);
    };

    return (
        <div className="min-h-screen px-6 py-12 md:px-16 w-full max-w-[95%] xl:max-w-[90%] mx-auto space-y-10">
            
            {/* Beautiful Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-blue-100/50 dark:border-slate-800/60 pb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-[#1E40AF] dark:text-blue-400 tracking-tight flex items-center gap-2">
                        Super Admin Console
                    </h1>
                    <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-semibold mt-1.5">
                        แผงควบคุมระบบจัดเตรียมร้านค้า POS อัตโนมัติ (SaaS Management)
                    </p>
                </div>
                
                <div className="flex items-center gap-4 self-start md:self-center">
                    {/* Database status */}
                    <div className="flex items-center gap-2.5 px-5 py-3 bg-white dark:bg-slate-900 rounded-full border border-emerald-100 dark:border-emerald-950/40 shadow-md">
                        <span className={`w-3.5 h-3.5 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        <span className={`text-sm font-bold ${dbConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {dbConnected ? 'เชื่อมต่อกับ PostgreSQL สำเร็จ' : 'เชื่อมต่อกับ PostgreSQL ล้มเหลว'}
                        </span>
                    </div>

                    {/* Announcement button */}
                    <Button 
                        variant="outline" 
                        size="default" 
                        onClick={() => setBroadcastOpen(true)}
                        className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 font-bold text-sm px-5 py-2.5 h-auto shadow-sm"
                    >
                        <Megaphone className="h-4 w-4 mr-1.5" />
                        ประกาศระบบ
                    </Button>

                    {/* Logout button */}
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 rounded-full border border-rose-200 dark:border-rose-950/40 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-500 font-bold text-sm transition-colors shadow-sm"
                    >
                        <LogOut className="h-4 w-4" />
                        ออกจากระบบ
                    </button>
                </div>
            </div>

            {/* Main Cards Side-by-Side - Expanded grid gap */}
            <div className="grid gap-10 lg:grid-cols-12 items-start">
                
                {/* Left Card: Create Shop */}
                <Card className="lg:col-span-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-slate-950/40 rounded-3xl overflow-hidden relative p-4">
                    {/* Decorative Top-Right Curve Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-indigo-500/0 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <CardHeader className="pb-4 relative">
                        <CardTitle className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 text-xl font-black">
                            <span className="w-9.5 h-9.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl">+</span>
                            เปิดระบบร้านค้าใหม่
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">ชื่อร้านค้า (ภาษาไทย หรือ อังกฤษ)</label>
                                <Input
                                    placeholder="เช่น เขียวขจีการค้า, กัญชาสุขใจ"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    className="h-14 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-2xl focus-visible:ring-blue-500 font-semibold px-5 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed mt-2">
                                    * พิมพ์เฉพาะชื่อร้านค้า ระบบจะนำไปแปลงเป็นคาราโอเกะภาษาอังกฤษสำหรับ URL และ Gen บัญชีให้อัตโนมัติในพริบตา
                                </p>
                            </div>

                            {formData.name && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl space-y-3.5 text-xs border border-slate-100 dark:border-slate-800 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 dark:text-slate-400 font-bold">บัญชีผู้ใช้เริ่มต้น:</span>
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 px-2.5 py-1 rounded border border-blue-100/30 dark:border-blue-900/40">
                                            admin@{transliterateThaiToEnglish(formData.name)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 dark:text-slate-400 font-bold">รหัสผ่านเริ่มต้น:</span>
                                        <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded border border-amber-100/50 dark:border-amber-900/40">
                                            ระบบจะสุ่มเพื่อความปลอดภัย
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-base rounded-2xl transition-[background-color,box-shadow] shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15"
                                disabled={creating}
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin text-white" />
                                        กำลังสร้างระบบร้านค้า...
                                    </>
                                ) : (
                                    'สร้างระบบร้านค้าทันที'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Right Card: Tenants List - Proportional scaling and expanded width */}
                <Card className="lg:col-span-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-slate-950/40 rounded-3xl overflow-hidden p-4">
                    <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div>
                            <CardTitle className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 text-xl font-black">
                                <Layers className="h-6 w-6 text-indigo-500" />
                                บัญชีร้านค้าที่เปิดใช้งานอยู่ ({filteredTenants.length})
                            </CardTitle>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                                <Input
                                    placeholder="ค้นหาร้านค้า..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-full text-sm font-semibold focus-visible:ring-blue-500 shadow-sm"
                                />
                            </div>

                            {/* Refresh */}
                            <Button
                                variant="outline"
                                size="default"
                                onClick={fetchData}
                                className="h-11 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 rounded-full font-extrabold text-sm flex items-center gap-1.5 shadow-sm"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                รีเฟรชรายการ
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="pt-2">
                        {loading && filteredTenants.length === 0 ? (
                            <div className="flex flex-col justify-center items-center p-16 space-y-3">
                                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">กำลังโหลดระบบร้านค้า...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                            <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase h-12 py-3">ชื่อร้านค้า</TableHead>
                                            <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase h-12 py-3">ชื่อผู้ใช้ล็อกอิน</TableHead>
                                            <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase h-12 py-3">พนักงาน / ผู้ใช้งาน</TableHead>
                                            <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase h-12 py-3">สถานะระบบ</TableHead>
                                            <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase h-12 py-3">วันที่สร้าง</TableHead>
                                            <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase h-12 py-3 text-right">จัดการ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTenants.map((tenant) => (
                                            <TableRow key={tenant.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-slate-100 dark:border-slate-800 group transition-colors">
                                                
                                                {/* Shop Name & Logo Circle - Expanded avatar size */}
                                                <TableCell className="py-4.5 font-semibold">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shadow-inner uppercase tracking-wider ${
                                                            tenant.slug === 'default' 
                                                                ? 'bg-blue-100 text-blue-600 border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40' 
                                                                : 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40'
                                                        }`}>
                                                            {getAvatarText(tenant.name)}
                                                        </div>
                                                        <div>
                                                            <div className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-snug">{tenant.name}</div>
                                                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 font-mono">{tenant.slug}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                
                                                {/* Login Username */}
                                                <TableCell className="py-4.5 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                                                    {`admin@${tenant.slug}`}
                                                </TableCell>
                                                
                                                {/* Users Count Pill */}
                                                <TableCell className="py-4.5">
                                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-full font-bold text-xs">
                                                        👤 {tenant.userCount ?? 0}
                                                    </div>
                                                </TableCell>
                                                
                                                {/* Active Status System Badge */}
                                                <TableCell className="py-4.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <Switch
                                                            checked={tenant.isActive}
                                                            onCheckedChange={() => handleToggle(tenant.id, tenant.isActive)}
                                                            className="scale-105 data-[state=checked]:bg-emerald-500"
                                                        />
                                                        <span className={`text-xs font-bold ${tenant.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                            {tenant.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                
                                                {/* Created Date in Thai format (e.g. 1 มิ.ย. 69) */}
                                                <TableCell className="py-4.5 text-slate-500 font-semibold text-sm font-mono whitespace-nowrap">
                                                    ⏰ {formatThaiDate(tenant.createdAt)}
                                                </TableCell>
                                                
                                                {/* Action buttons (pencil, eye, delete) */}
                                                <TableCell className="py-4.5 text-right">
                                                    <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEditDialog(tenant)}
                                                            className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        >
                                                            <Pencil className="h-4.5 w-4.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                                                            className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                        >
                                                            <Eye className="h-4.5 w-4.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(tenant.id, tenant.name)}
                                                            className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                        >
                                                            <Trash2 className="h-4.5 w-4.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredTenants.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-semibold text-sm">
                                                    {searchQuery ? 'ไม่พบข้อมูลร้านค้าที่ค้นหา' : 'ยังไม่มีร้านค้าในระบบ'}
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

            {/* Dynamic Success Dialog for Newly Created Tenant Credentials */}
            <Dialog open={!!createdUser} onOpenChange={(open) => !open && setCreatedUser(null)}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600 font-extrabold text-lg">
                            <Check className="h-6 w-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-full p-0.5" />
                            เปิดระบบร้านค้าใหม่สำเร็จ!
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1">
                            ร้านค้าใหม่ถูกจัดสรรเรียบร้อย โปรดบันทึกรหัสผ่านนี้เพื่อใช้งาน
                            <br /><span className="text-rose-500 font-bold mt-1 block">⚠️ สำคัญ: รหัสผ่านจะแสดงเพียงครั้งเดียวเท่านั้น!</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">บัญชีผู้ดูแลระบบร้านค้า</label>
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl font-mono text-sm font-bold text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 select-all">
                                {createdUser?.username}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">รหัสผ่านเข้าใช้งาน</label>
                            <div className="flex gap-2">
                                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl font-mono text-sm font-bold text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 flex-1 select-all">
                                    {createdUser?.password}
                                </div>
                                <Button size="icon" variant="outline" onClick={copyToClipboard} className="h-12 w-12 rounded-xl border-slate-200 dark:border-slate-800">
                                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ลิงก์เข้าใช้งานระบบ</label>
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl font-mono text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 select-all">
                                {window.location.origin}
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => setCreatedUser(null)} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl">
                        ตกลง, บันทึกแล้ว
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Edit Shop Dialog */}
            <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold text-lg">
                            <Pencil className="h-5 w-5 text-blue-500" />
                            แก้ไขข้อมูลร้านค้า
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                        <div className="space-y-4 py-4 text-slate-800 dark:text-slate-200">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">ชื่อร้านค้า (ภาษาไทย หรือ อังกฤษ)</label>
                                <Input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">ชื่อเจ้าของร้าน</label>
                                <Input
                                    value={editForm.ownerName}
                                    onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                                    className="h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Slug (ไม่สามารถเปลี่ยนแปลงได้)</label>
                                <div className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                                    {editingTenant?.slug}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">แพลนการใช้งาน</label>
                                <select
                                    value={editForm.plan}
                                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                                    className="w-full h-11 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none"
                                >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">วันหมดอายุสัญญา</label>
                                <Input
                                    type="date"
                                    value={editForm.expiresAt}
                                    onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                                    className="h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">เว้นว่างไว้หากไม่มีกำหนดหมดอายุ</p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditingTenant(null)} className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={editSaving} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                {editSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังบันทึก...</> : 'บันทึกข้อมูล'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Broadcast Announcement Dialog */}
            <Dialog open={broadcastOpen} onOpenChange={(open) => setBroadcastOpen(open)}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold text-lg">
                            <Megaphone className="h-5 w-5 text-indigo-500" />
                            บรอดแคสต์ประกาศระบบ
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1">
                            ส่งแจ้งเตือนด่วนไปยังหน้าแอปพลิเคชันของร้านค้าผู้ใช้ทุกร้านค้าหรือระบุร้าน
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBroadcast}>
                        <div className="space-y-4 py-4 text-slate-800 dark:text-slate-200">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">หัวข้อประกาศ (Title)</label>
                                <Input
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    placeholder="ประกาศจากฝ่ายบริการผู้ดูแลระบบ"
                                    className="h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">ข้อความประกาศ <span className="text-rose-500">*</span></label>
                                <textarea
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    placeholder="พิมพ์เนื้อหาแจ้งเตือนระบบ..."
                                    rows={3}
                                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">กลุ่มเป้าหมาย</label>
                                <select
                                    value={broadcastTenantId}
                                    onChange={(e) => setBroadcastTenantId(e.target.value)}
                                    className="w-full h-11 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none"
                                >
                                    <option value="">ทุกระบบร้านค้า (All Active Shops)</option>
                                    {tenants.filter(t => t.isActive).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setBroadcastOpen(false)} className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={broadcasting || !broadcastMessage.trim()} className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                {broadcasting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังส่ง...</> : 'ส่งประกาศทันที'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
