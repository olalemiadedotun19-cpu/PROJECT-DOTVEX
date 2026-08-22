import { MemoryRepository, DbMemory } from '../repositories/memoryRepository';
import { MemoryItem, MemoryCategory, MemoryLifespan, MemorySourceType, UserUnderstandingProfile } from '../../src/types/memory';
import { AI_IDENTITY } from '../ai/identity';
import { config } from '../config';

export interface MemoryContext {
  memories: MemoryItem[];
  contextText: string;
  personalizationContext?: PersonalizationContext;
}

export interface PersonalizationContext {
  contextText: string;
  relevantMemories: MemoryItem[];
}

interface ExtractionPattern {
  pattern: RegExp;
  category: MemoryCategory;
  confidence: number;
  importance: number;
  lifespan: MemoryLifespan;
  extractConcept: (match: RegExpMatchArray, text: string) => string;
  extractContent: (match: RegExpMatchArray, text: string) => string;
  tags: string[];
  isTentative: boolean;
  sourceType?: MemorySourceType;
  isCommunicationStyle?: boolean;
}

interface MemoryCommand {
  pattern: RegExp;
  handler: (match: RegExpMatchArray, message: string, userId: string) => { memories: MemoryItem[]; message: string };
}

interface CommunicationStylePattern {
  keywords: string[];
  concept: string;
  content: string;
  tags: string[];
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z0-9']*/g) || [];
}

export class MemoryService {
  private repo = new MemoryRepository();
  private readonly maxRetrievalLimit: number;
  private extractionPatterns: ExtractionPattern[];
  private memoryCommands: MemoryCommand[];
  private tfidfCache: Map<string, { tokens: string[]; tf: Map<string, number> }> = new Map();
  private idfCache: Map<string, number> | null = null;
  private corpusSnapshot: string[] = [];
  private static readonly COMMUNICATION_STYLE_PATTERNS: CommunicationStylePattern[] = [
    {
      keywords: ['explain simply', 'break this down', 'break it down', 'keep it simple', 'make it simple', 'don\'t make it too technical', 'in simple terms', 'simple explanation', 'simpler', 'explain it simply', 'simplify'],
      concept: 'Communication: Prefers simple explanations',
      content: 'User prefers simple, beginner-friendly explanations. Avoid complex jargon; use plain language and analogies.',
      tags: ['communication_style', 'beginner_friendly', 'simple_explanations'],
    },
    {
      keywords: ['step by step', 'step-by-step', 'show me the steps', 'walk me through', 'in steps', 'numbered steps'],
      concept: 'Communication: Prefers step-by-step instructions',
      content: 'User prefers step-by-step instructions. Break complex tasks into clear numbered steps.',
      tags: ['communication_style', 'step_by_step'],
    },
    {
      keywords: ['just give me', 'skip the explanation', 'directly', 'in short', 'tldr', 'summary only', 'no explanation', 'just the answer', 'straight to the point'],
      concept: 'Communication: Prefers direct concise responses',
      content: 'User prefers direct, concise responses without lengthy explanations. Provide the answer first.',
      tags: ['communication_style', 'direct', 'concise'],
    },
    {
      keywords: ['explain everything', 'in detail', 'deep dive', 'thoroughly', 'comprehensive', 'explain it all', 'fully explain'],
      concept: 'Communication: Prefers detailed explanations',
      content: 'User prefers detailed, comprehensive explanations. Include thorough background and reasoning.',
      tags: ['communication_style', 'detailed', 'comprehensive'],
    },
    {
      keywords: ['give me an example', 'show me an example', 'give me the code', 'give me the exact', 'demonstrate', 'show me how', 'example please'],
      concept: 'Communication: Prefers examples and code',
      content: 'User prefers examples and code snippets. Illustrate concepts with practical demonstrations.',
      tags: ['communication_style', 'examples', 'practical'],
    },
    {
      keywords: ['math', 'prove it', 'verify', 'mathematically', 'rigorous', 'formula'],
      concept: 'Communication: Prefers mathematical rigor',
      content: 'User appreciates mathematical rigor and proofs. Include formulas and formal reasoning when relevant.',
      tags: ['communication_style', 'mathematical', 'rigorous'],
    },
  ];

