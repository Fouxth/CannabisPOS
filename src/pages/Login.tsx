import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('เข้าสู่ระบบสำเร็จ');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-glow mb-4">
            <Leaf className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display text-gradient">CannabisPOS</h1>
          <p className="text-muted-foreground mt-1">ระบบจัดการร้านค้าครบวงจร</p>
        </div>

        <Card className="glass-strong">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-xl">เข้าสู่ระบบ</CardTitle>
            <CardDescription>กรอกข้อมูลเพื่อเข้าใช้งานระบบ</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <a href="#" className="text-xs text-primary hover:underline">
                    ลืมรหัสผ่าน?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm cursor-pointer">
                  จดจำฉันไว้
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 gradient-primary text-primary-foreground shadow-glow font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Demo: ใส่อีเมลและรหัสผ่านอะไรก็ได้
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2025 CannabisPOS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
