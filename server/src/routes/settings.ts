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

// Test SMS
router.post('/test-sms', async (req, res) => {
    try {
        const settings = await getSettingValue('sms', req.tenantPrisma!);
        if (!settings.enabled) {
            return res.status(400).json({ message: 'SMS is disabled in settings' });
        }
        await smsService.sendSms(settings.recipients as unknown as string[], 'Test SMS from CannabisPOS', req.tenantPrisma!);
        res.json({ message: 'Test SMS sent' });
    } catch (error) {
        console.error('Test SMS error', error);
        res.status(500).json({ message: 'Unable to send test SMS' });
    }
});

// LINE Webhook
router.post('/line-webhook', async (req, res) => {
    try {
        const events = req.body.events; // LINE sends an array of events
        if (!events || events.length === 0) {
            return res.status(200).send('OK');
        }

        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
            console.error('LINE Token missing');
            return res.status(500).send('Server Error');
        }

        for (const event of events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const text = event.message.text.trim().toLowerCase();
                if (text === 'id' || text === 'check') {
                    const userId = event.source.userId;
                    const replyToken = event.replyToken;

                    // Reply with ID
                    await fetch('https://api.line.me/v2/bot/message/reply', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            replyToken: replyToken,
                            messages: [{
                                type: 'text',
                                text: `User ID ของคุณคือ:\n${userId}\n(Copy รหัสนี้ไปใส่ในหน้าตั้งค่าได้เลยครับ)`
                            }]
                        })
                    });
                }
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('LINE Webhook Error', error);
        res.status(500).send('Error');
    }
});

export const settingsRouter = router;
