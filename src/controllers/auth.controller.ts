import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../model/user.model";
import { sendEmail } from "../services/email";
import { passwordSchema } from "../utils/joivalidators/auth";
import { v4 as uuid } from "uuid";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;

const Auth = {
  register: async (req: Request, res: Response) => {
    try {
      const { error, value } = passwordSchema.validate(req.body);

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
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
        return res
          .status(400)
          .json({ success: false, message: "All fields are required" });
      }

      if (password === confirmPassword) {
        return res
          .status(400)
          .json({ success: false, message: "Password doesn't match." });
      }

      if (!passwordPattern.test(password)) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters long and include uppercase letters, lowercase letters, digits, and special characters.",
        });
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const email_verification = uuid();

      let newUser;
      newUser = await User.create({
        firstName,
        lastName,
        email,
        walletAddress,
        password: hashedPassword,
        email_verification,
      });

      const verification_link = `${
        process.env.NODE_ENV === "production"
          ? process.env.PROD_BASE_URL
          : process.env.BASE_URL
      }/auth/verify?email_verification=${email_verification}&user=${newUser._id?.toString()}`;

      const context = {
        verification_link,
        user: {
          email: newUser.email,
        },
      };

      const subject = "Kindly verify your email";
      const isEmailSent = await sendEmail(
        email,
        subject,
        "verifyAccount",
        context
      );
      if (!isEmailSent) {
        return res
          .status(400)
          .json({ success: false, message: "An error occurred while sending" });
      }

      return res.status(201).json({ success: true, data: newUser });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "An error occurred while creating account",
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

  resendVerificationEmail: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Email not found" });
      }

      if (user.isVerified) {
        return res
          .status(400)
          .json({ success: false, message: "Email already verified" });
      }
      const email_verification = uuid();
      const verification_link = `${
        process.env.NODE_ENV === "production"
          ? process.env.PROD_BASE_URL
          : process.env.BASE_URL
      }}/auth/verify?email_verification=${email_verification}&user=${user._id?.toString()}`;
      const context = {
        verification_link,
        user: {
          email: user.email,
        },
      };

      const subject = "Kindly verify your email";
      const isEmailSent = await sendEmail(
        email,
        subject,
        "verifyAccount",
        context
      );

      if (!isEmailSent) {
        return res.status(400).json({
          success: false,
          message: "An error occurred while sending email",
        });
      }

      user.email_verification = email_verification;
      await user.save();
      return res.status(200).json({ success: true, message: "Email sent" });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "An error occurred while creating account",
      });
    }
  },
};

export { Auth };
