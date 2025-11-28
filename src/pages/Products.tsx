import { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, Download, Upload } from 'lucide-react';
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
import { mockProducts, mockCategories } from '@/data/mockData';
import { Product } from '@/types';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveProduct = () => {
    toast.success(editingProduct ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ');
    setShowAddDialog(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (product: Product) => {
    toast.success(`ลบสินค้า ${product.name} สำเร็จ`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">สินค้า</h1>
          <p className="text-muted-foreground">จัดการสินค้าทั้งหมด {mockProducts.length} รายการ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            นำเข้า
          </Button>
          <Button variant="outline">
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
                placeholder="ค้นหาสินค้า, SKU..."
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
                {mockCategories.map((category) => (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">รูป</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">ราคา</TableHead>
                <TableHead className="text-right">ต้นทุน</TableHead>
                <TableHead className="text-right">สต็อก</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, index) => {
                const category = mockCategories.find((c) => c.id === product.categoryId);
                const isLowStock = product.stock <= product.minStock;
                
                return (
                  <TableRow
                    key={product.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell>
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.barcode && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {product.barcode}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
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
                    <TableCell className="text-right text-muted-foreground">
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
                    <TableCell>
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
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
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) setEditingProduct(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อสินค้า *</Label>
                <Input id="name" defaultValue={editingProduct?.name} placeholder="กรอกชื่อสินค้า" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">ชื่อภาษาอังกฤษ</Label>
                <Input id="nameEn" defaultValue={editingProduct?.nameEn} placeholder="Product name" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sku">รหัสสินค้า (SKU) *</Label>
                <Input id="sku" defaultValue={editingProduct?.sku} placeholder="SKU001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" defaultValue={editingProduct?.barcode} placeholder="8850000000000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">หมวดหมู่</Label>
                <Select defaultValue={editingProduct?.categoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">ราคาขาย *</Label>
                <Input id="price" type="number" defaultValue={editingProduct?.price} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">ราคาทุน</Label>
                <Input id="cost" type="number" defaultValue={editingProduct?.cost} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comparePrice">ราคาเปรียบเทียบ</Label>
                <Input id="comparePrice" type="number" defaultValue={editingProduct?.comparePrice} placeholder="0.00" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="stock">จำนวนสต็อก</Label>
                <Input id="stock" type="number" defaultValue={editingProduct?.stock} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">จำนวนขั้นต่ำ</Label>
                <Input id="minStock" type="number" defaultValue={editingProduct?.minStock} placeholder="10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockUnit">หน่วยนับ</Label>
                <Input id="stockUnit" defaultValue={editingProduct?.stockUnit || 'ชิ้น'} placeholder="ชิ้น" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea id="description" defaultValue={editingProduct?.description} placeholder="รายละเอียดสินค้า..." rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingProduct(null); }}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveProduct} className="gradient-primary text-primary-foreground">
              {editingProduct ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
