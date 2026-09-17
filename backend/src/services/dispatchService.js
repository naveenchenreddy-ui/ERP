import prisma from '../config/db.js';
import { generateDocNumber } from '../utils/numberGenerator.js';
// Note: We call inventory update directly here with audit log entries

/**
 * Create a dispatch for a CONFIRMED sales order.
 * Decrements physical + reserved inventory.
 * Partial dispatch is allowed but quantity-dispatching dispatch cannot exceed order quantity.
 */
export async function createDispatch({ salesOrderId, dispatchDate, vehicleNumber, driverName, items }, userId, actorRole) {
  if (actorRole !== 'ADMIN') {
    throw Object.assign(new Error('Only ADMIN can process dispatches'), { statusCode: 403 });
  }

  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { items: true },
  });
  if (!order) throw Object.assign(new Error('Sales order not found'), { statusCode: 404 });
  if (order.status !== 'CONFIRMED') {
    throw Object.assign(new Error('Only CONFIRMED orders can be dispatched'), { statusCode: 400 });
  }

  // Validate dispatch items are a subset of order items
  const orderItemMap = new Map(order.items.map((i) => [i.productId, i.quantity]));
  for (const item of items) {
    if (!orderItemMap.has(item.productId)) {
      throw Object.assign(new Error(`Product ${item.productId} is not part of this order`), { statusCode: 400 });
    }
    if (item.quantityDispatched <= 0) {
      throw Object.assign(new Error('Dispatch quantity must be positive'), { statusCode: 400 });
    }
    if (item.quantityDispatched > orderItemMap.get(item.productId)) {
      throw Object.assign(new Error(`Cannot dispatch more than ordered quantity for product ${item.productId}`), { statusCode: 400 });
    }
  }

  // Check physical availability
  for (const item of items) {
    const inv = await prisma.inventory.findUnique({ where: { productId: item.productId } });
    if (!inv || inv.physicalQuantity < item.quantityDispatched) {
      throw Object.assign(new Error(`Insufficient physical stock for product ${item.productId}`), { statusCode: 400 });
    }
  }

  const dispatchNumber = await generateDocNumber('DSP');

  const dispatch = await prisma.dispatch.create({
    data: {
      dispatchNumber,
      salesOrderId,
      dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
      vehicleNumber,
      driverName,
      createdById: userId,
      items: {
        create: items.map((i) => ({ productId: i.productId, quantityDispatched: i.quantityDispatched })),
      },
    },
    include: { items: { include: { product: true } }, salesOrder: true, createdBy: { select: { name: true, email: true } } },
  });

  // Decrement inventory + audit
  for (const item of items) {
    await prisma.inventory.update({
      where: { productId: item.productId },
      data: {
        physicalQuantity: { decrement: item.quantityDispatched },
        reservedQuantity: { decrement: item.quantityDispatched },
        lastUpdated: new Date(),
        updatedById: userId,
      },
    });
    await prisma.inventoryAuditLog.create({
      data: {
        productId: item.productId,
        action: 'DISPATCH',
        quantityChanged: -item.quantityDispatched,
        referenceId: dispatch.id ? String(dispatch.id) : null,
        createdById: userId,
      },
    });
  }

  // Mark order dispatched (if fully dispatched)
  const totalDispatchedPerItem = await prisma.dispatchItem.groupBy({
    by: ['productId'],
    where: { dispatch: { salesOrderId } },
    _sum: { quantityDispatched: true },
  });
  const dispatchedMap = new Map(
    totalDispatchedPerItem.map((d) => [d.productId, Number(d._sum.quantityDispatched) || 0])
  );
  const allFullyDispatched = order.items.every((i) => (dispatchedMap.get(i.productId) || 0) >= i.quantity);

  if (allFullyDispatched) {
    await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { status: 'DISPATCHED' } });
  }

  return dispatch;
}

/**
 * List dispatches.
 */
export async function list({ page = 1, limit = 20, search, salesOrderId } = {}) {
  const where = {};
  if (salesOrderId) where.salesOrderId = salesOrderId;
  if (search) {
    where.OR = [
      { dispatchNumber: { contains: search, mode: 'insensitive' } },
      { salesOrder: { orderNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.dispatch.findMany({
      where,
      include: {
        items: { include: { product: true } },
        salesOrder: { include: { customer: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dispatch.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getById(id) {
  const d = await prisma.dispatch.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      salesOrder: { include: { customer: true, items: { include: { product: true } } } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!d) throw Object.assign(new Error('Dispatch not found'), { statusCode: 404 });
  return d;
}