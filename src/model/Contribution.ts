import mongoose, { Document, Schema } from 'mongoose';

export interface IContribution extends Document {
  capsule: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: {
    text?: string;
    mediaFiles: mongoose.Types.ObjectId[];
  };
  status: 'pending' | 'approved' | 'rejected';
  version: number;
  previousVersion?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contributionSchema = new Schema<IContribution>(
  {
    capsule: {
      type: Schema.Types.ObjectId,
      ref: 'Capsule',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      text: {
        type: String,
        maxlength: 5000,
      },
      mediaFiles: [{
        type: Schema.Types.ObjectId,
        ref: 'Media',
      }],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    version: {
      type: Number,
      default: 1,
    },
    previousVersion: {
      type: Schema.Types.ObjectId,
      ref: 'Contribution',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
contributionSchema.index({ capsule: 1, status: 1 });
contributionSchema.index({ author: 1 });
contributionSchema.index({ createdAt: -1 });

// Virtual for version history
contributionSchema.virtual('history', {
  ref: 'Contribution',
  localField: '_id',
  foreignField: 'previousVersion',
});

// Pre-save hook for versioning
contributionSchema.pre('save', async function(next) {
  if (this.isNew && this.previousVersion) {
    const prev = await mongoose.model('Contribution').findById(this.previousVersion);
    if (prev) {
      this.version = prev.version + 1;
    }
  }
  next();
});

export const Contribution = mongoose.model<IContribution>('Contribution', contributionSchema);
