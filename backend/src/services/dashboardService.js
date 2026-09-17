import prisma from '../config/db.js';

export async function getStats() {
  const [
    customerCount,
    productCount,
    enquiriesCount,
    enquiriesByStatus,
    quotationsCount,
    quotationsByStatus,
    ordersCount,
    ordersByStatus,
    dispatchesCount,
    allOrders,
    inventoryItems,
    recentEnquiries,
    recentOrders,
    recentDispatches,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.product.count(),
    prisma.enquiry.count(),
    prisma.enquiry.groupBy({ by: ['status'], _count: true }),
    prisma.quotation.count(),
    prisma.quotation.groupBy({ by: ['status'], _count: true }),
    prisma.salesOrder.count(),
    prisma.salesOrder.groupBy({ by: ['status'], _count: true }),
    prisma.dispatch.count(),
    prisma.salesOrder.findMany({
      select: { totalAmount: true, status: true, orderDate: true },
    }),
    prisma.inventory.findMany({
      include: { product: true },
    }),
    prisma.enquiry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    }),
    prisma.salesOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    }),
    prisma.dispatch.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { salesOrder: { include: { customer: true } } },
    }),
  ]);

  // Calculate totals
  const totalRevenue = allOrders
    .filter((o) => o.status === 'CONFIRMED' || o.status === 'DISPATCHED')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const pendingRevenue = allOrders
    .filter((o) => o.status === 'PENDING')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const lowStockItems = inventoryItems.filter(
    (inv) => inv.physicalQuantity - inv.reservedQuantity <= 10
  );

  const enqStatusMap = Object.fromEntries(enquiriesByStatus.map((e) => [e.status, e._count]));
  const quoteStatusMap = Object.fromEntries(quotationsByStatus.map((q) => [q.status, q._count]));
  const orderStatusMap = Object.fromEntries(ordersByStatus.map((o) => [o.status, o._count]));

  return {
    customerCount,
    productCount,
    enquiriesCount,
    enquiriesByStatus: enqStatusMap,
    quotationsCount,
    quotationsByStatus: quoteStatusMap,
    ordersCount,
    ordersByStatus: orderStatusMap,
    dispatchesCount,
    totalRevenue,
    pendingRevenue,
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.slice(0, 5),
    recentEnquiries,
    recentOrders,
    recentDispatches,
  };
}
