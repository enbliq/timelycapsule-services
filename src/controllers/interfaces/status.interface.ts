export interface CountdownInfo {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export interface TimelineInfo {
  createdAt: Date;
  sealedAt?: Date;
  unlockedAt?: Date;
  lastActivityAt: Date;
}

export interface PublicStatusInfo {
  canUnlock: boolean;
  requiresPassword: boolean;
  requiresLocation: boolean;
  unlockDate?: Date;
}

export interface PrivateStatusInfo {
  unlockAttempts: number;
  lastUnlockAttempt?: Date;
  passwordHint?: string;
}

export interface CapsuleStatusResponse {
  success: boolean;
  data: {
    id: string;
    status: 'draft' | 'sealed' | 'unlocked' | 'expired';
    countdown: CountdownInfo;
    timeline: TimelineInfo;
    publicInfo: PublicStatusInfo;
    privateInfo?: PrivateStatusInfo;
  };
} 