import { memoryService } from '../services/memoryService';
import { getDatabase } from '../database';

const testUserId = 'test-user-' + Date.now();
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== User Understanding & Personalization Tests ===\n');

  console.log('TEST 1: Explicit memory storage with sourceType');
  const mem = memoryService.createMemory({
    concept: 'Favorite programming language',
    category: 'preference',
    content: 'My favorite programming language is Python.',
    confidence: 0.98,
    importance: 0.85,
    tags: ['user-preference', 'real-time'],
    sourceType: 'explicit',
    evidenceCount: 1,
    userId: testUserId,
  });
  assert(mem.sourceType === 'explicit', 'sourceType is "explicit"');
  assert(mem.evidenceCount === 1, 'evidenceCount is 1');
  assert(mem.confidence === 0.98, 'confidence is 0.98');

  const retrieved = memoryService.getMemory(mem.id, testUserId);
  assert(retrieved?.sourceType === 'explicit', 'retrieved sourceType is "explicit"');
  assert(retrieved?.evidenceCount === 1, 'retrieved evidenceCount is 1');
  assert(retrieved?.content === 'My favorite programming language is Python.', 'content matches');
  console.log('');

  console.log('TEST 2: Communication style inference and reinforcement');
  memoryService.detectCommunicationStyle('Can you break this down for me?', 'conv-1', testUserId);
  let profile = memoryService.getUserUnderstandingProfile(testUserId);
  const commStyleCount1 = profile.communicationStyle.length;
  assert(commStyleCount1 === 1, `One communication style memory created (got ${commStyleCount1})`);
  const firstStyle = profile.communicationStyle[0];
  assert(firstStyle.sourceType === 'inferred', 'sourceType is "inferred"');
  assert(firstStyle.evidenceCount === 1, 'evidenceCount is 1 on first detection');
  assert(firstStyle.confidence === 0.5, 'initial confidence is 0.5');
  assert(firstStyle.tags.includes('communication_style'), 'includes communication_style tag');
  assert(firstStyle.tags.includes('beginner_friendly'), 'includes beginner_friendly tag');

  memoryService.detectCommunicationStyle('Explain it simply', 'conv-2', testUserId);
  profile = memoryService.getUserUnderstandingProfile(testUserId);
  const commStyleCount2 = profile.communicationStyle.length;
  assert(commStyleCount2 === 1, `Same communication style memory reinforced, not duplicated (got ${commStyleCount2})`);
  const reinforced = profile.communicationStyle[0];
  assert(reinforced.evidenceCount === 2, `evidenceCount increased to 2 (got ${reinforced.evidenceCount})`);
  assert(reinforced.confidence > 0.5, `confidence increased above 0.5 (got ${reinforced.confidence})`);
  console.log('');

  console.log('TEST 3: Contradiction handling');
  memoryService.createMemory({
    concept: 'Preference: Python',
    category: 'preference',
    content: 'I prefer Python.',
    confidence: 0.95,
    importance: 0.7,
    tags: ['user-preference'],
    sourceType: 'explicit',
    evidenceCount: 1,
    userId: testUserId,
  });

  const beforeCount = memoryService.getAllMemories(testUserId).length;
  memoryService.extractMemories('I prefer JavaScript now.', 'conv-3', testUserId);
  const afterCount = memoryService.getAllMemories(testUserId).length;

  const allMems = memoryService.getAllMemories(testUserId);
  const jsPref = allMems.find((m) => m.content.toLowerCase().includes('javascript'));
  assert(jsPref !== undefined, 'JavaScript preference found after contradiction');
  console.log('');

  console.log('TEST 4: Cross-conversation memory retrieval');
  memoryService.createMemory({
    concept: 'Project Context',
    category: 'project',
    content: 'User is building: an AI assistant.',
    confidence: 0.95,
    importance: 0.9,
    tags: ['project', 'context'],
    sourceType: 'explicit',
    evidenceCount: 1,
    userId: testUserId,
  });

  const context = memoryService.buildMemoryContext('Do you remember the AI assistant I am building?', testUserId);
  assert(context.memories.some((m) => m.content.includes('AI assistant')), 'AI assistant project found in memory context');
  assert(context.personalizationContext !== undefined, 'Personalization context present');
  console.log('');

  console.log('TEST 5: False inference prevention');
  const falseInferences = memoryService.extractMemories('Python is annoying today.', 'conv-4', testUserId);
  assert(falseInferences.length === 0, 'No memory created from temporary frustration');
  assert(memoryService.detectCommunicationStyle('Python is annoying today.', 'conv-4', testUserId).length === 0, 'No communication style inferred from frustration');
  console.log('');

  console.log('TEST 6: Persistence (in-memory)');
  const beforeClear = memoryService.getAllMemories(testUserId).length;
  assert(beforeClear > 0, `Memories exist before any operations (${beforeClear} found)`);
  const reRetrieved = memoryService.getAllMemories(testUserId);
  assert(reRetrieved.length === beforeClear, 'Same number of memories retrievable');
  console.log('');

  console.log('TEST 7: Delete removes memory');
  const toDelete = memoryService.createMemory({
    concept: 'Delete me',
    category: 'fact',
    content: 'This should be deleted.',
    confidence: 0.95,
    importance: 0.8,
    tags: ['test'],
    sourceType: 'explicit',
    userId: testUserId,
  });
  memoryService.deleteMemory(toDelete.id, testUserId);
  const afterDelete = memoryService.getAllMemories(testUserId);
  assert(!afterDelete.find((m) => m.id === toDelete.id), 'Deleted memory not found');
  console.log('');

  console.log('TEST 8: Identity preservation (not overwritten by memories)');
  const { AI_IDENTITY } = await import('../ai/identity');
  assert(AI_IDENTITY.name === 'DOTVEX', 'DOTVEX identity name preserved');
  assert(AI_IDENTITY.creator.includes('Dotman'), 'Creator identity preserved');
  console.log('');

  console.log('TEST 9: Personalization context affects Qwen3 prompt');
  const personalization = memoryService.buildPersonalizationContext('What programming language do I prefer?', testUserId);
  assert(personalization.contextText.includes('Python'), 'Personalization context mentions Python');
  assert(personalization.contextText.includes('USER PERSONALIZATION PROFILE'), 'Context labeled as personalization profile');
  assert(personalization.relevantMemories.length > 0, 'Relevant memories found for query');
  assert(personalization.relevantMemories.every((m) => m.category === 'preference' || m.category === 'project'), 'All returned memories are preference or project type');
  console.log('');

  console.log('TEST: Communication style semantic matching');
  memoryService.detectCommunicationStyle('Can you break this down for me?', 'conv-5', testUserId);
  const personalization2 = memoryService.buildPersonalizationContext('Can you break this down?', testUserId);
  const hasStyleMatch = personalization2.contextText.includes('simple explanations') ||
    personalization2.contextText.includes('beginner-friendly') ||
    personalization2.contextText.includes('Communication');
  assert(hasStyleMatch, 'Communication style preference surfaced in personalization context for "break this down"');
  console.log('');

  console.log('TEST: Evidence-based confidence accumulation');
  let conf = 0.5;
  conf = memoryService.accumulateConfidence(conf, 1, 'inferred');
  assert(conf > 0.5, `Confidence increases with evidence (got ${conf.toFixed(3)})`);
  conf = memoryService.accumulateConfidence(conf, 5, 'inferred');
  assert(conf > 0.55, `Confidence continues to grow with evidence, but with diminishing returns (got ${conf.toFixed(3)})`);
  conf = memoryService.accumulateConfidence(conf, 50, 'explicit');
  assert(conf < 0.98, `Confidence never reaches 1.0 (got ${conf.toFixed(3)})`);
  console.log('');

  console.log('TEST: Staleness factor');
  assert(memoryService.stalenessFactor(Date.now()) === 1.0, 'Recent memory: staleness = 1.0');
  assert(memoryService.stalenessFactor(Date.now() - 365 * 24 * 60 * 60 * 1000) === 0.3, 'Year-old memory: staleness = 0.3');
  console.log('');

  console.log('TEST: Different communication styles do not merge');
  memoryService.clearAllMemories(testUserId);
  memoryService.detectCommunicationStyle('Explain simply', 'conv-6', testUserId);
  memoryService.detectCommunicationStyle('Give me an example', 'conv-7', testUserId);
  const profile3 = memoryService.getUserUnderstandingProfile(testUserId);
  assert(profile3.communicationStyle.length === 2, `Two distinct communication styles (got ${profile3.communicationStyle.length})`);
  const concepts = profile3.communicationStyle.map((m) => m.concept);
  assert(concepts.includes('Communication: Prefers simple explanations'), 'Simple explanations style present');
  assert(concepts.includes('Communication: Prefers examples and code'), 'Examples style present');
  console.log('');

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});