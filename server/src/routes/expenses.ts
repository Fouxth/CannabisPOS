import { Router } from 'express';
import { ExpenseCategory } from '@prisma/client';
import { toExpenseDto } from '../utils/dtos';

const router = Router();

// Get all expenses
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where: any = {};
        if (startDate && typeof startDate === 'string') {
            where.date = { ...where.date, gte: new Date(startDate) };
        }
        if (endDate && typeof endDate === 'string') {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.date = { ...where.date, lte: end };
        }

        const expenses = await req.tenantPrisma!.expense.findMany({
            where,
            orderBy: { date: 'desc' },
            include: { user: true },
        });
        res.json(expenses.map(toExpenseDto));
    } catch (error) {
        console.error('Fetch expenses error', error);
        res.status(500).json({ message: 'Unable to fetch expenses' });
    }
});

// Get expense by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await req.tenantPrisma!.expense.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json(toExpenseDto(expense));
    } catch (error) {
        console.error('Fetch expense error', error);
        res.status(500).json({ message: 'Unable to fetch expense' });
    }
});

// Create expense
router.post('/', async (req, res) => {
    try {
        const { title, amount, category, date, userId, notes } = req.body;

        if (!title || amount === undefined || !category || !date || !userId) {
            return res.status(400).json({ message: 'Title, amount, category, date, and user ID are required' });
        }

        // Validate category
        const validCategories = Object.values(ExpenseCategory);
        const upperCategory = category.toUpperCase();
        if (!validCategories.includes(upperCategory as ExpenseCategory)) {
            return res.status(400).json({ message: 'Invalid expense category' });
        }

        const expense = await req.tenantPrisma!.expense.create({
            data: {
                title,
                amount,
                category: upperCategory as ExpenseCategory,
                date: new Date(date),
                userId,
                notes,
            },
            include: { user: true },
        });
        res.status(201).json(toExpenseDto(expense));
    } catch (error) {
        console.error('Create expense error', error);
        res.status(500).json({ message: 'Unable to create expense' });
    }
});

// Update expense
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, amount, category, date, notes } = req.body;

        const data: Record<string, any> = {};
        if (title !== undefined) data.title = title;
        if (amount !== undefined) data.amount = amount;
        if (category !== undefined) {
            const validCategories = Object.values(ExpenseCategory);
            const upperCategory = category.toUpperCase();
            if (!validCategories.includes(upperCategory as ExpenseCategory)) {
                return res.status(400).json({ message: 'Invalid expense category' });
            }
            data.category = upperCategory;
        }
        if (date !== undefined) data.date = new Date(date);
        if (notes !== undefined) data.notes = notes;

        const expense = await req.tenantPrisma!.expense.update({
            where: { id },
            data,
            include: { user: true },
        });
        res.json(toExpenseDto(expense));
    } catch (error) {
        console.error('Update expense error', error);
        res.status(500).json({ message: 'Unable to update expense' });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await req.tenantPrisma!.expense.delete({
            where: { id },
        });
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Delete expense error', error);
        res.status(500).json({ message: 'Unable to delete expense' });
    }
});

export const expensesRouter = router;
