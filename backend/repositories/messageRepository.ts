import { getDatabase } from '../database';
import { DbMessage } from './conversationRepository';

export interface CreateMessageData {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  metadata?: Record<string, unknown> | null;
}

export class MessageRepository {
  private db = getDatabase();

  getByConversationId(
    conversationId: string,
    userId: string = 'default'
  ): DbMessage[] {
    const stmt = this.db.prepare(`
      SELECT m.id, m.conversation_id, m.role, m.content, m.created_at, m.metadata
      FROM messages m
      INNER JOIN conversations c ON m.conversation_id = c.id
      WHERE m.conversation_id = ? AND c.user_id = ?
      ORDER BY m.created_at ASC
    `);
    const rows = stmt.all(conversationId, userId) as any[];
    return rows.map(this.rowToMessage);
  }

  create(data: CreateMessageData, userId: string = 'default'): DbMessage {
    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages (id, conversation_id, role, content, created_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const checkStmt = this.db.prepare(`
      SELECT 1 FROM conversations WHERE id = ? AND user_id = ?
    `);

    const exists = checkStmt.get(data.conversationId, userId);
    if (!exists) {
      throw new Error(`Conversation ${data.conversationId} not found`);
    }

    insertStmt.run(
      data.id,
      data.conversationId,
      data.role,
      data.content,
      data.createdAt,
      data.metadata ? JSON.stringify(data.metadata) : null
    );

    return {
      id: data.id,
      conversation_id: data.conversationId,
      role: data.role,
      content: data.content,
      created_at: data.createdAt,
      metadata: data.metadata ?? null,
    };
  }

  replaceAll(
    conversationId: string,
    messages: CreateMessageData[],
    userId: string = 'default'
  ): void {
    const deleteStmt = this.db.prepare(`
      DELETE FROM messages
      WHERE conversation_id = ? AND EXISTS (
        SELECT 1 FROM conversations WHERE id = ? AND user_id = ?
      )
    `);
    const insertStmt = this.db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, created_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.db.exec('BEGIN');
    try {
      deleteStmt.run(conversationId, conversationId, userId);
      for (const msg of messages) {
        insertStmt.run(
          msg.id,
          msg.conversationId,
          msg.role,
          msg.content,
          msg.createdAt,
          msg.metadata ? JSON.stringify(msg.metadata) : null
        );
      }
      this.db.exec('COMMIT');
    } catch {
      this.db.exec('ROLLBACK');
      throw new Error('Failed to replace messages');
    }
  }

  updateContent(
    id: string,
    content: string,
    userId: string = 'default'
  ): void {
    const stmt = this.db.prepare(`
      UPDATE messages m
      SET content = ?
      WHERE m.id = ? AND EXISTS (
        SELECT 1 FROM conversations c WHERE c.id = m.conversation_id AND c.user_id = ?
      )
    `);
    stmt.run(content, id, userId);
  }

  private rowToMessage(row: any): DbMessage {
    let metadata: Record<string, unknown> | null = null;
    if (row.metadata) {
      try {
        metadata = JSON.parse(row.metadata);
      } catch {
        metadata = null;
      }
    }
    return {
      id: row.id,
      conversation_id: row.conversation_id,
      role: row.role,
      content: row.content,
      created_at: row.created_at,
      metadata,
    };
  }
}
