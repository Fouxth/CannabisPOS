import { Router } from 'express';
import { DEFAULT_SETTINGS, SettingKey, getSettingValue } from '../utils/helpers';
import { toPaymentMethodDto } from '../utils/dtos';
import { smsService } from '../services/SmsService';

const router = Router();

// Get all settings
router.get('/', async (req, res) => {
    try {
        const keys = Object.keys(DEFAULT_SETTINGS) as SettingKey[];
        const values = await Promise.all(keys.map((key) => getSettingValue(key, req.tenantPrisma!)));
        const response = keys.reduce<Record<string, any>>((acc, key, index) => {
            acc[key] = values[index];
            return acc;
        }, {});
        res.json(response);
    } catch (error) {
        console.error('Fetch settings error', error);
        res.status(500).json({ message: 'Unable to fetch settings' });
    }
});

// Update settings section
router.put('/:section', async (req, res) => {
    try {
        const section = req.params.section as SettingKey;
        if (!DEFAULT_SETTINGS[section]) {
            return res.status(400).json({ message: 'Invalid settings section' });
        }
        const value = req.body ?? {};
        const setting = await req.tenantPrisma!.systemSetting.upsert({
            where: { key: section },
            update: { value },
            create: { key: section, value },
        });
        res.json(setting.value);
    } catch (error) {
        console.error('Update settings error', error);
        res.status(500).json({ message: 'Unable to update settings' });
    }
});

// Get payment methods (under settings)
router.get('/payment-methods', async (req, res) => {
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
router.put('/payment-methods/:id', async (req, res) => {
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

// Test SMS - Send all Flex Message types
router.post('/test-sms', async (req, res) => {
    try {
        const settings = await getSettingValue('sms', req.tenantPrisma!);
        if (!settings.enabled) {
            return res.status(400).json({ message: 'SMS is disabled in settings' });
        }

        // Sample data for testing
        const sampleSaleItems = [
            { name: 'สินค้าตัวอย่าง A', quantity: 2, price: 500 },
            { name: 'สินค้าตัวอย่าง B', quantity: 1, price: 350 },
        ];

        // Send all 4 Flex Message types for testing
        await Promise.all([
            // 1. Sales Flex
            smsService.sendSalesAlert(
                'TEST-' + Date.now().toString().slice(-6),
                850,
                sampleSaleItems,
                'cash',
                req.tenantPrisma!
            ),
            // 2. Low Stock Flex
            smsService.sendLowStockAlert(
                'สินค้าตัวอย่าง',
                5,
                10,
                'ชิ้น',
                req.tenantPrisma!
            ),
            // 3. Stock Adjustment Flex
            smsService.sendStockAdjustmentAlert(
                'สินค้าตัวอย่าง',
                50,
                45,
                'ทดสอบระบบ',
                req.tenantPrisma!
            ),
            // 4. Daily Summary Flex
            smsService.sendDailySummaryAlert(
                12500,
                15,
                3200,
                'สินค้าขายดี',
                8500,
                4000,
                req.tenantPrisma!
            ),
            // 5. Monthly Summary Flex
            smsService.sendMonthlySummaryAlert(
                new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
                385000,
                156,
                85000,
                250000,
                135000,
                'สินค้าขายดีประจำเดือน',
                req.tenantPrisma!
            ),
        ]);

        res.json({ message: 'ส่ง Flex Message ทดสอบ 5 รายการเรียบร้อย!' });
    } catch (error) {
        console.error('Test SMS error', error);
        res.status(500).json({ message: 'Unable to send test SMS' });
    }
});

// LINE Webhook removed (moved to auth routes for public access)

export const settingsRouter = router;
