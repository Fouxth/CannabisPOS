import { PrismaClient } from '@prisma/client';
import { managementPrisma } from '../lib/management-db';
import { createTenantScopedPrisma } from '../lib/db';

export class TenantManager {
    static async getTenantClientById(tenantId: string): Promise<PrismaClient | null> {
        // ALWAYS check for tenant existence and active status first
        const tenant = await managementPrisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant || !tenant.isActive) {
            return null;
        }

        // Return a client strictly scoped to this tenant ID
        return createTenantScopedPrisma(tenantId);
    }
}
