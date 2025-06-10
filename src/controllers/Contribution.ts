import { Request, Response } from 'express';
import { Capsule } from '../models/Capsule';
import { Contribution } from '../models/Contribution';
import { Media } from '../models/Media';
import mongoose from 'mongoose';

export const createContribution = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const capsuleId = req.params.id;
    const { text, mediaFiles = [], previousVersionId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(capsuleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid capsule ID',
      });
    }

    const capsule = await Capsule.findOne({
      _id: capsuleId,
      deletedAt: null,
    });

    if (!capsule) {
      return res.status(404).json({
        success: false,
        message: 'Capsule not found',
      });
    }

    // Verify capsule is group type
    if (capsule.type !== 'group') {
      return res.status(400).json({
        success: false,
        message: 'Contributions only allowed for group capsules',
      });
    }

    // Check user is collaborator
    const isCollaborator = capsule.collaborators.some(
      (c: any) => c.toString() === userId
    );

    if (!isCollaborator) {
      return res.status(403).json({
        success: false,
        message: 'Only collaborators can contribute to this capsule',
      });
    }

    // Check media files exist
    if (mediaFiles.length > 0) {
      const validMedia = await Media.countDocuments({
        _id: { $in: mediaFiles },
        deletedAt: null,
      });
      
      if (validMedia !== mediaFiles.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more media files not found',
        });
      }
    }

    let previousVersion = null;
    if (previousVersionId) {
      if (!mongoose.Types.ObjectId.isValid(previousVersionId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid previous version ID',
        });
      }

      previousVersion = await Contribution.findOne({
        _id: previousVersionId,
        capsule: capsuleId,
        author: userId,
      });

      if (!previousVersion) {
        return res.status(404).json({
          success: false,
          message: 'Previous contribution version not found',
        });
      }
    }

    const contribution = new Contribution({
      capsule: capsuleId,
      author: userId,
      content: {
        text: text?.trim(),
        mediaFiles,
      },
      previousVersion: previousVersionId,
    });

    await contribution.save();

    // Add to capsule's contributions
    capsule.contributions.push(contribution._id);
    await capsule.save();

    res.status(201).json({
      success: true,
      message: 'Contribution submitted for approval',
      data: {
        contribution: {
          _id: contribution._id,
          status: contribution.status,
          version: contribution.version,
          createdAt: contribution.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Create contribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contribution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const approveContribution = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { contributionId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(contributionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contribution ID',
      });
    }

    const contribution = await Contribution.findById(contributionId)
      .populate('capsule', 'creator contributions approvedContributions');

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found',
      });
    }

    const capsule = contribution.capsule as any;

    
    if (capsule.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only capsule creator can approve contributions',
      });
    }

    
    if (contribution.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Contribution is already ${contribution.status}`,
      });
    }


    contribution.status = 'approved';
    await contribution.save();


    if (!capsule.approvedContributions.includes(contribution._id)) {
      capsule.approvedContributions.push(contribution._id);
      await capsule.save();
    }

    res.status(200).json({
      success: true,
      message: 'Contribution approved',
      data: {
        contribution: {
          _id: contribution._id,
          status: contribution.status,
        },
      },
    });
  } catch (error) {
    console.error('Approve contribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve contribution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const rejectContribution = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { contributionId } = req.params;
    const { feedback } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(contributionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contribution ID',
      });
    }

    const contribution = await Contribution.findById(contributionId)
      .populate('capsule', 'creator');

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found',
      });
    }

    const capsule = contribution.capsule as any;

    
    if (capsule.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only capsule creator can reject contributions',
      });
    }

    
    if (contribution.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Contribution is already ${contribution.status}`,
      });
    }

    
    contribution.status = 'rejected';
    if (feedback) {
      contribution.feedback = feedback;
    }
    await contribution.save();

    res.status(200).json({
      success: true,
      message: 'Contribution rejected',
      data: {
        contribution: {
          _id: contribution._id,
          status: contribution.status,
          feedback: contribution.feedback,
        },
      },
    });
  } catch (error) {
    console.error('Reject contribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject contribution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
