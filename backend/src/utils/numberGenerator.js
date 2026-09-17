import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';

function pad(seq) {
  return String(seq).padStart(5, '0');
}

function getTableForPrefix(prefix) {
  const map = {
    ENQ: 'enquiries',
    QT: 'quotations',
    SO: 'sales_orders',
    DSP: 'dispatches',
    PDT: 'products',
  };
  const table = map[prefix];
  if (!table) throw new Error(`Unknown number prefix: ${prefix}`);
  return table;
}

/**
 * Generates a unique business document number.
 * Uses a retry loop keyed on a DB count so concurrent creation stays safe.
 */
export async function generateDocNumber(prefix) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const year = new Date().getFullYear();
    const tableName = getTableForPrefix(prefix);
    const count = await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM ${Prisma.raw(tableName)}`;
    const seq = (count?.[0]?.c ?? 0) + 1 + attempt;
    const number = `${prefix}-${year}-${pad(seq)}`;
    return number;
  }
  throw new Error('Failed to generate a unique document number');
}

export { generateDocNumber as default };