/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import User from '../model/user.model';
import { sendEmail } from '../services/email';
import updateUserProfileSchema from '../utils/joivalidators/user/updateUserSchema';

export interface UserRequest extends Request {
  user?: any;
  data?: any;
}

const UserController = {
  getUserById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err?.message || 'An error occurred while retrieving user',
      });
    }
  },

  getCurrentUser: async (req: UserRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err?.message || 'An error occurred while retrieving user',
      });
    }
  },

  updateUserProfile: async (req: UserRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const allowedUpdates: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        walletAddress: req.body.walletAddress,
      };

      Object.keys(allowedUpdates).forEach(
        (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
      );

      if (Object.keys(allowedUpdates).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid fields to update',
        });
      }

      const { error, value } = updateUserProfileSchema.validate(allowedUpdates);

      if (error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      const updates = {
        ...value,
        updatedAt: new Date(),
      };

      const user = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
        select: '-password -passwordResetToken -passwordResetExpires',
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (err: unknown) {
      if ((err as any).name === 'ValidationError') {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: Object.values((err as any).errors).map((e: any) => e.message),
        });
      }

      res.status(400).json({
        success: false,
        message:
          (err as any)?.message || 'An error occurred while updating profile',
      });
    }
  },

  changePassword: async (req: UserRequest, res: Response) => {
    try {
      const userId = req.user._id;
      const { error, value } = updateUserProfileSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      const user: any = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const isMatch = await bcrypt.compare(
        value.currentPassword,
        user.password
      );

      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      const hashedPassword = await bcrypt.hash(value.newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      const subject = 'Password Change';
      const isEmailSent = await sendEmail(
        user.email,
        subject,
        'passwordResetSuccess',
        {}
      );
      if (!isEmailSent) {
        res
          .status(400)
          .json({ success: false, message: 'An error occurred while sending' });
      }

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err?.message || 'An error occurred while changing password',
      });
    }
  },

  getAllUsers: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find().skip(skip).limit(limit).select('-password'),
        User.countDocuments(),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages,
            totalUsers: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err?.message || 'An error occurred while retrieving users',
      });
    }
  },
};

export { UserController };
