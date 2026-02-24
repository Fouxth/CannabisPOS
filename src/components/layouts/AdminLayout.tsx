import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
    LayoutDashboard,
    LogOut,
    Activity,
    ShieldCheck,
    Menu,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
    const { logout } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const menuItems = [
        { title: 'Overview', icon: LayoutDashboard, path: '/admin' },
        { title: 'Activity Monitor', icon: Activity, path: '/admin/activity' },
    ];

    const isActive = (path: string) =>
        location.pathname === path ||
        (path !== '/admin' && location.pathname.startsWith(path));

    const SidebarContent = () => (
        <>
            <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <ShieldCheck className="h-6 w-6 text-purple-400" />
                    <span>Super Admin</span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium',
                            isActive(item.path)
                                ? 'bg-slate-800 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 shrink-0">
                <div className="p-3 rounded-lg bg-slate-800 mb-3">
                    <p className="text-xs text-slate-400 mb-0.5">Signed in as</p>
                    <p className="text-sm font-medium text-white truncate">Super Administrator</p>
                </div>
                <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => logout()}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Desktop Sidebar */}
            <aside className="w-64 border-r bg-slate-900 text-slate-50 hidden md:flex flex-col fixed h-full z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside
                className={cn(
                    'fixed top-0 left-0 h-full w-72 bg-slate-900 text-slate-50 flex flex-col z-50 transition-transform duration-300 md:hidden',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <SidebarContent />
                <button
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                >
                    <X className="h-5 w-5" />
                </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Mobile Top Bar */}
                <header className="h-14 flex items-center px-4 bg-slate-900 text-white md:hidden shrink-0 z-30 sticky top-0">
                    <button
                        className="mr-3 text-slate-300 hover:text-white"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-2 font-bold">
                        <ShieldCheck className="h-5 w-5 text-purple-400" />
                        <span>Super Admin</span>
                    </div>
                </header>

                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
