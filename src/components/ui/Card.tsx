import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { Colors } from '../../constants/colors';

interface CardProps extends ViewProps {
  elevated?: boolean;
  noPadding?: boolean;
}

export function Card({ elevated = false, noPadding = false, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[styles.card, elevated && styles.elevated, noPadding && styles.noPadding, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  noPadding: { padding: 0 },
});
