import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Phone, Award, History, Edit, Plus, Minus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [pointsChange, setPointsChange] = useState('');
  const [pointsReason, setPointsReason] = useState('');

  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: () => api.getCustomers(searchQuery),
  });

  const createMutation = useMutation({
    mutationFn: api.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('เพิ่มข้อมูลสมาชิกสำเร็จ');
      setShowAddDialog(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการสร้างสมาชิก');
    },
  });

  const pointsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.adjustCustomerPoints(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('ปรับปรุงแต้มสะสมเรียบร้อยแล้ว');
      setShowPointsDialog(false);
      setSelectedCustomer(null);
      setPointsChange('');
      setPointsReason('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการปรับปรุงแต้ม');
    },
  });

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: String(formData.get('name') || ''),
      phone: String(formData.get('phone') || ''),
      email: String(formData.get('email') || '') || undefined,
      lineUserId: String(formData.get('lineUserId') || '') || undefined,
      lineDisplayName: String(formData.get('lineDisplayName') || '') || undefined,
      notes: String(formData.get('notes') || '') || undefined,
    };
    createMutation.mutate(data);
  };

  const handlePointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !pointsChange) return;
    pointsMutation.mutate({
      id: selectedCustomer.id,
      data: {
        pointsChange: parseInt(pointsChange),
        reason: pointsReason || 'ปรับปรุงแต้มโดยผู้ดูแลระบบ',
      },
    });
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
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            ระบบสมาชิก & สะสมแต้ม LINE
          </h1>
          <p className="text-muted-foreground">จัดการข้อมูลสมาชิก ค้นหาเบอร์ และประวัติการสะสมแต้ม</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gradient-primary text-primary-foreground shadow-glow">
          <UserPlus className="h-4 w-4 mr-2" />
          เพิ่มสมาชิกใหม่
        </Button>
      </div>

      {/* Filter */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสมาชิกด้วยชื่อ, เบอร์โทรศัพท์ หรือ LINE Display Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {customers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            ไม่พบข้อมูลสมาชิก
          </div>
        ) : (
          customers.map((c: any) => (
            <Card key={c.id} className="glass hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-primary/10 rounded-full blur-xl pointer-events-none" />
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{c.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 flex items-center gap-1">
                    <Award className="h-3 w-3" /> {c.points} แต้ม
                  </Badge>
                </div>

                {c.lineDisplayName && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-md">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>LINE: {c.lineDisplayName}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/40">
                  <div>
                    <span className="text-muted-foreground">ยอดซื้อรวม: </span>
                    <span className="font-semibold text-foreground">฿{Number(c.totalSpent || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">จำนวนบิล: </span>
                    <span className="font-semibold text-foreground">{c._count?.bills || 0} บิล</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1"
                    onClick={() => { setSelectedCustomer(c); setShowPointsDialog(true); }}
                  >
                    <Plus className="h-3.5 w-3.5 text-success" /> / <Minus className="h-3.5 w-3.5 text-destructive" /> ปรับแต้ม
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">เพิ่มสมาชิกใหม่</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ-นามสกุล / ชื่อเล่น *</Label>
              <Input id="name" name="name" placeholder="เช่น คุณสมชาย (GreenHouse)" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
              <Input id="phone" name="phone" placeholder="0812345678" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lineDisplayName">ชื่อใน LINE (ถ้ามี)</Label>
              <Input id="lineDisplayName" name="lineDisplayName" placeholder="เช่น Somchai_Line" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lineUserId">LINE User ID (สำหรับส่งข้อความแต้มอัตโนมัติ)</Label>
              <Input id="lineUserId" name="lineUserId" placeholder="U1234567890abcdef..." />
              <p className="text-[11px] text-muted-foreground">สามารถรับได้เมื่อลูกค้าทัก LINE OA ของร้าน</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">หมายเหตุเพิ่มเติม</Label>
              <Textarea id="notes" name="notes" placeholder="เช่น ลูกค้าประจำ ชอบสายพันธุ์ Sativa" rows={2} />
            </div>
            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground">
                บันทึกสมาชิก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">ปรับปรุงแต้มสะสม</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <form onSubmit={handlePointsSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/10 space-y-1">
                <p className="font-bold">{selectedCustomer.name}</p>
                <p className="text-xs text-muted-foreground">เบอร์โทรศัพท์: {selectedCustomer.phone}</p>
                <p className="text-sm font-semibold text-primary mt-1">แต้มสะสมปัจจุบัน: {selectedCustomer.points} แต้ม</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsChange">จำนวนแต้มที่ต้องการปรับ (ใส่ติดลบเพื่อหักแต้ม)</Label>
                <Input
                  id="pointsChange"
                  type="number"
                  placeholder="เช่น 50 หรือ -20"
                  value={pointsChange}
                  onChange={(e) => setPointsChange(e.target.value)}
                  className="text-xl h-12 text-center font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsReason">เหตุผลในการปรับแต้ม</Label>
                <Input
                  id="pointsReason"
                  placeholder="เช่น โปรโมชันวันเกิด, ชดเชยสินค้า"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setShowPointsDialog(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="gradient-primary text-primary-foreground">
                  ยืนยันปรับแต้ม
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
