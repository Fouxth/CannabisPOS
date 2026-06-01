import { PrismaClient } from '@prisma/client';
import { managementPrisma } from '../lib/management-db';
import { prisma } from '../lib/db';

export class TenantManager {
    static async getTenantClientById(tenantId: string): Promise<PrismaClient | null> {
        // ALWAYS check for tenant existence and active status first
        const tenant = await managementPrisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant || !tenant.isActive) {
            return null;
        }

        // Return the single shared database client (targets cannabispos_d4)
        return prisma;
    }
}
