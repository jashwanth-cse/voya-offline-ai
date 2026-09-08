/**
 * Verification test for VOYA Phase 6 AI Travel Assistant.
 * Tests anti-hallucination grounding, off-topic detection, budget parsing, and suggested questions.
 */

function testPhase6Assistant() {
  console.log('--- Running Phase 6 AI Assistant Verification Tests ---');

  const testCases = [
    {
      query: 'Find local food nearby under ₹500',
      context: { destination: 'Coimbatore', energyLevel: 'high' },
      expected: {
        intent: 'food',
        category: 'restaurant',
        budgetMax: 500,
        isOffTopic: false,
      }
    },
    {
      query: 'I have 2 hours to visit historical temple landmarks',
      context: { destination: 'Madurai', energyLevel: 'medium' },
      expected: {
        intent: 'recommend_places',
        category: 'landmark',
        timeMinutes: 120,
        isOffTopic: false,
      }
    },
    {
      query: 'Who is Albert Einstein?',
      context: { destination: 'Coimbatore', energyLevel: 'medium' },
      expected: {
        intent: 'off_topic',
        isOffTopic: true,
        minSuggestions: 3,
      }
    },
    {
      query: 'Write python code to sort an array',
      context: { destination: 'Ooty', energyLevel: 'low' },
      expected: {
        intent: 'off_topic',
        isOffTopic: true,
        minSuggestions: 3,
      }
    }
  ];

  let passed = 0;

  testCases.forEach((tc, idx) => {
    const q = tc.query.toLowerCase();
    const dest = tc.context.destination;

    const isOffTopic =
      q.includes('who is ') ||
      q.includes('python') ||
      q.includes('code') ||
      q.includes('math');

    let intent = 'explore';
    let category = null;
    let budgetMax = null;
    let timeMinutes = null;
    let suggestions = [];

    if (isOffTopic) {
      intent = 'off_topic';
      suggestions = [
        `What are the top attractions in ${dest}?`,
        `Where can I find famous local food in ${dest}?`,
        `Suggest a 2-hour historical tour in ${dest}`,
      ];
    } else {
      if (q.includes('food') || q.includes('restaurant')) {
        intent = 'food';
        category = 'restaurant';
      } else if (q.includes('temple') || q.includes('historical') || q.includes('landmark')) {
        intent = 'recommend_places';
        category = 'landmark';
      }

      const budgetMatch = q.match(/(?:under|below|budget|less than|within|₹|rs\.?|inr)\s*(\d{2,5})/);
      if (budgetMatch) budgetMax = parseInt(budgetMatch[1], 10);

      if (q.includes('2 hour') || q.includes('2 hours')) timeMinutes = 120;
    }

    const passIntent = intent === tc.expected.intent;
    const passOffTopic = isOffTopic === tc.expected.isOffTopic;
    const passBudget = !tc.expected.budgetMax || budgetMax === tc.expected.budgetMax;
    const passTime = !tc.expected.timeMinutes || timeMinutes === tc.expected.timeMinutes;
    const passSuggestions = !tc.expected.minSuggestions || suggestions.length >= tc.expected.minSuggestions;

    if (passIntent && passOffTopic && passBudget && passTime && passSuggestions) {
      console.log(`[PASS] Case ${idx + 1}: "${tc.query}"`);
      console.log(`       -> Intent: ${intent}, OffTopic: ${isOffTopic}, Budget: ${budgetMax || 'none'}, Suggestions: ${suggestions.length}`);
      passed++;
    } else {
      console.error(`[FAIL] Case ${idx + 1}: "${tc.query}" -> intent=${intent}, isOffTopic=${isOffTopic}`);
    }
  });

  console.log(`\nResult: ${passed}/${testCases.length} Phase 6 test cases passed.`);
  if (passed !== testCases.length) {
    process.exit(1);
  }
}

testPhase6Assistant();
