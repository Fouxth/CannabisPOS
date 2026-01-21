import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileText, Check, AlertTriangle, ArrowRight, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

interface ProductImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Map CSV headers to Product fields
const FIELD_MAPPING: Record<string, string[]> = {
    name: ['ชื่อสินค้า', 'product name', 'name', 'item name', 'ชื่อ'],
    price: ['ราคา', 'price', 'selling price', 'ราคาขาย'],
    cost: ['ต้นทุน', 'cost', 'cost price', 'ราคาทุน'],
    stock: ['จำนวน', 'stock', 'quantity', 'qty', 'จำนวนคงเหลือ'],
    description: ['รายละเอียด', 'description', 'desc', 'คำอธิบาย'],
    stockUnit: ['หน่วย', 'unit', 'uom', 'หน่วยนับ'],
};

// Possible target fields
const TARGET_FIELDS = [
    { value: 'name', label: 'ชื่อสินค้า (จำเป็น)' },
    { value: 'price', label: 'ราคา (จำเป็น)' },
    { value: 'cost', label: 'ต้นทุน (จำเป็น)' },
    { value: 'stock', label: 'จำนวนสต็อก' },
    { value: 'description', label: 'รายละเอียด' },
    { value: 'stockUnit', label: 'หน่วยนับ' },
    { value: 'ignore', label: 'ไม่นำเข้า' },
];

