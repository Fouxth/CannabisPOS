import { PrismaClient } from '../generated/management';

const globalForManagement = globalThis as unknown as {
    managementPrisma: PrismaClient | undefined;
};

export const managementPrisma = globalForManagement.managementPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForManagement.managementPrisma = managementPrisma;
}

export type { Tenant, Prisma } from '../generated/management';
