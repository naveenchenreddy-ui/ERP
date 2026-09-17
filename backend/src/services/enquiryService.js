import prisma from '../config/db.js';
import { generateDocNumber } from '../utils/numberGenerator.js';

/**
 * Create a new customer enquiry with its items.
 */
export async function createEnquiry({ customerId, enquiryDate, requiredDate, items }, userId) {
  const enquiryNumber = await generateDocNumber('ENQ');

  return prisma.enquiry.create({
    data: {
      enquiryNumber,
      customerId,
      enquiryDate: enquiryDate ? new Date(enquiryDate) : new Date(),
      requiredDate: requiredDate ? new Date(requiredDate) : null,
      status: 'NEW',
      createdById: userId,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          notes: i.notes || null,
        })),
      },
    },
    include: { items: { include: { product: true } }, customer: true },
  });
}

/**
 * List enquiries (with search on customer name or enquiry number).
 */
export async function list({ page = 1, limit = 20, search, status } = {}) {
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { enquiryNumber: { contains: search, mode: 'insensitive' } },
      { customer: { companyName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.enquiry.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Get enquiry by id.
 */
export async function getById(id) {
  const e = await prisma.enquiry.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      quotation: true,
    },
  });
  if (!e) throw Object.assign(new Error('Enquiry not found'), { statusCode: 404 });
  return e;
}

/**
 * Update enquiry status (NEW → QUOTED, WON, LOST).
 */
export async function updateStatus(id, status) {
  await getById(id);
  return prisma.enquiry.update({ where: { id }, data: { status } });
}