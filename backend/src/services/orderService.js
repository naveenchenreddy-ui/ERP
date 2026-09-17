import prisma from '../config/db.js';
import { generateDocNumber } from '../utils/numberGenerator.js';
import { reserveStock } from './inventoryService.js';

/**
 * Create a sales order from an ACCEPTED quotation.
 * Copies quotation items into sales order items.
 * Prevents duplicate orders via unique quotationId.
 */
export async function createFromQuotation(quotationId, userId) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { itemsList: { include: { product: true } } },
  });
  if (!quotation) throw Object.assign(new Error('Quotation not found'), { statusCode: 404 });
  if (quotation.status !== 'ACCEPTED') {
    throw Object.assign(new Error('Order can be created only from an ACCEPTED quotation'), { statusCode: 400 });
  }

  const existingOrder = await prisma.salesOrder.findUnique({ where: { quotationId } });
  if (existingOrder) {
    throw Object.assign(new Error('A sales order already exists for this quotation'), { statusCode: 409 });
  }

  const orderNumber = await generateDocNumber('SO');

  const order = await prisma.salesOrder.create({
    data: {
      orderNumber,
      quotationId,
      customerId: quotation.customerId,
      orderDate: new Date(),
      totalAmount: quotation.totalAmount,
      status: 'PENDING',
      createdById: userId,
      items: {
        create: quotation.itemsList.map((q) => ({
          productId: q.productId,
          quantity: q.quantity,
          unitPrice: q.unitPrice,
        })),
      },
    },
    include: {
      items: { include: { product: true } },
      customer: true,
      quotation: { include: { itemsList: true } },
    },
  });

  return order;
}

/**
 * Confirm a PENDING order: checks inventory and reserves stock.
 * Only ADMIN can confirm.
 */
export async function confirmOrder(id, userId, actorRole) {
  if (actorRole !== 'ADMIN') {
    throw Object.assign(new Error('Only ADMIN can confirm orders'), { statusCode: 403 });
  }

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw Object.assign(new Error('Sales order not found'), { statusCode: 404 });
  if (order.status !== 'PENDING') {
    throw Object.assign(new Error('Only PENDING orders can be confirmed'), { statusCode: 400 });
  }

  // Check stock for all items first
  for (const item of order.items) {
    const inv = await prisma.inventory.findUnique({ where: { productId: item.productId } });
    if (!inv) throw Object.assign(new Error(`Inventory not found for ${item.product.productCode}`), { statusCode: 404 });
    const available = inv.physicalQuantity - inv.reservedQuantity;
    if (available < item.quantity) {
      throw Object.assign(
        new Error(`Insufficient stock for ${item.product.productCode} (available ${available}, required ${item.quantity})`),
        { statusCode: 400 }
      );
    }
  }

  // Reserve stock
  for (const item of order.items) {
    await reserveStock(item.productId, item.quantity, userId);
  }

  // Create audit log entries for reservations
  for (const item of order.items) {
    await prisma.inventoryAuditLog.create({
      data: {
        productId: item.productId,
        action: 'RESERVE',
        quantityChanged: item.quantity,
        referenceId: `SO-${order.id}`,
        createdById: userId,
      },
    });
  }

  const updated = await prisma.salesOrder.update({
    where: { id },
    data: { status: 'CONFIRMED', confirmedById: userId, confirmedAt: new Date() },
    include: {
      items: { include: { product: true } },
      customer: true,
      confirmedBy: { select: { name: true, email: true } },
    },
  });

  return updated;
}

export async function cancelOrder(id, userId) {
  const order = await prisma.salesOrder.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw Object.assign(new Error('Sales order not found'), { statusCode: 404 });
  if (order.status === 'DISPATCHED') {
    throw Object.assign(new Error('A dispatched order cannot be cancelled'), { statusCode: 400 });
  }

  // Release any reserved stock
  if (order.status === 'CONFIRMED') {
    for (const item of order.items) {
      await prisma.inventory.update({
        where: { productId: item.productId },
        data: { reservedQuantity: { decrement: item.quantity } },
      });
      await prisma.inventoryAuditLog.create({
        data: {
          productId: item.productId,
          action: 'RELEASE',
          quantityChanged: -item.quantity,
          referenceId: `SO-${order.id}`,
          createdById: userId,
        },
      });
    }
  }

  return prisma.salesOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
}

/**
 * List sales orders.
 */
export async function list({ page = 1, limit = 20, search, status } = {}) {
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { companyName: { contains: search, mode: 'insensitive' } } },
      { quotation: { quotationNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        quotation: true,
        items: { include: { product: true } },
        confirmedBy: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.salesOrder.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getById(id) {
  const o = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      quotation: { include: { itemsList: { include: { product: true } } } },
      items: { include: { product: true } },
      confirmedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!o) throw Object.assign(new Error('Sales order not found'), { statusCode: 404 });
  return o;
}