import mongoose from 'mongoose';
import { z } from 'zod';

import { BaseSchema } from './base';
import { ControlStatus } from '~/lib/types/controls';
import { CONTROL_STATUSES } from '~/lib/constants/controls';

const EVIDENCE_STATUSES = ['NEEDS_ARTIFACT', 'UPDATED'] as const;
export const EvidenceStatus = z.enum(EVIDENCE_STATUSES);
export type EvidenceStatus = z.infer<typeof EvidenceStatus>;

const EVIDENCE_RETRIEVAL_STATUSES = ['SUCCESS', 'FAILED', 'PENDING'] as const;
const EvidenceRetrievalStatus = z.enum(EVIDENCE_RETRIEVAL_STATUSES);
export type EvidenceRetrievalStatus = z.infer<typeof EvidenceRetrievalStatus>;

export const Evidence = z.object({
  id: z.string(),
  codes: z.array(z.string()),
  status: EvidenceStatus,
  feedback: ControlStatus,
  retrievalStatus: EvidenceRetrievalStatus,
  organisationId: z.string(),
  createdAt: z.coerce.date(),
  errorCode: z.string().optional(),
});

export type Evidence = z.infer<typeof Evidence>;

type EvidenceWithDocument = Evidence & mongoose.Document;

const EvidenceSchema = new BaseSchema<EvidenceWithDocument>({
  codes: {
    type: [{ type: String }],
    required: true,
  },
  status: {
    type: String,
    enum: EVIDENCE_STATUSES,
    required: false,
  },
  retrievalStatus: {
    type: String,
    enum: EVIDENCE_RETRIEVAL_STATUSES,
    default: 'PENDING',
  },
  feedback: {
    type: String,
    enum: CONTROL_STATUSES,
    default: 'NOT_IMPLEMENTED',
  },
  organisationId: {
    type: String,
    required: true,
  },
  errorCode: {
    type: String,
    required: false,
  },
});

export default (mongoose.models
  .Evidence as mongoose.Model<EvidenceWithDocument>) ||
  mongoose.model('Evidence', EvidenceSchema);
