import asyncHandler from '../utils/asyncHandler.js';
import * as svc from '../services/orderService.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, search, status } = req.query;
  res.json(await svc.list({ page: Number(page) || 1, limit: Number(limit) || 20, search, status }));
});

export const getById = asyncHandler(async (req, res) => {
  res.json(await svc.getById(Number(req.params.id)));
});

export const createFromQuotation = asyncHandler(async (req, res) => {
  const order = await svc.createFromQuotation(Number(req.body.quotationId), req.user.id);
  res.status(201).json(order);
});

export const confirm = asyncHandler(async (req, res) => {
  res.json(await svc.confirmOrder(Number(req.params.id), req.user.id, req.user.role));
});

export const cancel = asyncHandler(async (req, res) => {
  res.json(await svc.cancelOrder(Number(req.params.id), req.user.id));
});