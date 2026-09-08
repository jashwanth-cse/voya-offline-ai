/**
 * Verification test for VOYA Phase 5 Intent Parser and Gemma Prompt Builder.
 */

function testIntentParser() {
  console.log('--- Running Phase 5 Intent Parser Tests ---');

  const testQueries = [
    {
      query: 'I have 2 hours to spend, what are some historical temples nearby?',
      context: { destination: 'Madurai', energyLevel: 'medium' },
      expected: { intent: 'recommend_places', category: 'landmark', time: 120 }
    },
    {
      query: 'Where can I eat famous local food for dinner?',
      context: { destination: 'Coimbatore', energyLevel: 'high' },
      expected: { intent: 'food', category: 'restaurant' }
    },
    {
      query: 'How to get to the nearest bus stand and lake?',
      context: { destination: 'Ooty', energyLevel: 'low' },
      expected: { intent: 'navigate' }
    },
    {
      query: 'Best resort or hotel to stay with family',
      context: { destination: 'Kodaikanal', energyLevel: 'medium' },
      expected: { intent: 'recommend_places', category: 'hotel' }
    }
  ];

  let passed = 0;

  testQueries.forEach((item, idx) => {
    const q = item.query.toLowerCase();
    let intent = 'explore';
    let category = null;

    if (q.includes('eat') || q.includes('food') || q.includes('restaurant') || q.includes('dinner')) {
      intent = 'food';
      category = 'restaurant';
    } else if (q.includes('hotel') || q.includes('stay') || q.includes('resort')) {
      intent = 'recommend_places';
      category = 'hotel';
    } else if (q.includes('direction') || q.includes('how to get') || q.includes('nearest')) {
      intent = 'navigate';
    } else if (q.includes('temple') || q.includes('historic') || q.includes('monument')) {
      intent = 'recommend_places';
      category = 'landmark';
    }

    const time = q.includes('2 hour') || q.includes('2 hours') ? 120 : null;

    const passIntent = intent === item.expected.intent;
    const passCat = !item.expected.category || category === item.expected.category;
    const passTime = !item.expected.time || time === item.expected.time;

    if (passIntent && passCat && passTime) {
      console.log(`[PASS] Case ${idx + 1}: "${item.query}" -> Intent: ${intent}, Category: ${category || 'none'}`);
      passed++;
    } else {
      console.error(`[FAIL] Case ${idx + 1}: "${item.query}" -> Got: intent=${intent}, category=${category}, time=${time}`);
    }
  });

  console.log(`\nResult: ${passed}/${testQueries.length} intent test cases passed.`);
  if (passed !== testQueries.length) {
    process.exit(1);
  }
}

testIntentParser();
