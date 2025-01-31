import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../model/user.model";
import { sendEmail } from '../services/email'

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
        user ?.password as string
      );
      if (!isPasswordMatch) {
        res
          .status(400)
          .json({ success: false, message: "Invalid email or password" });
      }

      const token = jwt.sign(
        {
          id: user ?._id,
          email: user ?.email,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "30d" }
      );

      const userObj = user ?.toObject();

      res.status(200).json({ success: true, data: userObj, token });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err.message || "An error occurred while logging in",
      });
    }
  },

  resendVerificationEmail: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Email not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'Email already verified' });
      }
      const email_verification = uuid();
      const verification_link = `${
        process.env.NODE_ENV === 'production' ? process.env.PROD_BASE_URL : process.env.BASE_URL
        }}/auth/verify?email_verification=${email_verification}&user=${user._id ?.toString()}`;
      const context = {
        verification_link,
        user: {
          email: user.email
        }
      };

      const subject = 'Kindly verify your email';
      const isEmailSent = await sendEmail(email, subject, 'verifyAccount', context);

      if (!isEmailSent) {
        return res.status(400).json({
          success: false,
          message: 'An error occurred while sending email'
        });
      }

      user.email_verification = email_verification;
      await user.save();
      return res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'An error occurred while creating account'
      });
    }
  }
};

export { Auth };

