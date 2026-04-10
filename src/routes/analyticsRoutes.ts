import express, { Router, Request, Response } from 'express';
import { getUserAnalytics } from '../controllers/analyticsController';
import { AuthMiddleware } from '../middleware/auth';

const router: Router = express.Router();

router.get(
  '/users/me/analytics',
  AuthMiddleware.requireAuth,
  (req: Request, res: Response) => {
    getUserAnalytics(req, res);
  }
);

export default router;
