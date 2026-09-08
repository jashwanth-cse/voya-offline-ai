import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import type { Place } from '../../types/travel';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface PlaceCardProps {
  place: Place;
  isSaved?: boolean;
  distanceKm?: number;
  bearingCardinal?: string;
  matchReasons?: string[];
  matchScore?: number;
  onPress?: () => void;
  onSave?: () => void;
  onNavigate?: () => void;
}

export function PlaceCard({
  place,
  isSaved = false,
  distanceKm,
  bearingCardinal,
  matchReasons,
  matchScore,
  onPress,
  onSave,
  onNavigate,
}: PlaceCardProps) {
  const [imageError, setImageError] = useState(false);
  const stars = '★'.repeat(Math.round(place.rating ?? 0));
  const imageSource = place.imageUri || place.imageUrl;
  const showImage = imageSource && !imageError;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
      <Card noPadding style={styles.card}>
        {/* Image Banner */}
        {showImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageSource }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            <View style={styles.imageOverlayTop}>
              <View style={styles.badgeRow}>
                <Badge category={place.category} small />
                {matchScore != null && matchScore >= 75 && (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{matchScore}% Match</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={onSave}
                hitSlop={10}
                activeOpacity={0.7}
                style={styles.saveBtn}
              >
                <Text style={[styles.saveIcon, isSaved && styles.savedIcon]}>
                  {isSaved ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.headerNoImage}>
            <View style={styles.badgeRow}>
              <Badge category={place.category} small />
              {matchScore != null && matchScore >= 75 && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{matchScore}% Match</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onSave} hitSlop={10} activeOpacity={0.7}>
              <Text style={[styles.saveIcon, isSaved && styles.savedIcon]}>
                {isSaved ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Card Body */}
        <View style={styles.body}>
          {/* Title & Distance */}
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={2}>
              {place.name}
            </Text>
            {distanceKm != null && (
              <View style={styles.distBadgeWrapper}>
                <Text style={styles.distanceBadge}>
                  {bearingCardinal ? `${bearingCardinal} · ` : ''}
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)} m`
                    : `${distanceKm.toFixed(1)} km`}
                </Text>
              </View>
            )}
          </View>

          {/* Match Reasons Tags (AI Reasoning) */}
          {matchReasons && matchReasons.length > 0 && (
            <View style={styles.reasonsRow}>
              {matchReasons.map((reason, idx) => (
                <View key={idx} style={styles.reasonPill}>
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Address */}
          {place.address ? (
            <Text style={styles.address} numberOfLines={1}>
              📍 {place.address}
            </Text>
          ) : null}

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {place.description}
          </Text>

          {/* Footer: rating + opening hours + Navigate button */}
          <View style={styles.footer}>
            {place.rating != null && (
              <View style={styles.ratingRow}>
                <Text style={styles.stars}>{stars}</Text>
                <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
                {place.reviewCount ? (
                  <Text style={styles.reviewsText}>({place.reviewCount.toLocaleString()})</Text>
                ) : null}
              </View>
            )}
            {place.openingHours && (
              <Text style={styles.hours} numberOfLines={1}>
                🕐 {place.openingHours}
              </Text>
            )}
            {onNavigate && (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={onNavigate}
                activeOpacity={0.7}
                hitSlop={6}
              >
                <Text style={styles.navBtnText}>🧭 Navigate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 7,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.cardElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: 'rgba(15, 15, 30, 0.7)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNoImage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  body: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
  },
  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reasonPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  distBadgeWrapper: {
    alignItems: 'flex-end',
  },
  distanceBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryLight,
    backgroundColor: Colors.surface,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  address: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stars: { fontSize: 12, color: Colors.accent },
  ratingText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  reviewsText: { fontSize: 11, color: Colors.textMuted },
  hours: { fontSize: 12, color: Colors.textMuted },
  navBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginLeft: 'auto',
  },
  navBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  saveIcon: { fontSize: 18, color: Colors.textPrimary },
  savedIcon: { color: Colors.restaurant },
});
