import type { Request, Response, NextFunction } from "express"
import Subscription, { SubscriptionStatus, type SubscriptionPlanType, PaymentMethod } from "../model/subscription.model"
import { BadRequestError, NotFoundError } from "../utils/error.utils"
import { sendSuccessResponse } from "../utils/response.utils"
import mongoose, { type SortOrder } from "mongoose"

// Define a proper type for filter objects
interface SubscriptionFilter {
  status?: SubscriptionStatus
  planType?: SubscriptionPlanType
  userId?: mongoose.Types.ObjectId
  [key: string]: unknown
}

export class SubscriptionController {
  /**
   * Create a new subscription
   */
  async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, planType, startDate, endDate, paymentMethod, walletAddress, price, currency } = req.body

      // Validate user exists (assuming User model is imported)
      // Using import instead of require
      const User = await import("../model/user.model").then((m) => m.default)
      const userExists = await User.findById(userId)
      if (!userExists) {
        throw new BadRequestError("User does not exist")
      }

      // Check for active subscriptions
      const activeSubscription = await Subscription.findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
      })

      if (activeSubscription) {
        throw new BadRequestError("User already has an active subscription")
      }

      // Create new subscription
      const subscription = await Subscription.create({
        userId,
        planType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: SubscriptionStatus.PENDING,
        paymentMethod,
        walletAddress: paymentMethod === PaymentMethod.CRYPTO ? walletAddress : undefined,
        price,
        currency,
      })

      sendSuccessResponse(res, "Subscription created successfully", subscription, 201)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all subscriptions with optional filtering
   */
  async getAllSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, planType, page = 1, limit = 10 } = req.query

      const filter: SubscriptionFilter = {}

      if (status) {
        filter.status = status as SubscriptionStatus
      }

      if (planType) {
        filter.planType = planType as SubscriptionPlanType
      }

      const options = {
        page: Number.parseInt(page as string),
        limit: Number.parseInt(limit as string),
        sort: { createdAt: -1 as SortOrder },
      }

      const subscriptions = await Subscription.find(filter)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .sort(options.sort)
        .populate("userId", "firstName lastName email")

      const total = await Subscription.countDocuments(filter)

      sendSuccessResponse(res, "Subscriptions retrieved successfully", {
        subscriptions,
        pagination: {
          total,
          page: options.page,
          limit: options.limit,
          pages: Math.ceil(total / options.limit),
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid subscription ID")
      }

      const subscription = await Subscription.findById(id).populate("userId", "firstName lastName email")

      if (!subscription) {
        throw new NotFoundError("Subscription not found")
      }

      sendSuccessResponse(res, "Subscription retrieved successfully", subscription)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get subscriptions by user ID
   */
  async getUserSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new BadRequestError("Invalid user ID")
      }

      const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 as SortOrder })

      sendSuccessResponse(res, "User subscriptions retrieved successfully", subscriptions)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const updateData = req.body

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid subscription ID")
      }

      // Prevent updating critical fields directly
      const protectedFields = ["userId", "createdAt"]
      protectedFields.forEach((field) => {
        if (updateData[field]) {
          delete updateData[field]
        }
      })

      const subscription = await Subscription.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true },
      )

      if (!subscription) {
        throw new NotFoundError("Subscription not found")
      }

      sendSuccessResponse(res, "Subscription updated successfully", subscription)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid subscription ID")
      }

      const subscription = await Subscription.findById(id)

      if (!subscription) {
        throw new NotFoundError("Subscription not found")
      }

      if (subscription.status === SubscriptionStatus.CANCELLED) {
        throw new BadRequestError("Subscription is already cancelled")
      }

      subscription.status = SubscriptionStatus.CANCELLED
      subscription.autoRenew = false
      subscription.updatedAt = new Date()
      await subscription.save()

      sendSuccessResponse(res, "Subscription cancelled successfully", subscription)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update subscription payment status
   */
  async updatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const { paymentStatus, transactionHash } = req.body

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid subscription ID")
      }

      const subscription = await Subscription.findById(id)

      if (!subscription) {
        throw new NotFoundError("Subscription not found")
      }

      subscription.paymentStatus = paymentStatus

      // If payment is successful, update status to ACTIVE
      if (paymentStatus) {
        subscription.status = SubscriptionStatus.ACTIVE

        // If it's a crypto payment, store the transaction hash
        if (subscription.paymentMethod === PaymentMethod.CRYPTO && transactionHash) {
          subscription.transactionHash = transactionHash
        }
      }

      subscription.updatedAt = new Date()
      await subscription.save()

      sendSuccessResponse(res, "Payment status updated successfully", subscription)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Check for expired subscriptions and update their status
   * This would typically be called by a scheduled job
   */
  async checkExpiredSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date()

      // Find active subscriptions that have expired
      const expiredSubscriptions = await Subscription.find({
        status: SubscriptionStatus.ACTIVE,
        endDate: { $lt: now },
      })

      // Update status to EXPIRED
      if (expiredSubscriptions.length > 0) {
        await Subscription.updateMany(
          { _id: { $in: expiredSubscriptions.map((sub) => sub._id) } },
          {
            status: SubscriptionStatus.EXPIRED,
            updatedAt: now,
          },
        )
      }

      sendSuccessResponse(res, "Expired subscriptions checked successfully", {
        expiredCount: expiredSubscriptions.length,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new SubscriptionController()

