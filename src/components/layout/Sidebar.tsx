import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Boxes,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  Leaf,
  Receipt,
  TrendingDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth, ROLE_NAMES, ROLE_COLORS, Permission } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  requiredPermission: Permission;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'แดชบอร์ด', path: '/dashboard', requiredPermission: 'view_dashboard' },
  { icon: ShoppingCart, label: 'ขายสินค้า', path: '/pos', requiredPermission: 'use_pos' },
  { icon: Package, label: 'สินค้า', path: '/products', requiredPermission: 'view_products' },
  { icon: FolderTree, label: 'หมวดหมู่', path: '/categories', requiredPermission: 'view_categories' },
  { icon: Boxes, label: 'สต็อก', path: '/stock', requiredPermission: 'view_stock' },
  { icon: BarChart3, label: 'รายงาน', path: '/reports', requiredPermission: 'view_sales_report' },
  { icon: TrendingDown, label: 'รายจ่าย', path: '/expenses', requiredPermission: 'view_sales_report' },
  { icon: Receipt, label: 'บิล', path: '/bills', requiredPermission: 'view_bills' },
  { icon: Users, label: 'พนักงาน', path: '/users', requiredPermission: 'view_users' },
  { icon: Settings, label: 'ตั้งค่า', path: '/settings', requiredPermission: 'view_settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const location = useLocation();
  const { user, hasPermission } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
    staleTime: 1000 * 60 * 5,
  });

  const visibleNavItems = navItems.filter(item => hasPermission(item.requiredPermission));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border transition-all duration-300 flex flex-col',
        'bg-sidebar shadow-[1px_0_12px_0_hsl(0_0%_0%/0.06)] dark:shadow-[1px_0_16px_0_hsl(0_0%_0%/0.25)]',
        collapsed ? 'w-[70px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 sm:h-16 px-3 sm:px-4 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/15 flex-shrink-0 ring-1 ring-primary/20">
            <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm sm:text-base font-bold font-display text-sidebar-foreground whitespace-nowrap leading-tight">
                {settings?.store?.storeName || 'CannabisPOS'}
              </h1>
              <p className="text-[10px] text-sidebar-foreground/50 whitespace-nowrap">ระบบจัดการร้าน</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 group relative',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary-foreground/60 rounded-r-full" />
                  )}
                  <item.icon className={cn(
                    'flex-shrink-0 transition-transform duration-200',
                    'w-[18px] h-[18px]',
                    isActive ? 'text-primary-foreground' : 'group-hover:scale-110'
                  )} />
                  {!collapsed && (
                    <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      {user && (
        <div className={cn(
          'border-t border-sidebar-border bg-sidebar',
          collapsed ? 'flex justify-center p-3' : 'p-3'
        )}>
          {collapsed ? (
            <Avatar className="w-9 h-9">
              <AvatarImage src={user.avatarUrl} alt={user.fullName} />
              <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs ring-2 ring-primary/20">
                {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs ring-2 ring-primary/20">
                  {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
                  {user.fullName || user.nickname}
                </p>
                <Badge
                  variant="secondary"
                  className={cn('text-[10px] px-1.5 py-0 mt-0.5 text-white border-0', ROLE_COLORS[user.role])}
                >
                  {ROLE_NAMES[user.role]}
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapse Button */}
      <button
        onClick={() => onCollapse(!collapsed)}
        className="hidden lg:flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-xs gap-1.5"
      >
        <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        {!collapsed && <span>ย่อเมนู</span>}
      </button>
    </aside>
  );
}
