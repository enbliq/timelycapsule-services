import type { PaymentMethod } from "../model/subscription.model"

export interface PaymentDetails {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod; 
  description?: string;
  metadata?: Record<string, unknown>;  
}

export interface CryptoPaymentDetails extends PaymentDetails {
  walletAddress: string
  network?: string
  tokenType?: string
}
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  transactionHash?: string; 
  message?: string;
  error?: unknown; 
  timestamp: Date;
}


export interface PaymentServiceInterface {
  processPayment(details: PaymentDetails): Promise<PaymentResult>
  verifyPayment(transactionId: string): Promise<PaymentResult>
  refundPayment(transactionId: string, amount?: number): Promise<PaymentResult>
}

