import asyncHandler from '../utils/asyncHandler.js';
import * as svc from '../services/productService.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  res.json(await svc.list({ page: Number(page) || 1, limit: Number(limit) || 20, search }));
});

export const getById = asyncHandler(async (req, res) => {
  res.json(await svc.getById(Number(req.params.id)));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await svc.create(req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await svc.update(Number(req.params.id), req.body));
});

export const remove = asyncHandler(async (req, res) => {
  await svc.remove(Number(req.params.id));
  res.status(204).end();
});