  constructor(maxRetrievalLimit?: number) {
    this.maxRetrievalLimit = maxRetrievalLimit ?? config.memoryRetrievalLimit;

    this.extractionPatterns = [
      {
        pattern: /\b(i actually (like|prefer)|i (now|currently) (like|prefer))\s+(.+?)(?:\.|\s*$)/i,
        category: 'preference',
        confidence: 0.95,
        importance: 0.7,
        lifespan: 'long_term',
        extractConcept: (match) => match[4]?.trim().slice(0, 60),
        extractContent: (match) => match[0].trim(),
        tags: ['update', 'real-time'],
        isTentative: false,
        sourceType: 'explicit',
      },
      {
        pattern: /\b(i prefer|i like|always use)\s+(.+?)(?:\.|\s*$)/i,
        category: 'preference',
        confidence: 0.95,
        importance: 0.7,
        lifespan: 'long_term',
        extractConcept: (match) => `Preference: ${match[2]?.trim().slice(0, 60)}`,
        extractContent: (match) => match[0].trim(),
        tags: ['user-preference', 'real-time'],
        isTentative: false,
        sourceType: 'explicit',
      },
      {
        pattern: /\b(my favorite)\s+(.+?)(?:\.|\s*$)/i,
        category: 'preference',
        confidence: 0.95,
        importance: 0.7,
        lifespan: 'long_term',
        extractConcept: (match) => `Favorite: ${match[2]?.trim().slice(0, 60)}`,
        extractContent: (match) => match[0].trim(),
        tags: ['user-preference', 'real-time'],
        isTentative: false,
        sourceType: 'explicit',
      },
      {
        pattern: /\b(i don't like|i hate|i dislike|i'm not fond of)\s+(.+?)(?:\.|\s*$)/i,
        category: 'preference',
        confidence: 0.95,
        importance: 0.6,
        lifespan: 'long_term',
        extractConcept: (match) => `Dislike: ${match[2]?.trim().slice(0, 60)}`,
        extractContent: (match) => match[0].trim(),
        tags: ['preference', 'negation'],
        isTentative: false,
        sourceType: 'explicit',
      },
      {
        pattern: /\b(i am (working on|building|a))\s+(.+?)(?:\.|\s*$)/i,
        category: 'project',
        confidence: 0.98,
        importance: 0.9,
        lifespan: 'long_term',
        extractConcept: (match) => 'Project Context',
        extractContent: (match) => match[0].trim(),
        tags: ['project', 'context'],
        isTentative: false,
        sourceType: 'explicit',
      },
      {
        pattern: /\b(my name is|i'm called|i'm named|call me|people call me|everyone calls me)\s+(.+?)(?:\.|\s*$)/i,
        category: 'fact',
        confidence: 0.98,
        importance: 0.85,
        lifespan: 'permanent',
        extractConcept: (match) => 'User Identity',
        extractContent: (match) => match[0].trim(),
        tags: ['profile', 'identity'],
        isTentative: false,
        sourceType: 'explicit',
      },
      {
        pattern: /\b(my goal is|i want to|i aim to|dream of|aspire to)\s+(.+?)(?:\.|\s*$)/i,
        category: 'instruction',
        confidence: 0.9,
        importance: 0.8,
        lifespan: 'long_term',
        extractConcept: (match) => `Goal: ${match[2]?.trim().slice(0, 60)}`,
        extractContent: (match) => match[0].trim(),
        tags: ['goal', 'aspiration'],
        isTentative: false,
        sourceType: 'explicit',
      },
      {
        pattern: /\b(remember that|from now on|always|never)\s+(.+?)(?:\.|\s*$)/i,
        category: 'instruction',
        confidence: 0.99,
        importance: 0.9,
        lifespan: 'permanent',
        extractConcept: (match) => match[2]?.trim().slice(0, 60),
        extractContent: (match) => match[0].trim(),
        tags: ['instruction', 'real-time'],
        isTentative: false,
        sourceType: 'explicit',
      },
      {
        pattern: /\b(i might|i could|i may|maybe|perhaps|might|possibly|probably will)\s+(.+?)(?:\.|\s*$)/i,
        category: 'fact',
        confidence: 0.3,
        importance: 0.2,
        lifespan: 'temporary',
        extractConcept: (match) => `Possibility: ${match[2]?.trim().slice(0, 60)}`,
        extractContent: (match) => match[0].trim(),
        tags: ['tentative'],
        isTentative: true,
        sourceType: 'inferred',
      },
    ];

    this.memoryCommands = [
      {
        pattern: /\b(what do you remember about me|what do you recall about me|do you remember anything about me|show me what you know about me)\b/i,
        handler: (_match, _message, userId) => {
          const memories = this.getAllMemories(userId);
          const grouped: Record<string, MemoryItem[]> = {};
          for (const mem of memories) {
            if (!grouped[mem.category]) grouped[mem.category] = [];
            grouped[mem.category].push(mem);
          }
          const lines: string[] = [];
          for (const [cat, mems] of Object.entries(grouped)) {
            lines.push(`\n${cat.toUpperCase()}:`);
            for (const m of mems) {
              lines.push(`  - ${m.content}`);
            }
          }
          const text = lines.length > 0
            ? `Here's what I remember about you:${lines.join('')}`
            : "I don't have any memories stored about you yet.";
          return { memories, message: text };
        },
      },
      {
        pattern: /\b(what do you remember|show me your memories|show me what you remember|what have you learned about me|tell me what you know)\b/i,
        handler: (_match, _message, userId) => {
          const memories = this.getAllMemories(userId);
          const lines = memories.map((m) => `  - [${m.category}] ${m.content}`);
          const text = memories.length > 0
            ? `Here's what I've remembered:\n${lines.join('\n')}`
            : "I haven't stored any memories yet.";
          return { memories, message: text };
        },
      },
      {
        pattern: /\b(forget|delete|remove|stop remembering)\b/i,
        handler: (_match, message, userId) => {
          const lower = message.toLowerCase();

          if (lower.includes('everything') || lower.includes('all of them') || lower.includes('all my')) {
            const deleted = this.clearAllMemories(userId);
            return { memories: [], message: `I've forgotten everything I remembered (${deleted} memories cleared).` };
          }

          const contentMatch = message.match(/(?:forget|delete|remove|stop remembering)\s+(?:that\s+|about\s+)?(?:i\s+(?:prefer|like|have|am|used to)|my\s+)?(.+?)(?:\.|\s*$)/i);
          const content = contentMatch?.[1]?.trim();

          if (!content || content.length < 2) {
            return { memories: [], message: "I'm not sure what you'd like me to forget. Please be more specific." };
          }

          const all = this.repo.getAll(userId);
          const contentLower = content.toLowerCase();
          const contentWords = contentLower.split(/\s+/).filter((w) => w.length > 3);

          const existing = all.filter((m) => {
            const combined = `${m.concept} ${m.content}`.toLowerCase();
            return combined.includes(contentLower) ||
              contentWords.some((w) => combined.includes(w)) ||
              (m.tags || []).some((t) => contentLower.includes(t.toLowerCase()) || t.toLowerCase().includes(contentLower));
          });

          if (existing.length === 0) {
            return { memories: [], message: `I don't have a memory matching "${content}".` };
          }

          for (const mem of existing) {
            this.deleteMemory(mem.id, userId);
          }

          return {
            memories: existing.map((m) => this.repo.mapToMemoryItem(m)),
            message: `I've forgotten: ${existing.map((m) => `\""${m.content}"\``).join(', ')}`,
          };
        },
      },
    ];
  }

  handleMemoryCommands(message: string, userId: string = 'default'): { handled: boolean; response: string; memories: MemoryItem[] } {
    for (const cmd of this.memoryCommands) {
      const match = message.match(cmd.pattern);
      if (match) {
        const result = cmd.handler(match, message, userId);
        return { handled: true, response: result.message, memories: result.memories };
      }
    }
    return { handled: false, response: '', memories: [] };
  }

  getAllMemories(userId: string = 'default'): MemoryItem[] {
    const dbMemories = this.repo.getAll(userId);
    return dbMemories.map((m) => this.repo.mapToMemoryItem(m));
  }

  getStats(userId: string = 'default') {
    return this.repo.getStats(userId);
  }

  private buildTfidfCorpus(userId: string = 'default'): void {
    const all = this.repo.getAll(userId);
    this.corpusSnapshot = all.map((m) => `${m.concept} ${m.content}`);
    this.tfidfCache.clear();
    this.idfCache = null;
  }

