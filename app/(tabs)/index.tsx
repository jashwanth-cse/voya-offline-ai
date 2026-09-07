import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VOYA</Text>
      <Text style={styles.tagline}>Your destination. In your pocket.</Text>
      <Text style={styles.status}>Phase 0 — Project Initialized ✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#9999BB',
    marginTop: 12,
    textAlign: 'center',
  },
  status: {
    fontSize: 12,
    color: '#44CC88',
    marginTop: 40,
    fontFamily: 'monospace',
  },
});
