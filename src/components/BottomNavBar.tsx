import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, typography } from '../theme';
import Typography, { Caption } from './Typography';

export default function BottomNavBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const tabs = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
        ? options.title
        : route.name;

    const isFocused = state.index === index;
    const isPostTab = route.name === 'Post';

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarTestID}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[styles.tab, isPostTab && styles.postTab]}
        activeOpacity={0.7}
      >
        {isPostTab ? (
          <View style={styles.postButton}>
            <Typography variant="body" style={styles.postIcon}>
              +
            </Typography>
          </View>
        ) : (
          <>
            <View style={styles.tabIcon}>
              {/* Icon placeholder - can be replaced with actual icons later */}
              <Typography
                variant="body"
                style={[
                  styles.tabIconText,
                  isFocused && styles.tabIconTextActive,
                ]}
              >
                {route.name === 'Home' && '🏠'}
                {route.name === 'Map' && '🗺️'}
                {route.name === 'Messages' && '💬'}
                {route.name === 'Profile' && '👤'}
              </Typography>
            </View>
            <Caption
              style={[
                styles.tabLabel,
                isFocused && styles.tabLabelActive,
              ]}
            >
              {label}
            </Caption>
          </>
        )}
      </TouchableOpacity>
    );
  });

  return <View style={styles.container}>{tabs}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 28,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  postTab: {
    flex: 0,
    marginHorizontal: 8,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabIconText: {
    fontSize: 24,
    opacity: 0.6,
  },
  tabIconTextActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textPrimaryOpacity[70],
  },
  tabLabelActive: {
    color: colors.accentBlue,
    fontWeight: '600',
  },
  postButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  postIcon: {
    fontSize: 28,
    color: colors.card,
    fontWeight: '300',
    lineHeight: 28,
  },
});

