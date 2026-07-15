import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product } from '@/types';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

import { ProductImportDialog } from '@/components/ProductImportDialog';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

import { useAuth } from '@/hooks/useAuth';

export default function Products() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});

  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', user?.storeId],
    queryFn: api.getProducts,
    enabled: !!user?.storeId,
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', user?.storeId],
    queryFn: api.getCategories,
    enabled: !!user?.storeId,
  });

  const createMutation = useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('เพิ่มสินค้าสำเร็จ');
      setShowAddDialog(false);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => api.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('แก้ไขสินค้าสำเร็จ');
      setShowAddDialog(false);
      setEditingProduct(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการแก้ไขสินค้า');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Use message from backend (handles soft delete cases)
      if (data?.message) {
        toast.success(data.message);
      } else {
        toast.success('ลบสินค้าสำเร็จ');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
    },
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const isLoading = isLoadingProducts || isLoadingCategories;

  const handleSaveProduct = (data: Partial<Product>) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`คุณต้องการลบสินค้า ${product.name} ใช่หรือไม่?`)) {
      deleteMutation.mutate(product.id);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ProductImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">สินค้า</h1>
          <p className="text-muted-foreground">จัดการสินค้าทั้งหมด {products.length} รายการ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            นำเข้า
          </Button>
          <Button variant="outline" onClick={() => toast.info('ฟีเจอร์นี้กำลังพัฒนา (Coming Soon)')}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="gradient-primary text-primary-foreground shadow-glow">
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มสินค้า
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="หมวดหมู่ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">หมวดหมู่ทั้งหมด</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="glass">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สินค้า</TableHead>
                <TableHead className="hidden sm:table-cell">หมวดหมู่</TableHead>
                <TableHead className="text-right">ราคา</TableHead>
                <TableHead className="text-right hidden md:table-cell">ต้นทุน</TableHead>
                <TableHead className="text-right">สต็อก</TableHead>
                <TableHead className="hidden md:table-cell">สถานะ</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId) || product.category;
                const isLowStock = product.stock <= product.minStock;

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {category && (
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                      ฿{formatCurrency(product.cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={isLowStock ? 'text-destructive font-medium' : ''}>
                        {product.stock}
                      </span>
                      <span className="text-muted-foreground text-xs ml-1">
                        {product.stockUnit}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`ตัวเลือกเพิ่มเติมสำหรับ ${product.name}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info('ระบบดูรายละเอียดสินค้าแบบเต็ม กำลังพัฒนาครับ')}>
                            <Eye className="h-4 w-4 mr-2" />
                            ดูรายละเอียด
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingProduct(product); setShowAddDialog(true); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setEditingProduct(null);
          setFormData({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const promoQtyVal = (form.elements.namedItem('promoQuantity') as HTMLInputElement).value;
            const promoPriceVal = (form.elements.namedItem('promoPrice') as HTMLInputElement).value;
            const categoryVal = (form.elements.namedItem('category') as HTMLSelectElement).value;

            const data: Partial<Product> = {
              name: (form.elements.namedItem('name') as HTMLInputElement).value,
              categoryId: categoryVal || null, // Send null if empty
              price: parseFloat((form.elements.namedItem('price') as HTMLInputElement).value),
              cost: parseFloat((form.elements.namedItem('cost') as HTMLInputElement).value) || 0,
              promoQuantity: promoQtyVal ? parseInt(promoQtyVal) : null, // Send null if empty
              promoPrice: promoPriceVal ? parseFloat(promoPriceVal) : null, // Send null if empty
              stock: parseInt((form.elements.namedItem('stock') as HTMLInputElement).value) || 0,
              minStock: parseInt((form.elements.namedItem('minStock') as HTMLInputElement).value) || 10,
              stockUnit: (form.elements.namedItem('stockUnit') as HTMLInputElement).value || 'unit',
              description: (form.elements.namedItem('description') as HTMLTextAreaElement).value || undefined,
              isActive: true,
              showInPos: true,
            };
            handleSaveProduct(data);
          }}>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อสินค้า *</Label>
                <Input id="name" name="name" defaultValue={editingProduct?.name} placeholder="กรอกชื่อสินค้า" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">หมวดหมู่</Label>
                  <Select name="category" defaultValue={editingProduct?.categoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">ราคาขาย *</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">ราคาทุน</Label>
                  <Input id="cost" name="cost" type="number" step="0.01" defaultValue={editingProduct?.cost} placeholder="0.00" />
                </div>
              </div>

              {/* Promotion Section */}
              <div className="p-4 rounded-lg border border-dashed border-primary/50 bg-primary/5">
                <p className="text-sm font-medium text-primary mb-3">🎁 โปรโมชัน (ซื้อกี่กรัมราคาเท่าไหร่)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="promoQuantity">จำนวนโปรโมชัน</Label>
                    <Input id="promoQuantity" name="promoQuantity" type="number" defaultValue={(editingProduct as any)?.promoQuantity || ''} placeholder="เช่น 3" />
                    <p className="text-xs text-muted-foreground">ซื้อกี่กรัมถึงได้โปร</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promoPrice">ราคาโปรโมชัน</Label>
                    <Input id="promoPrice" name="promoPrice" type="number" step="0.01" defaultValue={(editingProduct as any)?.promoPrice || ''} placeholder="เช่น 100" />
                    <p className="text-xs text-muted-foreground">ราคารวมเมื่อซื้อครบจำนวน</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="stock">จำนวนสต็อก</Label>
                  <Input id="stock" name="stock" type="number" defaultValue={editingProduct?.stock} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">จำนวนขั้นต่ำ</Label>
                  <Input id="minStock" name="minStock" type="number" defaultValue={editingProduct?.minStock} placeholder="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockUnit">หน่วยนับ</Label>
                  <Input id="stockUnit" name="stockUnit" defaultValue={editingProduct?.stockUnit || 'กรัม'} placeholder="กรัม" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">คำอธิบาย</Label>
                <Textarea id="description" name="description" defaultValue={editingProduct?.description} placeholder="รายละเอียดสินค้า..." rows={3} />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); setEditingProduct(null); setFormData({}); }}>
                ยกเลิก
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground">
                {editingProduct ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
