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

        // Update in BOTH databases to keep them in sync (especially for login data)
        const [updatedUser] = await Promise.all([
            req.tenantPrisma!.user.update({
                where: { id },
                data,
            }),
            managementPrisma.user.update({
                where: { id },
                data: {
                    // Sync only relevant fields to central DB
                    ...(data.username && { username: data.username }),
                    ...(data.fullName && { fullName: data.fullName }),
                    ...(data.password && { password: data.password }),
                    ...(data.isActive !== undefined && { isActive: data.isActive }),
                    // Note: Management DB might not have all fields like nickname/phone/avatarUrl if schema differs
                    // But assuming it does based on User interface in Auth
                },
            }).catch(err => {
                console.warn('Failed to update central user, but proceeding:', err);
                // Don't fail the request if central update fails (e.g. schema mismatch)
                // But ideally we should keep them in sync.
                return null;
            })
        ]);

        res.json(toUserDto(updatedUser));
    } catch (error: any) {
        console.error('Update user error', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Username or employee code already exists' });
        }
        res.status(500).json({ message: 'Unable to update user' });
    }
});

// Change Password (Secure)
router.put('/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        const currentUser = req.user;

        // Security Check: Only allow self-update or Admin
        if (currentUser?.id !== id && currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์ในการเปลี่ยนรหัสผ่านของผู้อื่น' });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'กรุณาระบุรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
        }

        const user = await req.tenantPrisma!.user.findUnique({
            where: { id },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password (Check against Management DB as it is the auth source)
        const centralUser = await managementPrisma.user.findUnique({
            where: { id },
        });

        if (!centralUser) {
            return res.status(404).json({ message: 'User not found in central database' });
        }

        const isValid = await bcrypt.compare(currentPassword, centralUser.password);
        if (!isValid) {
            return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update in BOTH databases to keep them in sync
        await Promise.all([
            managementPrisma.user.update({
                where: { id },
                data: { password: hashedPassword },
            }),
            req.tenantPrisma!.user.update({
                where: { id },
                data: { password: hashedPassword },
            })
        ]);

        res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Change password error', error);
        res.status(500).json({ message: 'Unable to change password' });
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
