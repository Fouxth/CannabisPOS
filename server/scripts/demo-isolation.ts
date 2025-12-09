import { managementPrisma } from '../src/lib/management-db';
import { TenantManager } from '../src/services/TenantManager';

async function demo() {
    console.log('🔍 Checking Tenants...');
    const tenants = await managementPrisma.tenant.findMany();
    console.log('Found Tenants:', tenants.map(t => `${t.name} (${t.slug})`).join(', '));

    const shopA = tenants.find(t => t.slug === 'shop-a');
    const shopB = tenants.find(t => t.slug === 'shop-b');

    if (!shopA || !shopB) {
        console.error('❌ Shop A or Shop B not found. Please run provisioning scripts first.');
        return;
    }

    console.log('\n🧪 Starting Isolation Test');

    // 1. Connect to Shop A
    console.log(`\n🔌 Connecting to Shop A (${shopA.dbName})...`);
    const clientA = await TenantManager.getTenantClientById(shopA.id);
    if (!clientA) throw new Error('Could not connect to Shop A');

    // 2. Create Product in Shop A
    console.log('📝 Creating "Exclusive Product A" in Shop A...');
    await clientA.product.create({
        data: {
            name: 'Exclusive Product A',
            price: 100,
            cost: 50,
            stock: 10,
        }
    });

    // 3. Verify in Shop A
    console.log('🔎 Searching for products in Shop A...');
    const productsA = await clientA.product.findMany({
        where: { name: 'Exclusive Product A' }
    });
    console.log(`   Found in Shop A: ${productsA.length} item(s)`);

    // 4. Connect to Shop B
    console.log(`\n🔌 Connecting to Shop B (${shopB.dbName})...`);
    const clientB = await TenantManager.getTenantClientById(shopB.id);
    if (!clientB) throw new Error('Could not connect to Shop B');

    // 5. Verify in Shop B (Should be 0)
    console.log('🔎 Searching for "Exclusive Product A" in Shop B...');
    const productsB = await clientB.product.findMany({
        where: { name: 'Exclusive Product A' }
    });
    console.log(`   Found in Shop B: ${productsB.length} item(s)`);

    if (productsA.length === 1 && productsB.length === 0) {
        console.log('\n✅ SUCCESS: Data is completely isolated between tenants!');
    } else {
        console.error('\n❌ FAILED: Data isolation check failed.');
    }
}

demo();
