import express from 'express';
import authRouter from './auth.router';
import userRouter from './user.router';

const router = express.Router();
export default (): express.Router => {
  authRouter(router);
  userRouter(router);
  return router;
};
