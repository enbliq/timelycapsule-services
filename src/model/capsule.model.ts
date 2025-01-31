import mongoose, { Model } from 'mongoose';
import { Types } from 'mongoose';


interface ICapsule {
  _id: Types.ObjectId;
  title: string;
  content: string;
  media: string | null;
  password: string | null;
  recipientEmail: string;
  recipientLink: string;
  unlockAt: Date;
  expiresAt: Date;
  createdBy: Types.ObjectId | null;  
  isClaimed: boolean;
  isGuest: boolean;
  createdAt: Date;
}

const CapsuleSchema = new mongoose.Schema<ICapsule>({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  media: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    default: null,
  },
  recipientEmail: {
    type: String,
    required: true,
  },
  recipientLink: {
    type: String,
    required: true,
  },
  unlockAt: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  isClaimed: {
    type: Boolean,
    default: false,
  },
  isGuest: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  
  timestamps: true,
  
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


interface ICapsuleMethods {
  isExpired(): boolean;
  isUnlocked(): boolean;
}


interface CapsuleModel extends Model<ICapsule, object, ICapsuleMethods> {
  findByRecipientEmail(email: string): Promise<ICapsule[]>;
}


CapsuleSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

CapsuleSchema.methods.isUnlocked = function(): boolean {
  return new Date() >= this.unlockAt;
};


CapsuleSchema.statics.findByRecipientEmail = function(email: string) {
  return this.find({ recipientEmail: email });
};


const Capsule = mongoose.model<ICapsule, CapsuleModel>('Capsule', CapsuleSchema);

export default Capsule;