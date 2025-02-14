/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../model/user.model';

interface AuthRequest extends Request {
  user?: any;
}

export default async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authorizationHeader = req?.headers?.authorization;

    if (!authorizationHeader?.startsWith('Bearer')) {
      return res
        .status(401)
        .json({ success: false, message: 'You are not logged in' });
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'You are not logged in' });
    }

    const decodedJwt = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    const user = await User.findOne({ email: decodedJwt.email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'You are not logged in' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res
      .status(401)
      .json({ success: false, message: 'You are not logged in' });
  }
};
