import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, Phone, Sparkles, MessageSquare, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function ClaimPoints() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimResult, setClaimResult] = useState<any | null>(null);

  useEffect(() => {
    if (!token) {
      toast.error('ไม่พบรหัสสะสมแต้ม');
    }
  }, [token]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('ไม่พบรหัสสะสมแต้ม');
      return;
    }
    if (!phone.trim()) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.claimPointsQr({
        claimToken: token,
        phone: phone.trim(),
        name: name.trim() || undefined,
      });

      setClaimResult(res);
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || 'ไม่สามารถสะสมแต้มได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass shadow-xl border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 ring-4 ring-primary/10">
            <Award className="h-8 w-8 text-primary animate-bounce" />
          </div>
          <CardTitle className="text-2xl font-bold font-display text-primary">
            สะสมแต้มสมาชิก
          </CardTitle>
          <CardDescription>
            สแกนแล้วกรอกเบอร์โทรศัพท์เพื่อรับแต้มทันที (ไม่ต้องแอด LINE)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {claimResult ? (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="w-16 h-16 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold">สะสมแต้มสำเร็จ!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ได้รับแต้มเพิ่ม <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">+{claimResult.pointsEarned}</span> ดวง
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  แต้มสะสมรวมทั้งหมด: <span className="font-bold text-foreground">{claimResult.currentPoints} ดวง</span>
                </p>
              </div>

              {/* 10 Stamp Visual Card */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-center">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {claimResult.currentPoints >= 10 ? '🎉 สะสมครบ 10 ดวงแล้ว! แลกรับของรางวัลได้ทันที' : `สะสมอีก ${10 - (claimResult.currentPoints % 10)} ดวงจะครบ 10 ดวงเพื่อแลกรางวัล`}
                </p>
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const isCollected = idx < (claimResult.currentPoints % 10 || (claimResult.currentPoints > 0 && claimResult.currentPoints % 10 === 0 ? 10 : 0));
                    return (
                      <div
                        key={idx}
                        className={`h-10 rounded-lg flex items-center justify-center font-bold text-sm border transition-all ${
                          isCollected
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-105'
                            : 'bg-muted/50 text-muted-foreground border-border/40'
                        }`}
                      >
                        {isCollected ? '★' : idx + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground space-y-1">
                <p className="flex items-center justify-center gap-1 font-medium text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> สะสมแต้มเข้าเบอร์ {phone} เรียบร้อยแล้ว
                </p>
                <p>สามารถบอกเบอร์โทรศัพท์นี้เพื่อใช้แต้มเป็นส่วนลดในการซื้อครั้งถัดไป</p>
              </div>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" /> กลับสู่หน้าหลัก
              </Button>
            </div>
          ) : (
            <form onSubmit={handleClaim} className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-center">
                <p className="font-mono font-bold text-primary">รหัสบิล: {token || 'N/A'}</p>
                <p className="text-muted-foreground mt-0.5">ทุกๆ 100 บาท จะได้รับ 1 แต้มสะสม</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์สมาชิก *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0812345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 text-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">ชื่อของคุณ (สำหรับลงทะเบียนใหม่)</Label>
                <Input
                  id="name"
                  placeholder="เช่น คุณสมชาย"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full h-12 text-base font-bold gradient-primary text-primary-foreground shadow-glow"
              >
                {isSubmitting ? 'กำลังบันทึกแต้ม...' : 'ยืนยันรับแต้มสะสม'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
