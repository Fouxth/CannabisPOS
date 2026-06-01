import { managementPrisma } from '../lib/management-db';
import dotenv from 'dotenv';

dotenv.config();

export class ProvisioningService {
    static async createTenant(name: string, slug: string, domain: string, ownerName?: string) {
        const dbName = `cannabispos_d4_${slug}`;
        const dbUrl = process.env.DATABASE_URL!;

        console.log(`[Provisioning] Creating tenant record: ${name} (${slug})`);

        // Create Tenant Record in Central Management DB
        let tenant;
        try {
            tenant = await managementPrisma.tenant.create({
                data: {
                    name,
                    slug,
                    dbName,
                    dbUrl,
                    ownerName,
                    isActive: true
                }
            });
            console.log('[Provisioning] ✅ Tenant record created');
        } catch (e) {
            console.error('[Provisioning] ❌ Failed to create tenant record:', e);
            throw e;
        }

        return tenant;
    }
}
