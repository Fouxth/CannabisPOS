import { useState } from 'react';
import { Store, Receipt, CreditCard, Bell, MessageSquare, Shield, Database, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function Settings() {
  const [smsEnabled, setSmsEnabled] = useState(true);

  const handleSave = () => {
    toast.success('บันทึกการตั้งค่าสำเร็จ');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground">จัดการการตั้งค่าร้านค้าและระบบ</p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 h-auto gap-2">
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
            <span className="hidden sm:inline">SMS</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">แจ้งเตือน</span>
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
                  <Input id="storeName" defaultValue="ร้านกัญชาสุขใจ" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeNameEn">ชื่อร้าน (อังกฤษ)</Label>
                  <Input id="storeNameEn" defaultValue="Happy Cannabis Shop" />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input id="phone" defaultValue="02-123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input id="email" type="email" defaultValue="contact@happycannabis.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Textarea id="address" defaultValue="123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110" rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
                <Input id="taxId" defaultValue="0123456789012" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground shadow-glow">
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
                  <Input id="invoicePrefix" defaultValue="INV" />
                  <p className="text-xs text-muted-foreground">เช่น INV20251128001</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">อัตราภาษี (%)</Label>
                  <Input id="taxRate" type="number" defaultValue="7" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">ตั้งค่าส่วนลด</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">ส่วนลดสูงสุด (%) สำหรับ Cashier</Label>
                    <Input id="maxDiscount" type="number" defaultValue="10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountManager">ส่วนลดสูงสุด (%) สำหรับ Manager</Label>
                    <Input id="maxDiscountManager" type="number" defaultValue="30" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>แสดงราคาทุน</Label>
                    <p className="text-sm text-muted-foreground">แสดงราคาทุนสินค้าในหน้า POS (เฉพาะ Manager ขึ้นไป)</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>เสียงเมื่อสแกน</Label>
                    <p className="text-sm text-muted-foreground">เปิดเสียงเตือนเมื่อสแกน barcode</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>พิมพ์ใบเสร็จอัตโนมัติ</Label>
                    <p className="text-sm text-muted-foreground">พิมพ์ใบเสร็จทันทีหลังชำระเงิน</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground shadow-glow">
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
              {['เงินสด', 'บัตรเครดิต/เดบิต', 'โอนเงิน', 'PromptPay'].map((method, index) => (
                <div key={method} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{method}</p>
                      <p className="text-sm text-muted-foreground">
                        {index === 0 && 'รับชำระด้วยเงินสด'}
                        {index === 1 && 'รับชำระด้วยบัตร'}
                        {index === 2 && 'รับโอนเงินผ่านธนาคาร'}
                        {index === 3 && 'รับชำระผ่าน QR PromptPay'}
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked={index < 3} />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground shadow-glow">
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        </TabsContent>

        {/* SMS Settings */}
        <TabsContent value="sms" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">ตั้งค่า SMS</CardTitle>
                  <CardDescription>จัดการการแจ้งเตือนผ่าน SMS</CardDescription>
                </div>
                <Badge variant={smsEnabled ? 'default' : 'secondary'}>
                  {smsEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label>เปิดใช้งาน SMS</Label>
                  <p className="text-sm text-muted-foreground">ส่งการแจ้งเตือนผ่าน SMS</p>
                </div>
                <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
              </div>

              {smsEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="smsProvider">ผู้ให้บริการ SMS</Label>
                    <Select defaultValue="twilio">
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกผู้ให้บริการ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="thaisms">ThaiSMS</SelectItem>
                        <SelectItem value="thaibulksms">ThaiBulkSMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smsRecipients">เบอร์โทรผู้รับ (คั่นด้วย , )</Label>
                    <Textarea id="smsRecipients" defaultValue="081-234-5678, 082-345-6789" placeholder="08X-XXX-XXXX" rows={2} />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">ประเภทการแจ้งเตือน</h4>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">แจ้งเตือนการขาย Real-time</p>
                        <p className="text-sm text-muted-foreground">ส่ง SMS ทุกครั้งที่มีการขาย</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">สรุปยอดขายประจำวัน</p>
                        <p className="text-sm text-muted-foreground">ส่งสรุปยอดขายทุกวัน เวลา 21:00</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">สรุปยอดขายประจำเดือน</p>
                        <p className="text-sm text-muted-foreground">ส่งสรุปยอดขายทุกสิ้นเดือน</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">แจ้งเตือนสินค้าใกล้หมด</p>
                        <p className="text-sm text-muted-foreground">ส่ง SMS เมื่อสินค้าต่ำกว่าจำนวนขั้นต่ำ</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">แจ้งเตือนการปรับสต็อก</p>
                        <p className="text-sm text-muted-foreground">ส่ง SMS เมื่อมีการปรับปรุงสต็อก</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            {smsEnabled && (
              <Button variant="outline" onClick={() => toast.success('ส่ง SMS ทดสอบสำเร็จ')}>
                ส่ง SMS ทดสอบ
              </Button>
            )}
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground shadow-glow">
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
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">แจ้งเตือนยอดขายถึงเป้า</p>
                  <p className="text-sm text-muted-foreground">แสดงการแจ้งเตือนเมื่อยอดขายถึงเป้าหมาย</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">เสียงแจ้งเตือน</p>
                  <p className="text-sm text-muted-foreground">เปิดเสียงเมื่อมีการแจ้งเตือน</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground shadow-glow">
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
