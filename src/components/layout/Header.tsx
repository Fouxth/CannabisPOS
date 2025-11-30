import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, LogOut, Menu, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useAuth, ROLE_NAMES, ROLE_COLORS, UserRole } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('ออกจากระบบสำเร็จ');
    navigate('/login');
  };

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    toast.success(`เปลี่ยนบทบาทเป็น ${ROLE_NAMES[role]}`);
  };

  const roles: UserRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'];

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-6">
      {/* Left: Menu Button (Mobile) & Date */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 sm:h-9 sm:w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="hidden sm:block">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(currentTime, 'EEEE d MMMM yyyy', { locale: th })}
          </p>
          <p className="text-primary font-mono text-xs sm:text-sm font-medium">
            {format(currentTime, 'HH:mm:ss')}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDark(!isDark)}
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-destructive text-[9px] sm:text-[10px] font-bold text-destructive-foreground">
            3
          </span>
        </Button>

        {/* Role Switcher (Demo) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <Shield className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">สลับบทบาท (Demo)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roles.map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() => handleSwitchRole(role)}
                className={cn(
                  'cursor-pointer text-xs',
                  user?.role === role && 'bg-accent'
                )}
              >
                <div className={cn('w-2 h-2 rounded-full mr-2', ROLE_COLORS[role])} />
                {ROLE_NAMES[role]}
                {user?.role === role && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">ปัจจุบัน</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-1 sm:px-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] sm:text-xs font-bold text-primary">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs sm:text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{user ? ROLE_NAMES[user.role] : ''}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56">
            <DropdownMenuLabel className="text-xs sm:text-sm">บัญชีของฉัน</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs sm:text-sm">
              <User className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              โปรไฟล์
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive text-xs sm:text-sm">
              <LogOut className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
