import prisma from '../config/db.js';

export async function create(data) {
  return prisma.customer.create({ data });
}

export async function list({ page = 1, limit = 20, search } = {}) {
  const where = search
    ? { OR: [{ companyName: { contains: search, mode: 'insensitive' } }, { contactPerson: { contains: search, mode: 'insensitive' } }, { city: { contains: search, mode: 'insensitive' } }] }
    : {};
  const [items, total] = await Promise.all([
    prisma.customer.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.customer.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getById(id) {
  const c = await prisma.customer.findUnique({ where: { id } });
  if (!c) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  return c;
}

export async function update(id, data) {
  await getById(id);
  return prisma.customer.update({ where: { id }, data });
}

export async function remove(id) {
  await getById(id);
  return prisma.customer.delete({ where: { id } });
}