import prisma from '../config/db.js';

/**
 * Add physical stock (admin operation, e.g., receiving goods).
 */
export async function addStock(productId, quantity, userId) {
  const inv = await prisma.inventory.findUnique({ where: { productId } });
  if (!inv) throw Object.assign(new Error('Inventory record not found'), { statusCode: 404 });

  const updated = await prisma.inventory.update({
    where: { productId },
    data: { physicalQuantity: inv.physicalQuantity + quantity, lastUpdated: new Date(), updatedById: userId },
  });

  await prisma.inventoryAuditLog.create({
    data: {
      productId,
      action: 'RESERVE', // RESERVE is used for "inbound" adjustment in the enum
      quantityChanged: quantity,
      referenceId: null,
      createdById: userId,
    },
  });

  return updated;
}

/**
 * Update physical quantity directly (admin, for corrections).
 */
export async function setPhysicalQuantity(productId, quantity, userId) {
  const inv = await prisma.inventory.findUnique({ where: { productId } });
  if (!inv) throw Object.assign(new Error('Inventory record not found'), { statusCode: 404 });
  if (quantity < 0) throw Object.assign(new Error('Physical quantity cannot be negative'), { statusCode: 400 });

  const delta = quantity - inv.physicalQuantity;

  const updated = await prisma.inventory.update({
    where: { productId },
    data: { physicalQuantity: quantity, lastUpdated: new Date(), updatedById: userId },
  });

  await prisma.inventoryAuditLog.create({
    data: {
      productId,
      action: 'RESERVE',
      quantityChanged: delta,
      referenceId: 'MANUAL_ADJUSTMENT',
      createdById: userId,
    },
  });

  return updated;
}

/**
 * List inventory with product info. Supports pagination.
 */
export async function list({ page = 1, limit = 20, search } = {}) {
  const where = search
    ? { product: { OR: [{ productName: { contains: search, mode: 'insensitive' } }, { productCode: { contains: search, mode: 'insensitive' } }] } }
    : {};

  const [items, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: { product: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { lastUpdated: 'desc' },
    }),
    prisma.inventory.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Get inventory for a single product.
 */
export async function getByProductId(productId) {
  const inv = await prisma.inventory.findUnique({
    where: { productId },
    include: { product: true },
  });
  if (!inv) throw Object.assign(new Error('Inventory record not found'), { statusCode: 404 });
  return inv;
}

/**
 * Reserve stock for an order (set aside reserved_quantity).
 */
export async function reserveStock(productId, qty, userId) {
  const inv = await prisma.inventory.findUnique({ where: { productId } });
  if (!inv) throw Object.assign(new Error('Inventory not found'), { statusCode: 404 });

  const available = inv.physicalQuantity - inv.reservedQuantity;
  if (available < qty) {
    throw Object.assign(
      new Error(`Insufficient stock for product ${productId}: available ${available}, requested ${qty}`),
      { statusCode: 400 }
    );
  }

  return prisma.inventory.update({
    where: { productId },
    data: {
      reservedQuantity: inv.reservedQuantity + qty,
      lastUpdated: new Date(),
      updatedById: userId,
    },
  });
}

/**
 * Release reserved stock (e.g. order cancelled).
 */
export async function releaseStock(productId, qty, userId) {
  const inv = await prisma.inventory.findUnique({ where: { productId } });
  if (!inv) throw Object.assign(new Error('Inventory not found'), { statusCode: 404 });

  return prisma.inventory.update({
    where: { productId },
    data: {
      reservedQuantity: Math.max(0, inv.reservedQuantity - qty),
      lastUpdated: new Date(),
      updatedById: userId,
    },
  });
}

/**
 * Dispatch stock: decrement both physical and reserved quantities.
 */
export async function dispatchStock(productId, qty, userId, dispatchId) {
  const inv = await prisma.inventory.findUnique({ where: { productId } });
  if (!inv) throw Object.assign(new Error('Inventory not found'), { statusCode: 404 });
  if (inv.physicalQuantity < qty) {
    throw Object.assign(new Error(`Not enough physical stock for product ${productId}`), { statusCode: 400 });
  }

  const updated = await prisma.inventory.update({
    where: { productId },
    data: {
      physicalQuantity: inv.physicalQuantity - qty,
      reservedQuantity: Math.max(0, inv.reservedQuantity - qty),
      lastUpdated: new Date(),
      updatedById: userId,
    },
  });

  await prisma.inventoryAuditLog.create({
    data: {
      productId,
      action: 'DISPATCH',
      quantityChanged: -qty,
      referenceId: dispatchId ? String(dispatchId) : null,
      createdById: userId,
    },
  });

  return updated;
}

export async function getAuditLog({ productId, page = 1, limit = 50 } = {}) {
  const where = productId ? { productId } : {};
  const [items, total] = await Promise.all([
    prisma.inventoryAuditLog.findMany({
      where,
      include: { product: true, createdBy: { select: { id: true, name: true, email: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inventoryAuditLog.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}