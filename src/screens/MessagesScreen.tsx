import { StyleSheet, View } from 'react-native';
import { H2, Body } from '../components/Typography';
import { colors } from '../theme';

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <H2>Messages</H2>
      <Body style={styles.subtitle}>Your conversations</Body>
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
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
});

