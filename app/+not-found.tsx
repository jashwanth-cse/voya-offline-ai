import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Screen not found.</Text>
        <Link href="/" style={styles.link}>
          Go to Home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
    padding: 20,
  },
  title: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    color: '#44CC88',
  },
});
