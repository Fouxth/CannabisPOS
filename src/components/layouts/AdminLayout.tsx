import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Activity,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
    const { logout } = useAuth();
    const location = useLocation();

    const menuItems = [
        {
            title: 'Overview',
            icon: LayoutDashboard,
            path: '/admin',
        },
        {
            title: 'Activity Monitor',
            icon: Activity,
            path: '/admin/activity',
        },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-slate-900 text-slate-50 hidden md:block fixed h-full z-50">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <ShieldCheck className="h-6 w-6 text-purple-400" />
                        <span>Super Admin</span>
                    </div>
                </div>

                <div className="p-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                                location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    ))}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                    <div className="p-4 rounded-lg bg-slate-800 mb-4">
                        <p className="text-xs text-slate-400 mb-1">Signed in as</p>
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
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen">
                <div className="h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
