import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage holds the tenantId context for the current request lifecycle
export const tenantLocalStorage = new AsyncLocalStorage<string>();

const globalForPrisma = globalThis as unknown as {
    basePrisma: PrismaClient | undefined;
    prisma: any;
};

export const basePrisma = globalForPrisma.basePrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.basePrisma = basePrisma;
}

/**
 * Creates a Prisma Client instance strictly bound to a specific tenant ID.
 * All queries on this client are automatically scoped to tenantId.
 */
export function createTenantScopedPrisma(tenantId: string) {
    return basePrisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const injectTenantToData = (data: any): any => {
                        if (!data || typeof data !== 'object') return data;
                        if (Array.isArray(data)) {
                            return data.map((item: any) => injectTenantToData(item));
                        }
                        const result: any = { ...data, tenantId };
                        for (const key of Object.keys(result)) {
                            if (result[key] && typeof result[key] === 'object' && 'create' in result[key]) {
                                result[key] = {
                                    ...result[key],
                                    create: injectTenantToData(result[key].create)
                                };
                            }
                        }
                        return result;
                    };

                    if (operation === 'create' || operation === 'createMany') {
                        args.data = injectTenantToData(args.data);
                    } else if (operation === 'upsert') {
                        args.create = injectTenantToData(args.create);
                        args.update = injectTenantToData(args.update);
                    }

                    if ([
                        'findFirst', 'findFirstOrThrow', 'findMany', 'findUnique',
                        'findUniqueOrThrow', 'update', 'updateMany', 'delete',
                        'deleteMany', 'count', 'aggregate', 'groupBy'
                    ].includes(operation)) {
                        const anyArgs = args as any;
                        anyArgs.where = { ...anyArgs.where, tenantId };
                    }

                    return query(args);
                }
            }
        }
    }) as unknown as PrismaClient;
}

// Prisma Client Extension to automatically filter and inject tenantId on all POS queries via AsyncLocalStorage
export const prisma = globalForPrisma.prisma ?? basePrisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const tenantId = tenantLocalStorage.getStore();

                if (tenantId) {
                    const injectTenantToData = (data: any): any => {
                        if (!data || typeof data !== 'object') return data;
                        if (Array.isArray(data)) {
                            return data.map((item: any) => injectTenantToData(item));
                        }
                        const result: any = { ...data, tenantId };
                        for (const key of Object.keys(result)) {
                            if (result[key] && typeof result[key] === 'object' && 'create' in result[key]) {
                                result[key] = {
                                    ...result[key],
                                    create: injectTenantToData(result[key].create)
                                };
                            }
                        }
                        return result;
                    };

                    // 1. Inject tenantId into write operations
                    if (operation === 'create') {
                        args.data = injectTenantToData(args.data);
                    } else if (operation === 'createMany') {
                        args.data = injectTenantToData(args.data);
                    } else if (operation === 'upsert') {
                        args.create = injectTenantToData(args.create);
                        args.update = injectTenantToData(args.update);
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
