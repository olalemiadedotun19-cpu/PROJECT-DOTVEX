import { getDatabase } from '../database';
import { MemoryItem, MemoryCategory, MemoryLifespan, MemorySourceType } from '../../src/types/memory';

export interface DbMemory {
  id: string;
  user_id: string;
  concept: string;
  category: string;
  content: string;
  confidence: number;
  importance: number;
  source: string | null;
  source_conversation_id: string | null;
  created_at: number;
  updated_at: number;
  last_accessed_at: number | null;
  access_count: number;
  tags: string[];
  metadata: Record<string, unknown> | null;
}

export interface DbLearningEvent {
  id: string;
  memory_id: string;
  event_type: string;
  source: string | null;
  created_at: number;
  metadata: Record<string, unknown> | null;
}

export class MemoryRepository {
  private db = getDatabase();

  getAll(userId: string = 'default'): DbMemory[] {
    const stmt = this.db.prepare(
      'SELECT * FROM memories WHERE user_id = ? ORDER BY updated_at DESC'
    );
    const rows = stmt.all(userId) as any[];
    return rows.map(this.rowToDbMemory);
  }

  getById(id: string, userId: string = 'default'): DbMemory | null {
    const stmt = this.db.prepare(
      'SELECT * FROM memories WHERE id = ? AND user_id = ?'
    );
    const row = stmt.get(id, userId) as any;
    return row ? this.rowToDbMemory(row) : null;
  }

