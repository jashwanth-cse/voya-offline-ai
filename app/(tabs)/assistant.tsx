import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useTravelStore } from '@/stores/travelStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const MOCK_RESPONSE =
  'AI travel assistance connects in Phase 5 when Gemma is integrated. ' +
  'For now, explore the destination using the Explore tab. ' +
  "Your trip context is active — I can see you're visiting " +
  "this destination and I'm ready to help when my model loads!";

export default function AssistantScreen() {
  const context = useTravelStore(s => s.context);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: `Hi! I'm VOYA, your offline AI travel companion. I'm ready to help you explore ${context?.destination ?? 'your destination'}. (Gemma integration coming in Phase 5.)`,
    },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    const asstMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: MOCK_RESPONSE,
    };

    setMessages(prev => [...prev, userMsg, asstMsg]);
    setInput('');

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
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
            📍 {context.destination} · ⚡ {context.energyLevel ?? 'medium'} energy
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
            style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.asstBubble]}
          >
            <Text style={[styles.bubbleText, item.role === 'user' && styles.userText]}>
              {item.text}
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

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
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} activeOpacity={0.8}>
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
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
  },
  asstBubble: { backgroundColor: Colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  userBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  userText: { color: Colors.textPrimary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
  sendIcon: { fontSize: 18, color: Colors.textPrimary, fontWeight: '700' },
});
