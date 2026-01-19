import { Router } from 'express';
import { toNotificationDto } from '../utils/dtos';

const router = Router();

// Get notifications for user
router.get('/', async (req, res) => {
    try {
        const { userId, unreadOnly } = req.query;

        const where: any = {};
        if (userId && typeof userId === 'string') {
            where.userId = userId;
        }
        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const notifications = await req.tenantPrisma!.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json(notifications.map(toNotificationDto));
    } catch (error) {
        console.error('Fetch notifications error', error);
        res.status(500).json({ message: 'Unable to fetch notifications' });
    }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
    try {
        const { userId } = req.query;

        const where: any = { isRead: false };
        if (userId && typeof userId === 'string') {
            where.userId = userId;
        }

        const count = await req.tenantPrisma!.notification.count({ where });
        res.json({ count });
    } catch (error) {
        console.error('Fetch unread count error', error);
        res.status(500).json({ message: 'Unable to fetch unread count' });
    }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await req.tenantPrisma!.notification.update({
            where: { id },
            data: { isRead: true },
        });
        res.json(toNotificationDto(notification));
    } catch (error) {
        console.error('Mark notification read error', error);
        res.status(500).json({ message: 'Unable to mark notification as read' });
    }
});

// Mark all notifications as read for user
router.put('/read-all', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        await req.tenantPrisma!.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error', error);
        res.status(500).json({ message: 'Unable to mark all notifications as read' });
    }
});

// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await req.tenantPrisma!.notification.delete({
            where: { id },
        });
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete notification error', error);
        res.status(500).json({ message: 'Unable to delete notification' });
    }
});

// Delete all read notifications for user
router.delete('/clear-read', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ message: 'User ID is required' });
        }

        await req.tenantPrisma!.notification.deleteMany({
            where: { userId, isRead: true },
        });
        res.json({ message: 'Read notifications cleared' });
    } catch (error) {
        console.error('Clear read notifications error', error);
        res.status(500).json({ message: 'Unable to clear read notifications' });
    }
});

export const notificationsRouter = router;
