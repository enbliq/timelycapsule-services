import { Router } from "express"
import { body, param, query } from "express-validator"
import subscriptionController from "../controllers/subscription.controller"
import { validate } from "../middleware/validator.middleware"
import { SubscriptionPlanType, SubscriptionStatus, PaymentMethod } from "../model/subscription.model"

const router = Router()

// Create subscription
router.post(
  "/",
  validate([
    body("userId").isMongoId().withMessage("Invalid user ID"),
    body("planType").isIn(Object.values(SubscriptionPlanType)).withMessage("Invalid plan type"),
    body("startDate").isISO8601().withMessage("Start date must be a valid ISO date"),
    body("endDate")
      .isISO8601()
      .withMessage("End date must be a valid ISO date")
      .custom((endDate, { req }) => {
        if (new Date(endDate) <= new Date(req.body.startDate)) {
          throw new Error("End date must be after start date")
        }
        return true
      }),
    body("paymentMethod").isIn(Object.values(PaymentMethod)).withMessage("Invalid payment method"),
    body("walletAddress")
      .if(body("paymentMethod").equals(PaymentMethod.CRYPTO))
      .notEmpty()
      .withMessage("Wallet address is required for crypto payments"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("currency").isString().withMessage("Currency must be a string"),
  ]),
  subscriptionController.createSubscription,
)

// Get all subscriptions with optional filtering
router.get(
  "/",
  validate([
    query("status").optional().isIn(Object.values(SubscriptionStatus)).withMessage("Invalid status"),
    query("planType").optional().isIn(Object.values(SubscriptionPlanType)).withMessage("Invalid plan type"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  ]),
  subscriptionController.getAllSubscriptions,
)

// Get subscription by ID
router.get(
  "/:id",
  validate([param("id").isMongoId().withMessage("Invalid subscription ID")]),
  subscriptionController.getSubscriptionById,
)

// Get subscriptions by user ID
router.get(
  "/user/:userId",
  validate([param("userId").isMongoId().withMessage("Invalid user ID")]),
  subscriptionController.getUserSubscriptions,
)

// Update subscription
router.put(
  "/:id",
  validate([
    param("id").isMongoId().withMessage("Invalid subscription ID"),
    body("planType").optional().isIn(Object.values(SubscriptionPlanType)).withMessage("Invalid plan type"),
    body("status").optional().isIn(Object.values(SubscriptionStatus)).withMessage("Invalid status"),
    body("endDate").optional().isISO8601().withMessage("End date must be a valid ISO date"),
    body("autoRenew").optional().isBoolean().withMessage("Auto renew must be a boolean"),
  ]),
  subscriptionController.updateSubscription,
)

// Cancel subscription
router.patch(
  "/:id/cancel",
  validate([param("id").isMongoId().withMessage("Invalid subscription ID")]),
  subscriptionController.cancelSubscription,
)

// Update payment status
router.patch(
  "/:id/payment",
  validate([
    param("id").isMongoId().withMessage("Invalid subscription ID"),
    body("paymentStatus").isBoolean().withMessage("Payment status must be a boolean"),
    body("transactionHash").optional().isString().withMessage("Transaction hash must be a string"),
  ]),
  subscriptionController.updatePaymentStatus,
)

// Check for expired subscriptions (typically called by a scheduled job)
router.post("/check-expired", subscriptionController.checkExpiredSubscriptions)

export default router

