import { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical, Package } from 'lucide-react';
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
import { mockCategories } from '@/data/mockData';
import { Category } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const colorOptions = [
  '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', 
  '#6366F1', '#14B8A6', '#EF4444', '#3B82F6',
];

export default function Categories() {
  const [categories, setCategories] = useState(mockCategories);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  const handleSave = () => {
    toast.success(editingCategory ? 'แก้ไขหมวดหมู่สำเร็จ' : 'เพิ่มหมวดหมู่สำเร็จ');
    setShowDialog(false);
    setEditingCategory(null);
  };

  const handleDelete = (category: Category) => {
    if (category.productCount > 0) {
      toast.error(`ไม่สามารถลบได้ มีสินค้าในหมวดหมู่นี้ ${category.productCount} รายการ`);
      return;
    }
    toast.success(`ลบหมวดหมู่ ${category.name} สำเร็จ`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
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
                    {category.nameEn && (
                      <p className="text-sm text-muted-foreground">{category.nameEn}</p>
                    )}
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อหมวดหมู่ *</Label>
              <Input id="name" defaultValue={editingCategory?.name} placeholder="เช่น ดอก, พรีโรล" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEn">ชื่อภาษาอังกฤษ</Label>
              <Input id="nameEn" defaultValue={editingCategory?.nameEn} placeholder="e.g. Flower, Pre-Roll" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea id="description" defaultValue={editingCategory?.description} placeholder="รายละเอียดหมวดหมู่..." rows={2} />
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
              <Switch id="active" defaultChecked={editingCategory?.isActive ?? true} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingCategory(null); }}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
              {editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
