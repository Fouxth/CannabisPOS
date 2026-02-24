import { useState } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth, Permission } from '@/hooks/useAuth';
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Settings } from 'lucide-react';

const mobileNavItems: { icon: React.ElementType; label: string; path: string; permission: Permission }[] = [
  { icon: LayoutDashboard, label: 'หน้าหลัก', path: '/dashboard', permission: 'view_dashboard' },
  { icon: ShoppingCart, label: 'ขายสินค้า', path: '/pos', permission: 'use_pos' },
  { icon: Package, label: 'สินค้า', path: '/products', permission: 'view_products' },
  { icon: BarChart3, label: 'รายงาน', path: '/reports', permission: 'view_sales_report' },
  { icon: Settings, label: 'ตั้งค่า', path: '/settings', permission: 'view_settings' },
];

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const visibleMobileItems = mobileNavItems.filter(item => hasPermission(item.permission));

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar Sheet (for full menu) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[260px] sm:w-[280px]">
          <Sidebar
            collapsed={false}
            onCollapse={() => {}}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          'lg:ml-[240px]',
          sidebarCollapsed && 'lg:ml-[70px]'
        )}
      >
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        {/* pb-20 on mobile to avoid overlap with bottom nav */}
        <main className="p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex items-stretch h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {visibleMobileItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200',
                  isActive && 'bg-primary/12'
                )}>
                  <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.2]')} />
                </div>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
