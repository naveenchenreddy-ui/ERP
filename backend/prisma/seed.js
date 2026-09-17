import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function main() {
  let admin = await prisma.user.findUnique({ where: { email: 'admin@erp.com' } });
  if (!admin) {
    const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
    admin = await prisma.user.create({
      data: {
        email: 'admin@erp.com',
        passwordHash,
        name: 'Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
  }

  let sales = await prisma.user.findUnique({ where: { email: 'sales@erp.com' } });
  if (!sales) {
    const passwordHash = await bcrypt.hash('sales123', SALT_ROUNDS);
    sales = await prisma.user.create({
      data: {
        email: 'sales@erp.com',
        passwordHash,
        name: 'Sales User',
        role: 'SALES_USER',
        isActive: true,
      },
    });
  }

  const products = [
    { productCode: 'PROD-001', productName: 'Steel Beam 10m', category: 'Construction', unit: 'pieces', basePrice: 4500.00 },
    { productCode: 'PROD-002', productName: 'Cement Bag 50kg', category: 'Materials', unit: 'kg', basePrice: 350.00 },
    { productCode: 'PROD-003', productName: 'Copper Wire 2mm', category: 'Electrical', unit: 'meters', basePrice: 120.00 },
    { productCode: 'PROD-004', productName: 'Paint Drum 20L', category: 'Finishes', unit: 'liters', basePrice: 850.00 },
    { productCode: 'PROD-005', productName: 'Glass Panel 6ft', category: 'Interior', unit: 'boxes', basePrice: 2200.00 },
    { productCode: 'PROD-006', productName: 'Aluminium Sheet', category: 'Construction', unit: 'rolls', basePrice: 3100.00 },
    { productCode: 'PROD-007', productName: 'PVC Pipe 4ft', category: 'Plumbing', unit: 'sets', basePrice: 450.00 },
    { productCode: 'PROD-008', productName: 'Ceramic Tile 1sqft', category: 'Flooring', unit: 'boxes', basePrice: 65.00 },
  ];

  for (const p of products) {
    const exists = await prisma.product.findUnique({ where: { productCode: p.productCode } });
    if (!exists) {
      const product = await prisma.product.create({ data: p });
      await prisma.inventory.create({ data: { productId: product.id, physicalQuantity: 100 } });
    }
  }

  const customers = [
    { companyName: 'ABC Construction Ltd', contactPerson: 'Rajesh Kumar', mobile: '9876543210', email: 'rajesh@abc.com', city: 'Mumbai', createdById: sales.id },
    { companyName: 'XYZ Industries', contactPerson: 'Priya Sharma', mobile: '9876543211', email: 'priya@xyz.com', city: 'Delhi', createdById: sales.id },
    { companyName: 'Global Supplies', contactPerson: 'Amit Patel', mobile: '9876543212', email: 'amit@global.com', city: 'Bangalore', createdById: sales.id },
  ];

  for (const c of customers) {
    const exists = await prisma.customer.findUnique({ where: { companyName: c.companyName } });
    if (!exists) {
      await prisma.customer.create({ data: c });
    }
  }

  console.log('✅ Seed data created successfully');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
