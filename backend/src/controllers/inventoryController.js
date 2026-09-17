import asyncHandler from '../utils/asyncHandler.js';
import * as svc from '../services/inventoryService.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  res.json(await svc.list({ page: Number(page) || 1, limit: Number(limit) || 20, search }));
});

export const getByProductId = asyncHandler(async (req, res) => {
  res.json(await svc.getByProductId(Number(req.params.productId)));
});

export const addStock = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  res.json(await svc.addStock(Number(productId), Number(quantity), req.user.id));
});

export const setPhysical = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  res.json(await svc.setPhysicalQuantity(Number(req.params.productId), Number(quantity), req.user.id));
});

export const auditLog = asyncHandler(async (req, res) => {
  const { productId, page, limit } = req.query;
  res.json(await svc.getAuditLog({ productId: productId ? Number(productId) : undefined, page: Number(page) || 1, limit: Number(limit) || 50 }));
});