import prisma from '../config/db.js';
import { generateDocNumber } from '../utils/numberGenerator.js';

export async function create(data) {
  const product = await prisma.product.create({ data });
  await prisma.inventory.create({ data: { productId: product.id } });
  return product;
}

export async function list({ page = 1, limit = 20, search } = {}) {
  const where = search
    ? { OR: [{ productName: { contains: search, mode: 'insensitive' } }, { productCode: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } }] }
    : {};
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getById(id) {
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  return p;
}

export async function update(id, data) {
  await getById(id);
  return prisma.product.update({ where: { id }, data });
}

export async function remove(id) {
  await getById(id);
  return prisma.product.delete({ where: { id } });
}