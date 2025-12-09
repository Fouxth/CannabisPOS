import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreVertical, Edit, Trash2, Shield, Mail, Phone, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-red-500',
  OWNER: 'bg-purple-500',
  ADMIN: 'bg-blue-500',
  MANAGER: 'bg-amber-500',
  CASHIER: 'bg-green-500',
  VIEWER: 'bg-gray-500',
};

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'เจ้าของร้าน',
  ADMIN: 'ผู้ดูแลระบบ',
  MANAGER: 'ผู้จัดการ',
  CASHIER: 'พนักงานขาย',
  VIEWER: 'ผู้ดูอย่างเดียว',
};

export default function Users() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const createMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('เพิ่มพนักงานสำเร็จ');
      setShowDialog(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('แก้ไขพนักงานสำเร็จ');
      setShowDialog(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('ลบพนักงานสำเร็จ');
    },
    onError: (error: any) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });

  const filteredUsers = users.filter((user) => {
    return !searchQuery ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSave = (data: Partial<User>) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      // Generate unique employee code
      const newData = {
        ...data,
        employeeCode: data.employeeCode || `EMP${Date.now().toString().slice(-6)}`
      };
      createMutation.mutate(newData);
    }
  };

  const handleDelete = (user: User) => {
    if (confirm(`คุณต้องการลบพนักงาน ${user.fullName} ใช่หรือไม่?`)) {
      deleteMutation.mutate(user.id);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[120px] w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">จัดการพนักงาน</h1>
          <p className="text-muted-foreground">พนักงานทั้งหมด {users.length} คน</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gradient-primary text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มพนักงาน
        </Button>
      </div>

      {/* Search */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ, อีเมล, รหัสพนักงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user, index) => (
          <Card
            key={user.id}
            className={cn(
              'glass overflow-hidden transition-all duration-200 hover:shadow-lg animate-slide-up',
              !user.isActive && 'opacity-60'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{user.fullName}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{user.employeeCode}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditingUser(user); setShowDialog(true); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      แก้ไข
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Shield className="h-4 w-4 mr-2" />
                      จัดการสิทธิ์
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      ลบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Badge className={cn(roleColors[user.role], 'text-white')}>
                  {roleLabels[user.role]}
                </Badge>
                <div className="flex items-center gap-1">
                  {user.isActive ? (
                    <UserCheck className="h-4 w-4 text-success" />
                  ) : (
                    <UserX className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn(
                    'text-xs',
                    user.isActive ? 'text-success' : 'text-muted-foreground'
                  )}>
                    {user.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setEditingUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingUser ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data: Partial<User> & { password?: string } = {
              fullName: (form.elements.namedItem('fullName') as HTMLInputElement).value,
              email: (form.elements.namedItem('email') as HTMLInputElement).value,
              phone: (form.elements.namedItem('phone') as HTMLInputElement).value || undefined,
              role: (form.elements.namedItem('role') as HTMLSelectElement).value as UserRole,
              isActive: (form.elements.namedItem('active') as HTMLInputElement).checked,
            };
            // Include password only when creating new user
            if (!editingUser) {
              data.password = (form.elements.namedItem('password') as HTMLInputElement).value;
            }
            handleSave(data);
          }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">ชื่อ-นามสกุล *</Label>
                <Input id="fullName" name="fullName" defaultValue={editingUser?.fullName} placeholder="กรอกชื่อ-นามสกุล" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล *</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingUser?.email} placeholder="email@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทร</Label>
                  <Input id="phone" name="phone" defaultValue={editingUser?.phone} placeholder="08X-XXX-XXXX" />
                </div>
              </div>

              {/* Password field - only show when creating new user */}
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="กรอกรหัสผ่านสำหรับพนักงาน"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">ตำแหน่ง</Label>
                <Select name="role" defaultValue={editingUser?.role || 'CASHIER'}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกตำแหน่ง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ผู้ดูแลระบบ</SelectItem>
                    <SelectItem value="MANAGER">ผู้จัดการ</SelectItem>
                    <SelectItem value="CASHIER">พนักงานขาย</SelectItem>
                    <SelectItem value="VIEWER">ผู้ดูอย่างเดียว</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="active">เปิดใช้งาน</Label>
                  <p className="text-sm text-muted-foreground">อนุญาตให้เข้าสู่ระบบได้</p>
                </div>
                <Switch id="active" name="active" defaultChecked={editingUser?.isActive ?? true} />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); setEditingUser(null); }}>
                ยกเลิก
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground">
                {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
