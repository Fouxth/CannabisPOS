import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { toUserDto } from '../utils/dtos';

const router = Router();

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await req.tenantPrisma!.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(users.map(toUserDto));
    } catch (error) {
        console.error('Fetch users error', error);
        res.status(500).json({ message: 'Unable to fetch users' });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await req.tenantPrisma!.user.findUnique({
            where: { id },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(toUserDto(user));
    } catch (error) {
        console.error('Fetch user error', error);
        res.status(500).json({ message: 'Unable to fetch user' });
    }
});

// Create user
router.post('/', async (req, res) => {
    try {
        const { employeeCode, username, fullName, nickname, phone, avatarUrl, password, role } = req.body;

        if (!employeeCode || !username || !fullName || !role) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        const user = await req.tenantPrisma!.user.create({
            data: {
                employeeCode,
                username: username.toLowerCase(),
                fullName,
                nickname,
                phone,
                avatarUrl,
                password: hashedPassword,
                role,
            },
        });
        res.status(201).json(toUserDto(user));
    } catch (error: any) {
        console.error('Create user error', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Username or employee code already exists' });
        }
        res.status(500).json({ message: 'Unable to create user' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeCode, username, fullName, nickname, phone, avatarUrl, password, role, isActive } = req.body;

        const data: Record<string, any> = {};
        if (employeeCode !== undefined) data.employeeCode = employeeCode;
        if (username !== undefined) data.username = username.toLowerCase();
        if (fullName !== undefined) data.fullName = fullName;
        if (nickname !== undefined) data.nickname = nickname;
        if (phone !== undefined) data.phone = phone;
        if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
        if (role !== undefined) data.role = role;
        if (typeof isActive === 'boolean') data.isActive = isActive;
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await req.tenantPrisma!.user.update({
            where: { id },
            data,
        });
        res.json(toUserDto(user));
    } catch (error: any) {
        console.error('Update user error', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Username or employee code already exists' });
        }
        res.status(500).json({ message: 'Unable to update user' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await req.tenantPrisma!.user.delete({
            where: { id },
        });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error', error);
        res.status(500).json({ message: 'Unable to delete user' });
    }
});

export const usersRouter = router;
