import express from 'express';
import {
  createContribution,
  approveContribution,
  rejectContribution
} from '../controllers/contributionController';

const router = express.Router();

router.post('/capsules/:id/contributions', createContribution);

router.patch('/contributions/:contributionId/approve', approveContribution);

router.patch('/contributions/:contributionId/reject', rejectContribution);

export default router;
