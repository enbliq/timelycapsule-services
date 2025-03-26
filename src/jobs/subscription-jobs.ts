import cron from "node-cron"
import Subscription, { SubscriptionStatus } from "../model/subscription.model"
import subscriptionService from "../services/subscription.service"
// Assuming you have some notification service
// import notificationService from '../services/notification.service';

/**
 * Initialize subscription-related scheduled jobs
 */
export const initSubscriptionJobs = () => {
  // Check for expired subscriptions daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running job: Check expired subscriptions")
    try {
      const now = new Date()

      // Find and update expired subscriptions
      const expiredSubscriptions = await Subscription.find({
        status: SubscriptionStatus.ACTIVE,
        endDate: { $lt: now },
      })

      if (expiredSubscriptions.length > 0) {
        await Subscription.updateMany(
          { _id: { $in: expiredSubscriptions.map((sub) => sub._id) } },
          {
            status: SubscriptionStatus.EXPIRED,
            updatedAt: now,
          },
        )

        console.log(`Updated ${expiredSubscriptions.length} expired subscriptions`)
      }
    } catch (error) {
      console.error("Error checking expired subscriptions:", error)
    }
  })

  // Check for subscriptions about to expire and send notifications
  cron.schedule("0 9 * * *", async () => {
    console.log("Running job: Check expiring subscriptions")
    try {
      // Get subscriptions expiring in the next 3 days
      const expiringSubscriptions = await subscriptionService.getExpiringSubscriptions(3)

      // Send notifications to users
      for (const subscription of expiringSubscriptions) {
        // Assuming you have a notification service
        // await notificationService.sendExpirationReminder(subscription);
        console.log(`Notification sent for subscription ${subscription._id} expiring soon`)
      }

      console.log(`Processed ${expiringSubscriptions.length} expiring subscriptions`)
    } catch (error) {
      console.error("Error checking expiring subscriptions:", error)
    }
  })

  // Auto-renew eligible subscriptions
  cron.schedule("0 1 * * *", async () => {
    console.log("Running job: Auto-renew subscriptions")
    try {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)

      // Find subscriptions that are set to auto-renew and expire tomorrow
      const subscriptionsToRenew = await Subscription.find({
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        endDate: {
          $gte: now,
          $lt: tomorrow,
        },
        paymentStatus: true,
      })

      console.log(`Found ${subscriptionsToRenew.length} subscriptions to auto-renew`)

      // Process each subscription for renewal
      // This would typically involve payment processing logic
      // which would be implemented in a payment service

      // For demonstration purposes:
      for (const subscription of subscriptionsToRenew) {
        try {
          // Here you would typically:
          // 1. Process payment
          // 2. If successful, renew the subscription

          // For now, just log it
          console.log(`Would auto-renew subscription ${subscription._id}`)

          // Example of how you might renew after payment:
          // const paymentResult = await paymentService.processRenewal(subscription);
          // if (paymentResult.success) {
          //   await subscriptionService.renewSubscription(subscription._id.toString());
          // }
        } catch (error) {
          console.error(`Error processing renewal for subscription ${subscription._id}:`, error)
        }
      }
    } catch (error) {
      console.error("Error in auto-renewal job:", error)
    }
  })
}

