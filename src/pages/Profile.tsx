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
import { Loader2, User, Lock, Camera } from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();
    const updateProfile = useUpdateProfile();
    const changePassword = useChangePassword();

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        nickname: user?.nickname || '',
        phone: user?.phone || '',
        email: user?.email || '',
        avatarUrl: user?.avatarUrl || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        try {
            await updateProfile.mutateAsync({
                userId: user.id,
                data: formData,
            });
            toast.success('อัปเดตข้อมูลส่วนตัวสำเร็จ');
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
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
        <div className="space-y-6 p-6 pb-16 md:block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">โปรไฟล์</h2>
                <p className="text-muted-foreground">
                    จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ
                </p>
            </div>
            <Separator className="my-6" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        <Button variant="ghost" className="justify-start bg-muted hover:bg-muted">
                            <User className="mr-2 h-4 w-4" />
                            ข้อมูลทั่วไป
                        </Button>
                        <Button variant="ghost" className="justify-start hover:bg-transparent hover:underline">
                            <Lock className="mr-2 h-4 w-4" />
                            ความปลอดภัย
                        </Button>
                    </nav>
                </aside>

                <div className="flex-1 lg:max-w-2xl space-y-6">
                    {/* Profile Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>ข้อมูลส่วนตัว</CardTitle>
                            <CardDescription>
                                แก้ไขชื่อ เบอร์โทรศัพท์ และข้อมูลติดต่อของคุณ
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-24 w-24">
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
                                                className="w-[300px]"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">รองรับ URL ของรูปภาพ (เช่นจาก Google Photos หรือ Imgur)</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
                                        <Input
                                            id="fullName"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nickname">ชื่อเล่น</Label>
                                        <Input
                                            id="nickname"
                                            value={formData.nickname}
                                            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">อีเมล</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

                                <div className="space-y-2">
                                    <Label>รหัสพนักงาน</Label>
                                    <Input value={user?.employeeCode} disabled className="bg-muted" />
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

                    {/* Change Password */}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            required
                                            minLength={6}
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
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" variant="outline" disabled={changePassword.isPending}>
                                        {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        เปลี่ยนรหัสผ่าน
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
