import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SlotWithUserInfo,
  fetchSlotsForListing,
} from '../lib/roomApi';
import {
  formatTimeRemaining,
  SLOT_COLORS,
  SlotStatus,
} from '../constants/room';

interface RoomSlotsModuleProps {
  listingId: string;
  currentUserId: string | null;
  onCommit: (slotId: string) => void;
  onCancel: (slotId: string) => void;
  refreshTrigger?: number;
}

export default function RoomSlotsModule({
  listingId,
  currentUserId,
  onCommit,
  onCancel,
  refreshTrigger,
}: RoomSlotsModuleProps) {
  const [slots, setSlots] = useState<SlotWithUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSlotsForListing(listingId);
      setSlots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots, refreshTrigger]);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update countdowns
      setSlots((prev) => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2C67FF" />
        <Text style={styles.loadingText}>Loading slots...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadSlots} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No slots available for this listing</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Spots</Text>
      <View style={styles.slotsGrid}>
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            currentUserId={currentUserId}
            onCommit={() => onCommit(slot.id)}
            onCancel={() => onCancel(slot.id)}
          />
        ))}
      </View>
    </View>
  );
}

interface SlotCardProps {
  slot: SlotWithUserInfo;
  currentUserId: string | null;
  onCommit: () => void;
  onCancel: () => void;
}

function SlotCard({ slot, currentUserId, onCommit, onCancel }: SlotCardProps) {
  const isYourLock = slot.locked_by_user_id === currentUserId;
  const status = slot.status as SlotStatus;

  const getColors = () => {
    if (isYourLock) return SLOT_COLORS.yourLock;
    return SLOT_COLORS[status];
  };

  const colors = getColors();

  const renderContent = () => {
    switch (status) {
      case 'available':
        return (
          <>
            <View style={styles.slotHeader}>
              <Ionicons name="bed-outline" size={20} color={colors.text} />
              <Text style={[styles.slotLabel, { color: colors.text }]}>
                Spot {slot.slot_number}
              </Text>
            </View>
            <Text style={[styles.statusText, { color: colors.text }]}>
              Available
            </Text>
            {currentUserId && (
              <TouchableOpacity
                style={[styles.commitButton, { backgroundColor: colors.border }]}
                onPress={onCommit}
              >
                <Text style={styles.commitButtonText}>Commit</Text>
              </TouchableOpacity>
            )}
          </>
        );

      case 'locked':
        return (
          <>
            <View style={styles.slotHeader}>
              <Ionicons
                name={isYourLock ? 'checkmark-circle' : 'lock-closed'}
                size={20}
                color={colors.text}
              />
              <Text style={[styles.slotLabel, { color: colors.text }]}>
                Spot {slot.slot_number}
              </Text>
            </View>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {isYourLock ? 'Your spot' : 'Locked'}
            </Text>
            {slot.locked_until && (
              <Text style={[styles.countdown, { color: colors.text }]}>
                {formatTimeRemaining(slot.locked_until)}
              </Text>
            )}
            {isYourLock && (
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={onCancel}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </>
        );

      case 'filled':
        return (
          <>
            <View style={styles.slotHeader}>
              <Ionicons name="checkmark-done" size={20} color={colors.text} />
              <Text style={[styles.slotLabel, { color: colors.text }]}>
                Spot {slot.slot_number}
              </Text>
            </View>
            <Text style={[styles.statusText, { color: colors.text }]}>
              Filled
            </Text>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.slotCard,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  slotCard: {
    width: '47%',
    marginHorizontal: '1.5%',
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 140,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Poppins-Medium',
  },
  countdown: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginBottom: 8,
  },
  commitButton: {
    marginTop: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  commitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  cancelButton: {
    marginTop: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2C67FF',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

