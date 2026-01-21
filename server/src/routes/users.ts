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

import { managementPrisma } from '../lib/management-db';

// ... existing imports ...

// Create user
router.post('/', async (req, res) => {
    try {
        const { employeeCode, username, fullName, nickname, phone, avatarUrl, password, role } = req.body;
        const currentUser = req.user;

        if (!employeeCode || !username || !fullName || !role) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!currentUser?.tenantId) {
            return res.status(403).json({ message: 'Only tenant users can create employees' });
        }

        const normalizedUsername = username.toLowerCase();

        // 1. Check uniqueness in Management DB
        const existingUser = await managementPrisma.user.findFirst({
            where: {
                username: { equals: normalizedUsername, mode: 'insensitive' }
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        // 2. Create in Management DB
        const centralUser = await managementPrisma.user.create({
            data: {
                username: normalizedUsername,
                password: hashedPassword,
                role: role, // Storing as string
                tenantId: currentUser.tenantId,
                isActive: true
            }
        });

        // 3. Create in Tenant DB (using same ID)
        try {
            const user = await req.tenantPrisma!.user.create({
                data: {
                    id: centralUser.id, // Use same ID
                    employeeCode,
                    username: normalizedUsername,
                    fullName,
                    nickname,
                    phone,
                    avatarUrl,
                    password: hashedPassword,
                    role,
                },
            });
            res.status(201).json(toUserDto(user));
        } catch (tenantError: any) {
            // Rollback Management DB creation if Tenant DB fails
            console.error('Tenant DB creation failed, rolling back central user...', tenantError);
            await managementPrisma.user.delete({ where: { id: centralUser.id } });

            if (tenantError.code === 'P2002') {
                return res.status(400).json({ message: 'Employee code already exists' });
            }
            throw tenantError;
        }

    } catch (error: any) {
        console.error('Create user error', error);
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
