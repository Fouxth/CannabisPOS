import { PrismaClient, PaymentType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clean existing data
    await prisma.notification.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.billItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.bill.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.user.deleteMany();

    console.log('Creating payment methods...');
    const paymentMethods = await prisma.$transaction([
        prisma.paymentMethod.create({
            data: {
                name: 'เงินสด',
                nameEn: 'Cash',
                type: PaymentType.CASH,
                icon: 'Banknote',
                isActive: true,
                isDefault: true,
            },
        }),
        prisma.paymentMethod.create({
            data: {
                name: 'โอนเงิน',
                nameEn: 'Transfer',
                type: PaymentType.TRANSFER,
                icon: 'ArrowLeftRight',
                isActive: true,
            },
        }),
    ]);
    console.log(`✅ Created ${paymentMethods.length} payment methods`);

    const adminPassword = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
    const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');

    console.log('Creating admin user...');
    const user = await prisma.user.create({
        data: {
            employeeCode: 'E001',
            username: 'admin',
            fullName: 'ผู้ดูแลระบบ',
            nickname: 'Admin',
            role: 'ADMIN',
            password: await bcrypt.hash(adminPassword, 10),
            isActive: true,
        },
    });
    console.log('✅ Created admin user (Credentials configured securely)');

    console.log('Creating Super Admin user...');
    await prisma.user.create({
        data: {
            employeeCode: 'SA001',
            username: 'sysadmin',
            fullName: 'System Owner',
            nickname: 'Dev',
            role: 'SUPER_ADMIN',
            password: await bcrypt.hash(superAdminPassword, 10),
            isActive: true,
            avatarUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        },
    });
    console.log('✅ Created Super Admin user (Credentials configured securely)');

    console.log('Creating basic categories...');
    const categoryData = [
        { name: 'ดอก', nameEn: 'Flower', slug: 'flower', color: '#10B981', icon: 'Flower2', sortOrder: 1 },
        { name: 'สกัด', nameEn: 'Extract', slug: 'extract', color: '#8B5CF6', icon: 'Droplet', sortOrder: 2 },
        { name: 'อุปกรณ์', nameEn: 'Accessories', slug: 'accessories', color: '#6366F1', icon: 'Package', sortOrder: 3 },
    ];
    const categories = await Promise.all(
        categoryData.map((category) =>
            prisma.category.create({
                data: {
                    ...category,
                    description: `หมวดหมู่${category.name}`,
                    isActive: true,
                },
            })
        )
    );
    console.log(`✅ Created ${categories.length} basic categories`);

    console.log('🎉 Database seeded successfully!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
