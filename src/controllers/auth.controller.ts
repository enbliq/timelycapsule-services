/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../model/user.model';
import { sendEmail } from '../services/email';
import {
  forgotPasswordSchema,
  passwordSchema,
} from '../utils/joivalidators/auth';
import { v4 as uuid } from 'uuid';

const passwordPattern = /^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[\W_]).{6,}$/;

const Auth = {
  register: async (req: Request, res: Response) => {
    try {
      const { error, value } = passwordSchema.validate(req.body);

      if (error) {
        res.status(400).json({ success: false, message: error.message });
      }

      const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        walletAddress,
      } = req.body;

      if (!email || !password) {
        res
          .status(400)
          .json({ success: false, message: 'All fields are required' });
      }

      if (password === confirmPassword) {
        res
          .status(400)
          .json({ success: false, message: "Password doesn't match." });
      }

      if (!passwordPattern.test(password)) {
        res.status(400).json({
          success: false,
          message:
            'Password must be at least 6 characters long and include uppercase letters, lowercase letters, digits, and special characters.',
        });
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        res
          .status(400)
          .json({ success: false, message: 'Email already in use' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const email_verification = uuid();

      const newUser = await User.create({
        firstName,
        lastName,
        email,
        walletAddress,
        password: hashedPassword,
        email_verification,
      });

      const verification_link = `${
        process.env.NODE_ENV === 'production'
          ? process.env.PROD_BASE_URL
          : process.env.BASE_URL
      }/auth/verify?email_verification=${email_verification}&user=${newUser._id?.toString()}`;

      const context: any = {
        verification_link,
        user: {
          email: newUser.email,
        },
      };

      const subject = 'Kindly verify your email';
      const isEmailSent = await sendEmail(
        email,
        subject,
        'verifyAccount',
        context
      );
      if (!isEmailSent) {
        res
          .status(400)
          .json({ success: false, message: 'An error occurred while sending' });
      }

      res.status(201).json({ success: true, data: newUser });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'An error occurred while creating account',
      });
    }
  },
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        res
          .status(400)
          .json({ success: false, message: 'Invalid email or password' });
      }

      const isPasswordMatch = await bcrypt.compare(
        password,
        user?.password as string
      );
      if (!isPasswordMatch) {
        res
          .status(400)
          .json({ success: false, message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        {
          id: user?._id,
          email: user?.email,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '30d' }
      );

      const userObj = user?.toObject();

      res.status(200).json({ success: true, data: userObj, token });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'An error occurred while logging in',
      });
    }
  },

  resendVerificationEmail: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user: any = await User.findOne({ email });
      if (!user) {
        res.status(400).json({ success: false, message: 'Email not found' });
      }

      if (user.isVerified) {
        res
          .status(400)
          .json({ success: false, message: 'Email already verified' });
      }
      const email_verification = uuid();
      const verification_link = `${
        process.env.NODE_ENV === 'production'
          ? process.env.PROD_BASE_URL
          : process.env.BASE_URL
      }}/auth/verify?email_verification=${email_verification}&user=${user._id?.toString()}`;
      const context: any = {
        verification_link,
        user: {
          email: user.email,
        },
      };

      const subject = 'Kindly verify your email';
      const isEmailSent = await sendEmail(
        email,
        subject,
        'verifyAccount',
        context
      );

      if (!isEmailSent) {
        res.status(400).json({
          success: false,
          message: 'An error occurred while sending email',
        });
      }

      user.email_verification = email_verification;
      await user.save();
      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'An error occurred while creating account',
      });
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const { error, value } = forgotPasswordSchema.validate(req.body);

      if (error) {
        res.status(400).json({ success: false, message: error.message });
      }

      const user: any = await User.findOne({ email: value.email });
      if (!user) {
        res.status(400).json({ success: false, message: 'Email not found' });
      }

      const resetPasswordToken = uuid();

      const reset_link = `${
        process.env.NODE_ENV === 'production'
          ? process.env.PROD_BASE_URL
          : process.env.BASE_URL
      }/auth/forgot-password?token=${resetPasswordToken}&user=${user._id?.toString()}`;

      const subject = 'Reset your password';

      const context = {
        reset_link,
        user: user.firstName,
      };

      const isEmailSent = await sendEmail(
        email,
        subject,
        'resetPassword',
        context
      );

      if (!isEmailSent) {
        res
          .status(400)
          .json({ success: false, message: 'An error occurred while sending' });
      }

      user.passwordResetToken = resetPasswordToken;
      user.passwordResetExpires = new Date(Date.now() + 600000); // 10 minutes

      await user.save();

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message:
          err instanceof Error
            ? err.message
            : 'An error occurred while creating account',
      });
    }
  },

  verifyEmail: async (req: Request, res: Response) => {
    try {
      const { token, user: userId } = req.params;
      const user: any = await User.findOne({
        _id: userId,
        email_verification: token,
      });

      if (!user) {
        res.status(400).json({ success: false, message: 'Invalid token' });
      }

      if (user.isVerified) {
        res
          .status(400)
          .json({ success: false, message: 'Email already verified' });
      }

      user.isVerified = true;

      await user.save();

      const get_started_link = `${
        process.env.NODE_ENV === 'production'
          ? process.env.PROD_BASE_URL
          : process.env.BASE_URL
      }}/auth/login`;
      const context: any = {
        get_started_link,
        user: {
          firstName: user.fullName,
        },
      };
      const subject = 'Welcome to Timely Capsule';
      const isEmailSent = await sendEmail(
        user.email,
        subject,
        'welcomeEmail',
        context
      );

      if (!isEmailSent) {
        res.status(400).json({
          success: false,
          message: 'An error occurred while sending email',
        });
      }

      res
        .status(200)
        .json({ success: true, message: 'Email verified successfully' });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'An error occurred while verifying email',
      });
    }
  },
};

export { Auth };
