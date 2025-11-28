import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  TrendingUp,
  Users,
  Settings,
  FileText,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Leaf,
  BarChart3,
  Warehouse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePOSStore } from '@/stores/posStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const menuItems = [
  { icon: LayoutDashboard, label: 'แดชบอร์ด', href: '/dashboard' },
  { icon: ShoppingCart, label: 'ขายสินค้า', href: '/pos' },
  { icon: Package, label: 'สินค้า', href: '/products' },
  { icon: FolderTree, label: 'หมวดหมู่', href: '/categories' },
  { icon: Warehouse, label: 'สต็อก', href: '/stock' },
  { icon: BarChart3, label: 'รายงาน', href: '/reports' },
  { icon: Users, label: 'พนักงาน', href: '/users' },
  { icon: Settings, label: 'ตั้งค่า', href: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { currentUser } = usePOSStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="font-display text-lg font-bold text-sidebar-foreground">CannabisPOS</h1>
                <p className="text-xs text-muted-foreground">ระบบจัดการร้าน</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            
            const linkContent = (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'animate-scale-in')} />
                {!collapsed && <span className="animate-fade-in">{item.label}</span>}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg bg-sidebar-accent p-3',
              collapsed && 'justify-center'
            )}
          >
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarImage src={currentUser?.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {currentUser?.fullName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 animate-fade-in">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {currentUser?.fullName}
                </p>
                <p className="text-xs text-muted-foreground">{currentUser?.role}</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Button */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>ย่อเมนู</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
