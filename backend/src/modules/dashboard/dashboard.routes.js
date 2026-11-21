import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { resumen } from './dashboard.service.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/resumen',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await resumen(req.user) });
  })
);
