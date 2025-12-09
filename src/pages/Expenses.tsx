import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreVertical, Trash2, Calendar, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Expense } from '@/types';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const EXPENSE_CATEGORIES = [
    { value: 'rent', label: 'ค่าเช่า', color: '#f59e0b' },
    { value: 'utilities', label: 'ค่าสาธารณูปโภค', color: '#3b82f6' },
    { value: 'salary', label: 'เงินเดือน', color: '#8b5cf6' },
    { value: 'supplies', label: 'วัสดุสิ้นเปลือง', color: '#10b981' },
    { value: 'marketing', label: 'การตลาด', color: '#ec4899' },
    { value: 'other', label: 'อื่นๆ', color: '#6b7280' },
];

export default function Expenses() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedCategoryValue, setSelectedCategoryValue] = useState('other'); // For add dialog
    const { user } = useAuth(); // Get logged-in user

    const queryClient = useQueryClient();

    const { data: expenses = [], isLoading } = useQuery({
        queryKey: ['expenses'],
        queryFn: () => api.getExpenses(),
    });

    const createMutation = useMutation({
        mutationFn: api.createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            toast.success('บันทึกรายจ่ายสำเร็จ');
            setShowAddDialog(false);
            setSelectedCategoryValue('other'); // Reset category
        },
        onError: (error: any) => {
            toast.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกรายจ่าย');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            toast.success('ลบรายจ่ายสำเร็จ');
        },
        onError: (error: any) => {
            toast.error(error.message || 'เกิดข้อผิดพลาดในการลบรายจ่าย');
        },
    });

    const filteredExpenses = useMemo(() => {
        return expenses.filter((expense) => {
            const matchesSearch = !searchQuery ||
                expense.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [expenses, searchQuery, selectedCategory]);

    const totalExpenses = useMemo(() => {
        return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, [filteredExpenses]);

    const handleDeleteExpense = (expense: Expense) => {
        if (confirm(`คุณต้องการลบรายจ่าย "${expense.title}" ใช่หรือไม่?`)) {
            deleteMutation.mutate(expense.id);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user?.id) {
            toast.error('ไม่พบข้อมูลผู้ใช้');
            return;
        }
        const form = e.currentTarget;
        const data: Partial<Expense> = {
            title: (form.elements.namedItem('title') as HTMLInputElement).value,
            amount: parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value),
            category: selectedCategoryValue as Expense['category'], // Use state instead of form element
            date: (form.elements.namedItem('date') as HTMLInputElement).value,
            notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value || undefined,
            userId: user.id, // Use logged-in user's ID
        };
        createMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display">รายจ่าย</h1>
                    <p className="text-muted-foreground">จัดการรายจ่ายทั้งหมด {expenses.length} รายการ</p>
                </div>
                <Button onClick={() => setShowAddDialog(true)} className="gradient-primary text-primary-foreground shadow-glow">
                    <Plus className="h-4 w-4 mr-2" />
                    บันทึกรายจ่าย
                </Button>
            </div>

            {/* Summary Card */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">รายจ่ายรวม</CardTitle>
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">฿{formatCurrency(totalExpenses)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            จากรายการที่แสดง {filteredExpenses.length} รายการ
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="glass">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหารายจ่าย..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="หมวดหมู่ทั้งหมด" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">หมวดหมู่ทั้งหมด</SelectItem>
                                {EXPENSE_CATEGORIES.map((category) => (
                                    <SelectItem key={category.value} value={category.value}>
                                        {category.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Expenses Table */}
            <Card className="glass">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>วันที่</TableHead>
                                <TableHead>รายละเอียด</TableHead>
                                <TableHead>หมวดหมู่</TableHead>
                                <TableHead className="text-right">จำนวนเงิน</TableHead>
                                <TableHead>ผู้บันทึก</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        ไม่พบรายจ่าย
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExpenses.map((expense, index) => {
                                    const category = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);

                                    return (
                                        <TableRow
                                            key={expense.id}
                                            className="animate-fade-in"
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {formatDate(expense.date)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{expense.title}</p>
                                                    {expense.notes && (
                                                        <p className="text-sm text-muted-foreground">{expense.notes}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {category && (
                                                    <Badge
                                                        variant="secondary"
                                                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                                                    >
                                                        {category.label}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-rose-600">
                                                -฿{formatCurrency(expense.amount)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {expense.user?.fullName || 'ไม่ระบุ'}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDeleteExpense(expense)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            ลบ
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Expense Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-display text-xl">บันทึกรายจ่าย</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">รายละเอียด *</Label>
                                <Input id="title" name="title" placeholder="เช่น ค่าเช่าร้าน, ค่าไฟ" required />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">จำนวนเงิน *</Label>
                                    <Input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">วันที่ *</Label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">หมวดหมู่ *</Label>
                                <Select value={selectedCategoryValue} onValueChange={setSelectedCategoryValue}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกหมวดหมู่" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXPENSE_CATEGORIES.map((category) => (
                                            <SelectItem key={category.value} value={category.value}>
                                                {category.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="category" value={selectedCategoryValue} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">หมายเหตุ</Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="รายละเอียดเพิ่มเติม..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                                ยกเลิก
                            </Button>
                            <Button type="submit" className="gradient-primary text-primary-foreground">
                                บันทึก
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
