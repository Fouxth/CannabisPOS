import { useState, useEffect } from 'react';
import { AlertTriangle, Lock, Unlock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function Suspended() {
    const [isRestored, setIsRestored] = useState(false);
    const { logout } = useAuth();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) return; // No token, stay locked

                const response = await fetch(`${API_BASE_URL}/auth/tenant-status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) return; // Server error or invalid token — stay locked

                const data = await response.json();

                // Only unlock when management DB explicitly says active: true
                if (data.active === true) {
                    setIsRestored(true);
                    logout();
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 3000);
                }
            } catch (error) {
                console.error('Status check failed', error);
            }
        };

        const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [logout]);

    if (isRestored) {
        return (
            <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black/90 backdrop-blur-sm z-50">
                <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none" />
                <Card className="max-w-2xl w-full mx-4 border-4 border-green-500/80 bg-black/95 shadow-[0_0_50px_rgba(34,197,94,0.5)] transform scale-110 animate-in fade-in duration-500">
                    <CardContent className="pt-12 pb-12 px-8 text-center space-y-8">
                        <div className="mx-auto w-32 h-32 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-bounce">
                            <Unlock className="w-16 h-16 text-white" />
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-black font-display text-green-500 tracking-tight uppercase drop-shadow-md">
                                SYSTEM UNLOCKED
                            </h1>
                            <p className="text-2xl md:text-3xl text-white font-bold animate-pulse">
                                เปิดใช้งานเรียบร้อย
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-green-900/30 border-2 border-green-800/50 mt-8">
                            <div className="flex items-center justify-center gap-3 text-green-400 font-bold text-xl mb-2">
                                <CheckCircle className="w-8 h-8" />
                                <span>สถานะระบบ</span>
                            </div>
                            <p className="text-lg text-gray-300">
                                กำลังพาคุณไปหน้าเข้าสู่ระบบ...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black/90 backdrop-blur-sm z-50">
            {/* Pulsing Red Background Effect */}
            <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />

            <Card className="max-w-2xl w-full mx-4 border-4 border-red-600/80 bg-black/95 shadow-[0_0_50px_rgba(220,38,38,0.5)] transform scale-110">
                <CardContent className="pt-12 pb-12 px-8 text-center space-y-8">
                    <div className="mx-auto w-32 h-32 rounded-full bg-red-600 flex items-center justify-center shadow-lg animate-bounce">
                        <Lock className="w-16 h-16 text-white" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black font-display text-red-500 tracking-tight uppercase drop-shadow-md">
                            SYSTEM LOCKED
                        </h1>
                        <p className="text-2xl md:text-3xl text-white font-bold animate-pulse">
                            กรุณาติดต่อบังสุดหล่อ
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-900/30 border-2 border-red-800/50 mt-8">
                        <div className="flex items-center justify-center gap-3 text-red-400 font-bold text-xl mb-2">
                            <AlertTriangle className="w-8 h-8" />
                            <span>ข้อความแจ้งเตือน</span>
                        </div>
                        <p className="text-lg text-gray-300">
                            ระบบถูกระงับการใช้งานชั่วคราว ไม่สามารถปิดหน้าต่างนี้ได้
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
