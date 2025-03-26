import mongoose, { type Document, Schema } from "mongoose"

export enum SubscriptionPlanType {
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
  ENTERPRISE = "ENTERPRISE",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING",
}

export enum PaymentMethod {
  CRYPTO = "CRYPTO",
  CREDIT_CARD = "CREDIT_CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
}

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId
  planType: SubscriptionPlanType
  startDate: Date
  endDate: Date
  status: SubscriptionStatus
  paymentStatus: boolean
  paymentMethod: PaymentMethod
  transactionHash?: string // For Web3 payments
  walletAddress?: string
  autoRenew: boolean
  price: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planType: {
      type: String,
      enum: Object.values(SubscriptionPlanType),
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.PENDING,
    },
    paymentStatus: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    transactionHash: {
      type: String,
      sparse: true,
    },
    walletAddress: {
      type: String,
      sparse: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
subscriptionSchema.index({ userId: 1, status: 1 })
subscriptionSchema.index({ endDate: 1, status: 1 })

const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema)

export default Subscription

