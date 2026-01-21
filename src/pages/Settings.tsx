import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Receipt,
  CreditCard,
  Bell,
  MessageSquare,
  Banknote,
  ArrowRightLeft,
  QrCode,
  Database,
  Download,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import {
  AppNotificationSettings,
  PaymentMethod,
  PosSettings,
  SettingsResponse,
  SmsSettings,
  StoreSettings,
} from '@/types';

const paymentDescriptions: Record<string, string> = {
  cash: 'รับชำระด้วยเงินสด',
  card: 'รับชำระด้วยบัตรเครดิต/เดบิต',
  transfer: 'รับโอนเงินผ่านธนาคาร',
  qr: 'รับชำระผ่าน QR Code',
};

const paymentIcons: Record<string, typeof CreditCard> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowRightLeft,
  qr: QrCode,
};

const LoadingState = () => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-12 w-1/3" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-[300px] w-full" />
  </div>
);

type SettingsSection = 'store' | 'pos' | 'sms' | 'notifications';

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
  });
  const { data: paymentMethods = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: api.getPaymentMethods,
  });

  const [storeForm, setStoreForm] = useState<StoreSettings>();
  const [posForm, setPosForm] = useState<PosSettings>();
  const [smsForm, setSmsForm] = useState<SmsSettings>();
  const [notificationForm, setNotificationForm] = useState<AppNotificationSettings>();
  const [smsRecipientsText, setSmsRecipientsText] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreForm(settings.store);
      setPosForm(settings.pos);
      setSmsForm(settings.sms);
      setNotificationForm(settings.notifications);
      setSmsRecipientsText(settings.sms.recipients.join(', '));
    }
  }, [settings]);

  const settingMutation = useMutation({
    mutationFn: ({ section, data }: { section: SettingsSection; data: any }) =>
      api.updateSettings(section, data),
    onSuccess: (_result, variables) => {
      queryClient.setQueryData<SettingsResponse>(['settings'], (prev) =>
        prev ? { ...prev, [variables.section]: variables.data } : prev
      );
      toast.success('บันทึกการตั้งค่าสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updatePaymentMethod(id, { isActive }),
    onSuccess: (_result, variables) => {
      queryClient.setQueryData<PaymentMethod[]>(['payment-methods'], (prev) =>
        prev
          ? prev.map((method) =>
            method.id === variables.id ? { ...method, isActive: variables.isActive } : method
          )
          : prev
      );
      toast.success('อัปเดตช่องทางการชำระเงินแล้ว');
    },
    onError: (error: Error) => toast.error(error.message || 'ไม่สามารถอัปเดตช่องทางการชำระเงินได้'),
  });

  const handleSave = (section: SettingsSection) => {
    if (section === 'store' && storeForm) {
      settingMutation.mutate({ section, data: storeForm });
    } else if (section === 'pos' && posForm) {
      settingMutation.mutate({
        section,
        data: {
          ...posForm,
          taxRate: Number(posForm.taxRate) || 0,
          maxDiscountCashier: Number(posForm.maxDiscountCashier) || 0,
          maxDiscountManager: Number(posForm.maxDiscountManager) || 0,
        },
      });
    } else if (section === 'sms' && smsForm) {
      const recipients = smsRecipientsText
        .split(',')
        .map((recipient) => recipient.trim())
        .filter(Boolean);
      settingMutation.mutate({
        section,
        data: { ...smsForm, recipients },
      });
    } else if (section === 'notifications' && notificationForm) {
      settingMutation.mutate({ section, data: notificationForm });
    }
  };

  const handleSendTestSms = async () => {
    try {
      await api.sendTestSms();
      toast.success('ส่ง SMS ทดสอบสำเร็จ');
    } catch (error: any) {
      toast.error(error.message || 'ไม่สามารถส่ง SMS ทดสอบได้');
    }
  };

  const backupMutation = useMutation({
    mutationFn: api.backupData,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cannabispos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'ไม่สามารถสำรองข้อมูลได้');
    },
  });

  const resetMutation = useMutation({
    mutationFn: api.resetData,
    onSuccess: () => {
      toast.success('รีเซ็ตข้อมูลสำเร็จ');
      queryClient.invalidateQueries(); // Invalidate all queries to refetch data
    },
    onError: (error: Error) => {
      toast.error(error.message || 'ไม่สามารถรีเซ็ตข้อมูลได้');
    },
  });

  const handleBackup = () => {
    backupMutation.mutate();
  };

  const handleResetData = () => {
    setIsResetConfirmOpen(false);
    resetMutation.mutate();
  };

  const isLoading =
    isLoadingSettings ||
    !storeForm ||
    !posForm ||
    !smsForm ||
    !notificationForm;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground">จัดการการตั้งค่าร้านค้าและระบบ</p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 h-auto gap-2">
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">ข้อมูลร้าน</span>
          </TabsTrigger>
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">POS</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">การชำระเงิน</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">LINE BOT</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">แจ้งเตือน</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">จัดการข้อมูล</span>
          </TabsTrigger>
        </TabsList>

        {/* Store Settings */}
        <TabsContent value="store" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display">ข้อมูลร้านค้า</CardTitle>
              <CardDescription>ข้อมูลพื้นฐานของร้าน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">ชื่อร้าน</Label>
                  <Input
                    id="storeName"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                  />
                </div>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    value={storeForm.phone ?? ''}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={storeForm.email ?? ''}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Textarea
                  id="address"
                  rows={2}
                  value={storeForm.address ?? ''}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                {/* <div className="space-y-2">
                  <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
                  <Input
                    id="taxId"
                    value={storeForm.taxId ?? ''}
                    onChange={(e) => setStoreForm({ ...storeForm, taxId: e.target.value })}
                    placeholder="เช่น 0123456789012"
                  />
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="dayClosingTime">เวลาปิดรอบยอดขายรายวัน (Reset Time)</Label>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id="dayClosingTime"
                      type="time"
                      value={storeForm.dayClosingTime || "00:00"}
                      onChange={(e) =>
                        setStoreForm({ ...storeForm, dayClosingTime: e.target.value })
                      }
                      className="w-full sm:w-full"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      ยอดขายจะถูกรีเซ็ตตามเวลานี้ (เหมาะสำหรับร้านที่ปิดดึกหลังเที่ยงคืน)
                    </p>
                  </div>
                </div>
              </div>


            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => handleSave('store')}
              className="gradient-primary text-primary-foreground shadow-glow"
              disabled={settingMutation.isPending}
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        </TabsContent>

        {/* POS Settings */}
        <TabsContent value="pos" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display">ตั้งค่า POS</CardTitle>
              <CardDescription>ปรับแต่งการทำงานของระบบขาย</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">รูปแบบหมายเลขบิล</Label>
                  <Input
                    id="invoicePrefix"
                    value={posForm.invoicePrefix}
                    onChange={(e) => setPosForm({ ...posForm, invoicePrefix: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">เช่น POS-20250101-00001</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">อัตราภาษี (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={posForm.taxRate}
                    onChange={(e) =>
                      setPosForm({ ...posForm, taxRate: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="vatEnabled"
                  checked={posForm.vatEnabled}
                  onCheckedChange={(checked) => setPosForm({ ...posForm, vatEnabled: checked })}
                />
                <Label htmlFor="vatEnabled">คิดภาษีมูลค่าเพิ่ม (VAT 7%)</Label>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxDiscountCashier">ส่วนลดสูงสุด (%) สำหรับ Cashier</Label>
                  <Input
                    id="maxDiscountCashier"
                    type="number"
                    value={posForm.maxDiscountCashier}
                    onChange={(e) =>
                      setPosForm({
                        ...posForm,
                        maxDiscountCashier: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDiscountManager">ส่วนลดสูงสุด (%) สำหรับ Manager</Label>
                  <Input
                    id="maxDiscountManager"
                    type="number"
                    value={posForm.maxDiscountManager}
                    onChange={(e) =>
                      setPosForm({
                        ...posForm,
                        maxDiscountManager: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>แสดงราคาทุน</Label>
                    <p className="text-sm text-muted-foreground">
                      แสดงราคาทุนสินค้าในหน้า POS (เฉพาะ Manager ขึ้นไป)
                    </p>
                  </div>
                  <Switch
                    checked={posForm.showCostPrice}
                    onCheckedChange={(checked) =>
                      setPosForm({ ...posForm, showCostPrice: checked })
                    }
                  />
                </div>



                <div className="flex items-center justify-between">
                  <div>
                    <Label>พิมพ์ใบเสร็จอัตโนมัติ</Label>
                    <p className="text-sm text-muted-foreground">พิมพ์ใบเสร็จทันทีหลังชำระเงิน</p>
                  </div>
                  <Switch
                    checked={posForm.autoPrintReceipt}
                    onCheckedChange={(checked) =>
                      setPosForm({ ...posForm, autoPrintReceipt: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => handleSave('pos')}
              className="gradient-primary text-primary-foreground shadow-glow"
              disabled={settingMutation.isPending}
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display">ช่องทางการชำระเงิน</CardTitle>
              <CardDescription>จัดการช่องทางการรับชำระเงิน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPayments ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                paymentMethods.map((method) => {
                  const Icon = paymentIcons[method.type] ?? CreditCard;
                  return (
                    <div key={method.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {paymentDescriptions[method.type] || ''}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={method.isActive}
                        onCheckedChange={(checked) =>
                          paymentMutation.mutate({ id: method.id, isActive: checked })
                        }
                        disabled={paymentMutation.isPending}
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LINE Settings */}
        <TabsContent value="sms" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">การแจ้งเตือน LINE</CardTitle>
                  <CardDescription>จัดการการแจ้งเตือนผ่าน LINE Official Account</CardDescription>
                </div>
                <Badge variant={smsForm.enabled ? 'default' : 'secondary'}>
                  {smsForm.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label>เปิดใช้งานแจ้งเตือน</Label>
                  <p className="text-sm text-muted-foreground">ส่งการแจ้งเตือนผ่าน LINE</p>
                </div>
                <Switch
                  checked={smsForm.enabled}
                  onCheckedChange={(checked) => setSmsForm({ ...smsForm, enabled: checked })}
                />
              </div>

              {smsForm.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lineUserId">LINE User ID (สำหรับรับแจ้งเตือน)</Label>
                    <Input
                      id="lineUserId"
                      value={smsRecipientsText}
                      onChange={(e) => setSmsRecipientsText(e.target.value)}
                      placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <p className="text-xs text-muted-foreground">
                      ใส่ User ID ของคนที่ต้องการให้แจ้งเตือน (ไม่ใช่ LINE ID ทั่วไป)
                    </p>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(smsForm.alerts).map(([key, value]) => {
                      const alertConfig: Record<string, { title: string; description: string; icon: string; color: string }> = {
                        lowStock: {
                          title: 'แจ้งเตือนสินค้าใกล้หมด',
                          description: 'ส่งข้อความเมื่อสินค้าต่ำกว่าจำนวนขั้นต่ำ',
                          icon: '📦',
                          color: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
                        },
                        dailySummary: {
                          title: 'สรุปยอดขายประจำวัน',
                          description: `ส่งสรุปยอดขายทุกวัน เวลา ${storeForm.dayClosingTime || '00:00'}`,
                          icon: '📊',
                          color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
                        },
                        realtimeSales: {
                          title: 'แจ้งเตือนการขาย Real-time',
                          description: 'ส่งข้อความทุกครั้งที่มีการขาย',
                          icon: '💰',
                          color: 'from-green-500/20 to-green-500/5 border-green-500/30',
                        },
                        monthlySummary: {
                          title: 'สรุปยอดขายประจำเดือน',
                          description: 'ส่งสรุปยอดขายทุกสิ้นเดือน',
                          icon: '📅',
                          color: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
                        },
                        stockAdjustments: {
                          title: 'แจ้งเตือนการปรับสต็อก',
                          description: 'ส่งข้อความเมื่อมีการปรับปรุงสต็อก',
                          icon: '🔄',
                          color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
                        },
                      };
                      const config = alertConfig[key] ?? { title: key, description: '', icon: '🔔', color: 'from-primary/20 to-primary/5 border-primary/30' };
                      return (
                        <div
                          key={key}
                          className={`rounded-xl border p-4 bg-gradient-to-br ${config.color} transition-all hover:shadow-lg`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-2xl">{config.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-sm truncate">{config.title}</h4>
                                <Switch
                                  checked={value}
                                  onCheckedChange={(checked) =>
                                    setSmsForm({
                                      ...smsForm,
                                      alerts: { ...smsForm.alerts, [key]: checked },
                                    })
                                  }
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">{config.description}</p>
                              {value && (
                                <Badge variant="secondary" className="mt-2 text-[10px] bg-green-500/20 text-green-600 border-green-500/30">
                                  เปิดใช้งาน
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            {smsForm.enabled && (
              <Button variant="outline" onClick={handleSendTestSms}>
                ส่งข้อความทดสอบ
              </Button>
            )}
            <Button
              onClick={() => handleSave('sms')}
              className="gradient-primary text-primary-foreground shadow-glow"
              disabled={settingMutation.isPending}
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display">การแจ้งเตือนในระบบ</CardTitle>
              <CardDescription>ตั้งค่าการแจ้งเตือนภายในแอปพลิเคชัน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">แจ้งเตือนสินค้าใกล้หมด</p>
                  <p className="text-sm text-muted-foreground">แสดงการแจ้งเตือนเมื่อสินค้าต่ำกว่าจำนวนขั้นต่ำ</p>
                </div>
                <Switch
                  checked={notificationForm.lowStock}
                  onCheckedChange={(checked) =>
                    setNotificationForm({ ...notificationForm, lowStock: checked })
                  }
                />
              </div>

              <div className="space-y-3 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">แจ้งเตือนยอดขายถึงเป้า</p>
                    <p className="text-sm text-muted-foreground">แสดงการแจ้งเตือนเมื่อยอดขายถึงเป้าหมาย</p>
                  </div>
                  <Switch
                    checked={(notificationForm as any).salesTarget ?? false}
                    onCheckedChange={(checked) =>
                      setNotificationForm({ ...notificationForm, salesTarget: checked } as any)
                    }
                  />
                </div>
                {notificationForm.salesTarget && (
                  <div className="pt-3 border-t">
                    <Label htmlFor="salesTargetAmount">เป้าหมายยอดขายรายวัน (บาท)</Label>
                    <Input
                      id="salesTargetAmount"
                      type="number"
                      className="mt-2"
                      placeholder="เช่น 10000"
                      value={(notificationForm as any).salesTargetAmount || ''}
                      onChange={(e) =>
                        setNotificationForm({
                          ...notificationForm,
                          salesTargetAmount: Number(e.target.value) || 0,
                        } as any)
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ระบบจะแจ้งเตือนเมื่อยอดขายวันนี้ถึงเป้าหมายที่ตั้งไว้
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">เสียงแจ้งเตือน</p>
                  <p className="text-sm text-muted-foreground">เปิดเสียงเมื่อมีการแจ้งเตือน</p>
                </div>
                <Switch
                  checked={false}
                  onCheckedChange={() =>
                    toast.info('ฟีเจอร์นี้กำลังอยู่ในระหว่างการพัฒนา (Coming Soon)')
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => handleSave('notifications')}
              className="gradient-primary text-primary-foreground shadow-glow"
              disabled={settingMutation.isPending}
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display">สำรองข้อมูล</CardTitle>
              <CardDescription>
                สำรองข้อมูลร้านค้า สินค้า และการตั้งค่าต่างๆ (ไม่รวมข้อมูลการขาย)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleBackup}
                disabled={backupMutation.isPending}
              >
                {backupMutation.isPending ? (
                  'กำลังดาวน์โหลด...'
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    ดาวน์โหลดไฟล์สำรองข้อมูล
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
