import { Router } from 'express';
import { toPaymentMethodDto } from '../utils/dtos';

const router = Router();

// Get all payment methods
router.get('/', async (req, res) => {
    try {
        const paymentMethods = await req.tenantPrisma!.paymentMethod.findMany({
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });
        res.json(paymentMethods.map(toPaymentMethodDto));
    } catch (error) {
        console.error('Fetch payment methods error', error);
        res.status(500).json({ message: 'Unable to fetch payment methods' });
    }
});

// Update payment method
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, nameEn, icon, isActive, isDefault } = req.body;
        const data: Record<string, any> = {};
        if (typeof name === 'string') data.name = name;
        if (typeof nameEn === 'string') data.nameEn = nameEn;
        if (typeof icon === 'string') data.icon = icon;
        if (typeof isActive === 'boolean') data.isActive = isActive;
        if (typeof isDefault === 'boolean') data.isDefault = isDefault;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided' });
        }

        const method = await req.tenantPrisma!.paymentMethod.update({
            where: { id },
            data,
        });

        if (data.isDefault) {
            await req.tenantPrisma!.paymentMethod.updateMany({
                where: { id: { not: id } },
                data: { isDefault: false },
            });
        }

        res.json(toPaymentMethodDto(method));
    } catch (error) {
        console.error('Update payment method error', error);
        res.status(500).json({ message: 'Unable to update payment method' });
    }
});

export const paymentMethodsRouter = router;
