// Import from local generated directory to avoid node_modules path issues on Vercel
import { PrismaClient } from '../generated/management-client/index.js';

declare global {
    var managementPrisma: PrismaClient | undefined;
}

export const managementPrisma = global.managementPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.managementPrisma = managementPrisma;
}

export type { Tenant, Domain, Prisma } from '../generated/management-client/index.js';
