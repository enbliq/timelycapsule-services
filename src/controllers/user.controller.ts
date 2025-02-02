import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import User from '../model/user.model';

export interface UserRequest extends Request {
  user?: any;
  data?: any;
}

const UserController = {
  getUserById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err?.message || 'An error occurred while retrieving user',
      });
    }
  },
};

export { UserController };