  private getTf(doc: string): Map<string, number> {
    const cached = this.tfidfCache.get(doc);
    if (cached) return cached.tf;

    const tokens = tokenize(doc);
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) ?? 0) + 1);
    }
    for (const [token, count] of tf) {
      tf.set(token, count / tokens.length);
    }
    this.tfidfCache.set(doc, { tokens, tf });
    return tf;
  }

  private getIdf(userId: string = 'default'): Map<string, number> {
    if (this.idfCache) return this.idfCache;

    this.buildTfidfCorpus(userId);
    const docs = this.corpusSnapshot;
    const df = new Map<string, number>();

    for (const doc of docs) {
      const tokens = new Set(this.getTf(doc).keys());
      for (const token of tokens) {
        df.set(token, (df.get(token) ?? 0) + 1);
      }
    }

    const idf = new Map<string, number>();
    const N = docs.length;
    for (const [token, freq] of df) {
      idf.set(token, Math.log((N + 1) / (freq + 1)) + 1);
    }

    this.idfCache = idf;
    return idf;
  }

  private computeTfVector(text: string, idf: Map<string, number>): number[] {
    const tf = this.getTf(text);
    const vector: number[] = [];
    for (const [token, idfValue] of idf) {
      vector.push((tf.get(token) ?? 0) * idfValue);
    }
    return vector;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private semanticScore(query: string, memoryText: string, userId: string = 'default'): number {
    const idf = this.getIdf(userId);
    const queryVec = this.computeTfVector(query, idf);
    const memVec = this.computeTfVector(memoryText, idf);
    return this.cosineSimilarity(queryVec, memVec);
  }

   retrieveRelevantMemories(
    query: string,
    userId: string = 'default',
    limit: number = this.maxRetrievalLimit
  ): MemoryItem[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 3);
    const allMemories = this.repo.getAll(userId);

    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const communicationStyleTags = ['communication_style', 'beginner_friendly', 'simple_explanations', 'step_by_step', 'direct', 'concise', 'detailed', 'comprehensive', 'examples', 'practical'];
    const queryHasStyleSignal = queryWords.some((w) => communicationStyleTags.includes(w));

    const scored = allMemories.map((m) => {
      let keywordScore = 0;
      const conceptLower = m.concept.toLowerCase();
      const contentLower = m.content.toLowerCase();
      const tagsLower = (m.tags || []).map((t) => t.toLowerCase());

      if (conceptLower.includes(queryLower)) keywordScore += 3;
      if (contentLower.includes(queryLower)) keywordScore += 2;
      if (tagsLower.some((t) => queryLower.includes(t) || t.includes(queryLower))) keywordScore += 1;

      for (const word of queryWords) {
        if (conceptLower.includes(word)) keywordScore += 2;
        if (contentLower.includes(word)) keywordScore += 1;
      }

      if (queryHasStyleSignal) {
        const memHasStyleTag = (m.tags || []).some((t) => communicationStyleTags.includes(t));
        if (memHasStyleTag) keywordScore += 3;
      }

      const semanticScore = this.semanticScore(query, `${m.concept} ${m.content}`, userId);

      const importance = m.importance ?? 0.5;
      const importanceScore = importance * 0.5;

      const confidenceScore = m.confidence * 0.3;

      let recencyScore = 0;
      const ageHours = (Date.now() - m.updated_at) / (1000 * 3600);
      if (ageHours < 24) recencyScore = 0.5;
      else if (ageHours < 168) recencyScore = 0.3;
      else if (m.updated_at > cutoffTime) recencyScore = 0.1;

      const accessScore = Math.min((m.access_count || 0) / 10, 1) * 0.3;

      const sourceType = (m.metadata?.sourceType as MemorySourceType) ?? (m.source === 'user_message' ? 'explicit' : 'inferred');
      const sourceTypeBoost = sourceType === 'explicit' ? 0.2 : 0;

      const evidenceCount = (m.metadata?.evidenceCount as number) ?? 1;
      const evidenceScore = Math.min(evidenceCount / 10, 1) * 0.15;

      const staleness = this.stalenessFactor(m.updated_at);
      const stalenessPenalty = staleness < 1 ? (1 - staleness) * 0.5 : 0;

      const totalScore =
        keywordScore +
        semanticScore * 2 +
        importanceScore +
        confidenceScore +
        recencyScore +
        accessScore +
        sourceTypeBoost +
        evidenceScore -
        stalenessPenalty;

      return { memory: m, score: totalScore };
    });

    const relevant = scored
      .filter((s) => s.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    for (const { memory } of relevant) {
      this.repo.touch(memory.id, userId);
      this.repo.logEvent(memory.id, 'accessed', { query, score: memory.confidence });
    }

    return relevant.map((r) => this.repo.mapToMemoryItem(r.memory));
  }

   extractMemories(
    userMessage: string,
    conversationId?: string,
    userId: string = 'default'
  ): MemoryItem[] {
    const created: MemoryItem[] = [];
    const lower = userMessage.toLowerCase();

    if (this.isTemporaryStatement(lower)) {
      return created;
    }

    for (const pattern of this.extractionPatterns) {
      const match = userMessage.match(pattern.pattern);
      if (!match) continue;

      const concept = pattern.extractConcept(match, userMessage);
      const content = pattern.extractContent(match, userMessage);

      if (!concept || !content || content.trim().length === 0) continue;

      const existing = this.findSimilarMemory(concept, content, pattern.category, userId, pattern);

      if (existing) {
        const isContradiction = this.isContradictory(existing, content, pattern, lower);
        const isPastTense = this.isPastTense(lower);
        const isSameIntent = !isPastTense;

        if (isContradiction) {
          const existingSourceType = (existing.metadata?.sourceType as MemorySourceType) ?? 'inferred';
          const existingEvidence = (existing.metadata?.evidenceCount as number) ?? 1;

          this.repo.logEvent(existing.id, 'contradicted', {
            old_content: existing.content,
            new_content: content,
            conversation_id: conversationId,
            old_sourceType: existingSourceType,
          });
          this.repo.logEvent(existing.id, 'superseded', {
            old_content: existing.content,
            new_content: content,
            conversation_id: conversationId,
          });

          const metadataUpdate: Record<string, unknown> = {
            sourceType: pattern.sourceType ?? 'explicit',
            evidenceCount: existingEvidence + 1,
            lastConfirmedAt: Date.now(),
            lastContradictedAt: Date.now(),
          };

          this.repo.update(existing.id, {
            concept: concept,
            content: content,
            confidence: pattern.confidence,
            importance: pattern.importance,
            tags: [...new Set([...(existing.tags || []), ...pattern.tags])],
            source_conversation_id: conversationId,
            metadata: metadataUpdate,
          }, userId);
          this.repo.touch(existing.id, userId);
          this.repo.logEvent(existing.id, 'updated', { content, confidence: pattern.confidence, importance: pattern.importance });
          created.push(this.repo.mapToMemoryItem(this.repo.getById(existing.id, userId)!));
        } else if (isSameIntent && !existing.content.toLowerCase().includes(content.toLowerCase())) {
          const existingEvidence = (existing.metadata?.evidenceCount as number) ?? 1;
          const existingSourceType = (existing.metadata?.sourceType as MemorySourceType) ?? 'inferred';
          const newSourceType = pattern.sourceType ?? existingSourceType;
          const newEvidence = existingEvidence + 1;
          const newConfidence = this.accumulateConfidence(existing.confidence, newEvidence, newSourceType);

          this.repo.update(existing.id, {
            content: content,
            confidence: newConfidence,
            importance: Math.max(existing.importance ?? 0.5, pattern.importance),
            tags: [...new Set([...(existing.tags || []), ...pattern.tags])],
            source_conversation_id: conversationId,
            metadata: {
              sourceType: newSourceType,
              evidenceCount: newEvidence,
              lastConfirmedAt: Date.now(),
            },
          }, userId);
          this.repo.touch(existing.id, userId);
          this.repo.logEvent(existing.id, 'confirmed', { content, reason: 'reinforcement', evidenceCount: newEvidence, confidence: newConfidence });
          created.push(this.repo.mapToMemoryItem(this.repo.getById(existing.id, userId)!));
        } else {
          this.repo.touch(existing.id, userId);
          this.repo.logEvent(existing.id, 'accessed', { conversation_id: conversationId });
          created.push(this.repo.mapToMemoryItem(existing));
        }
      } else if (this.isPastTense(lower)) {
        const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const dbMemory = this.repo.create({
          id,
          concept: `Past: ${concept}`,
          category: pattern.category,
          content,
          confidence: Math.min(0.9, pattern.confidence),
          importance: pattern.importance * 0.4,
          lifespan: 'short_term',
          source: 'user_message',
          sourceConversationId: conversationId,
          tags: [...pattern.tags, 'historical'],
          userId,
          metadata: {
            sourceType: pattern.sourceType ?? 'inferred',
            evidenceCount: 1,
            lastConfirmedAt: Date.now(),
          },
        });
        this.repo.logEvent(id, 'created', { content, confidence: pattern.confidence, importance: pattern.importance, sourceType: pattern.sourceType ?? 'inferred' });
        created.push(this.repo.mapToMemoryItem(dbMemory));
      } else {
        const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const sourceType = pattern.sourceType ?? 'explicit';
        const dbMemory = this.repo.create({
          id,
          concept,
          category: pattern.category,
          content,
          confidence: pattern.confidence,
          importance: pattern.importance,
          lifespan: pattern.lifespan,
          source: 'user_message',
          sourceConversationId: conversationId,
          tags: [...new Set(pattern.tags)],
          userId,
          metadata: {
            sourceType,
            evidenceCount: 1,
            lastConfirmedAt: Date.now(),
          },
        });
        this.repo.logEvent(id, 'created', { content, confidence: pattern.confidence, importance: pattern.importance, sourceType, evidenceCount: 1 });
        created.push(this.repo.mapToMemoryItem(dbMemory));
      }
    }

    return created;
  }

  private isTemporaryStatement(lower: string): boolean {
    const temporaryPatterns = [
      /\b(i'm hungry|i'm tired|i'm sleepy|i'm bored|i'm thirsty|i'm sad|i'm happy|i'm excited)\b/,
      /\b(it's raining|it's sunny|it's cold|it's hot|it's nice out)\b/,
      /\b(i'll (go|probably go|maybe go|likely)|i'm going to)\s+(later|soon|today|tonight)\b/,
      /\b(i need to|have to|should)\s+(eat|sleep|rest|go)\b/,
      /\b(just wondering|random thought|btw|fyi)\b/,
    ];
    return temporaryPatterns.some((p) => p.test(lower));
  }

  private isPastTense(lower: string): boolean {
    return /\b(used to|previously|formerly|back then|old|before|in the past)\b/.test(lower) ||
           /\b(i (used to|formerly|previously))\b/.test(lower);
  }

  private findSimilarMemory(
    concept: string,
    content: string,
    category: MemoryCategory,
    userId: string,
    pattern?: Partial<ExtractionPattern>
  ): DbMemory | null {
    const all = this.repo.getAll(userId).sort((a, b) => b.updated_at - a.updated_at);
    const combined = `${concept} ${content}`.toLowerCase();

    for (const mem of all) {
      if (mem.category === category && mem.concept.toLowerCase() === concept.toLowerCase()) {
        return mem;
      }
    }

    for (const mem of all) {
      const conceptMatch =
        mem.concept.toLowerCase().includes(concept.toLowerCase().slice(0, 25)) ||
        concept.toLowerCase().includes(mem.concept.toLowerCase().slice(0, 25));

      if (conceptMatch && mem.category === category) {
        return mem;
      }
    }

    for (const mem of all) {
      const contentMatch =
        mem.content.toLowerCase().includes(content.toLowerCase().slice(0, 40)) ||
        content.toLowerCase().includes(mem.content.toLowerCase().slice(0, 40));

      if (contentMatch && mem.category === category) {
        return mem;
      }
    }

    if (category === 'preference') {
      const domainKeywords = ['prefer', 'like', 'favorite', 'language', 'coding', 'program', 'backend', 'frontend', 'grown on'];
      const newHasDomain = domainKeywords.some((k) => combined.includes(k));

      if (newHasDomain) {
        for (const mem of all) {
          if (mem.category !== category) continue;
          if (mem.tags && mem.tags.includes('update')) continue;
          const memText = `${mem.concept} ${mem.content}`.toLowerCase();
          if (domainKeywords.some((k) => memText.includes(k))) {
            return mem;
          }
        }
      }
    }

    if (pattern?.tags.includes('update') && category === 'preference') {
      const scored = all
        .filter((m) => m.category === category)
        .map((m) => {
          const memText = `${m.concept} ${m.content}`.toLowerCase();
          const queryTokens = tokenize(combined);
          const memTokens = tokenize(memText);
          const overlap = queryTokens.filter((t) => memTokens.includes(t)).length;
          return { mem: m, overlap, age: Date.now() - m.updated_at };
        })
        .sort((a, b) => b.overlap - a.overlap || a.age - b.age);

      if (scored.length > 0 && scored[0].overlap > 0) {
        return scored[0].mem;
      }

      const byImportance = all
        .filter((m) => m.category === category)
        .sort((a, b) => (b.importance ?? 0.5) - (a.importance ?? 0.5) || b.updated_at - a.updated_at);
      if (byImportance.length > 0) return byImportance[0];
    }

    if (pattern?.tags.includes('update') && category === 'project') {
      const projectMem = all
        .filter((m) => m.category === 'project')
        .sort((a, b) => b.updated_at - a.updated_at)[0];
      if (projectMem) return projectMem;
    }

    const queryTokens = tokenize(`${concept} ${content}`).filter((w) => w.length > 3);
    const querySet = new Set(queryTokens);

    if (pattern?.tags.includes('started')) {
      for (const mem of all) {
        if (!mem.tags?.includes('tentative')) continue;
        const memTokens = new Set(tokenize(`${mem.concept} ${mem.content}`));
        const overlap = queryTokens.filter((t) => memTokens.has(t)).length;
        if (overlap >= 1) return mem;
      }
    }

    for (const mem of all) {
      if (mem.category !== category) continue;
      const memTokens = new Set(tokenize(`${mem.concept} ${mem.content}`));
      const overlap = queryTokens.filter((t) => memTokens.has(t)).length;
      if (overlap >= 2) return mem;
    }

    const idf = this.getIdf(userId);
    const queryVec = this.computeTfVector(`${concept} ${content}`, idf);
    for (const mem of all) {
      if (mem.category !== category) continue;
      const memVec = this.computeTfVector(`${mem.concept} ${mem.content}`, idf);
      const sim = this.cosineSimilarity(queryVec, memVec);
      if (sim > 0.2) {
        return mem;
      }
    }

    return null;
  }

  private isContradictory(
    existing: DbMemory,
    newContent: string,
    pattern: { category: MemoryCategory; tags: string[] },
    lowerMessage: string
  ): boolean {
    if (pattern.tags.includes('update')) return true;

    const existingLower = existing.content.toLowerCase();
    const newLower = newContent.toLowerCase();

    const negationPatterns = ['don\'t', 'doesn\'t', 'not ', 'never ', 'hate', 'dislike', 'no longer', 'stopped'];
    const isNegativeNew = negationPatterns.some((p) => newLower.includes(p));
    const isNegativeExisting = negationPatterns.some((p) => existingLower.includes(p));

    if (isNegativeNew && !isNegativeExisting) return true;
    if (!isNegativeNew && isNegativeExisting) return true;

    if (lowerMessage.includes('actually') || lowerMessage.includes('now')) {
      const memTokens = new Set(tokenize(`${existing.concept} ${existing.content}`));
      const newTokens = tokenize(newContent);
      const overlap = newTokens.filter((t) => memTokens.has(t)).length;
      if (overlap > 0) return true;
    }

    const isPastTense = this.isPastTense(lowerMessage);
    if (isPastTense) return false;

    const existingDomain = this.extractDomain(existing.content);
    const newDomain = this.extractDomain(newContent);
    if (existingDomain && newDomain && existingDomain !== newDomain) return true;

    return false;
  }

  private extractDomain(text: string): string | null {
    const lower = text.toLowerCase();
    if (/\b(python|javascript|java|go|rust|typescript|ruby|php|c\+\+|c#|kotlin|swift|rust|python)\b/.test(lower)) {
      const langMatch = lower.match(/\b(python|javascript|typescript|java|go|rust|ruby|php|kotlin|swift)\b/);
      return langMatch ? langMatch[1] : null;
    }
    return null;
  }

  private inferIntent(message: string): {
    category: MemoryCategory;
    confidence: number;
    importance: number;
    lifespan: MemoryLifespan;
    concept: string;
    content: string;
    tags: string[];
    isTentative: boolean;
  } | null {
    const lower = message.toLowerCase().trim();

    if (!lower || lower.length < 5) return null;

    if (lower.length > 300) return null;

    const growsOnPattern = lower.match(/\b((?:java)?script|python|go|rust|typescript|java|ruby|php|kubernetes|react|vue|svelte|sveltekit|next\.js|node\.js)\b.*?\b(grown on me|really like|really prefer|love|enjoy)\b/i);
    if (growsOnPattern) {
      const lang = growsOnPattern[1].replace(/[^a-z0-9\.]/gi, '');
      return {
        category: 'preference',
        confidence: 0.85,
        importance: 0.6,
        lifespan: 'long_term',
        concept: `Preference: ${lang}`,
        content: `User has grown to like ${lang}.`,
        tags: ['semantic', 'user-preference'],
        isTentative: false,
      };
    }

    const buildingPattern = lower.match(/\b(i(?:'m| am)|we\b).*?\b(building|creating|working on|developing|putting (together|up))\b\s+(.+?)(?:\.|\s*$)/i);
    if (buildingPattern) {
      const project = buildingPattern[4]?.trim();
      if (project) {
        return {
          category: 'project',
          confidence: 0.85,
          importance: 0.8,
          lifespan: 'long_term',
          concept: 'Project Context',
          content: `User is building: ${project}.`,
          tags: ['semantic', 'project', 'context'],
          isTentative: false,
        };
      }
    }

    const careerPattern = lower.match(/\b(i want to|i aim to|eventually want to|dream of becoming|aspire to be|goal is to)\s+(be|a)\s+(.+?)(?:\.|\s*$)/i);
    if (careerPattern) {
      return {
        category: 'instruction',
        confidence: 0.75,
        importance: 0.85,
        lifespan: 'permanent',
        concept: 'Career Goal',
        content: `User wants to become: ${careerPattern[2]?.trim()}.`,
        tags: ['semantic', 'goal', 'aspiration'],
        isTentative: false,
      };
    }

    const startedPattern = lower.match(/\b(i've|i have|i just)\s+(?:actually|now|recently)?\s*(started|begun)\s+(learning|building|working on|doing|exploring|using)\s+(.+?)(?:\.|\s*$)/i);
    if (startedPattern) {
      const action = startedPattern[3];
      const topic = startedPattern[4];
      const cat: MemoryCategory = action === 'learning' ? 'fact' : action === 'building' ? 'project' : 'instruction';
      return {
        category: cat,
        confidence: 0.9,
        importance: 0.6,
        lifespan: 'long_term',
        concept: `Started ${action}: ${topic}`,
        content: `User has started ${action} ${topic}.`,
        tags: ['real-time', 'started', 'confirmed'],
        isTentative: false,
      };
    }

    return null;
  }

  extractWithIntent(
    userMessage: string,
    conversationId?: string,
    userId: string = 'default'
  ): MemoryItem[] {
    const created = this.extractMemories(userMessage, conversationId, userId);

    const intent = this.inferIntent(userMessage);
    if (intent) {
      const existing = this.findSimilarMemory(intent.concept, intent.content, intent.category, userId, {
        category: intent.category,
        tags: intent.tags,
      });

      if (existing) {
        const isContradiction = this.isContradictory(existing, intent.content, {
          category: intent.category,
          tags: intent.tags,
        }, userMessage.toLowerCase());

        if (isContradiction) {
          this.repo.logEvent(existing.id, 'contradicted', {
            old_content: existing.content,
            new_content: intent.content,
            conversation_id: conversationId,
          });
          this.repo.logEvent(existing.id, 'superseded', {
            old_content: existing.content,
            new_content: intent.content,
            conversation_id: conversationId,
          });
          this.repo.update(existing.id, {
            concept: intent.concept,
            content: intent.content,
            confidence: intent.confidence,
            importance: intent.importance,
            tags: intent.tags,
            source_conversation_id: conversationId,
            metadata: {
              sourceType: 'inferred',
              evidenceCount: ((existing.metadata?.evidenceCount as number) ?? 1) + 1,
              lastConfirmedAt: Date.now(),
              lastContradictedAt: Date.now(),
            },
          }, userId);
          this.repo.touch(existing.id, userId);
          this.repo.logEvent(existing.id, 'updated', { content: intent.content });
          created.push(this.repo.mapToMemoryItem(this.repo.getById(existing.id, userId)!));
        } else {
          const existingEvidence = (existing.metadata?.evidenceCount as number) ?? 1;
          const newEvidence = existingEvidence + 1;
          const newConfidence = this.accumulateConfidence(existing.confidence, newEvidence, 'inferred');

          this.repo.update(existing.id, {
            confidence: newConfidence,
            importance: Math.max(existing.importance ?? 0.5, intent.importance),
            tags: [...new Set([...(existing.tags || []), ...intent.tags])],
            source_conversation_id: conversationId,
            metadata: {
              sourceType: 'inferred',
              evidenceCount: newEvidence,
              lastConfirmedAt: Date.now(),
            },
          }, userId);
          this.repo.touch(existing.id, userId);
          this.repo.logEvent(existing.id, 'inferred', { content: intent.content, evidenceCount: newEvidence, confidence: newConfidence });
          created.push(this.repo.mapToMemoryItem(this.repo.getById(existing.id, userId)!));
        }
      } else {
        const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const dbMemory = this.repo.create({
          id,
          concept: intent.concept,
          category: intent.category,
          content: intent.content,
          confidence: intent.confidence,
          importance: intent.importance,
          lifespan: intent.lifespan,
          source: 'semantic',
          sourceConversationId: conversationId,
          tags: intent.tags,
          userId,
          metadata: {
            sourceType: 'inferred',
            evidenceCount: 1,
            lastConfirmedAt: Date.now(),
          },
        });
        this.repo.logEvent(id, 'created', { content: intent.content, source: 'semantic', sourceType: 'inferred' });
        created.push(this.repo.mapToMemoryItem(dbMemory));
      }
    }

    const styleMemories = this.detectCommunicationStyle(userMessage, conversationId, userId);
    created.push(...styleMemories);

    return created;
  }

  detectCommunicationStyle(
    message: string,
    conversationId?: string,
    userId: string = 'default'
  ): MemoryItem[] {
    const created: MemoryItem[] = [];
    const lower = message.toLowerCase().trim();

    if (!lower || lower.length < 5) return created;
    if (lower.length > 300) return created;

    const matchedStyle = MemoryService.COMMUNICATION_STYLE_PATTERNS.find((p) =>
      p.keywords.some((kw) => lower.includes(kw))
    );

    if (!matchedStyle) return created;

    const allCommStyle = this.repo.getAll(userId).filter(
      (m) => m.category === 'preference' && (m.tags || []).includes('communication_style')
    );
    const existing = allCommStyle.find((m) => m.concept.toLowerCase() === matchedStyle.concept.toLowerCase());

    if (existing) {
      const existingEvidence = (existing.metadata?.evidenceCount as number) ?? 1;
      const newEvidence = existingEvidence + 1;
      const newConfidence = this.accumulateConfidence(existing.confidence, newEvidence, 'inferred');

      this.repo.update(existing.id, {
        confidence: newConfidence,
        importance: Math.max(existing.importance ?? 0.5, 0.7),
        tags: [...new Set([...(existing.tags || []), ...matchedStyle.tags])],
        source_conversation_id: conversationId,
        metadata: {
          sourceType: 'inferred',
          evidenceCount: newEvidence,
          lastConfirmedAt: Date.now(),
        },
      }, userId);
      this.repo.touch(existing.id, userId);
      this.repo.logEvent(existing.id, 'confirmed', {
        content: matchedStyle.content,
        reason: 'communication_style_reinforcement',
        evidenceCount: newEvidence,
      });
      created.push(this.repo.mapToMemoryItem(this.repo.getById(existing.id, userId)!));
    } else {
      const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const dbMemory = this.repo.create({
        id,
        concept: matchedStyle.concept,
        category: 'preference',
        content: matchedStyle.content,
        confidence: 0.5,
        importance: 0.7,
        lifespan: 'long_term',
        source: 'semantic',
        sourceConversationId: conversationId,
        tags: matchedStyle.tags,
        userId,
        metadata: {
          sourceType: 'inferred',
          evidenceCount: 1,
          lastConfirmedAt: Date.now(),
        },
      });
      this.repo.logEvent(id, 'inferred', { content: matchedStyle.content, evidenceCount: 1 });
      created.push(this.repo.mapToMemoryItem(dbMemory));
    }

    return created;
  }

  accumulateConfidence(currentConfidence: number, evidenceCount: number, sourceType: MemorySourceType): number {
    const baseIncrement = sourceType === 'explicit' ? 0.12 : 0.06;
    const diminishingFactor = 1 / (1 + Math.log(1 + Math.max(1, evidenceCount - 1)));
    const increment = baseIncrement * diminishingFactor;
    return Math.min(0.98, currentConfidence + increment);
  }

  stalenessFactor(updatedAt: number): number {
    const ageHours = (Date.now() - updatedAt) / (1000 * 3600);
    if (ageHours < 24) return 1.0;
    if (ageHours < 168) return 0.9;
    if (ageHours < 720) return 0.7;
    if (ageHours < 2160) return 0.5;
    return 0.3;
  }

  buildPersonalizationContext(
    query: string,
    userId: string = 'default'
  ): PersonalizationContext {
    const allMemories = this.repo.getAll(userId);
    const queryLower = query.toLowerCase();
    const queryTokens = tokenize(queryLower).filter((t) => t.length > 3);

    const matchedStylePatterns = MemoryService.COMMUNICATION_STYLE_PATTERNS
      .filter((p) => p.keywords.some((kw) => queryLower.includes(kw)))
      .flatMap((p) => p.tags);

    const personalizationMemories = allMemories.filter(
      (m) =>
        m.category === 'preference' ||
        (m.tags || []).some((t) =>
          ['communication_style', 'user-preference', 'preference', 'goal', 'project'].includes(t)
        )
    );

    const scored = personalizationMemories.map((m) => {
      let score = 0;
      const conceptLower = m.concept.toLowerCase();
      const contentLower = m.content.toLowerCase();
      const tagsLower = (m.tags || []).map((t) => t.toLowerCase());

      if (conceptLower.includes(queryLower)) score += 3;
      if (contentLower.includes(queryLower)) score += 2;
      if (tagsLower.some((t) => queryLower.includes(t) || t.includes(queryLower))) score += 1;

      for (const word of queryTokens) {
        if (conceptLower.includes(word)) score += 2;
        if (contentLower.includes(word)) score += 1;
      }

      if (matchedStylePatterns.length > 0) {
        const tagOverlap = (m.tags || []).filter((t) => matchedStylePatterns.includes(t));
        if (tagOverlap.length > 0) {
          score += 2 + tagOverlap.length;
        }
      }

      const semantic = this.semanticScore(query, `${m.concept} ${m.content}`, userId);
      score += semantic * 2;

      const explicitBoost = m.metadata?.sourceType === 'explicit' ? 0.3 : 0;
      score += explicitBoost;

      const confidence = m.confidence ?? 0.5;
      score += confidence * 0.2;

      const evidenceBoost = Math.min((m.metadata?.evidenceCount as number ?? 1) / 10, 1) * 0.2;
      score += evidenceBoost;

      const staleness = this.stalenessFactor(m.updated_at);
      score *= staleness;

      const accessBoost = Math.min((m.access_count || 0) / 10, 1) * 0.15;
      score += accessBoost;

      return { memory: this.repo.mapToMemoryItem(m), score };
    });

    const relevant = scored
      .filter((s) => s.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxRetrievalLimit * 2);

    for (const { memory } of relevant) {
      this.repo.touch(memory.id, userId);
      this.repo.logEvent(memory.id, 'accessed', { query, purpose: 'personalization', score: memory.confidence });
    }

    let contextText = '';
    if (relevant.length > 0) {
      contextText = 'USER PERSONALIZATION PROFILE:\n';
      for (const { memory } of relevant) {
        const sourceLabel = memory.sourceType === 'explicit' ? 'explicit' : 'inferred';
        const evidence = memory.evidenceCount ?? 1;
        contextText += `- [${sourceLabel}, confidence: ${(memory.confidence * 100).toFixed(0)}%, evidence: ${evidence}] ${memory.content}\n`;
      }
    }

    return { contextText, relevantMemories: relevant.map((r) => r.memory) };
  }

  getUserUnderstandingProfile(userId: string = 'default'): UserUnderstandingProfile {
    const allMemories = this.repo.getAll(userId);

    const byCategory = (cat: MemoryCategory): MemoryItem[] =>
      allMemories
        .filter((m) => m.category === cat)
        .sort((a, b) => {
          const scoreA = (a.confidence ?? 0.5) * (a.metadata?.evidenceCount as number ?? 1);
          const scoreB = (b.confidence ?? 0.5) * (b.metadata?.evidenceCount as number ?? 1);
          return scoreB - scoreA || b.updated_at - a.updated_at;
        })
        .map((m) => this.repo.mapToMemoryItem(m));

    const preferences = byCategory('preference');
    const projects = byCategory('project');
    const goals = allMemories
      .filter((m) => (m.tags || []).some((t) => t.includes('goal') || t.includes('aspiration')))
      .sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5) || b.updated_at - a.updated_at)
      .map((m) => this.repo.mapToMemoryItem(m));

    const communicationStyle = preferences.filter((m) =>
      (m.tags || []).some((t) => t.includes('communication_style'))
    );

    const interests = allMemories
      .filter((m) => (m.tags || []).some((t) => t.includes('technology') || t.includes('interest')))
      .sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5) || b.updated_at - a.updated_at)
      .map((m) => this.repo.mapToMemoryItem(m));

    const instructions = byCategory('instruction');
    const facts = byCategory('fact');

    return {
      preferences,
      interests,
      goals,
      projects,
      communicationStyle,
      instructions,
      facts,
    };
  }

  buildMemoryContext(userMessage: string, userId: string = 'default'): MemoryContext {
    const memories = this.retrieveRelevantMemories(userMessage, userId);
    const personalization = this.buildPersonalizationContext(userMessage, userId);

    let contextText = '';
    if (memories.length > 0) {
      contextText = 'RELEVANT DOTVEX MEMORY:\n';
      for (const mem of memories) {
        contextText += `- ${mem.content}\n`;
      }
    }

    return { memories, contextText, personalizationContext: personalization };
  }

  buildMemoryContextForPrompt(userMessage: string, userId: string = 'default'): string {
    const { contextText, personalizationContext } = this.buildMemoryContext(userMessage, userId);
    let combined = contextText;
    if (personalizationContext && personalizationContext.contextText) {
      combined = combined
        ? `${contextText}\n${personalizationContext.contextText}`
        : personalizationContext.contextText;
    }
    return combined;
  }

  createMemory(data: {
    concept: string;
    category: MemoryCategory;
    content: string;
    confidence?: number;
    importance?: number;
    lifespan?: MemoryLifespan;
    tags?: string[];
    sourceConversationId?: string;
    userId?: string;
    sourceType?: MemorySourceType;
    evidenceCount?: number;
  }): MemoryItem {
    const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const confidence = Math.min(1.0, Math.max(0.1, data.confidence ?? 0.85));
    const importance = data.importance ?? this.defaultImportance(data.category, confidence);
    const lifespan = data.lifespan ?? this.defaultLifespan(data.category, confidence, importance);
    const sourceType = data.sourceType ?? 'explicit';
    const evidenceCount = data.evidenceCount ?? 1;
    const dbMemory = this.repo.create({
      id,
      concept: data.concept.trim(),
      category: data.category,
      content: data.content.trim(),
      confidence,
      importance,
      lifespan,
      source: 'manual',
      sourceConversationId: data.sourceConversationId,
      tags: data.tags ?? [],
      userId: data.userId ?? 'default',
      metadata: {
        sourceType,
        evidenceCount,
        lastConfirmedAt: Date.now(),
      },
    });
    this.repo.logEvent(id, 'created', { content: data.content.trim(), confidence, importance, sourceType, evidenceCount });
    return this.repo.mapToMemoryItem(dbMemory);
  }

  getMemory(id: string, userId: string = 'default'): MemoryItem | null {
    const dbMemory = this.repo.getById(id, userId);
    return dbMemory ? this.repo.mapToMemoryItem(dbMemory) : null;
  }

  updateMemory(id: string, updates: Partial<Omit<MemoryItem, 'id' | 'createdAt'>>, userId: string = 'default'): boolean {
    const existing = this.repo.getById(id, userId);
    if (!existing) return false;

    const metadataUpdate: Record<string, unknown> = {};
    if (updates.sourceType !== undefined) metadataUpdate.sourceType = updates.sourceType;
    if (updates.evidenceCount !== undefined) metadataUpdate.evidenceCount = updates.evidenceCount;
    if (updates.lastConfirmedAt !== undefined) metadataUpdate.lastConfirmedAt = updates.lastConfirmedAt;
    if (updates.lastContradictedAt !== undefined) metadataUpdate.lastContradictedAt = updates.lastContradictedAt;

    const metadataMerged = Object.keys(metadataUpdate).length > 0 ? metadataUpdate : undefined;

    this.repo.update(id, {
      concept: updates.concept,
      category: updates.category,
      content: updates.content,
      confidence: updates.confidence,
      importance: updates.importance,
      tags: updates.tags,
      source_conversation_id: updates.sourceConversationId,
      metadata: metadataMerged,
    }, userId);
    this.repo.logEvent(id, 'updated', { updates: Object.keys(updates).length });
    return true;
  }

  deleteMemory(id: string, userId: string = 'default'): boolean {
    return this.repo.delete(id, userId);
  }

  clearAllMemories(userId: string = 'default'): number {
    return this.repo.deleteAll(userId);
  }

  migrateFromLocalStorage(memories: any[], userId: string = 'default'): { imported: number; skipped: number } {
    let imported = 0;
    let skipped = 0;

    for (const item of memories) {
      if (!item.id || !item.concept || !item.category || !item.content) {
        skipped++;
        continue;
      }

      const existing = this.repo.getById(item.id, userId);
      if (existing) {
        skipped++;
        continue;
      }

      const now = item.createdAt ?? Date.now();
      const importance = item.importance ?? this.defaultImportance(item.category, item.confidence ?? 0.85);
      const lifespan = item.lifespan ?? this.defaultLifespan(item.category, item.confidence ?? 0.85, importance);
      const sourceType: MemorySourceType = item.sourceType ?? 'inferred';
      const evidenceCount = item.evidenceCount ?? 1;
      const dbMemory = this.repo.create({
        id: item.id,
        concept: item.concept,
        category: item.category,
        content: item.content,
        confidence: item.confidence ?? 0.85,
        importance,
        lifespan,
        source: 'migration',
        sourceConversationId: item.sourceConversationId,
        tags: item.tags || [],
        userId,
        metadata: {
          sourceType,
          evidenceCount,
          lastConfirmedAt: now,
        },
      });
      this.repo.logEvent(dbMemory.id, 'created', { source: 'migration', sourceType, evidenceCount });
      imported++;
    }

    this.tfidfCache.clear();
    this.idfCache = null;

    return { imported, skipped };
  }

  private defaultImportance(category: string, confidence: number): number {
    if (category === 'fact' && confidence >= 0.95) return 0.95;
    if (category === 'project') return 0.9;
    if (category === 'instruction') return 0.85;
    if (category === 'preference') return 0.7;
    if (category === 'fact') return 0.5;
    if (category === 'entity') return 0.6;
    return 0.5;
  }

  private defaultLifespan(category: string, confidence: number, importance: number): MemoryLifespan {
    if (category === 'fact' && confidence >= 0.9 && importance >= 0.9) return 'permanent';
    if (category === 'fact' && importance >= 0.85) return 'permanent';
    if (importance >= 0.9) return 'permanent';
    if (importance >= 0.7) return 'long_term';
    if (importance >= 0.5) return 'short_term';
    return 'temporary';
  }

  getLearningEvents(memoryId: string, userId: string = 'default', limit: number = 50): any[] {
    return this.repo.getLearningEvents(memoryId, userId, limit);
  }

  getAllLearningEvents(userId: string = 'default', limit: number = 100): any[] {
    return this.repo.getAllLearningEvents(userId, limit);
  }
}

export const memoryService = new MemoryService();
