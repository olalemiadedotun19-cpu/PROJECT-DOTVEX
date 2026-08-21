import { Conversation } from '../../src/types/conversation';
import { ChatMessage } from '../../src/types/chat';
import { DbConversation, DbMessage, ConversationRepository } from '../repositories/conversationRepository';
import { MessageRepository, CreateMessageData } from '../repositories/messageRepository';

export class ConversationService {
  private conversationRepo = new ConversationRepository();
  private messageRepo = new MessageRepository();

  getAllConversations(userId: string = 'default'): Conversation[] {
    const dbConvs = this.conversationRepo.getAll(userId);
    return dbConvs.map(this.dbToFrontendConversation);
  }

  getConversation(id: string, userId: string = 'default'): Conversation | null {
    const dbConv = this.conversationRepo.getById(id, userId);
    if (!dbConv) return null;
    return this.dbToFrontendConversation(dbConv);
  }

  createConversation(data: {
    id?: string;
    title?: string;
    createdAt?: number;
    updatedAt?: number;
    isPinned?: boolean;
    userId?: string;
  }): Conversation {
    const now = Date.now();
    const id = data.id ?? this.generateConvId();
    const dbConv = this.conversationRepo.create({
      id,
      title: data.title ?? 'New chat',
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
      isPinned: data.isPinned,
      userId: data.userId ?? 'default',
    });
    return this.dbToFrontendConversation(dbConv);
  }

  ensureConversation(conversationId: string | null, userId: string = 'default'): Conversation {
    if (conversationId) {
      const existing = this.getConversation(conversationId, userId);
      if (existing) return existing;
    }
    return this.createConversation({ id: conversationId ?? undefined, userId });
  }

  updateConversation(
    id: string,
    data: { title?: string; isPinned?: boolean },
    userId: string = 'default'
  ): boolean {
    const existing = this.conversationRepo.getById(id, userId);
    if (!existing) return false;
    this.conversationRepo.update(id, data, userId);
    return true;
  }

  deleteConversation(id: string, userId: string = 'default'): boolean {
    const existing = this.conversationRepo.getById(id, userId);
    if (!existing) return false;
    this.conversationRepo.delete(id, userId);
    return true;
  }

  getMessages(conversationId: string, userId: string = 'default'): ChatMessage[] {
    const dbMessages = this.messageRepo.getByConversationId(conversationId, userId);
    return dbMessages.map(this.dbToFrontendMessage);
  }

  saveMessage(
    message: ChatMessage,
    userId: string = 'default'
  ): ChatMessage {
    const { id, conversationId, role, content, metadata } = this.extractMessageFields(message);

    this.messageRepo.create({
      id,
      conversationId,
      role,
      content,
      createdAt: message.timestamp ?? Date.now(),
      metadata,
    }, userId);

    if (content && content.trim()) {
      const preview = content.substring(0, 80);
      this.conversationRepo.setLastMessagePreview(conversationId, preview, userId);
    }

    return message;
  }

  saveMessages(messages: ChatMessage[], userId: string = 'default'): void {
    const db = this.conversationRepo['db'];
    const insertStmt = db.prepare(
      'INSERT OR REPLACE INTO messages (id, conversation_id, role, content, created_at, metadata) VALUES (?, ?, ?, ?, ?, ?)'
    );

    db.exec('BEGIN');
    try {
      for (const msg of messages) {
        const { id, conversationId, role, content, metadata } = this.extractMessageFields(msg);
        insertStmt.run(
          id,
          conversationId,
          role,
          content,
          msg.timestamp ?? Date.now(),
          metadata ? JSON.stringify(metadata) : null
        );
      }
      db.exec('COMMIT');
    } catch {
      db.exec('ROLLBACK');
      throw new Error('Failed to save messages');
    }

    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const preview = lastMsg.content ? lastMsg.content.substring(0, 80) : '';
      this.conversationRepo.setLastMessagePreview(messages[0].conversationId, preview, userId);
    }
  }

  updateMessageContent(
    messageId: string,
    content: string,
    userId: string = 'default'
  ): void {
    this.messageRepo.updateContent(messageId, content, userId);
  }

  replaceAllMessages(
    conversationId: string,
    messages: CreateMessageData[],
    userId: string = 'default'
  ): void {
    this.messageRepo.replaceAll(conversationId, messages, userId);
  }

  private extractMessageFields(message: ChatMessage): {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata: Record<string, unknown> | null;
  } {
    const {
      attachments,
      reasoningTrace,
      isReasoningCollapsed,
      status,
      error,
      modelName,
      latencyMs,
      savedToLibrary,
      generatedImageUrl,
      codeOutput,
      ...rest
    } = message as any;

    const metadata: Record<string, unknown> = {};
    if (attachments) (metadata as any).attachments = attachments;
    if (reasoningTrace !== undefined) (metadata as any).reasoningTrace = reasoningTrace;
    if (isReasoningCollapsed !== undefined) (metadata as any).isReasoningCollapsed = isReasoningCollapsed;
    if (status !== undefined) (metadata as any).status = status;
    if (error !== undefined) (metadata as any).error = error;
    if (modelName !== undefined) (metadata as any).modelName = modelName;
    if (latencyMs !== undefined) (metadata as any).latencyMs = latencyMs;
    if (savedToLibrary !== undefined) (metadata as any).savedToLibrary = savedToLibrary;
    if (generatedImageUrl !== undefined) (metadata as any).generatedImageUrl = generatedImageUrl;
    if (codeOutput !== undefined) (metadata as any).codeOutput = codeOutput;

    return {
      id: rest.id ?? '',
      conversationId: rest.conversationId ?? '',
      role: rest.role ?? 'user',
      content: rest.content ?? '',
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    };
  }

  private dbToFrontendConversation(db: DbConversation): Conversation {
    return {
      id: db.id,
      title: db.title,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
      lastMessagePreview: db.last_message_preview ?? undefined,
      isPinned: db.is_pinned ?? false,
      projectId: db.project_id ?? undefined,
    };
  }

  private dbToFrontendMessage(db: DbMessage): ChatMessage {
    const msg: ChatMessage = {
      id: db.id,
      conversationId: db.conversation_id,
      role: db.role,
      content: db.content,
      timestamp: db.created_at,
    };

    if (db.metadata) {
      const meta = db.metadata as Record<string, unknown>;
      if (meta.attachments) msg.attachments = meta.attachments as any;
      if (meta.reasoningTrace !== undefined) msg.reasoningTrace = meta.reasoningTrace as string;
      if (meta.isReasoningCollapsed !== undefined) msg.isReasoningCollapsed = meta.isReasoningCollapsed as boolean;
      if (meta.status !== undefined) msg.status = meta.status as any;
      if (meta.error !== undefined) msg.error = meta.error as string;
      if (meta.modelName !== undefined) msg.modelName = meta.modelName as string;
      if (meta.latencyMs !== undefined) msg.latencyMs = meta.latencyMs as number;
      if (meta.savedToLibrary !== undefined) msg.savedToLibrary = meta.savedToLibrary as boolean;
      if (meta.generatedImageUrl !== undefined) msg.generatedImageUrl = meta.generatedImageUrl as string;
      if (meta.codeOutput !== undefined) msg.codeOutput = meta.codeOutput as string;
    }

    return msg;
  }

  private generateConvId(): string {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  }
}

export const conversationService = new ConversationService();
