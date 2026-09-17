import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

prisma.$use(async (params, next) => {
  const result = await next(params);
  return result;
});

export default prisma;