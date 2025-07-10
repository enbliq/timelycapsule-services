import express, { Router, Request, Response } from 'express';
import {
  createCapsule,
  deleteCapsule,
  getCapsuleById,
  getCapsules,
  getMyCapsules,
  getCapsuleStatus,
} from '../controllers/capsuleController';
import { AuthMiddleware } from '../middleware/auth';
import { RateLimiter } from '../middleware/rateLimiter';

const router: Router = express.Router();

router.post(
  '/capsules',
  AuthMiddleware.requireAuth,
  (req: Request, res: Response) => {
    createCapsule(req, res);
  }
);
router.get(
  '/capsules',
  AuthMiddleware.requireAuth,
  (req: Request, res: Response) => {
    getCapsules(req, res);
  }
);

router.get(
  '/capsules/my',
  AuthMiddleware.requireAuth,
  (req: Request, res: Response) => {
    getMyCapsules(req, res);
  }
);

router.get(
  '/capsules/:id',
  AuthMiddleware.requireAuth,
  (req: Request, res: Response) => {
    getCapsuleById(req, res);
  }
);

router.get(
  '/capsules/:id/status',
  RateLimiter.general,
  AuthMiddleware.requireAuth,
  (req: Request, res: Response) => {
    getCapsuleStatus(req, res);
  }
);

router.delete(
  '/capsules/:id',
  AuthMiddleware.requireAuth,
  (req: Request, res: Response) => {
    deleteCapsule(req, res);
  }
);

export default router;
