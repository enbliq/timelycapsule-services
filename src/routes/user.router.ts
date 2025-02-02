import express from 'express';
import { UserController } from '../controllers/user.controller';

const authRouter = (router: express.Router) => {
  router.get('/users/:id', UserController.getUserById);
};

export default authRouter;
