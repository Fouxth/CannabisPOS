import { PrismaClient } from '@prisma/management-client';

declare global {
    var managementPrisma: PrismaClient | undefined;
}

export const managementPrisma = global.managementPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.managementPrisma = managementPrisma;
}

export * from '@prisma/management-client';
