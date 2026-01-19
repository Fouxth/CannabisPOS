import { Router } from 'express';

const router = Router();

// DTO for audit log
const toAuditLogDto = (log: any) => ({
    id: log.id,
    userId: log.userId,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId ?? undefined,
    oldValue: log.oldValue ?? undefined,
    newValue: log.newValue ?? undefined,
    ipAddress: log.ipAddress ?? undefined,
    userAgent: log.userAgent ?? undefined,
    createdAt: log.createdAt.toISOString(),
});

// Get audit logs
router.get('/', async (req, res) => {
    try {
        const { userId, entity, entityId, startDate, endDate, limit = '100' } = req.query;

        const where: any = {};
        if (userId && typeof userId === 'string') where.userId = userId;
        if (entity && typeof entity === 'string') where.entity = entity;
        if (entityId && typeof entityId === 'string') where.entityId = entityId;

        if (startDate && typeof startDate === 'string') {
            where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
        }
        if (endDate && typeof endDate === 'string') {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt = { ...where.createdAt, lte: end };
        }

        const logs = await req.tenantPrisma!.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string, 10) || 100,
        });
        res.json(logs.map(toAuditLogDto));
    } catch (error) {
        console.error('Fetch audit logs error', error);
        res.status(500).json({ message: 'Unable to fetch audit logs' });
    }
});

// Get audit log by entity
router.get('/entity/:entity/:entityId', async (req, res) => {
    try {
        const { entity, entityId } = req.params;

        const logs = await req.tenantPrisma!.auditLog.findMany({
            where: { entity, entityId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(logs.map(toAuditLogDto));
    } catch (error) {
        console.error('Fetch entity audit logs error', error);
        res.status(500).json({ message: 'Unable to fetch audit logs' });
    }
});

// Create audit log (internal use)
router.post('/', async (req, res) => {
    try {
        const { userId, action, entity, entityId, oldValue, newValue, ipAddress, userAgent } = req.body;

        if (!userId || !action || !entity) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const log = await req.tenantPrisma!.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                oldValue,
                newValue,
                ipAddress,
                userAgent,
            },
        });
        res.status(201).json(toAuditLogDto(log));
    } catch (error) {
        console.error('Create audit log error', error);
        res.status(500).json({ message: 'Unable to create audit log' });
    }
});

export const auditLogsRouter = router;

// Helper function to create audit log
export const createAuditLog = async (
    prisma: any,
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    oldValue?: any,
    newValue?: any,
    req?: any
) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                oldValue,
                newValue,
                ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
                userAgent: req?.headers?.['user-agent'] || null,
            },
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};
