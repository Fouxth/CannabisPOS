import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { toUserDto } from '../utils/dtos';
import { managementPrisma } from '../lib/management-db';
import { requirePermission, hasPermission } from '../middleware/permissions';

const router = Router();

// Get all users
router.get('/', requirePermission('VIEW_USERS'), async (req, res) => {
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
        const currentUser = req.user;

        // Allow self view or require VIEW_USERS
        if (currentUser?.id !== id && !hasPermission(currentUser?.role as any, 'VIEW_USERS')) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ในการดูข้อมูลผู้ใช้อื่น' });
        }

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
router.post('/', requirePermission('MANAGE_USERS'), async (req, res) => {
    try {
        const { employeeCode, username, fullName, nickname, phone, avatarUrl, password, role } = req.body;
        const currentUser = req.user;

        if (!employeeCode || !username || !fullName || !role) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!currentUser?.tenantId) {
            return res.status(403).json({ message: 'Only tenant users can create employees' });
        }

        // Prevent privilege escalation: non-SUPER_ADMIN cannot create SUPER_ADMIN
        if (role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'ไม่สามารถสร้างผู้ใช้สิทธิ์ SUPER_ADMIN ได้' });
        }

        const normalizedUsername = username.toLowerCase();

        // 1. Check uniqueness in Management DB
        try {
            const existingUser = await managementPrisma.user.findFirst({
                where: {
                    username: { equals: normalizedUsername, mode: 'insensitive' }
                }
            });

            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
        } catch (err: any) {
            return res.status(500).json({ message: 'Internal server error during username check', error: err.message });
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        // 2. Create in Management DB
        const centralUser = await managementPrisma.user.create({
            data: {
                username: normalizedUsername,
                password: hashedPassword,
                role: role,
                tenantId: currentUser.tenantId,
                isActive: true
            }
        });

        // 3. Create in Tenant DB (using same ID)
        try {
            const user = await req.tenantPrisma!.user.create({
                data: {
                    id: centralUser.id,
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
        const currentUser = req.user;
        const { employeeCode, username, fullName, nickname, phone, avatarUrl, password, role, isActive } = req.body;

        const isSelf = currentUser?.id === id;
        const canManage = hasPermission(currentUser?.role as any, 'MANAGE_USERS');

        if (!isSelf && !canManage) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้อื่น' });
        }

        // Verify user exists in current tenant
        const existingTenantUser = await req.tenantPrisma!.user.findUnique({
            where: { id },
        });

        if (!existingTenantUser) {
            return res.status(404).json({ message: 'User not found in tenant' });
        }

        const data: Record<string, any> = {};

        if (canManage) {
            if (employeeCode !== undefined) data.employeeCode = employeeCode;
            if (username !== undefined) data.username = username.toLowerCase();
            if (role !== undefined) {
                if (role === 'SUPER_ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
                    return res.status(403).json({ message: 'ไม่สามารถมอบสิทธิ์ SUPER_ADMIN ได้' });
                }
                data.role = role;
            }
            if (typeof isActive === 'boolean') data.isActive = isActive;
            if (password) {
                data.password = await bcrypt.hash(password, 10);
            }
        }

        // Safe profile fields accessible to self or admin
        if (fullName !== undefined) data.fullName = fullName;
        if (nickname !== undefined) data.nickname = nickname;
        if (phone !== undefined) data.phone = phone;
        if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

        // Update in Tenant DB
        const updatedUser = await req.tenantPrisma!.user.update({
            where: { id },
            data,
        });

        // Sync with Management DB (with tenant check!)
        if (currentUser?.tenantId) {
            await managementPrisma.user.updateMany({
                where: { id, tenantId: currentUser.tenantId },
                data: {
                    ...(data.username && { username: data.username }),
                    ...(data.password && { password: data.password }),
                    ...(data.role && { role: data.role }),
                    ...(data.isActive !== undefined && { isActive: data.isActive }),
                },
            }).catch(err => {
                console.warn('Failed to sync central user:', err);
            });
        }

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
        if (currentUser?.id !== id && currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN' && currentUser?.role !== 'OWNER') {
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

        // Verify current password against Management DB
        const centralUser = await managementPrisma.user.findFirst({
            where: { id, tenantId: currentUser?.tenantId || undefined },
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
            managementPrisma.user.updateMany({
                where: { id, tenantId: currentUser?.tenantId || undefined },
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
router.delete('/:id', requirePermission('MANAGE_USERS'), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        if (currentUser?.id === id) {
            return res.status(400).json({ message: 'ไม่สามารถลบบัญชีผู้ใช้ของตัวเองได้' });
        }

        const targetTenantUser = await req.tenantPrisma!.user.findUnique({
            where: { id },
        });

        if (!targetTenantUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetTenantUser.role === 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'ไม่สามารถลบบัญชี SUPER_ADMIN ได้' });
        }

        // Delete from tenant DB
        await req.tenantPrisma!.user.delete({
            where: { id },
        });

        // Delete from central management DB with tenant filter
        if (currentUser?.tenantId) {
            await managementPrisma.user.deleteMany({
                where: { id, tenantId: currentUser.tenantId },
            }).catch(err => console.warn('Failed to delete central user record:', err));
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error', error);
        res.status(500).json({ message: 'Unable to delete user' });
    }
});

export const usersRouter = router;
