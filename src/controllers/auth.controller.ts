// src/controllers/auth.controller.ts

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../model/user.model";
import { generateAccessToken } from "../utils/jwt";

export const Auth = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate inputs
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required." });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format." });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already in use." });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = await User.create({
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        email,
        password: passwordHash,
        roles: ['user'],
        guest: false,
        isVerified: false,
        provider: 'local',
      });

      // Generate JWT token
      const accessToken = generateAccessToken(newUser._id.toString());

      // Return success response
      return res.status(201).json({
        message: "User registered successfully.",
        user: {
          id: newUser._id,
          displayName: newUser.displayName,
          email: newUser.email,
          roles: newUser.roles,
          guest: newUser.guest,
          isVerified: newUser.isVerified,
        },
        accessToken,
      });
    } catch (error) {
      console.error("Registration Error:", error);
      return res.status(500).json({ message: "Server error during registration." });
    }
  },

  //Auth Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate inputs
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      // If user is a guest, reject login
      if (user.guest) {
        return res.status(403).json({ message: "Guest users cannot login." });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password || '');
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      // Update last login timestamp
      user.lastLoginAt = new Date();
      await user.save();

      // Generate JWT token
      const accessToken = generateAccessToken(user._id.toString());

      // Return success response
      return res.status(200).json({
        message: "Login successful.",
        user: {
          id: user._id,
          displayName: user.displayName,
          email: user.email,
          roles: user.roles,
          guest: user.guest,
          isVerified: user.isVerified,
        },
        accessToken,
      });
    } catch (error) {
      console.error("Login Error:", error);
      return res.status(500).json({ message: "Server error during login." });
    }
  },

  //Auth Logout
  async logout(req: Request, res: Response) {
    try {
      // Since JWTs are stateless, just tell client to delete their token
      return res.status(200).json({ message: "Logged out successfully." });
    } catch (error) {
      console.error("Logout Error:", error);
      return res.status(500).json({ message: "Server error during logout." });
    }
  },
//Guess Session
  async guestSession(req: Request, res: Response) {
    try {
      // Create a random guest display name
      const randomSuffix = crypto.randomBytes(3).toString('hex'); // e.g., 'f3a9c2'
      const displayName = `Guest_${randomSuffix}`;

      const guestUser = await User.create({
        displayName,
        guest: true,
        roles: ['guest'],
        email: null,
        password: null,
        isVerified: true, // guests don't need email verification
        provider: 'local',
        lastLoginAt: new Date(),
      });

      const accessToken = generateAccessToken(guestUser._id.toString());

      return res.status(201).json({
        message: "Guest session created successfully.",
        user: {
          id: guestUser._id,
          displayName: guestUser.displayName,
          guest: true,
        },
        accessToken,
      });
    } catch (error) {
      console.error("Guest Session Error:", error);
      return res.status(500).json({ message: "Server error creating guest session." });
    }
  },
};
