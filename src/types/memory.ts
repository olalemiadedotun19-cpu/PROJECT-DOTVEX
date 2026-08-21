export type MemoryCategory =
  | 'preference'
  | 'fact'
  | 'project'
  | 'instruction'
  | 'entity';

export type MemoryLifespan =
  | 'permanent'
  | 'long_term'
  | 'short_term'
  | 'temporary';

export type MemorySourceType =
  | 'explicit'
  | 'inferred';

export interface MemoryItem {
  id: string;
  concept: string;
  category: MemoryCategory;
  content: string;
  confidence: number;
  importance: number;
  lifespan: MemoryLifespan;
  sourceConversationId?: string;
  createdAt: number;
  updatedAt: number;
  lastReinforcedAt: number;
  tags: string[];
  sourceType?: MemorySourceType;
  evidenceCount?: number;
  lastConfirmedAt?: number;
  lastContradictedAt?: number;
}

export interface CognitionLabStats {
  totalMemories: number;
  activeConcepts: number;
  averageConfidence: number;
  averageImportance: number;
  lastUpdated: number;
  explicitCount?: number;
  inferredCount?: number;
  avgEvidenceCount?: number;
}

export interface UserUnderstandingProfile {
  preferences: MemoryItem[];
  interests: MemoryItem[];
  goals: MemoryItem[];
  projects: MemoryItem[];
  communicationStyle: MemoryItem[];
  instructions: MemoryItem[];
  facts: MemoryItem[];
}

export interface CommunicationStyleMemory {
  id: string;
  concept: string;
  content: string;
  confidence: number;
  evidenceCount: number;
  lastReinforcedAt: number;
  tags: string[];
}