  search(query: string, userId: string = 'default', limit: number = 10): DbMemory[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memories
      WHERE user_id = ?
      AND (
        concept LIKE ? OR
        content LIKE ? OR
        tags LIKE ?
      )
      ORDER BY updated_at DESC
      LIMIT ?
    `);
    const pattern = `%${query}%`;
    const rows = stmt.all(userId, pattern, pattern, `%${query}%`, limit) as any[];
    return rows.map(this.rowToDbMemory);
  }

  searchByConcept(concept: string, userId: string = 'default'): DbMemory[] {
    const stmt = this.db.prepare(
      'SELECT * FROM memories WHERE user_id = ? AND LOWER(concept) LIKE LOWER(?) ORDER BY updated_at DESC'
    );
    const rows = stmt.all(userId, `%${concept}%`) as any[];
    return rows.map(this.rowToDbMemory);
  }

  searchByTag(tag: string, userId: string = 'default'): DbMemory[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memories WHERE user_id = ?
      AND tags IS NOT NULL
      AND LOWER(tags) LIKE LOWER(?)
      ORDER BY updated_at DESC
    `);
    const rows = stmt.all(userId, `%${tag}%`) as any[];
    return rows.map(this.rowToDbMemory);
  }

  create(data: {
    id: string;
    concept: string;
    category: string;
    content: string;
    confidence: number;
    importance?: number;
    lifespan?: string;
    source?: string;
    sourceConversationId?: string;
    tags?: string[];
    metadata?: Record<string, unknown> | null;
    userId?: string;
  }): DbMemory {
    const now = Date.now();
    const metadataObj: Record<string, unknown> = {
      lifespan: data.lifespan,
    };
    if (data.metadata) {
      Object.assign(metadataObj, data.metadata);
    }
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memories
        (id, user_id, concept, category, content, confidence, importance, source, source_conversation_id, created_at, updated_at, last_accessed_at, access_count, tags, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      data.id,
      data.userId ?? 'default',
      data.concept,
      data.category,
      data.content,
      data.confidence,
      data.importance ?? 0.5,
      data.source ?? null,
      data.sourceConversationId ?? null,
      now,
      now,
      now,
      1,
      data.tags ? JSON.stringify(data.tags) : null,
      JSON.stringify(metadataObj)
    );
    return {
      id: data.id,
      user_id: data.userId ?? 'default',
      concept: data.concept,
      category: data.category,
      content: data.content,
      confidence: data.confidence,
      importance: data.importance ?? 0.5,
      source: data.source ?? null,
      source_conversation_id: data.sourceConversationId ?? null,
      created_at: now,
      updated_at: now,
      last_accessed_at: now,
      access_count: 1,
      tags: data.tags ?? [],
      metadata: metadataObj,
    };
  }

  update(
    id: string,
    data: {
      concept?: string;
      category?: string;
      content?: string;
      confidence?: number;
      importance?: number;
      tags?: string[];
      source_conversation_id?: string;
      metadata?: Partial<Record<string, unknown>>;
    },
    userId: string = 'default'
  ): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.concept !== undefined) { updates.push('concept = ?'); values.push(data.concept); }
    if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category); }
    if (data.content !== undefined) { updates.push('content = ?'); values.push(data.content); }
    if (data.confidence !== undefined) { updates.push('confidence = ?'); values.push(data.confidence); }
    if (data.importance !== undefined) { updates.push('importance = ?'); values.push(data.importance); }
    if (data.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(data.tags)); }
    if (data.source_conversation_id !== undefined) { updates.push('source_conversation_id = ?'); values.push(data.source_conversation_id ?? null); }
    if (data.metadata !== undefined) {
      const rowMeta = this.getById(id, userId)?.metadata ?? {};
      const merged = { ...rowMeta, ...data.metadata };
      updates.push('metadata = ?');
      values.push(JSON.stringify(merged));
    }

    if (updates.length === 0) return;

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(id, userId);

    const stmt = this.db.prepare(
      `UPDATE memories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    );
    stmt.run(...values);
  }

  touch(id: string, userId: string = 'default'): void {
    const stmt = this.db.prepare(`
      UPDATE memories
      SET last_accessed_at = ?, access_count = access_count + 1
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(Date.now(), id, userId);
  }

  delete(id: string, userId: string = 'default'): boolean {
    this.logEvent(id, 'deleted', null);
    const stmt = this.db.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, userId);
    return info.changes > 0;
  }

  deleteAll(userId: string = 'default'): number {
    const stmt = this.db.prepare('DELETE FROM memories WHERE user_id = ?');
    const info = stmt.run(userId);
    return Number(info.changes);
  }

  logEvent(memoryId: string, eventType: 'created' | 'updated' | 'accessed' | 'superseded' | 'deleted' | 'inferred' | 'confirmed' | 'contradicted', metadata: Record<string, unknown> | null = null): void {
    const id = 'lev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const stmt = this.db.prepare(`
      INSERT INTO learning_events (id, memory_id, event_type, source, created_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, memoryId, eventType, 'system', Date.now(), metadata ? JSON.stringify(metadata) : null);
  }

  getByCategory(category: string, userId: string = 'default', limit: number = 50): DbMemory[] {
    const stmt = this.db.prepare(
      'SELECT * FROM memories WHERE user_id = ? AND category = ? ORDER BY updated_at DESC LIMIT ?'
    );
    const rows = stmt.all(userId, category, limit) as any[];
    return rows.map(this.rowToDbMemory);
  }

  getByTag(tag: string, userId: string = 'default', limit: number = 50): DbMemory[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memories WHERE user_id = ?
      AND tags IS NOT NULL
      AND LOWER(tags) LIKE LOWER(?)
      ORDER BY updated_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(userId, `%${tag}%`, limit) as any[];
    return rows.map(this.rowToDbMemory);
  }

  getLearningEvents(memoryId: string, limit: number = 50): DbLearningEvent[] {
    const stmt = this.db.prepare(
      'SELECT * FROM learning_events WHERE memory_id = ? ORDER BY created_at DESC LIMIT ?'
    );
    const rows = stmt.all(memoryId, limit) as any[];
    return rows.map((row) => ({
      id: row.id,
      memory_id: row.memory_id,
      event_type: row.event_type,
      source: row.source ?? null,
      created_at: row.created_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  getAllLearningEvents(userId: string = 'default', limit: number = 100): DbLearningEvent[] {
    const stmt = this.db.prepare(
      `SELECT le.* FROM learning_events le
       INNER JOIN memories m ON le.memory_id = m.id
       WHERE m.user_id = ?
       ORDER BY le.created_at DESC
       LIMIT ?`
    );
    const rows = stmt.all(userId, limit) as any[];
    return rows.map((row) => ({
      id: row.id,
      memory_id: row.memory_id,
      event_type: row.event_type,
      source: row.source ?? null,
      created_at: row.created_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  getStats(userId: string = 'default'): {
    totalMemories: number;
    activeConcepts: number;
    averageConfidence: number;
    averageImportance: number;
    lastUpdated: number;
    explicitCount: number;
    inferredCount: number;
    avgEvidenceCount: number;
  } {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM memories WHERE user_id = ?');
    const totalRow = totalStmt.get(userId) as any;
    const total = Number(totalRow?.count ?? 0);

    const conceptsStmt = this.db.prepare(
      'SELECT COUNT(DISTINCT LOWER(concept)) as count FROM memories WHERE user_id = ?'
    );
    const conceptsRow = conceptsStmt.get(userId) as any;
    const activeConcepts = Number(conceptsRow?.count ?? 0);

    const confStmt = this.db.prepare(
      'SELECT AVG(confidence) as avg FROM memories WHERE user_id = ?'
    );
    const confRow = confStmt.get(userId) as any;
    const avgConf = confRow?.avg ?? 0;

    const impStmt = this.db.prepare(
      'SELECT AVG(importance) as avg FROM memories WHERE user_id = ?'
    );
    const impRow = impStmt.get(userId) as any;
    const avgImp = impRow?.avg ?? 0;

    const updatedStmt = this.db.prepare(
      'SELECT MAX(updated_at) as max FROM memories WHERE user_id = ?'
    );
    const updatedRow = updatedStmt.get(userId) as any;
    const lastUpdated = Number(updatedRow?.max ?? 0);

    const explicitStmt = this.db.prepare(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND metadata IS NOT NULL AND LOWER(metadata) LIKE '%\"sourcetype\":\"explicit\"%'"
    );
    const explicitRow = explicitStmt.get(userId) as any;
    const explicitCount = Number(explicitRow?.count ?? 0);

    const inferredStmt = this.db.prepare(
      "SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND metadata IS NOT NULL AND LOWER(metadata) LIKE '%\"sourcetype\":\"inferred\"%'"
    );
    const inferredRow = inferredStmt.get(userId) as any;
    const inferredCount = Number(inferredRow?.count ?? 0);

    const evidenceStmt = this.db.prepare(
      "SELECT AVG(CAST(JSON_EXTRACT(metadata, '$.evidenceCount') AS REAL)) as avg FROM memories WHERE user_id = ? AND metadata IS NOT NULL"
    );
    const evidenceRow = evidenceStmt.get(userId) as any;
    const avgEvidence = Number(evidenceRow?.avg ?? 0);

    return {
      totalMemories: total,
      activeConcepts: activeConcepts,
      averageConfidence: Math.round((avgConf || 0) * 100) / 100,
      averageImportance: Math.round((avgImp || 0) * 100) / 100,
      lastUpdated: lastUpdated || Date.now(),
      explicitCount,
      inferredCount,
      avgEvidenceCount: Math.round((avgEvidence || 0) * 100) / 100,
    };
  }

  private rowToDbMemory(row: any): DbMemory {
    let tags: string[] = [];
    if (row.tags) {
      try { tags = JSON.parse(row.tags); } catch { tags = []; }
    }
    let metadata: Record<string, unknown> | null = null;
    if (row.metadata) {
      try { metadata = JSON.parse(row.metadata); } catch { metadata = null; }
    }

    return {
      id: row.id,
      user_id: row.user_id,
      concept: row.concept,
      category: row.category,
      content: row.content,
      confidence: row.confidence,
      importance: row.importance ?? 0.5,
      source: row.source ?? null,
      source_conversation_id: row.source_conversation_id ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_accessed_at: row.last_accessed_at ?? null,
      access_count: row.access_count ?? 0,
      tags,
      metadata,
    };
  }

  private static mapToMemoryItem(db: DbMemory): MemoryItem {
    const lifespan = (db.metadata?.lifespan as MemoryLifespan) ?? MemoryRepository.defaultLifespan(db.category, db.confidence, db.importance);
    return {
      id: db.id,
      concept: db.concept,
      category: db.category as MemoryCategory,
      content: db.content,
      confidence: db.confidence,
      importance: db.importance ?? 0.5,
      lifespan,
      sourceConversationId: db.source_conversation_id ?? undefined,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
      lastReinforcedAt: db.updated_at,
      tags: db.tags,
      sourceType: (db.metadata?.sourceType as MemorySourceType) ?? (db.source === 'user_message' ? 'explicit' : 'inferred'),
      evidenceCount: (db.metadata?.evidenceCount as number) ?? 1,
      lastConfirmedAt: (db.metadata?.lastConfirmedAt as number) ?? db.created_at,
      lastContradictedAt: (db.metadata?.lastContradictedAt as number) ?? undefined,
    };
  }

  private static defaultLifespan(category: string, confidence: number, importance: number): MemoryLifespan {
    if (category === 'fact' && confidence >= 0.9 && importance >= 0.9) return 'permanent';
    if (importance >= 0.9) return 'permanent';
    if (importance >= 0.7) return 'long_term';
    if (importance >= 0.5) return 'short_term';
    return 'temporary';
  }

  mapToMemoryItem(db: DbMemory): MemoryItem {
    return MemoryRepository.mapToMemoryItem(db);
  }
}
