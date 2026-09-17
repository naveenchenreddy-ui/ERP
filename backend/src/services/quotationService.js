import prisma from '../config/db.js';
import { generateDocNumber } from '../utils/numberGenerator.js';

function calcItemLineAmount(item) {
  const { quantity = 0, unitPrice = 0, discountPercent = 0, gstPercent = 18 } = item;
  const qty = Number(quantity);
  const price = Number(unitPrice);
  const disc = Number(discountPercent) / 100;
  const gst = Number(gstPercent) / 100;
  const afterDisc = qty * price * (1 - disc);
  return afterDisc * (1 + gst);
}

/**
 * Create a quotation from enquiry items (or explicit items).
 * Enquiry is linked 1:1 (unique constraint on enquiry_id).
 */
export async function createQuotation(
  { enquiryId, customerId, validUntil, items: rawItems },
  userId
) {
  // Fetch enquiry items to use as source if items not provided
  let items = rawItems;
  if (!items || items.length === 0) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: { items: { include: { product: true } } },
    });
    if (!enquiry) throw Object.assign(new Error('Enquiry not found'), { statusCode: 404 });
    items = enquiry.items.map((ei) => ({
      productId: ei.productId,
      quantity: ei.quantity,
      unitPrice: Number(ei.product.basePrice),
      discountPercent: 0,
      gstPercent: 18,
    }));
  }

  // Calculate totals
  let totalAmount = 0;
  let gstAmount = 0;

  const itemsData = items.map((item) => {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    const discPct = Number(item.discountPercent || 0);
    const gstPct = Number(item.gstPercent || 18);

    const netQty = qty * price * (1 - discPct / 100);
    const gst = netQty * (gstPct / 100);
    const lineAmount = netQty + gst;

    totalAmount += netQty;
    gstAmount += gst;

    return {
      productId: item.productId,
      quantity: qty,
      unitPrice: price,
      discountPercent: discPct,
      gstPercent: gstPct,
      lineAmount,
    };
  });

  const quotationNumber = await generateDocNumber('QT');
  const discountAmount = 0; // computed from line items

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      enquiryId,
      customerId,
      quotationDate: new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      status: 'DRAFT',
      totalAmount,
      gstAmount,
      discountAmount,
      createdById: userId,
      itemsList: { create: itemsData },
    },
    include: { itemsList: { include: { product: true } }, enquiry: true, customer: true },
  });

  // Mark enquiry as QUOTED
  await prisma.enquiry.update({ where: { id: enquiryId }, data: { status: 'QUOTED' } });

  return quotation;
}

/**
 * List quotations.
 */
export async function list({ page = 1, limit = 20, search, status } = {}) {
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { quotationNumber: { contains: search, mode: 'insensitive' } },
      { customer: { companyName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        enquiry: true,
        itemsList: { include: { product: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quotation.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getById(id) {
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      enquiry: { include: { items: { include: { product: true } } } },
      itemsList: { include: { product: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!q) throw Object.assign(new Error('Quotation not found'), { statusCode: 404 });
  return q;
}

export async function updateStatus(id, status) {
  const q = await getById(id);
  if (status === 'ACCEPTED') {
    await prisma.enquiry.update({ where: { id: q.enquiryId }, data: { status: 'WON' } });
  }
  if (status === 'REJECTED') {
    await prisma.enquiry.update({ where: { id: q.enquiryId }, data: { status: 'LOST' } });
  }
  return prisma.quotation.update({ where: { id }, data: { status } });
}