import { Router } from 'express';
import { toCategoryDto } from '../utils/dtos';

const router = Router();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await req.tenantPrisma!.category.findMany({
            orderBy: { sortOrder: 'asc' },
            include: { _count: { select: { products: true } } },
        });
        res.json(categories.map((category) => toCategoryDto({ ...category, productCount: category._count.products })));
    } catch (error) {
        console.error('Fetch categories error', error);
        res.status(500).json({ message: 'Unable to fetch categories' });
    }
});

// Get category by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await req.tenantPrisma!.category.findUnique({
            where: { id },
            include: { _count: { select: { products: true } } },
        });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(toCategoryDto({ ...category, productCount: category._count.products }));
    } catch (error) {
        console.error('Fetch category error', error);
        res.status(500).json({ message: 'Unable to fetch category' });
    }
});

// Create category
router.post('/', async (req, res) => {
    try {
        const { name, nameEn, slug, description, color, icon, isActive, parentId, sortOrder } = req.body;

        if (!name || !slug || !color || !icon) {
            return res.status(400).json({ message: 'Name, slug, color, and icon are required' });
        }

        const category = await req.tenantPrisma!.category.create({
            data: {
                name,
                nameEn,
                slug,
                description,
                color,
                icon,
                isActive: isActive ?? true,
                parentId,
                sortOrder: sortOrder ?? 0,
            },
            include: { _count: { select: { products: true } } },
        });
        res.status(201).json(toCategoryDto({ ...category, productCount: category._count.products }));
    } catch (error: any) {
        console.error('Create category error', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Slug already exists' });
        }
        res.status(500).json({ message: 'Unable to create category' });
    }
});

// Update category
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, nameEn, slug, description, color, icon, isActive, parentId, sortOrder } = req.body;

        const data: Record<string, any> = {};
        if (name !== undefined) data.name = name;
        if (nameEn !== undefined) data.nameEn = nameEn;
        if (slug !== undefined) data.slug = slug;
        if (description !== undefined) data.description = description;
        if (color !== undefined) data.color = color;
        if (icon !== undefined) data.icon = icon;
        if (typeof isActive === 'boolean') data.isActive = isActive;
        if (parentId !== undefined) data.parentId = parentId;
        if (sortOrder !== undefined) data.sortOrder = sortOrder;

        const category = await req.tenantPrisma!.category.update({
            where: { id },
            data,
            include: { _count: { select: { products: true } } },
        });
        res.json(toCategoryDto({ ...category, productCount: category._count.products }));
    } catch (error: any) {
        console.error('Update category error', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Slug already exists' });
        }
        res.status(500).json({ message: 'Unable to update category' });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await req.tenantPrisma!.category.delete({
            where: { id },
        });
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error', error);
        res.status(500).json({ message: 'Unable to delete category' });
    }
});

export const categoriesRouter = router;
