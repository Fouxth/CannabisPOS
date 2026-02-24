import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, User, Lock, Camera, Shuffle } from 'lucide-react';

export default function Profile() {
    const { user, setUser } = useAuth();
    const updateProfile = useUpdateProfile();
    const changePassword = useChangePassword();

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        nickname: user?.nickname || '',
        phone: user?.phone || '',
        username: user?.username || '',
        avatarUrl: user?.avatarUrl || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // ... (keep existing logic)
        if (!user?.id) return;

        try {
            const updatedUser = await updateProfile.mutateAsync({
                userId: user.id,
                data: formData,
            });
            setUser(updatedUser);
            toast.success('อัปเดตข้อมูลส่วนตัวสำเร็จ');
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        // ... (keep existing logic)
        e.preventDefault();
        if (!user?.id) return;

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            return;
        }

        try {
            await changePassword.mutateAsync({
                userId: user.id,
                data: {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                },
            });
            toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">โปรไฟล์</h2>
                <p className="text-muted-foreground">
                    จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ
                </p>
            </div>
            <Separator className="my-6" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        <Button
                            variant="ghost"
                            className={`justify-start ${activeTab === 'general' ? 'bg-muted hover:bg-muted' : 'hover:bg-transparent hover:underline'}`}
                            onClick={() => setActiveTab('general')}
                        >
                            <User className="mr-2 h-4 w-4" />
                            ข้อมูลทั่วไป
                        </Button>
                        <Button
                            variant="ghost"
                            className={`justify-start ${activeTab === 'security' ? 'bg-muted hover:bg-muted' : 'hover:bg-transparent hover:underline'}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <Lock className="mr-2 h-4 w-4" />
                            ความปลอดภัย
                        </Button>
                    </nav>
                </aside>

                <div className="flex-1 lg:max-w-2xl space-y-6">
                    {/* Profile Information */}
                    {activeTab === 'general' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>ข้อมูลส่วนตัว</CardTitle>
                                <CardDescription>
                                    แก้ไขชื่อ เบอร์โทรศัพท์ และข้อมูลติดต่อของคุณ
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleProfileSubmit} className="space-y-6">
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                                            <AvatarImage src={formData.avatarUrl} />
                                            <AvatarFallback className="text-lg">{user?.fullName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-2">
                                            <Label>รูปโปรไฟล์ (URL)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={formData.avatarUrl}
                                                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                                    placeholder="https://example.com/avatar.jpg"
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    title="สุ่มรูปการ์ตูน"
                                                    onClick={() => {
                                                        const seed = Math.random().toString(36).substring(7);
                                                        setFormData({ ...formData, avatarUrl: `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}` });
                                                    }}
                                                >
                                                    <Shuffle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">รองรับ URL ของรูปภาพ (เช่นจาก Google Photos หรือ Imgur)</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <div className="space-y-2">
                                            <Label htmlFor="nickname">ชื่อเล่น</Label>
                                            <Input
                                                id="nickname"
                                                value={formData.nickname}
                                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="username">ชื่อผู้ใช้</Label>
                                            <Input
                                                id="username"
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={updateProfile.isPending}>
                                            {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            บันทึกการเปลี่ยนแปลง
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Change Password */}
                    {activeTab === 'security' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
                                <CardDescription>
                                    เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชี
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={changePassword.isPending}>
                                            {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            เปลี่ยนรหัสผ่าน
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
