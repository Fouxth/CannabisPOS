import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Printer } from 'lucide-react';

interface BillItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface ReceiptData {
    billNumber: string;
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    storeTaxId?: string;
    items: BillItem[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    amountReceived: number;
    changeAmount: number;
    paymentMethod: string;
    cashierName: string;
    createdAt: string;
    promotionCode?: string;
}

interface ReceiptPrinterProps {
    data: ReceiptData;
    onPrint?: () => void;
}

export default function ReceiptPrinter({ data, onPrint }: ReceiptPrinterProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (onPrint) onPrint();

        const printContent = receiptRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>ใบเสร็จ ${data.billNumber}</title>
                <style>
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Sarabun', 'Tahoma', sans-serif;
                        font-size: 12px;
                        width: 80mm;
                        padding: 5mm;
                        background: white;
                        color: black;
                    }
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 10px;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 10px;
                    }
                    .store-name {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .store-info {
                        font-size: 10px;
                        color: #333;
                    }
                    .receipt-info {
                        margin: 10px 0;
                        font-size: 11px;
                    }
                    .receipt-info p {
                        display: flex;
                        justify-content: space-between;
                    }
                    .items-header {
                        display: flex;
                        justify-content: space-between;
                        font-weight: bold;
                        border-bottom: 1px solid #000;
                        padding-bottom: 5px;
                        margin-bottom: 5px;
                    }
                    .item-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 3px;
                    }
                    .item-name {
                        flex: 1;
                    }
                    .item-qty {
                        width: 40px;
                        text-align: center;
                    }
                    .item-price {
                        width: 60px;
                        text-align: right;
                    }
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 10px 0;
                    }
                    .totals {
                        margin: 10px 0;
                    }
                    .totals p {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 3px;
                    }
                    .totals .grand-total {
                        font-size: 14px;
                        font-weight: bold;
                        border-top: 1px solid #000;
                        padding-top: 5px;
                        margin-top: 5px;
                    }
                    .payment-info {
                        margin-top: 10px;
                        font-size: 11px;
                    }
                    .receipt-footer {
                        text-align: center;
                        margin-top: 15px;
                        font-size: 11px;
                        border-top: 1px dashed #000;
                        padding-top: 10px;
                    }
                    .thank-you {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPaymentMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
            cash: 'เงินสด',
            card: 'บัตรเครดิต/เดบิต',
            transfer: 'โอนเงิน',
            qr: 'QR Payment',
        };
        return methods[method.toLowerCase()] || method;
    };

    return (
        <div className="space-y-4">
            {/* Hidden receipt for printing */}
            <div ref={receiptRef} className="hidden print:block">
                <div className="receipt-header">
                    <div className="store-name">{data.storeName}</div>
                    {data.storeAddress && <div className="store-info">{data.storeAddress}</div>}
                    {data.storePhone && <div className="store-info">โทร: {data.storePhone}</div>}
                    {data.storeTaxId && <div className="store-info">เลขประจำตัวผู้เสียภาษี: {data.storeTaxId}</div>}
                </div>

                <div className="receipt-info">
                    <p><span>เลขที่:</span><span>{data.billNumber}</span></p>
                    <p><span>วันที่:</span><span>{formatDate(data.createdAt)}</span></p>
                    <p><span>พนักงาน:</span><span>{data.cashierName}</span></p>
                </div>

                <div className="divider"></div>

                <div className="items-header">
                    <span className="item-name">รายการ</span>
                    <span className="item-qty">จำนวน</span>
                    <span className="item-price">ราคา</span>
                </div>

                {data.items.map((item, index) => (
                    <div key={index} className="item-row">
                        <span className="item-name">{item.productName}</span>
                        <span className="item-qty">{item.quantity}</span>
                        <span className="item-price">฿{item.total.toLocaleString()}</span>
                    </div>
                ))}

                <div className="divider"></div>

                <div className="totals">
                    <p><span>รวม</span><span>฿{data.subtotal.toLocaleString()}</span></p>
                    {data.discountAmount > 0 && (
                        <p><span>ส่วนลด {data.promotionCode && `(${data.promotionCode})`}</span><span>-฿{data.discountAmount.toLocaleString()}</span></p>
                    )}
                    {data.taxAmount > 0 && (
                        <p><span>ภาษี (7%)</span><span>฿{data.taxAmount.toLocaleString()}</span></p>
                    )}
                    <p className="grand-total"><span>ยอดรวมสุทธิ</span><span>฿{data.totalAmount.toLocaleString()}</span></p>
                </div>

                <div className="payment-info">
                    <p><span>ชำระโดย:</span><span>{getPaymentMethodLabel(data.paymentMethod)}</span></p>
                    <p><span>รับเงิน:</span><span>฿{data.amountReceived.toLocaleString()}</span></p>
                    {data.changeAmount > 0 && (
                        <p><span>เงินทอน:</span><span>฿{data.changeAmount.toLocaleString()}</span></p>
                    )}
                </div>

                <div className="receipt-footer">
                    <div className="thank-you">ขอบคุณที่ใช้บริการ</div>
                    <div>Thank you for your purchase</div>
                </div>
            </div>

            {/* Print button */}
            <Button onClick={handlePrint} className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                พิมพ์ใบเสร็จ
            </Button>
        </div>
    );
}
