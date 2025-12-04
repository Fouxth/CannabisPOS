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
import { cn } from '@/lib/utils';
import { useAuth, ROLE_NAMES, ROLE_COLORS, Permission } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

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

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter(item => hasPermission(item.requiredPermission));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-[70px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 sm:h-16 px-3 sm:px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex-shrink-0">
            <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base sm:text-lg font-bold font-display text-sidebar-foreground whitespace-nowrap">CannabisPOS</h1>
              <p className="text-[10px] text-sidebar-foreground/60 whitespace-nowrap">ระบบจัดการร้าน</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 sm:py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className={cn('w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0', isActive && 'text-primary-foreground')} />
                  {!collapsed && (
                    <span className="font-medium text-xs sm:text-sm whitespace-nowrap">{item.label}</span>
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
          'border-t border-sidebar-border p-2 sm:p-3',
          collapsed ? 'flex justify-center' : ''
        )}>
          {collapsed ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {user.fullName.charAt(0)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">
                  {user.fullName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-sidebar-foreground truncate">
                  {user.fullName}
                </p>
                <Badge
                  variant="secondary"
                  className={cn('text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 text-white', ROLE_COLORS[user.role])}
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
        className="hidden lg:flex items-center justify-center h-10 sm:h-12 border-t border-sidebar-border text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <ChevronLeft className={cn('w-4 h-4 sm:w-5 sm:h-5 transition-transform', collapsed && 'rotate-180')} />
        {!collapsed && <span className="ml-2 text-xs sm:text-sm">ย่อเมนู</span>}
      </button>
    </aside>
  );
}
