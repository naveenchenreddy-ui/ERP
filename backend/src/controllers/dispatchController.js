import asyncHandler from '../utils/asyncHandler.js';
import * as svc from '../services/dispatchService.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, search, salesOrderId } = req.query;
  res.json(await svc.list({ page: Number(page) || 1, limit: Number(limit) || 20, search, salesOrderId }));
});

export const getById = asyncHandler(async (req, res) => {
  res.json(await svc.getById(Number(req.params.id)));
});

export const create = asyncHandler(async (req, res) => {
  const dispatch = await svc.createDispatch(req.body, req.user.id, req.user.role);
  res.status(201).json(dispatch);
});