import asyncHandler from '../utils/asyncHandler.js';
import * as svc from '../services/enquiryService.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, search, status } = req.query;
  res.json(await svc.list({ page: Number(page) || 1, limit: Number(limit) || 20, search, status }));
});

export const getById = asyncHandler(async (req, res) => {
  res.json(await svc.getById(Number(req.params.id)));
});

export const create = asyncHandler(async (req, res) => {
  const enquiry = await svc.createEnquiry(req.body, req.user.id);
  res.status(201).json(enquiry);
});

export const updateStatus = asyncHandler(async (req, res) => {
  res.json(await svc.updateStatus(Number(req.params.id), req.body.status));
});