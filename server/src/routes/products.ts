import { Router } from 'express';
import { toProductDto } from '../utils/dtos';

const router = Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await req.tenantPrisma!.product.findMany({
            include: { category: true },
            orderBy: { name: 'asc' },
        });
        res.json(products.map(toProductDto));
    } catch (error) {
        console.error('Fetch products error', error);
        res.status(500).json({ message: 'Unable to fetch products' });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await req.tenantPrisma!.product.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(toProductDto(product));
    } catch (error) {
        console.error('Fetch product error', error);
        res.status(500).json({ message: 'Unable to fetch product' });
    }
});

// Bulk create products
router.post('/bulk', async (req, res) => {
    try {
        const products = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'Invalid product list' });
        }

        // Validate required fields for each product
        const validProducts = products.filter(p => p.name && p.price !== undefined && p.cost !== undefined).map(p => ({
            name: p.name,
            description: p.description,
            price: Number(p.price),
            cost: Number(p.cost),
            promoQuantity: p.promoQuantity ? Number(p.promoQuantity) : null,
            promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
            stock: p.stock ? Number(p.stock) : 0,
            minStock: p.minStock ? Number(p.minStock) : 10,
            stockUnit: p.stockUnit || 'unit',
            categoryId: p.categoryId || null,
            isActive: true,
            showInPos: true,
        }));

        if (validProducts.length === 0) {
            return res.status(400).json({ message: 'No valid products found to import' });
        }

        // Use transaction to ensure data integrity
        const createdCount = await req.tenantPrisma!.$transaction(async (tx) => {
            let count = 0;
            for (const product of validProducts) {
                await tx.product.create({ data: product });
                count++;
            }
            return count;
        });

        res.status(201).json({ message: `Successfully imported ${createdCount} products`, count: createdCount });
    } catch (error) {
        console.error('Bulk create product error', error);
        res.status(500).json({ message: 'Unable to import products' });
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        const { name, description, price, cost, promoQuantity, promoPrice, stock, minStock, stockUnit, categoryId, imageUrl, isActive, showInPos } = req.body;

        if (!name || price === undefined || cost === undefined) {
            return res.status(400).json({ message: 'Name, price, and cost are required' });
        }

        const product = await req.tenantPrisma!.product.create({
            data: {
                name,
                description,
                price,
                cost,
                promoQuantity: promoQuantity ? Number(promoQuantity) : null,
                promoPrice: promoPrice ? Number(promoPrice) : null,
                stock: stock ?? 0,
                minStock: minStock ?? 10,
                stockUnit: stockUnit ?? 'unit',
                categoryId,
                imageUrl,
                isActive: isActive ?? true,
                showInPos: showInPos ?? true,
            },
            include: { category: true },
        });
        res.status(201).json(toProductDto(product));
    } catch (error) {
        console.error('Create product error', error);
        res.status(500).json({ message: 'Unable to create product' });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, cost, promoQuantity, promoPrice, stock, minStock, stockUnit, categoryId, imageUrl, isActive, showInPos } = req.body;

        const data: Record<string, any> = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (price !== undefined) data.price = price;
        if (cost !== undefined) data.cost = cost;

        // Handle optional fields (allow setting to null)
        if (promoQuantity !== undefined) data.promoQuantity = promoQuantity;
        if (promoPrice !== undefined) data.promoPrice = promoPrice;
        if (categoryId !== undefined) data.categoryId = categoryId || null; // Handle empty string as null

        if (stock !== undefined) data.stock = stock;
        if (minStock !== undefined) data.minStock = minStock;
        if (stockUnit !== undefined) data.stockUnit = stockUnit;
        if (imageUrl !== undefined) data.imageUrl = imageUrl;
        if (typeof isActive === 'boolean') data.isActive = isActive;
        if (typeof showInPos === 'boolean') data.showInPos = showInPos;

        const product = await req.tenantPrisma!.product.update({
            where: { id },
            data,
            include: { category: true },
        });
        res.json(toProductDto(product));
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Unable to update product', error: String(error) });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Force delete everything associated with this product
        await req.tenantPrisma!.$transaction([
            req.tenantPrisma!.stockMovement.deleteMany({ where: { productId: id } }),
            req.tenantPrisma!.saleItem.deleteMany({ where: { productId: id } }),
            req.tenantPrisma!.billItem.deleteMany({ where: { productId: id } }),
            req.tenantPrisma!.product.delete({ where: { id } })
        ]);

        res.json({ message: 'ลบสินค้าและข้อมูลที่เกี่ยวข้องเรียบร้อยแล้ว' });


    } catch (error) {
        console.error('Delete product error', error);
        res.status(500).json({ message: 'Unable to delete product' });
    }
});

export const productsRouter = router;