export function ProductImportDialog({ open, onOpenChange }: ProductImportDialogProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<string[][]>([]); // Raw data rows
    const [columnMapping, setColumnMapping] = useState<Record<number, string>>({}); // Index -> Field
    const [previewData, setPreviewData] = useState<Partial<Product>[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                toast.error('กรุณาอัปโหลดไฟล์ CSV เท่านั้น');
                return;
            }
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            // Simple CSV parser (accounts for quoted strings)
            const rows: string[][] = [];
            let currentRow: string[] = [];
            let currentField = '';
            let insideQuotes = false;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const nextChar = text[i + 1];

                if (char === '"') {
                    if (insideQuotes && nextChar === '"') {
                        currentField += '"';
                        i++; // Skip escape quote
                    } else {
                        insideQuotes = !insideQuotes;
                    }
                } else if (char === ',' && !insideQuotes) {
                    currentRow.push(currentField.trim());
                    currentField = '';
                } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                    if (currentField || currentRow.length > 0) {
                        currentRow.push(currentField.trim());
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                    if (char === '\r' && nextChar === '\n') i++; // Skip \n after \r
                } else {
                    currentField += char;
                }
            }
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());
                rows.push(currentRow);
            }

            if (rows.length < 2) {
                toast.error('ไฟล์ไม่มีข้อมูล');
                return;
            }

            const headerRow = rows[0];
            setHeaders(headerRow);
            setCsvData(rows.slice(1));

            // Auto-map columns
            const initialMapping: Record<number, string> = {};
            headerRow.forEach((header, index) => {
                const lowerHeader = header.toLowerCase();
                for (const [field, aliases] of Object.entries(FIELD_MAPPING)) {
                    if (aliases.some(alias => lowerHeader.includes(alias))) {
                        initialMapping[index] = field;
                        break;
                    }
                }
            });
            setColumnMapping(initialMapping);
            setStep(2);
        };
        reader.readAsText(file);
    };

    const handleMapColumn = (index: number, field: string) => {
        setColumnMapping(prev => ({ ...prev, [index]: field }));
    };

    const processPreview = () => {
        // Validate mapping
        const mappedFields = Object.values(columnMapping);
        if (!mappedFields.includes('name') || !mappedFields.includes('price')) {
            toast.error('กรุณาจับคู่คอลัมน์ "ชื่อสินค้า" และ "ราคา" อย่างน้อย');
            return;
        }

        const processed: Partial<Product>[] = csvData.map(row => {
            const item: any = {};
            Object.entries(columnMapping).forEach(([index, field]) => {
                if (field !== 'ignore' && row[Number(index)] !== undefined) {
                    let value = row[Number(index)];
                    if (field === 'price' || field === 'cost' || field === 'stock') {
                        // Remove currency symbols and commas
                        value = value.replace(/[฿,]/g, '');
                        item[field] = Number(value) || 0;
                    } else {
                        item[field] = value;
                    }
                }
            });

            // Defaults
            if (item.cost === undefined) item.cost = 0;
            if (item.stock === undefined) item.stock = 0;

            return item;
        }).filter(item => item.name); // Filter out empty rows

        setPreviewData(processed);
        setStep(3);
    };

    const handleImport = async () => {
        try {
            setIsSubmitting(true);
            const result = await api.importProducts(previewData);
            toast.success(result.message);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            onOpenChange(false);
            // Reset state
            setTimeout(() => {
                setStep(1);
                setFile(null);
                setPreviewData([]);
            }, 500);
        } catch (error: any) {
            toast.error(error.message || 'เกิดข้อผิดพลาดในการนำเข้าสินค้า');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-display">นำเข้าสินค้าจากไฟล์ CSV</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Steps Indicator */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-primary bg-primary text-white' : 'border-current'}`}>1</div>
                            <span className="ml-2 font-medium">อัปโหลด</span>
                        </div>
                        <div className={`w-16 h-0.5 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-primary bg-primary text-white' : 'border-current'}`}>2</div>
                            <span className="ml-2 font-medium">จับคู่คอลัมน์</span>
                        </div>
                        <div className={`w-16 h-0.5 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-primary bg-primary text-white' : 'border-current'}`}>3</div>
                            <span className="ml-2 font-medium">ตรวจสอบ</span>
                        </div>
                    </div>

                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                <Upload className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">อัปโหลดไฟล์ CSV</h3>
                            <p className="text-muted-foreground mb-6 text-center max-w-sm">
                                ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ (รองรับเฉพาะ .csv)
                            </p>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <Button onClick={() => fileInputRef.current?.click()} size="lg">
                                เลือกไฟล์
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Mapping */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-700">
                                <div className="mt-0.5"><AlertTriangle className="w-5 h-5" /></div>
                                <div>
                                    <p className="font-semibold">โปรดตรวจสอบการจับคู่คอลัมน์</p>
                                    <p className="text-sm">ระบบพยายามจับคู่ให้อัตโนมัติ แต่คุณสามารถแก้ไขได้ถ้าไม่ถูกต้อง</p>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-1/3">หัวข้อในไฟล์ CSV</TableHead>
                                            <TableHead className="w-1/3">ตัวอย่างข้อมูล (แถวแรก)</TableHead>
                                            <TableHead className="w-1/3">นำเข้าเป็น...</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {headers.map((header, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{header}</TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-sm max-w-[200px] truncate">
                                                    {csvData[0]?.[index] || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={columnMapping[index] || 'ignore'}
                                                        onValueChange={(val) => handleMapColumn(index, val)}
                                                    >
                                                        <SelectTrigger className={columnMapping[index] ? 'border-primary/50 bg-primary/5' : ''}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {TARGET_FIELDS.map(f => (
                                                                <SelectItem key={f.value} value={f.value}>
                                                                    {f.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">รายการที่จะนำเข้า ({previewData.length} รายการ)</h3>
                                <div className="text-sm text-muted-foreground">
                                    ตรวจสอบความถูกต้องก่อนกดบันทึก
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                        <TableRow>
                                            <TableHead>ลำดับ</TableHead>
                                            <TableHead>สินค้า</TableHead>
                                            <TableHead className="text-right">ราคา</TableHead>
                                            <TableHead className="text-right">ต้นทุน</TableHead>
                                            <TableHead className="text-right">สต็อก</TableHead>
                                            <TableHead>หน่วย</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{i + 1}</TableCell>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-right">{item.price?.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{item.cost?.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={item.stock && item.stock > 0 ? 'text-green-600' : 'text-red-500'}>
                                                        {item.stock}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{item.stockUnit || 'กรัม'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {step === 1 && (
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
                    )}

                    {step === 2 && (
                        <>
                            <Button variant="outline" onClick={() => {
                                setStep(1);
                                setFile(null);
                                setCsvData([]);
                                setHeaders([]);
                            }}>
                                <X className="w-4 h-4 mr-2" />
                                ยกเลิกไฟล์
                            </Button>
                            <Button onClick={processPreview} className="gap-2">
                                ถัดไป <ArrowRight className="w-4 h-4" />
                            </Button>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <Button variant="outline" onClick={() => setStep(2)}>
                                ย้อนกลับ
                            </Button>
                            <Button onClick={handleImport} disabled={isSubmitting} className="gap-2 gradient-primary text-white shadow-glow">
                                {isSubmitting ? (
                                    <>กำลังบันทึก...</>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        ยืนยันการนำเข้า
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
