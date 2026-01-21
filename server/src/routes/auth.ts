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

export const authRouter = router;
