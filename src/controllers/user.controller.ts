import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import User from "../model/user.model";

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
          message: "User ID is required",
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err?.message || "An error occurred while retrieving user",
      });
    }
  },

  getCurrentUser: async (req: UserRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err?.message || "An error occurred while retrieving user",
      });
    }
  },

  getAllUsers: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find().skip(skip).limit(limit).select("-password"),
        User.countDocuments(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
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
      return res.status(400).json({
        success: false,
        message: err?.message || "An error occurred while retrieving users",
      });
    }
  },
};

export { UserController };
