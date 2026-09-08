import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import type { PlaceCategory } from '../../types/travel';

const CATEGORY_CONFIG: Record<PlaceCategory, { label: string; color: string; bg: string }> = {
  attraction: { label: 'Attraction', color: Colors.attraction, bg: Colors.attractionBg },
  restaurant: { label: 'Restaurant', color: Colors.restaurant, bg: Colors.restaurantBg },
  hotel: { label: 'Hotel', color: Colors.hotel, bg: Colors.hotelBg },
  landmark: { label: 'Landmark', color: Colors.landmark, bg: Colors.landmarkBg },
};

interface BadgeProps {
  category: PlaceCategory;
  small?: boolean;
}

export function Badge({ category, small = false }: BadgeProps) {
  const config = CATEGORY_CONFIG[category];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, small && styles.small]}>
      <Text style={[styles.label, { color: config.color }, small && styles.labelSmall]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 12 },
  label: { fontSize: 12, fontWeight: '600' },
  labelSmall: { fontSize: 10 },
});
