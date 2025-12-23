import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { poppinsFonts } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    ...poppinsFonts,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C67FF" />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

