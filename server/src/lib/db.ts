import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage holds the tenantId context for the current request lifecycle
export const tenantLocalStorage = new AsyncLocalStorage<string>();

const globalForPrisma = globalThis as unknown as {
    basePrisma: PrismaClient | undefined;
    prisma: any;
};

const basePrisma = globalForPrisma.basePrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.basePrisma = basePrisma;
}

// Prisma Client Extension to automatically filter and inject tenantId on all POS queries
export const prisma = globalForPrisma.prisma ?? basePrisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const tenantId = tenantLocalStorage.getStore();

                if (tenantId) {
                    // 1. Inject tenantId into write operations
                    if (operation === 'create') {
                        args.data = { ...args.data, tenantId };
                    } else if (operation === 'createMany') {
                        if (Array.isArray(args.data)) {
                            args.data = args.data.map((item: any) => ({ ...item, tenantId }));
                        } else {
                            args.data = { ...args.data, tenantId };
                        }
                    } else if (operation === 'upsert') {
                        args.create = { ...args.create, tenantId };
                        args.update = { ...args.update, tenantId };
                    }

                    if ([
                        'findFirst', 'findFirstOrThrow', 'findMany', 'findUnique', 
                        'findUniqueOrThrow', 'update', 'updateMany', 'delete', 
                        'deleteMany', 'count', 'aggregate', 'groupBy'
                    ].includes(operation)) {
                        const anyArgs = args as any;
                        anyArgs.where = { ...anyArgs.where, tenantId };
                    }
                }

                return query(args);
            }
        }
    }
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
