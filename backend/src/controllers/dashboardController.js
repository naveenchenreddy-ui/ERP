import asyncHandler from '../utils/asyncHandler.js';
import * as svc from '../services/dashboardService.js';

export const getStats = asyncHandler(async (req, res) => {
  const stats = await svc.getStats();
  res.json(stats);
});
