import { Bill } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillReceiptProps {
    bill: Bill;
    onClose?: () => void;
    showCloseButton?: boolean;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

export function BillReceipt({ bill, onClose, showCloseButton = false }: BillReceiptProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="relative">
            {/* Action Buttons - Hidden when printing */}
            <div className="flex gap-2 mb-4 print:hidden">
                <Button onClick={handlePrint} className="flex-1">
                    <Printer className="h-4 w-4 mr-2" />
                    พิมพ์บิล
                </Button>
                {showCloseButton && onClose && (
                    <Button variant="outline" onClick={onClose}>
                        <X className="h-4 w-4 mr-2" />
                        ปิด
                    </Button>
                )}
            </div>

            {/* Receipt */}
            <Card className="max-w-md mx-auto print:shadow-none print:border-0">
                <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold font-display">CannabisPOS</h1>
                        <p className="text-sm text-muted-foreground">ระบบจัดการร้าน</p>
                        <Separator />
                    </div>

                    {/* Bill Info */}
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">เลขที่บิล:</span>
                            <span className="font-mono font-semibold">{bill.billNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">วันที่:</span>
                            <span>{formatDate(bill.createdAt)}</span>
                        </div>
                        {bill.user && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">พนักงาน:</span>
                                <span>{bill.user.fullName}</span>
                            </div>
                        )}
                        {bill.customerName && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">ลูกค้า:</span>
                                <span>{bill.customerName}</span>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Items */}
                    <div className="space-y-3">
                        {bill.items.map((item) => (
                            <div key={item.id} className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="font-medium">{item.productName}</span>
                                    <span className="font-semibold">฿{formatCurrency(item.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground pl-2">
                                    <span>
                                        {item.quantity} x ฿{formatCurrency(item.unitPrice)}
                                        {item.discount > 0 && ` (ส่วนลด ฿${formatCurrency(item.discount)})`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    {/* Summary */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">ยอดรวม:</span>
                            <span>฿{formatCurrency(bill.subtotal)}</span>
                        </div>
                        {bill.discountAmount > 0 && (
                            <div className="flex justify-between text-destructive">
                                <span>
                                    ส่วนลด {bill.discountPercent > 0 && `(${bill.discountPercent}%)`}:
                                </span>
                                <span>-฿{formatCurrency(bill.discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">VAT 7%:</span>
                            <span>฿{formatCurrency(bill.taxAmount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>รวมทั้งสิ้น:</span>
                            <span className="text-primary">฿{formatCurrency(bill.totalAmount)}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Payment Info */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">ช่องทางชำระเงิน:</span>
                            <span className="font-medium capitalize">{bill.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">จำนวนเงินที่รับ:</span>
                            <span>฿{formatCurrency(bill.amountReceived)}</span>
                        </div>
                        {bill.changeAmount > 0 && (
                            <div className="flex justify-between text-success">
                                <span>เงินทอน:</span>
                                <span className="font-semibold">฿{formatCurrency(bill.changeAmount)}</span>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {bill.notes && (
                        <>
                            <Separator />
                            <div className="text-sm">
                                <p className="text-muted-foreground mb-1">หมายเหตุ:</p>
                                <p>{bill.notes}</p>
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="text-center text-sm text-muted-foreground pt-4">
                        <p>ขอบคุณที่ใช้บริการ</p>
                        <p className="text-xs mt-1">โปรดเก็บบิลนี้ไว้เป็นหลักฐาน</p>
                    </div>

                    {/* Status Badge */}
                    {bill.status === 'voided' && (
                        <div className="text-center">
                            <span className="inline-block px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-semibold">
                                บิลถูกยกเลิก
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
