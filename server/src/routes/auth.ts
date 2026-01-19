import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { toUserDto } from '../utils/dtos';
import { generateToken } from '../middleware/auth';

const router = Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const normalizedUsername = username.toLowerCase();

        const user = await req.tenantPrisma!.user.findUnique({
            where: { username: normalizedUsername },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        await req.tenantPrisma!.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate Token
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
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
