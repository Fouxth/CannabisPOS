import { useState } from 'react';
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

const mockUsers: User[] = [
  { id: '1', employeeCode: 'E001', email: 'owner@store.com', fullName: 'สมศักดิ์ เจริญรุ่งเรือง', phone: '081-234-5678', role: 'OWNER', isActive: true, lastLoginAt: '2025-11-28T10:30:00' },
  { id: '2', employeeCode: 'E002', email: 'admin@store.com', fullName: 'สมหญิง ใจดี', phone: '082-345-6789', role: 'ADMIN', isActive: true, lastLoginAt: '2025-11-28T09:15:00' },
  { id: '3', employeeCode: 'E003', email: 'manager@store.com', fullName: 'วิชัย มั่นคง', phone: '083-456-7890', role: 'MANAGER', isActive: true, lastLoginAt: '2025-11-28T08:00:00' },
  { id: '4', employeeCode: 'E004', email: 'cashier1@store.com', fullName: 'สมชาย ใจดี', phone: '084-567-8901', role: 'CASHIER', isActive: true, lastLoginAt: '2025-11-28T14:30:00' },
  { id: '5', employeeCode: 'E005', email: 'cashier2@store.com', fullName: 'นารี สดใส', phone: '085-678-9012', role: 'CASHIER', isActive: true, lastLoginAt: '2025-11-27T18:00:00' },
  { id: '6', employeeCode: 'E006', email: 'viewer@store.com', fullName: 'ประยุทธ์ ดูแล', phone: '086-789-0123', role: 'VIEWER', isActive: false, lastLoginAt: '2025-11-20T10:00:00' },
];

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
  const [users] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = users.filter((user) => {
    return !searchQuery ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSave = () => {
    toast.success(editingUser ? 'แก้ไขพนักงานสำเร็จ' : 'เพิ่มพนักงานสำเร็จ');
    setShowDialog(false);
    setEditingUser(null);
  };

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
                    <DropdownMenuItem className="text-destructive">
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">ชื่อ-นามสกุล *</Label>
              <Input id="fullName" defaultValue={editingUser?.fullName} placeholder="กรอกชื่อ-นามสกุล" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล *</Label>
                <Input id="email" type="email" defaultValue={editingUser?.email} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทร</Label>
                <Input id="phone" defaultValue={editingUser?.phone} placeholder="08X-XXX-XXXX" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">ตำแหน่ง</Label>
              <Select defaultValue={editingUser?.role || 'CASHIER'}>
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

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน *</Label>
                <Input id="password" type="password" placeholder="กรอกรหัสผ่าน" />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="active">เปิดใช้งาน</Label>
                <p className="text-sm text-muted-foreground">อนุญาตให้เข้าสู่ระบบได้</p>
              </div>
              <Switch id="active" defaultChecked={editingUser?.isActive ?? true} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingUser(null); }}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
              {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
