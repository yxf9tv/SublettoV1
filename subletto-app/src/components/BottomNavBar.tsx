import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { Caption } from './Typography';

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
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </View>
        ) : (
          <>
            <View style={styles.tabIcon}>
              <Ionicons
                name={
                  route.name === 'Home'
                    ? 'home'
                    : route.name === 'Map'
                    ? 'map-outline'
                    : route.name === 'Messages'
                    ? 'chatbubble-ellipses-outline'
                    : route.name === 'Profile'
                    ? 'person-outline'
                    : 'ellipse-outline'
                }
                size={20}
                color={isFocused ? '#113D43' : '#9CA3AF'}
              />
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

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>{tabs}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 20,
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 32,
    marginHorizontal: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  postTab: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#113D43',
  },
  postButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

