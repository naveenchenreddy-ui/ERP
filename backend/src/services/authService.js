import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { signToken } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

export async function register({ email, password, name, role }) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: role || 'SALES_USER' },
  });
  const token = signToken(user);
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const token = signToken(user);
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}