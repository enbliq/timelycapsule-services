import Subscription, { type ISubscription, SubscriptionStatus } from "../model/subscription.model"
import { BadRequestError, NotFoundError } from "../utils/error.utils"
import mongoose from "mongoose"

export class SubscriptionService {
  /**
   * Check if a user has an active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError("Invalid user ID")
    }

    const subscription = await Subscription.findOne({
      userId,
      status: SubscriptionStatus.ACTIVE,
      endDate: { $gt: new Date() },
    })

    return !!subscription
  }

  /**
   * Get user's active subscription
   */
  async getUserActiveSubscription(userId: string): Promise<ISubscription | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError("Invalid user ID")
    }

    return Subscription.findOne({
      userId,
      status: SubscriptionStatus.ACTIVE,
      endDate: { $gt: new Date() },
    })
  }

  /**
   * Check if a subscription is about to expire
   * Returns subscriptions expiring in the next 'days' days
   */
  async getExpiringSubscriptions(days = 3): Promise<ISubscription[]> {
    const now = new Date()
    const expiryThreshold = new Date()
    expiryThreshold.setDate(now.getDate() + days)

    return Subscription.find({
      status: SubscriptionStatus.ACTIVE,
      endDate: {
        $gt: now,
        $lte: expiryThreshold,
      },
      autoRenew: false,
    }).populate("userId", "firstName lastName email")
  }

  /**
   * Renew subscription
   */
  async renewSubscription(subscriptionId: string, durationMonths = 1): Promise<ISubscription> {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      throw new BadRequestError("Invalid subscription ID")
    }

    const subscription = await Subscription.findById(subscriptionId)

    if (!subscription) {
      throw new NotFoundError("Subscription not found")
    }

    // Calculate new end date
    const newEndDate = new Date(subscription.endDate)
    newEndDate.setMonth(newEndDate.getMonth() + durationMonths)

    subscription.endDate = newEndDate
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.updatedAt = new Date()

    await subscription.save()

    return subscription
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats() {
    const now = new Date()

    const stats = await Subscription.aggregate([
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          byPlanType: [
            {
              $group: {
                _id: "$planType",
                count: { $sum: 1 },
              },
            },
          ],
          activeSubscriptions: [
            {
              $match: {
                status: SubscriptionStatus.ACTIVE,
                endDate: { $gt: now },
              },
            },
            { $count: "count" },
          ],
          expiringThisMonth: [
            {
              $match: {
                status: SubscriptionStatus.ACTIVE,
                endDate: {
                  $gt: now,
                  $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
                },
              },
            },
            { $count: "count" },
          ],
          totalRevenue: [
            {
              $match: {
                paymentStatus: true,
              },
            },
            {
              $group: {
                _id: "$currency",
                total: { $sum: "$price" },
              },
            },
          ],
        },
      },
    ])

    return stats[0]
  }
}

export default new SubscriptionService()

