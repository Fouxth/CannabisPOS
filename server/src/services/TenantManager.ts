import { PrismaClient } from '@prisma/client';
import { managementPrisma } from '../lib/management-db';

export class TenantManager {
    private static instances: Map<string, PrismaClient> = new Map();

    static async getTenantClient(domain: string): Promise<PrismaClient | null> {
        // 1. Check if we have a cached client for this domain
        // Note: We might want to cache by tenant ID instead, but for middleware resolution, domain is the entry point.
        // Let's resolve tenant first.

        // Optimization: Cache the domain->tenantId mapping? 
        // For now, let's query the management DB.

        const tenantDomain = await managementPrisma.domain.findUnique({
            where: { domain },
            include: { tenant: true },
        });

        if (!tenantDomain || !tenantDomain.tenant.isActive) {
            return null;
        }

        const tenant = tenantDomain.tenant;

        if (this.instances.has(tenant.id)) {
            return this.instances.get(tenant.id)!;
        }

        // 2. Create new client
        const client = new PrismaClient({
            datasources: {
                db: {
                    url: tenant.dbUrl,
                },
            },
        });

        this.instances.set(tenant.id, client);
        return client;
    }

    static async getTenantClientById(tenantId: string): Promise<PrismaClient | null> {
        if (this.instances.has(tenantId)) {
            return this.instances.get(tenantId)!;
        }

        const tenant = await managementPrisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant || !tenant.isActive) {
            return null;
        }

        const client = new PrismaClient({
            datasources: {
                db: {
                    url: tenant.dbUrl,
                },
            },
        });

        this.instances.set(tenantId, client);
        return client;
    }
}
