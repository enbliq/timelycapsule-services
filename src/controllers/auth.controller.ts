import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../model/user.model";

const Auth = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        res
          .status(400)
          .json({ success: false, message: "Invalid email or password" });
      }

      const isPasswordMatch = await bcrypt.compare(
        password,
        user?.password as string
      );
      if (!isPasswordMatch) {
        res
          .status(400)
          .json({ success: false, message: "Invalid email or password" });
      }

      const token = jwt.sign(
        {
          id: user?._id,
          email: user?.email,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "30d" }
      );

      const userObj = user?.toObject();

      res.status(200).json({ success: true, data: userObj, token });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err.message || "An error occurred while logging in",
      });
    }
  },
};

export { Auth };
