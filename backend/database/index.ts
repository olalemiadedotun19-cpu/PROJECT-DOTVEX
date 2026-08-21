import { DatabaseSync } from 'node:sqlite';
import { config } from '../config';

let _db: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (_db) return _db;

  _db = new DatabaseSync(config.dbPath);
  _db.exec('PRAGMA foreign_keys = ON;');

  return _db;
}

export function initializeDatabase(): void {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_message_preview TEXT,
      is_pinned INTEGER DEFAULT 0,
      project_id TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      metadata TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_pinned ON conversations(user_id, is_pinned, updated_at);

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      concept TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 0.85,
      importance REAL NOT NULL DEFAULT 0.5,
      source TEXT,
      source_conversation_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_accessed_at INTEGER,
      access_count INTEGER DEFAULT 0,
      tags TEXT,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
    CREATE INDEX IF NOT EXISTS idx_memories_concept ON memories(user_id, concept);
    CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(user_id, category);
    CREATE INDEX IF NOT EXISTS idx_memories_content ON memories(user_id, content);
    CREATE INDEX IF NOT EXISTS idx_memories_accessed ON memories(user_id, last_accessed_at);
    CREATE INDEX IF NOT EXISTS idx_memories_confidence ON memories(user_id, confidence);
    CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(user_id, importance);

    CREATE TABLE IF NOT EXISTS learning_events (
      id TEXT PRIMARY KEY,
      memory_id TEXT,
      event_type TEXT NOT NULL,
      source TEXT,
      created_at INTEGER NOT NULL,
      metadata TEXT,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_learning_memory ON learning_events(memory_id);
  `);

  migrateImportanceColumn(db);
}

function migrateImportanceColumn(db: DatabaseSync): void {
  const columns = db.prepare('PRAGMA table_info(memories)').all() as any[];
  const hasImportance = columns.some((c) => c.name === 'importance');
  if (!hasImportance) {
    db.exec('ALTER TABLE memories ADD COLUMN importance REAL NOT NULL DEFAULT 0.5');
  }

  db.prepare(`
    UPDATE memories SET importance = 0.95
    WHERE tags LIKE '%identity%' OR tags LIKE '%profile%'
  `).run();

  db.prepare(`
    UPDATE memories SET importance = 0.9
    WHERE category = 'project' AND importance = 0.5
  `).run();

  db.prepare(`
    UPDATE memories SET importance = 0.85
    WHERE category = 'instruction' AND importance = 0.5
  `).run();

  db.prepare(`
    UPDATE memories SET importance = 0.7
    WHERE category = 'preference' AND (tags LIKE '%user-preference%' OR tags LIKE '%real-time%') AND importance = 0.5
  `).run();

   db.prepare(`
    UPDATE memories SET importance = 0.3
    WHERE tags LIKE '%tentative%' AND importance = 0.5
  `).run();

  migrateLearningEventsFk(db);
}

function migrateLearningEventsFk(db: DatabaseSync): void {
  try {
    const fks = db.prepare('PRAGMA foreign_key_list(learning_events)').all() as any[];
    const hasCascade = fks.some((fk) => fk.table === 'memories' && fk.on_delete === 'CASCADE');
    if (hasCascade) {
      db.exec(`
        CREATE TABLE learning_events_new (
          id TEXT PRIMARY KEY,
          memory_id TEXT,
          event_type TEXT NOT NULL,
          source TEXT,
          created_at INTEGER NOT NULL,
          metadata TEXT,
          FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE SET NULL
        );
        INSERT INTO learning_events_new SELECT id, memory_id, event_type, source, created_at, metadata FROM learning_events;
        DROP TABLE learning_events;
        ALTER TABLE learning_events_new RENAME TO learning_events;
        CREATE INDEX IF NOT EXISTS idx_learning_memory ON learning_events(memory_id);
      `);
    }
  } catch (err) {
    console.error('[DOTVEX] Learning events FK migration skipped:', (err as Error).message);
  }
}

export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
