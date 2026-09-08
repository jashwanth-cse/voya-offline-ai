import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PlaceCard } from '@/components/place/PlaceCard';
import { queryPlacesByConstraints } from '@/services/database';
import { processTravelQuery, type TravelQueryResult } from '@/services/nativeIntelligence';
import { rankPlaces, type RankedPlace } from '@/services/recommendationEngine';
import { useTravelStore } from '@/stores/travelStore';
import type { Place, PlaceCategory } from '@/types/travel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  result?: TravelQueryResult;
  places?: RankedPlace[];
}

const QUICK_PROMPTS = [
  'What should I visit here?',
  'Best local food & restaurants',
  '1 hour quick highlights tour',
  'Historical landmarks nearby',
];

export default function AssistantScreen() {
  const context = useTravelStore(s => s.context);
  const toggleSaved = useTravelStore(s => s.toggleSaved);
  const savedPlaces = context?.savedPlaces ?? [];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: `Hi! I'm VOYA, your on-device AI travel companion. I run completely offline using local intelligence. Ask me anything about ${context?.destination ?? 'your destination'}!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  async function handleSend(textToSend?: string) {
    const query = (textToSend ?? input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const result = await processTravelQuery(query, context);

      // Fetch matching places from local destination database using multi-constraint engine
      let matchedPlaces: RankedPlace[] = [];
      const cat = (result.category as PlaceCategory) || undefined;

      if (result.intent !== 'off_topic') {
        try {
          const rawMatches = await queryPlacesByConstraints({
            destinationId: context?.destination,
            category: cat,
            budgetMax: result.budgetMax,
            timeAvailableMinutes: result.timeAvailableMinutes,
            energyLevel: result.energyLevel || context?.energyLevel,
            distancePreference: result.distancePreference,
            userLat: context?.currentLatitude,
            userLon: context?.currentLongitude,
            limit: 6,
          });

          // Score and rank using deterministic recommendation engine
          matchedPlaces = rankPlaces(rawMatches, {
            userLat: context?.currentLatitude,
            userLon: context?.currentLongitude,
            energyLevel: result.energyLevel || context?.energyLevel,
            timeAvailableMinutes: result.timeAvailableMinutes,
            budgetMax: result.budgetMax,
            preferences: result.parsedIntent?.preferences,
            visitedPlaces: context?.visitedPlaces,
            limit: 3,
          });
        } catch {
          matchedPlaces = [];
        }
      }

      const asstMsg: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: result.reply || result.rawResponse,
        result,
        places: matchedPlaces.length > 0 ? matchedPlaces : undefined,
      };
      setMessages(prev => [...prev, asstMsg]);
    } catch {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: 'Sorry, I encountered an issue processing your query offline. Please try again.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function toggleSave(placeId: string) {
    toggleSaved(placeId);
  }

  function openMap(place: Place) {
    if (place.googleMapsUrl) {
      Linking.openURL(place.googleMapsUrl);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${place.name} ${place.address ?? ''}`
      )}`;
      Linking.openURL(url);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScreenHeader title="Travel Assistant" />

      {/* Context summary */}
      {context && (
        <View style={styles.contextBar}>
          <Text style={styles.contextText}>
            📍 {context.destination} · ⚡ {context.energyLevel ?? 'medium'} energy · 🔋 Offline
            Engine
          </Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubbleContainer,
              item.role === 'user' ? styles.userContainer : styles.asstContainer,
            ]}
          >
            <View
              style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.asstBubble]}
            >
              <Text style={[styles.bubbleText, item.role === 'user' && styles.userText]}>
                {item.text}
              </Text>

              {item.role === 'assistant' && item.result && (
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.intentBadge,
                      item.result.intent === 'off_topic' && styles.offTopicBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.intentText,
                        item.result.intent === 'off_topic' && styles.offTopicText,
                      ]}
                    >
                      {item.result.intent === 'off_topic'
                        ? '🛡️ Destination Guide Scope'
                        : `🏷️ ${item.result.intent}${item.result.category ? ` · ${item.result.category}` : ''}`}
                    </Text>
                  </View>
                  <View style={styles.latencyPill}>
                    <Text style={styles.latencyText}>
                      ⚡ {Math.round(item.result.latencyMs)}ms ·{' '}
                      {item.result.modelUsed ?? 'Offline'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Smart Suggested Question Chips */}
            {item.role === 'assistant' &&
              item.result?.suggestedQuestions &&
              item.result.suggestedQuestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsHeader}>💡 Suggested for you:</Text>
                  <View style={styles.suggestionsList}>
                    {item.result.suggestedQuestions.map((q: string, idx: number) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionChip}
                        onPress={() => handleSend(q)}
                        activeOpacity={0.7}
                        disabled={isLoading}
                      >
                        <Text style={styles.suggestionText}>{q} →</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

            {/* Embedded Recommended Places from Local Database */}
            {item.places && item.places.length > 0 && (
              <View style={styles.placesContainer}>
                <Text style={styles.placesHeader}>Recommended from your offline guide:</Text>
                {item.places.map((place: RankedPlace) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    distanceKm={place.distanceKm}
                    matchScore={place.matchScore}
                    matchReasons={place.matchReasons}
                    isSaved={savedPlaces.includes(place.id)}
                    onSave={() => toggleSave(place.id)}
                    onPress={() => openMap(place)}
                  />
                ))}
              </View>
            )}
          </View>
        )}
        ListFooterComponent={
          isLoading ? (
            <View style={[styles.bubble, styles.asstBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Thinking offline…</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Prompts */}
      <View style={styles.quickPromptsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {QUICK_PROMPTS.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chip}
              onPress={() => handleSend(prompt)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={styles.chipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about places, food, directions…"
          placeholderTextColor={Colors.textMuted}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          activeOpacity={0.8}
          disabled={!input.trim() || isLoading}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contextBar: {
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contextText: { fontSize: 12, color: Colors.textSecondary },
  messageList: { padding: 16, paddingBottom: 8 },
  bubbleContainer: {
    marginVertical: 6,
    width: '100%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  asstContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
  },
  asstBubble: {
    backgroundColor: Colors.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  userText: { color: Colors.textPrimary },
  placesContainer: {
    width: '100%',
    marginTop: 8,
    paddingLeft: 4,
  },
  placesHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  offTopicBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  offTopicText: {
    color: '#ef4444',
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: 8,
    paddingLeft: 4,
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 6,
  },
  suggestionsList: {
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  intentBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  intentText: { fontSize: 11, color: Colors.accent, fontWeight: '600' },
  latencyPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  latencyText: { fontSize: 11, color: '#f59e0b', fontWeight: '500' },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  loadingText: { fontSize: 13, color: Colors.textMuted },
  quickPromptsContainer: {
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chipsScroll: { paddingHorizontal: 12, gap: 8 },
  chip: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { fontSize: 12, color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendIcon: { fontSize: 18, color: Colors.textPrimary, fontWeight: '700' },
});
