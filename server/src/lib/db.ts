import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage holds the tenantId context for the current request lifecycle
export const tenantLocalStorage = new AsyncLocalStorage<string>();

const basePrisma = new PrismaClient();

// Prisma Client Extension to automatically filter and inject tenantId on all POS queries
export const prisma = basePrisma.$extends({
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

                    // 2. Filter read/modify operations by tenantId
                    if ([
                        'findFirst', 'findFirstOrThrow', 'findMany', 'findUnique', 
                        'findUniqueOrThrow', 'update', 'updateMany', 'delete', 
                        'deleteMany', 'count', 'aggregate', 'groupBy'
                    ].includes(operation)) {
                        args.where = { ...args.where, tenantId };
                    }
                }

                return query(args);
            }
        }
    }
}) as unknown as PrismaClient; // Cast to retain type compatibility for existing code

declare global {
    var prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
