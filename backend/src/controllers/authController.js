import asyncHandler from '../utils/asyncHandler.js';
import { register, login } from '../services/authService.js';

// @desc    Register a new user (Admin only, optional in production)
// @route   POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const { token, user } = await register(req.body);
  res.status(201).json({ token, user });
});

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { token, user } = await login(req.body);
  res.json({ token, user });
});