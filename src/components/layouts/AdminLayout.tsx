import { Outlet } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#DCEEFE] via-[#EBF3FC] to-[#F5F8FA] dark:from-[#0B0F19] dark:via-[#111827] dark:to-[#0B0F19] text-[#1E293B] dark:text-slate-100 font-sans antialiased transition-colors duration-300 relative">
            {/* Minimal floating Theme Switcher */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="h-9 w-9 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200/50 dark:border-slate-700/50 shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                    {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
                </Button>
            </div>
            <Outlet />
        </div>
    );
}
