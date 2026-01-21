import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Calendar, Banknote, CreditCard, ArrowRightLeft, QrCode, FileText, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillReceipt } from '@/components/BillReceipt';
import { Bill } from '@/types';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthPicker } from '@/components/MonthPicker';

type DateFilter = 'today' | 'custom' | 'month' | 'year' | 'all';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const paymentIcons: Record<string, typeof Banknote> = {
    cash: Banknote,
    card: CreditCard,
    transfer: ArrowRightLeft,
    qr: QrCode,
};

import { useAuth } from '@/hooks/useAuth';

export default function Bills() {
    const { user } = useAuth();

    const { data: bills = [], isLoading } = useQuery({
        queryKey: ['bills', user?.storeId],
        queryFn: api.getBills,
        enabled: !!user?.storeId,
    });
    const { data: systemSettings } = useQuery({
        queryKey: ['settings', user?.storeId],
        queryFn: api.getSettings,
        enabled: !!user?.storeId,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [showBillDialog, setShowBillDialog] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

    // Filter bills by date
    const dateFilteredBills = useMemo(() => {
        const now = new Date();
        const closingTime = systemSettings?.store?.dayClosingTime || '00:00';
        const [closeHour, closeMinute] = closingTime.split(':').map(Number);

        const getBusinessDate = (date: Date) => {
            const businessDate = new Date(date);
            if (date.getHours() < closeHour || (date.getHours() === closeHour && date.getMinutes() < closeMinute)) {
                businessDate.setDate(businessDate.getDate() - 1);
            }
            return businessDate;
        };

        const currentBusinessDate = getBusinessDate(now);

        return bills.filter((bill) => {
            const billDate = new Date(bill.createdAt);
            const billBusinessDate = getBusinessDate(billDate);

            switch (dateFilter) {
                case 'today':
                    return billBusinessDate.toDateString() === currentBusinessDate.toDateString();

                case 'custom':
                    // selectedDate is YYYY-MM-DD string
                    const targetDate = new Date(selectedDate);
                    return billBusinessDate.getFullYear() === targetDate.getFullYear() &&
                        billBusinessDate.getMonth() === targetDate.getMonth() &&
                        billBusinessDate.getDate() === targetDate.getDate();

                case 'month':
                    return billBusinessDate.getMonth() === selectedMonth.getMonth() &&
                        billBusinessDate.getFullYear() === selectedMonth.getFullYear();

                case 'year':
                    return billBusinessDate.getFullYear() === now.getFullYear();

                case 'all':
                default:
                    return true;
            }
        });
    }, [bills, dateFilter, selectedDate, selectedMonth, systemSettings]);

    const filteredBills = useMemo(() => {
        return dateFilteredBills.filter((bill) => {
            const matchesSearch = !searchQuery ||
                bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bill.user?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bill.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [dateFilteredBills, searchQuery]);

    const handleViewBill = (bill: Bill) => {
        setSelectedBill(bill);
        setShowBillDialog(true);
    };

    // Calculate revenue based on date filter
    const { revenue, billCount, periodLabel } = useMemo(() => {
        const completedBills = dateFilteredBills.filter((bill) => bill.status === 'completed');
        const totalRevenue = completedBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

        let label = '';
        switch (dateFilter) {
            case 'today':
                label = 'วันนี้';
                break;
            case 'custom':
                const customDate = new Date(selectedDate);
                label = new Intl.DateTimeFormat('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }).format(customDate);
                break;
            case 'month':
                label = new Intl.DateTimeFormat('th-TH', {
                    month: 'long',
                    year: 'numeric'
                }).format(selectedMonth);
                break;
            case 'year':
                label = 'ปีนี้';
                break;
            case 'all':
                label = 'ทั้งหมด';
                break;
        }

        return {
            revenue: totalRevenue,
            billCount: completedBills.length,
            periodLabel: label
        };
    }, [dateFilteredBills, dateFilter, selectedDate]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold font-display">บิล</h1>
                <p className="text-muted-foreground">ประวัติบิลทั้งหมด</p>
            </div>

            {/* Date Filter Tabs */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">ช่วงเวลา</h3>
                        </div>
                        <Tabs value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)} className="w-full sm:w-auto">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="today" className="text-xs sm:text-sm">วันนี้</TabsTrigger>
                                <TabsTrigger value="custom" className="text-xs sm:text-sm">เลือกวัน</TabsTrigger>
                                <TabsTrigger value="month" className="text-xs sm:text-sm">เลือกเดือน</TabsTrigger>
                                {/* <TabsTrigger value="year" className="text-xs sm:text-sm">ปีนี้</TabsTrigger> */}
                                <TabsTrigger value="all" className="text-xs sm:text-sm">ทั้งหมด</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    {dateFilter === 'custom' && (
                        <div className="mt-4">
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full sm:w-auto"
                            />
                        </div>
                    )}
                    {dateFilter === 'month' && (
                        <div className="mt-4">
                            <MonthPicker
                                currentDate={selectedMonth}
                                onDateChange={setSelectedMonth}
                            />
                        </div>
                    )}
                </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">จำนวนบิล ({periodLabel})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{billCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">จากทั้งหมด {bills.length} บิล</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">ยอดขาย ({periodLabel})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">฿{formatCurrency(revenue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            เฉลี่ย ฿{formatCurrency(billCount > 0 ? revenue / billCount : 0)} ต่อบิล
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาเลขที่บิล, พนักงาน, ลูกค้า..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Bills List */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-display">รายการบิล</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredBills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 opacity-50" />
                            <p>ไม่พบบิล</p>
                            {searchQuery && <p className="text-sm">ลองค้นหาด้วยคำอื่น</p>}
                        </div>
                    ) : (
                        <ScrollArea className="h-[600px]">
                            <div className="space-y-3">
                                {filteredBills.map((bill, index) => {
                                    const PaymentIcon = paymentIcons[bill.paymentMethod] || Banknote;
                                    if (isLoading) {
                                        return (
                                            <div className="space-y-4">
                                                <Skeleton className="h-10 w-32" />
                                                <Skeleton className="h-24 w-full" />
                                                <Skeleton className="h-[400px] w-full" />
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={bill.id}
                                            className={cn(
                                                'flex flex-col md:flex-row items-stretch md:items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors animate-slide-in-right',
                                                bill.status === 'voided' && 'opacity-50'
                                            )}
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            {/* Top Section: Icon + Info */}
                                            <div className="flex items-start gap-4 flex-1">
                                                {/* Bill Icon */}
                                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 shrink-0">
                                                    <FileText className="h-6 w-6 text-primary" />
                                                </div>

                                                {/* Bill Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold font-mono">{bill.billNumber}</p>
                                                        {bill.status === 'voided' && (
                                                            <Badge variant="destructive" className="text-xs">ยกเลิก</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(bill.createdAt)}
                                                        </span>
                                                        {bill.user && (
                                                            <span className="hidden sm:inline">•</span>
                                                        )}
                                                        {bill.user && (
                                                            <span>พนง: {bill.user.fullName}</span>
                                                        )}
                                                    </div>
                                                    {bill.customerName && (
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            <span>ลูกค้า: {bill.customerName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Section: Payment + Amount + Action */}
                                            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pl-[4rem] md:pl-0">
                                                {/* Payment Method */}
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted shrink-0">
                                                    <PaymentIcon className="h-4 w-4" />
                                                    <span className="text-sm capitalize hidden sm:inline">{bill.paymentMethod}</span>
                                                </div>

                                                {/* Amount & Button */}
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-primary">
                                                            ฿{formatCurrency(bill.totalAmount)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground hidden sm:block">
                                                            {bill.items.length} รายการ
                                                        </p>
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleViewBill(bill)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            {/* Bill Dialog */}
            <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-display">รายละเอียดบิล</DialogTitle>
                    </DialogHeader>
                    {selectedBill && (
                        <BillReceipt
                            bill={selectedBill}
                            storeName={systemSettings?.store?.storeName}
                            onClose={() => setShowBillDialog(false)}
                            showCloseButton={false}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
