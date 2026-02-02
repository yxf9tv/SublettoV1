// Room MVP Constants

export const LOCK_DURATION_HOURS = 48;

// Feature flag - set to true to enable Room mode
export const ROOM_MODE = true;

// Format functions for consistent UI display
// Shows spots LEFT (decreases as people sign up)
export const formatProgress = (filled: number, total: number): string => {
  const left = total - filled;
  return `${left}/${total}`;
};

export const formatSpotsLeft = (filled: number, total: number): string => {
  const left = total - filled;
  return left === 1 ? '1 spot left' : `${left} spots left`;
};

// Full format with "left" label
export const formatSpotsLeftFull = (filled: number, total: number): string => {
  const left = total - filled;
  return `${left}/${total} left`;
};

export const formatTimeRemaining = (expiresAt: Date | string): string => {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
};

// Slot status types
export type SlotStatus = 'available' | 'locked' | 'filled';

// Commitment status types
export type CommitmentStatus = 'active' | 'cancelled' | 'expired' | 'completed';

// Colors for different slot states
export const SLOT_COLORS = {
  available: {
    background: '#E8F5E9',
    border: '#4CAF50',
    text: '#2E7D32',
  },
  locked: {
    background: '#FFF3E0',
    border: '#FF9800',
    text: '#E65100',
  },
  filled: {
    background: '#ECEFF1',
    border: '#9E9E9E',
    text: '#616161',
  },
  yourLock: {
    background: '#E3F2FD',
    border: '#2196F3',
    text: '#1565C0',
  },
} as const;

// Badge styles
export const BADGE_STYLES = {
  full: {
    background: '#4CAF50',
    text: '#FFFFFF',
  },
  partial: {
    background: '#2C67FF',
    text: '#FFFFFF',
  },
  empty: {
    background: '#9E9E9E',
    text: '#FFFFFF',
  },
} as const;

