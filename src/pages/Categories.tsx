import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Category } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const colorOptions = [
  '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#6366F1', '#14B8A6', '#EF4444', '#3B82F6',
];

export default function Categories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  const createMutation = useMutation({
    mutationFn: api.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('เพิ่มหมวดหมู่สำเร็จ');
      setShowDialog(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('แก้ไขหมวดหมู่สำเร็จ');
      setShowDialog(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('ลบหมวดหมู่สำเร็จ');
    },
    onError: (error: any) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });

  const handleSave = (data: Partial<Category>) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (category: Category) => {
    if (category.productCount > 0) {
      toast.error(`ไม่สามารถลบได้ มีสินค้าในหมวดหมู่นี้ ${category.productCount} รายการ`);
      return;
    }
    if (confirm(`คุณต้องการลบหมวดหมู่ ${category.name} ใช่หรือไม่?`)) {
      deleteMutation.mutate(category.id);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
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
          <h1 className="text-2xl font-bold font-display">หมวดหมู่สินค้า</h1>
          <p className="text-muted-foreground">จัดการหมวดหมู่ทั้งหมด {categories.length} หมวดหมู่</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gradient-primary text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มหมวดหมู่
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => (
          <Card
            key={category.id}
            className={cn(
              'glass overflow-hidden transition-all duration-200 hover:shadow-lg animate-slide-up',
              !category.isActive && 'opacity-60'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="h-2" style={{ backgroundColor: category.color }} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Package className="h-6 w-6" style={{ color: category.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>

                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditingCategory(category); setSelectedColor(category.color); setShowDialog(true); }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Badge variant="secondary" className="font-mono">
                  {category.productCount} สินค้า
                </Badge>
                <Badge variant={category.isActive ? 'default' : 'outline'}>
                  {category.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                </Badge>
              </div>

              {category.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setEditingCategory(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.elements.namedItem('name') as HTMLInputElement).value;
            const data: Partial<Category> = {
              name,
              slug: name.toLowerCase().replace(/\s+/g, '-'),
              description: (form.elements.namedItem('description') as HTMLTextAreaElement)?.value || undefined,
              color: selectedColor,
              icon: 'Package',
              isActive: (form.elements.namedItem('active') as HTMLInputElement).checked,
              sortOrder: editingCategory?.sortOrder || 0,
            };
            handleSave(data);
          }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อหมวดหมู่ *</Label>
                <Input id="name" name="name" defaultValue={editingCategory?.name} placeholder="เช่น ดอก, พรีโรล" required />
              </div>



              <div className="space-y-2">
                <Label htmlFor="description">คำอธิบาย</Label>
                <Textarea id="description" name="description" defaultValue={editingCategory?.description} placeholder="รายละเอียดหมวดหมู่..." rows={2} />
              </div>

              <div className="space-y-2">
                <Label>สีหมวดหมู่</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        'h-8 w-8 rounded-full transition-all',
                        selectedColor === color && 'ring-2 ring-offset-2 ring-offset-background'
                      )}
                      style={{ backgroundColor: color, boxShadow: selectedColor === color ? `0 0 10px ${color}` : 'none' }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="active">เปิดใช้งาน</Label>
                  <p className="text-sm text-muted-foreground">แสดงหมวดหมู่นี้ในหน้าขาย</p>
                </div>
                <Switch id="active" name="active" defaultChecked={editingCategory?.isActive ?? true} />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); setEditingCategory(null); }}>
                ยกเลิก
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground">
                {editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
