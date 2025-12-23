import { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme';

type RootStackParamList = {
  MainTabs: undefined;
  NewListing: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PostScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      // Navigate to NewListing wizard when Post tab is focused
      navigation.navigate('NewListing');
    }
  }, [isFocused, navigation]);

  // Show loading while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accentBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

