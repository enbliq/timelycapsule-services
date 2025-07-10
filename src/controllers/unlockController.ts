//src/controllers/unlockController.ts
import { Request, Response } from 'express';
import { Capsule } from '../model/Capsule';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { UnlockAttempt } from '../model/UnlockAttempt';

export const unlockLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many unlock attempts. Please try again later.',
    });
  },
  keyGenerator: (req) => {
    return `${req.ip}-${req.params.id}`;
  },
});

export const unlockCapsule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { password, location } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid capsule ID',
      });
    }

    const capsule = await Capsule.findById(id).select(
      'status unlockDate unlockPassword unlockLocation creator collaborators'
    );

    if (!capsule) {
      return res.status(404).json({
        success: false,
        message: 'Capsule not found',
      });
    }

    const isCreator = capsule.creator.toString() === userId;
    const isCollaborator = capsule.collaborators.some(
      (c: any) => c.toString() === userId
    );

    if (!isCreator && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message:
          'Only capsule creator or collaborators can unlock this capsule',
      });
    }

    if (capsule.status !== 'sealed') {
      return res.status(400).json({
        success: false,
        message: `Capsule is already ${capsule.status}`,
      });
    }

    if (capsule.unlockDate && capsule.unlockDate > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Capsule cannot be unlocked before the scheduled date',
        unlockDate: capsule.unlockDate,
      });
    }

    const unlockAttempt = new UnlockAttempt({
      capsule: capsule._id,
      user: userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      attemptType: password ? 'password' : 'location',
      successful: false,
    });

    if (capsule.unlockPassword) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to unlock this capsule',
        });
      }

      const isMatch = await bcrypt.compare(password, capsule.unlockPassword);

      if (!isMatch) {
        unlockAttempt.details = 'Incorrect password';
        await unlockAttempt.save();

        return res.status(401).json({
          success: false,
          message: 'Incorrect password',
        });
      }
    }

    if (capsule.unlockLocation) {
      if (!location || !location.coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Location coordinates are required to unlock this capsule',
        });
      }

      const [longitude, latitude] = location.coordinates;
      const capsuleCoords = capsule.unlockLocation.coordinates;
      const radius = capsule.unlockLocation.radius || 100;

      const R = 6371000;
      const φ1 = (capsuleCoords[1] * Math.PI) / 180;
      const φ2 = (latitude * Math.PI) / 180;
      const Δφ = ((latitude - capsuleCoords[1]) * Math.PI) / 180;
      const Δλ = ((longitude - capsuleCoords[0]) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance > radius) {
        unlockAttempt.details = `Location mismatch (${Math.round(
          distance
        )}m from target)`;
        await unlockAttempt.save();

        return res.status(401).json({
          success: false,
          message:
            'You are not in the required location to unlock this capsule',
          distance: Math.round(distance),
          requiredRadius: radius,
        });
      }
    }

    capsule.status = 'unlocked';
    capsule.unlockedAt = new Date();
    capsule.lastActivityAt = new Date();
    await capsule.save();

    unlockAttempt.successful = true;
    await unlockAttempt.save();

    res.status(200).json({
      success: true,
      message: 'Capsule unlocked successfully',
      data: {
        unlockedAt: capsule.unlockedAt,
      },
    });
  } catch (error) {
    console.error('Unlock capsule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock capsule',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
