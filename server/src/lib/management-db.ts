// Use relative path to access the generated management client in root node_modules
import { PrismaClient } from '../../../node_modules/@prisma/management-client/index.js';

declare global {
    var managementPrisma: PrismaClient | undefined;
}

export const managementPrisma = global.managementPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.managementPrisma = managementPrisma;
}

export type { Tenant, Domain, Prisma } from '../../../node_modules/@prisma/management-client/index.js';
