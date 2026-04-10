import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Analytics } from '../model/Analytics';
import { Capsule } from '../model/Capsule';
import { Reaction } from '../model/Reaction';
import { Contribution } from '../model/Contribution';
import mongoose from 'mongoose';

export async function getUserAnalytics(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Aggregate statistics across all user capsules
    const [capsuleStats, reactionStats, contributionStats, analyticsAgg] =
      await Promise.all([
        // Capsule counts by status
        Capsule.aggregate([
          { $match: { creator: userObjectId } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),

        // Reaction counts across user's capsules
        Reaction.aggregate([
          {
            $lookup: {
              from: 'capsules',
              localField: 'capsule',
              foreignField: '_id',
              as: 'capsuleInfo',
            },
          },
          { $unwind: '$capsuleInfo' },
          { $match: { 'capsuleInfo.creator': userObjectId } },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
            },
          },
        ]),

        // Contribution counts
        Contribution.aggregate([
          {
            $lookup: {
              from: 'capsules',
              localField: 'capsule',
              foreignField: '_id',
              as: 'capsuleInfo',
            },
          },
          { $unwind: '$capsuleInfo' },
          { $match: { 'capsuleInfo.creator': userObjectId } },
          {
            $group: {
              _id: null,
              totalContributions: { $sum: 1 },
            },
          },
        ]),

        // Aggregated analytics metrics
        Analytics.aggregate([
          { $match: { entityType: 'user', entityId: userObjectId } },
          {
            $group: {
              _id: null,
              totalViews: { $sum: '$metrics.views' },
              totalUniqueViews: { $sum: '$metrics.uniqueViews' },
              totalReactions: { $sum: '$metrics.reactions' },
              totalShares: { $sum: '$metrics.shares' },
              totalCollaborators: { $sum: '$metrics.collaborators' },
              totalMediaUploads: { $sum: '$metrics.mediaUploads' },
              totalTextContributions: { $sum: '$metrics.textContributions' },
            },
          },
        ]),
      ]);

    // Build capsule status breakdown
    const capsuleBreakdown: Record<string, number> = {};
    let totalCapsules = 0;
    for (const stat of capsuleStats) {
      capsuleBreakdown[stat._id] = stat.count;
      totalCapsules += stat.count;
    }

    // Build reaction breakdown
    const reactionBreakdown: Record<string, number> = {};
    let totalReactions = 0;
    for (const stat of reactionStats) {
      reactionBreakdown[stat._id] = stat.count;
      totalReactions += stat.count;
    }

    const totalContributions =
      contributionStats[0]?.totalContributions ?? 0;

    const agg = analyticsAgg[0] ?? {};

    // Engagement rate: reactions / views (if available)
    const totalViews = agg.totalViews ?? 0;
    const engagementRate =
      totalViews > 0 ? ((totalReactions / totalViews) * 100).toFixed(2) : '0.00';

    // Growth metrics: compare last 7 days vs previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [recentPeriod, previousPeriod] = await Promise.all([
      Analytics.aggregate([
        {
          $match: {
            entityType: 'user',
            entityId: userObjectId,
            date: { $gte: sevenDaysAgo, $lte: now },
          },
        },
        {
          $group: {
            _id: null,
            views: { $sum: '$metrics.views' },
            reactions: { $sum: '$metrics.reactions' },
          },
        },
      ]),
      Analytics.aggregate([
        {
          $match: {
            entityType: 'user',
            entityId: userObjectId,
            date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            views: { $sum: '$metrics.views' },
            reactions: { $sum: '$metrics.reactions' },
          },
        },
      ]),
    ]);

    const recentViews = recentPeriod[0]?.views ?? 0;
    const previousViews = previousPeriod[0]?.views ?? 0;
    const viewsGrowthPercent =
      previousViews > 0
        ? (((recentViews - previousViews) / previousViews) * 100).toFixed(2)
        : null;

    const recentReactions = recentPeriod[0]?.reactions ?? 0;
    const previousReactions = previousPeriod[0]?.reactions ?? 0;
    const reactionsGrowthPercent =
      previousReactions > 0
        ? (((recentReactions - previousReactions) / previousReactions) * 100).toFixed(2)
        : null;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCapsules,
          totalReactions,
          totalContributions,
          engagementRate: `${engagementRate}%`,
        },
        capsules: {
          total: totalCapsules,
          byStatus: capsuleBreakdown,
        },
        performance: {
          totalViews: agg.totalViews ?? 0,
          totalUniqueViews: agg.totalUniqueViews ?? 0,
          totalReactions: agg.totalReactions ?? 0,
          totalShares: agg.totalShares ?? 0,
          totalCollaborators: agg.totalCollaborators ?? 0,
          totalMediaUploads: agg.totalMediaUploads ?? 0,
          totalTextContributions: agg.totalTextContributions ?? 0,
        },
        reactions: {
          total: totalReactions,
          byType: reactionBreakdown,
        },
        growth: {
          period: '7d',
          views: {
            recent: recentViews,
            previous: previousViews,
            changePercent: viewsGrowthPercent,
          },
          reactions: {
            recent: recentReactions,
            previous: previousReactions,
            changePercent: reactionsGrowthPercent,
          },
        },
      },
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics',
    });
  }
}
