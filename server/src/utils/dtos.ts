import { decimalToNumber } from './helpers';

// User DTO
export const toUserDto = (user: any) => ({
    id: user.id,
    employeeCode: user.employeeCode,
    username: user.username,
    fullName: user.fullName,
    nickname: user.nickname ?? undefined,
    phone: user.phone ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
});

// Category DTO
export const toCategoryDto = (category: any) => ({
    id: category.id,
    name: category.name,
    nameEn: category.nameEn ?? undefined,
    slug: category.slug,
    description: category.description ?? undefined,
    color: category.color,
    icon: category.icon,
    isActive: category.isActive,
    productCount: category.productCount ?? category._count?.products ?? 0,
    parentId: category.parentId ?? undefined,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
});

// Product DTO
export const toProductDto = (product: any) => ({
    id: product.id,
    name: product.name,
    description: product.description ?? undefined,
    price: decimalToNumber(product.price),
    cost: decimalToNumber(product.cost),
    promoQuantity: product.promoQuantity ?? undefined,
    promoPrice: product.promoPrice ? decimalToNumber(product.promoPrice) : undefined,
    stock: product.stock,
    minStock: product.minStock,
    stockUnit: product.stockUnit,
    categoryId: product.categoryId ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
    isActive: product.isActive,
    showInPos: product.showInPos,
    totalSold: product.totalSold ?? 0,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    category: product.category ? toCategoryDto(product.category) : undefined,
});

// Payment Method DTO
export const toPaymentMethodDto = (method: any) => ({
    id: method.id,
    name: method.name,
    nameEn: method.nameEn ?? undefined,
    type: method.type.toLowerCase(),
    icon: method.icon,
    isActive: method.isActive,
    isDefault: method.isDefault,
    createdAt: method.createdAt.toISOString(),
    updatedAt: method.updatedAt.toISOString(),
});

// Sale Item DTO
export const toSaleItemDto = (item: any) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice),
    discount: decimalToNumber(item.discount),
    total: decimalToNumber(item.total),
    createdAt: item.createdAt.toISOString(),
    product: item.product ? toProductDto(item.product) : undefined,
});

// Sale DTO
export const toSaleDto = (sale: any) => ({
    id: sale.id,
    saleNumber: sale.saleNumber,
    userId: sale.userId,
    customerId: sale.customerId ?? undefined,
    subtotal: decimalToNumber(sale.subtotal),
    discountAmount: decimalToNumber(sale.discountAmount),
    discountPercent: decimalToNumber(sale.discountPercent),
    taxAmount: decimalToNumber(sale.taxAmount),
    totalAmount: decimalToNumber(sale.totalAmount),
    paymentStatus: sale.paymentStatus.toLowerCase(),
    paymentMethod: sale.paymentMethod.toLowerCase(),
    amountReceived: decimalToNumber(sale.amountReceived),
    changeAmount: decimalToNumber(sale.changeAmount),
    status: sale.status.toLowerCase(),
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
    user: sale.user ? toUserDto(sale.user) : undefined,
    items: sale.items ? sale.items.map(toSaleItemDto) : [],
});

// Bill Item DTO
export const toBillItemDto = (item: any) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice),
    discount: decimalToNumber(item.discount),
    total: decimalToNumber(item.total),
    createdAt: item.createdAt.toISOString(),
    product: item.product ? toProductDto(item.product) : undefined,
});

// Bill DTO
export const toBillDto = (bill: any) => ({
    id: bill.id,
    billNumber: bill.billNumber,
    userId: bill.userId,
    customerId: bill.customerId ?? undefined,
    customerName: bill.customerName ?? undefined,
    subtotal: decimalToNumber(bill.subtotal),
    discountAmount: decimalToNumber(bill.discountAmount),
    discountPercent: decimalToNumber(bill.discountPercent),
    taxAmount: decimalToNumber(bill.taxAmount),
    totalAmount: decimalToNumber(bill.totalAmount),
    paymentMethod: bill.paymentMethod.toLowerCase(),
    amountReceived: decimalToNumber(bill.amountReceived),
    changeAmount: decimalToNumber(bill.changeAmount),
    status: bill.status.toLowerCase(),
    createdAt: bill.createdAt.toISOString(),
    notes: bill.notes ?? undefined,
    user: bill.user ? toUserDto(bill.user) : undefined,
    items: bill.items ? bill.items.map(toBillItemDto) : [],
});

// Stock Movement DTO
export const toStockMovementDto = (movement: any) => ({
    id: movement.id,
    productId: movement.productId,
    userId: movement.userId,
    movementType: movement.movementType.toLowerCase(),
    quantityChange: movement.quantityChange,
    previousQuantity: movement.previousQuantity,
    newQuantity: movement.newQuantity,
    reason: movement.reason ?? undefined,
    notes: movement.notes ?? undefined,
    createdAt: movement.createdAt.toISOString(),
    product: movement.product ? toProductDto(movement.product) : undefined,
    user: movement.user ? toUserDto(movement.user) : undefined,
});

// Expense DTO
export const toExpenseDto = (expense: any) => ({
    id: expense.id,
    title: expense.title,
    amount: decimalToNumber(expense.amount),
    category: expense.category.toLowerCase(),
    date: expense.date.toISOString(),
    userId: expense.userId,
    notes: expense.notes ?? undefined,
    createdAt: expense.createdAt.toISOString(),
    user: expense.user ? toUserDto(expense.user) : undefined,
});

// Notification DTO
export const toNotificationDto = (notification: any) => ({
    id: notification.id,
    userId: notification.userId,
    type: notification.type.toLowerCase(),
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
});

// Create Notification Helper
export const createNotification = async (
    userId: string,
    type: string,
    title: string,
    message: string,
    prisma: any
) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type: type.toUpperCase() as any,
                title,
                message,
            },
        });
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};
