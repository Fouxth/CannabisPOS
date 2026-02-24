import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, LogOut, Menu, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useAuth, ROLE_NAMES } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { NotificationDropdown } from '../NotificationDropdown';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
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

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 sm:px-6">
      {/* Left: Menu Button (Mobile) & Date */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight hidden sm:block">
            {format(currentTime, 'EEEE d MMMM yyyy', { locale: th })}
          </p>
          {/* Mobile: show short date */}
          <p className="text-[11px] text-muted-foreground leading-tight sm:hidden">
            {format(currentTime, 'd MMM yyyy', { locale: th })}
          </p>
          <p className="text-primary font-mono text-xs sm:text-sm font-semibold leading-tight">
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
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark'
            ? <Sun className="h-4 w-4 text-amber-400" />
            : <Moon className="h-4 w-4" />
          }
        </Button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1.5 h-8 sm:h-9 px-1.5 sm:px-2 hover:bg-accent/10">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-primary/20">
                <AvatarImage src={user?.avatarUrl} alt={user?.nickname} />
                <AvatarFallback className="bg-primary/15 text-primary font-bold text-[10px] sm:text-xs">
                  {user?.nickname?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-xs sm:text-sm font-semibold leading-tight">{user?.nickname}</p>
                <p className="text-[10px] text-muted-foreground">{user ? ROLE_NAMES[user.role] : ''}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56">
            <DropdownMenuLabel className="text-xs sm:text-sm">บัญชีของฉัน</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs sm:text-sm cursor-pointer" onClick={() => navigate('/profile')}>
              <User className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              โปรไฟล์
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive text-xs sm:text-sm cursor-pointer">
              <LogOut className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
