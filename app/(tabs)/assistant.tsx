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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
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
  'What are the top attractions?',
  'Best local food & restaurants',
  '1-hour highlights tour',
  'Historical landmarks nearby',
];

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const context = useTravelStore(s => s.context);
  const toggleSaved = useTravelStore(s => s.toggleSaved);
  const savedPlaces = context?.savedPlaces ?? [];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: `Hi! I'm VOYA, your personal offline travel guide for ${context?.destination ?? 'your destination'}. I run completely on your device — ask me about places to visit, local cuisine, or recommended routes.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  function handleClearChat() {
    setMessages([
      {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: `Chat cleared. How can I help you explore ${context?.destination ?? 'your destination'} today?`,
      },
    ]);
  }

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
        text: 'Something went wrong while looking that up. Please try again.',
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header with notch padding */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top > 0 ? insets.top + 8 : 16,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Travel Assistant</Text>
          {context && (
            <Text style={styles.headerSub}>{context.destination} · Offline intelligence</Text>
          )}
        </View>

        <View style={styles.headerRight}>
          <View style={styles.offlineBadge}>
            <MaterialIcons name="cloud-off" size={13} color={Colors.primary} />
            <Text style={styles.offlineBadgeText}>Offline</Text>
          </View>
          {messages.length > 1 && (
            <TouchableOpacity
              onPress={handleClearChat}
              style={styles.clearChatBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="delete-outline" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Message List */}
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
                  {item.result.intent !== 'off_topic' && item.result.intent && (
                    <View style={styles.intentBadge}>
                      <MaterialIcons name="auto-awesome" size={11} color={Colors.primary} />
                      <Text style={styles.intentText}>
                        {item.result.intent}
                        {item.result.category ? ` · ${item.result.category}` : ''}
                      </Text>
                    </View>
                  )}
                  {item.result.intent === 'off_topic' && (
                    <View style={[styles.intentBadge, styles.offTopicBadge]}>
                      <MaterialIcons name="info-outline" size={11} color={Colors.error} />
                      <Text style={[styles.intentText, styles.offTopicText]}>
                        Outside travel scope
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Suggested Questions */}
            {item.role === 'assistant' &&
              item.result?.suggestedQuestions &&
              item.result.suggestedQuestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsHeader}>You might also ask:</Text>
                  <View style={styles.suggestionsList}>
                    {item.result.suggestedQuestions.map((q: string, idx: number) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionChip}
                        onPress={() => handleSend(q)}
                        activeOpacity={0.7}
                        disabled={isLoading}
                      >
                        <Text style={styles.suggestionText}>{q}</Text>
                        <MaterialIcons name="arrow-forward" size={13} color={Colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

            {/* Place Results */}
            {item.places && item.places.length > 0 && (
              <View style={styles.placesContainer}>
                <Text style={styles.placesHeader}>Places from your offline guide:</Text>
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
              <Text style={styles.loadingText}>Looking that up in your guide…</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Prompt Chips */}
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
              <MaterialIcons name="lightbulb-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.chipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
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
          <MaterialIcons name="arrow-upward" size={20} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerLeft: {},
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  offlineBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  clearChatBtn: {
    padding: 4,
  },

  messageList: { padding: 16, paddingBottom: 8 },
  bubbleContainer: {
    marginVertical: 6,
    width: '100%',
  },
  userContainer: { alignItems: 'flex-end' },
  asstContainer: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 12,
  },
  asstBubble: {
    backgroundColor: Colors.surface,
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
  bubbleText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  userText: { color: Colors.textInverse },
  placesContainer: {
    width: '100%',
    marginTop: 8,
  },
  placesHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
    paddingLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  offTopicBadge: {
    backgroundColor: '#FEF2F2',
  },
  offTopicText: {
    color: Colors.error,
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: 10,
    paddingLeft: 2,
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
  },
  suggestionsList: {
    gap: 6,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  intentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  intentText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  loadingText: { fontSize: 13, color: Colors.textSecondary },
  quickPromptsContainer: {
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chipsScroll: { paddingHorizontal: 12, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 22,
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
    opacity: 0.35,
  },
});
