import { Bell, Search, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePOSStore } from '@/stores/posStore';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export function Header() {
  const { currentUser } = usePOSStore();
  const [isDark, setIsDark] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {format(currentTime, 'EEEE d MMMM yyyy', { locale: th })}
          </span>
          <span className="text-primary font-semibold">
            {format(currentTime, 'HH:mm:ss')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-lg">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              การแจ้งเตือน
              <Badge variant="secondary" className="ml-2">3 ใหม่</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-warning animate-pulse-soft" />
                  <span className="font-medium">สินค้าใกล้หมด</span>
                </div>
                <span className="text-xs text-muted-foreground">Blue Dream เหลือ 8 กรัม</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span className="font-medium">ยอดขายวันนี้</span>
                </div>
                <span className="text-xs text-muted-foreground">ทำยอด 28,450 บาท (45 รายการ)</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-info" />
                  <span className="font-medium">สินค้าขายดี</span>
                </div>
                <span className="text-xs text-muted-foreground">Classic Joint 1g ขายได้ 45 ชิ้น</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 rounded-lg">
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{currentUser?.fullName}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>โปรไฟล์</DropdownMenuItem>
            <DropdownMenuItem>ตั้งค่า</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
