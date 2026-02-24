import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Tag, Percent, Gift } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Promotion {
    id: string;
    name: string;
    description?: string;
    type: string;
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    code?: string;
    usageLimit?: number;
    usageCount: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Promotions() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        minPurchase: '',
        maxDiscount: '',
        code: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
        isActive: true,
    });

    const fetchPromotions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/promotions`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setPromotions(data);
            }
        } catch (error) {
            console.error('Failed to fetch promotions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            type: 'percentage',
            value: 0,
            minPurchase: '',
            maxDiscount: '',
            code: '',
            usageLimit: '',
            startDate: '',
            endDate: '',
            isActive: true,
        });
        setEditingPromotion(null);
    };

    const handleEdit = (promotion: Promotion) => {
        setEditingPromotion(promotion);
        setFormData({
            name: promotion.name,
            description: promotion.description || '',
            type: promotion.type,
            value: promotion.value,
            minPurchase: promotion.minPurchase?.toString() || '',
            maxDiscount: promotion.maxDiscount?.toString() || '',
            code: promotion.code || '',
            usageLimit: promotion.usageLimit?.toString() || '',
            startDate: promotion.startDate.slice(0, 16),
            endDate: promotion.endDate.slice(0, 16),
            isActive: promotion.isActive,
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                value: Number(formData.value),
                minPurchase: formData.minPurchase ? Number(formData.minPurchase) : null,
                maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
            };

            const url = editingPromotion
                ? `${API_URL}/api/promotions/${editingPromotion.id}`
                : `${API_URL}/api/promotions`;

            const response = await fetch(url, {
                method: editingPromotion ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast({
                    title: editingPromotion ? 'อัปเดตโปรโมชั่นแล้ว' : 'สร้างโปรโมชั่นแล้ว',
                    description: `โปรโมชั่น "${formData.name}" ถูก${editingPromotion ? 'อัปเดต' : 'สร้าง'}เรียบร้อยแล้ว`,
                });
                fetchPromotions();
                setDialogOpen(false);
                resetForm();
            } else {
                const error = await response.json();
                toast({
                    title: 'เกิดข้อผิดพลาด',
                    description: error.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to save promotion:', error);
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถบันทึกโปรโมชั่นได้',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('คุณแน่ใจหรือไม่ที่จะลบโปรโมชั่นนี้?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/promotions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                toast({
                    title: 'ลบโปรโมชั่นแล้ว',
                    description: 'โปรโมชั่นถูกลบเรียบร้อยแล้ว',
                });
                fetchPromotions();
            }
        } catch (error) {
            console.error('Failed to delete promotion:', error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'percentage': return <Percent className="h-4 w-4" />;
            case 'fixed_amount': return <Tag className="h-4 w-4" />;
            case 'buy_x_get_y': return <Gift className="h-4 w-4" />;
            default: return <Tag className="h-4 w-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'percentage': return 'ลดเปอร์เซ็นต์';
            case 'fixed_amount': return 'ลดราคาคงที่';
            case 'buy_x_get_y': return 'ซื้อ X แถม Y';
            default: return type;
        }
    };

    const isPromotionActive = (promo: Promotion) => {
        const now = new Date();
        const start = new Date(promo.startDate);
        const end = new Date(promo.endDate);
        return promo.isActive && now >= start && now <= end;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-display">โปรโมชั่น</h1>
                    <p className="text-muted-foreground">จัดการโปรโมชั่นและส่วนลด</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            สร้างโปรโมชั่น
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingPromotion ? 'แก้ไขโปรโมชั่น' : 'สร้างโปรโมชั่นใหม่'}</DialogTitle>
                            <DialogDescription>กรอกข้อมูลโปรโมชั่น</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">ชื่อโปรโมชั่น *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="code">รหัสโปรโมชั่น</Label>
                                        <Input
                                            id="code"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            placeholder="เช่น SALE20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">รายละเอียด</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">ประเภท *</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="percentage">ลดเปอร์เซ็นต์ (%)</SelectItem>
                                                <SelectItem value="fixed_amount">ลดราคาคงที่ (฿)</SelectItem>
                                                <SelectItem value="buy_x_get_y">ซื้อ X แถม Y</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="value">มูลค่า *</Label>
                                        <Input
                                            id="value"
                                            type="number"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="minPurchase">ยอดซื้อขั้นต่ำ (฿)</Label>
                                        <Input
                                            id="minPurchase"
                                            type="number"
                                            value={formData.minPurchase}
                                            onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxDiscount">ส่วนลดสูงสุด (฿)</Label>
                                        <Input
                                            id="maxDiscount"
                                            type="number"
                                            value={formData.maxDiscount}
                                            onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">วันเริ่มต้น *</Label>
                                        <Input
                                            id="startDate"
                                            type="datetime-local"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">วันสิ้นสุด *</Label>
                                        <Input
                                            id="endDate"
                                            type="datetime-local"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="usageLimit">จำกัดการใช้งาน (ครั้ง)</Label>
                                    <Input
                                        id="usageLimit"
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                        placeholder="ไม่จำกัด"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    ยกเลิก
                                </Button>
                                <Button type="submit">
                                    {editingPromotion ? 'บันทึก' : 'สร้างโปรโมชั่น'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>รายการโปรโมชั่น</CardTitle>
                    <CardDescription>โปรโมชั่นและส่วนลดทั้งหมดของร้าน</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">กำลังโหลด...</div>
                    ) : promotions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">ยังไม่มีโปรโมชั่น</div>
                    ) : (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ชื่อ</TableHead>
                                    <TableHead>ประเภท</TableHead>
                                    <TableHead>มูลค่า</TableHead>
                                    <TableHead className="hidden sm:table-cell">รหัส</TableHead>
                                    <TableHead className="hidden md:table-cell">การใช้งาน</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                    <TableHead className="text-right">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {promotions.map((promo) => (
                                    <TableRow key={promo.id}>
                                        <TableCell className="font-medium">{promo.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(promo.type)}
                                                {getTypeLabel(promo.type)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {promo.type === 'percentage' ? `${promo.value}%` : `฿${promo.value.toLocaleString()}`}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            {promo.code ? (
                                                <code className="bg-muted px-2 py-1 rounded">{promo.code}</code>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {promo.usageCount}{promo.usageLimit ? `/${promo.usageLimit}` : ''} ครั้ง
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isPromotionActive(promo) ? 'default' : 'secondary'}>
                                                {isPromotionActive(promo) ? 'ใช้งานได้' : 'หมดอายุ'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(promo)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(promo.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
