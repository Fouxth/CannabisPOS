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

// Create product
router.post('/', async (req, res) => {
    try {
        const { name, nameEn, description, price, cost, comparePrice, stock, minStock, stockUnit, categoryId, imageUrl, isActive, showInPos } = req.body;

        if (!name || price === undefined || cost === undefined) {
            return res.status(400).json({ message: 'Name, price, and cost are required' });
        }

        const product = await req.tenantPrisma!.product.create({
            data: {
                name,
                nameEn,
                description,
                price,
                cost,
                comparePrice,
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
        const { name, nameEn, description, price, cost, comparePrice, stock, minStock, stockUnit, categoryId, imageUrl, isActive, showInPos } = req.body;

        const data: Record<string, any> = {};
        if (name !== undefined) data.name = name;
        if (nameEn !== undefined) data.nameEn = nameEn;
        if (description !== undefined) data.description = description;
        if (price !== undefined) data.price = price;
        if (cost !== undefined) data.cost = cost;
        if (comparePrice !== undefined) data.comparePrice = comparePrice;
        if (stock !== undefined) data.stock = stock;
        if (minStock !== undefined) data.minStock = minStock;
        if (stockUnit !== undefined) data.stockUnit = stockUnit;
        if (categoryId !== undefined) data.categoryId = categoryId;
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
        console.error('Update product error', error);
        res.status(500).json({ message: 'Unable to update product' });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await req.tenantPrisma!.product.delete({
            where: { id },
        });
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error', error);
        res.status(500).json({ message: 'Unable to delete product' });
    }
});

export const productsRouter = router;
