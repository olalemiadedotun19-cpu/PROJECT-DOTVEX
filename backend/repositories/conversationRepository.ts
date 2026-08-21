import { getDatabase } from '../database';

export interface DbConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: number;
  updated_at: number;
  last_message_preview: string | null;
  is_pinned: boolean;
  project_id: string | null;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: number;
  metadata: Record<string, unknown> | null;
}

export class ConversationRepository {
  private db = getDatabase();

  getAll(userId: string = 'default'): DbConversation[] {
    const stmt = this.db.prepare(
      'SELECT id, user_id, title, created_at, updated_at, last_message_preview, is_pinned, project_id FROM conversations WHERE user_id = ? ORDER BY updated_at DESC'
    );
    const rows = stmt.all(userId) as any[];
    return rows.map(this.rowToConversation);
  }

  getById(id: string, userId: string = 'default'): DbConversation | null {
    const stmt = this.db.prepare(
      'SELECT id, user_id, title, created_at, updated_at, last_message_preview, is_pinned, project_id FROM conversations WHERE id = ? AND user_id = ?'
    );
    const row = stmt.get(id, userId) as any;
    return row ? this.rowToConversation(row) : null;
  }

  create(data: {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    lastMessagePreview?: string;
    isPinned?: boolean;
    projectId?: string;
    userId?: string;
  }): DbConversation {
    const stmt = this.db.prepare(`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at, last_message_preview, is_pinned, project_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      data.id,
      data.userId ?? 'default',
      data.title,
      data.createdAt,
      data.updatedAt,
      data.lastMessagePreview ?? null,
      data.isPinned ? 1 : 0,
      data.projectId ?? null
    );
    return {
      id: data.id,
      user_id: data.userId ?? 'default',
      title: data.title,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
      last_message_preview: data.lastMessagePreview ?? null,
      is_pinned: data.isPinned ?? false,
      project_id: data.projectId ?? null,
    };
  }

  update(
    id: string,
    data: { title?: string; isPinned?: boolean },
    userId: string = 'default'
  ): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.isPinned !== undefined) {
      updates.push('is_pinned = ?');
      values.push(data.isPinned ? 1 : 0);
    }

    if (updates.length === 0) return;

    values.push(Date.now());
    values.push(id, userId);

    const stmt = this.db.prepare(
      `UPDATE conversations SET ${updates.join(', ')}, updated_at = ? WHERE id = ? AND user_id = ?`
    );
    stmt.run(...values);
  }

  delete(id: string, userId: string = 'default'): void {
    const stmt = this.db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?');
    stmt.run(id, userId);
  }

  updateTimestamp(id: string, userId: string = 'default'): void {
    const stmt = this.db.prepare(
      'UPDATE conversations SET updated_at = ? WHERE id = ? AND user_id = ?'
    );
    stmt.run(Date.now(), id, userId);
  }

  setLastMessagePreview(
    id: string,
    preview: string,
    userId: string = 'default'
  ): void {
    const stmt = this.db.prepare(
      'UPDATE conversations SET last_message_preview = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    );
    stmt.run(preview, Date.now(), id, userId);
  }

  private rowToConversation(row: any): DbConversation {
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_message_preview: row.last_message_preview ?? null,
      is_pinned: Boolean(row.is_pinned),
      project_id: row.project_id ?? null,
    };
  }
}
