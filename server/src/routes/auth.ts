import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { toUserDto } from '../utils/dtos';
import { generateToken } from '../middleware/auth';
import { managementPrisma } from '../lib/management-db'; // Import Management DB

const router = Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // AUTH CHECK: Check against CENTRAL Management DB (case-insensitive)
        const user = await managementPrisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive' // Case-insensitive search
                }
            },
            include: { tenant: true }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // CHECK: Is User Active?
        if (!user.isActive) {
            return res.status(403).json({ message: 'User account is inactive' });
        }

        // CHECK: Is Tenant Active? (If user belongs to a tenant)
        if (user.tenant && !user.tenant.isActive) {
            return res.status(403).json({ message: 'Shop is inactive. Please contact support.' });
        }

        await managementPrisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate Token with Tenant ID
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role, // Use role from Management DB (or map it)
            tenantId: user.tenantId // CRITICAL: This allows routing
        });

        res.json({
            user: toUserDto(user),
            token
        });
    } catch (error) {
        console.error('Login error', error);
        res.status(500).json({ message: 'Unable to login' });
    }
});

// LINE Webhook (Public)
router.post('/line-webhook', async (req, res) => {
    try {
        const events = req.body.events;
        if (!events || events.length === 0) {
            return res.status(200).send('OK');
        }

        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
            return res.status(500).send('Server Error');
        }

        for (const event of events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const text = event.message.text.trim().toLowerCase();
                if (text === 'id' || text === 'check') {
                    const userId = event.source.userId;
                    const replyToken = event.replyToken;

                    // Skip verification events (dummy replyToken)
                    if (replyToken === '00000000000000000000000000000000') {
                        continue;
                    }

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

export const authRouter = router;
