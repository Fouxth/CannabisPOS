import { Prisma, PrismaClient } from '@prisma/client';

// Types
export type DecimalValue = Prisma.Decimal | number | null;

// Default Settings
export const DEFAULT_SETTINGS = {
    store: {
        storeName: 'ร้านกัญชาสุขใจ',
        storeNameEn: 'Happy Cannabis Shop',
        phone: '02-123-4567',
        email: 'contact@happycannabis.com',
        address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
        taxId: '0123456789012',
    },
    pos: {
        invoicePrefix: 'POS',
        taxRate: 7,
        maxDiscountCashier: 10,
        maxDiscountManager: 30,
        showCostPrice: true,
        scanSound: true,
        autoPrintReceipt: true,
    },
    sms: {
        enabled: true,
        provider: 'line',
        apiKey: '', // Start with empty
        sender: '',
        recipients: [], // Store Line User IDs
        alerts: {
            realtimeSales: true,
            dailySummary: true,
            monthlySummary: true,
            lowStock: true,
            stockAdjustments: false,
        },
    },
    notifications: {
        lowStock: true,
        salesTarget: true,
        sound: true,
    },
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

// Helper Functions
export const generateDocumentNumber = (prefix: string) => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}-${datePart}-${random}`;
};

export const normalizePaymentMethod = (method?: string) => {
    if (!method) return 'CASH';
    return method.toUpperCase();
};

export const decimalToNumber = (value: DecimalValue) => {
    if (value === null || value === undefined) return 0;
    return Number(value);
};

export const getSettingValue = async <K extends SettingKey>(key: K, prisma: PrismaClient) => {
    const setting = await prisma.systemSetting.findUnique({
        where: { key },
    });
    return (setting?.value as (typeof DEFAULT_SETTINGS)[K]) ?? DEFAULT_SETTINGS[key];
};

export const startOfDay = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
};

export const startOfNDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
};

export const formatPercent = (value: number) => Number(value.toFixed(1));
