import { Request, Response } from 'express';
import { conversationService } from '../services/conversationService';
import { ErrorResponse } from '../types/api';
import { getFirebaseUserId } from '../middleware/firebaseAuth';

export async function listConversationsHandler(req: Request, res: Response) {
  try {
    const userId = getFirebaseUserId(req) || 'default';
    const conversations = conversationService.getAllConversations(userId);
    res.json(conversations);
  } catch (err: any) {
    console.error('[DOTVEX] List conversations error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function getConversationHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Conversation ID is required.' } });
    return;
  }

  try {
    const userId = getFirebaseUserId(req) || 'default';
    const conv = conversationService.getConversation(id, userId);
    if (!conv) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
      return;
    }
    res.json(conv);
  } catch (err: any) {
    console.error('[DOTVEX] Get conversation error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function createConversationHandler(req: Request, res: Response) {
  const body = req.body as { title?: string };
  const title = body.title?.trim() || 'New chat';

  if (title.length > 200) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Title is too long (max 200 characters).' } });
    return;
  }

  try {
    const userId = getFirebaseUserId(req) || 'default';
    const conv = conversationService.createConversation({ title: title.length > 0 ? title : 'New chat', userId });
    res.status(201).json(conv);
  } catch (err: any) {
    console.error('[DOTVEX] Create conversation error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function updateConversationHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Conversation ID is required.' } });
    return;
  }

  const body = req.body as { title?: string; isPinned?: boolean };
  const updates: { title?: string; isPinned?: boolean } = {};

  if (body.title !== undefined) {
    const trimmed = body.title.trim();
    if (trimmed.length === 0) {
      res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Title cannot be empty.' } });
      return;
    }
    if (trimmed.length > 200) {
      res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Title is too long (max 200 characters).' } });
      return;
    }
    updates.title = trimmed;
  }

  if (body.isPinned !== undefined) {
    updates.isPinned = Boolean(body.isPinned);
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'No valid fields to update.' } });
    return;
  }

  try {
    const userId = getFirebaseUserId(req) || 'default';
    const conv = conversationService.getConversation(id, userId);
    if (!conv) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
      return;
    }

    conversationService.updateConversation(id, updates, userId);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DOTVEX] Update conversation error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function deleteConversationHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Conversation ID is required.' } });
    return;
  }

  try {
    const userId = getFirebaseUserId(req) || 'default';
    const deleted = conversationService.deleteConversation(id, userId);
    if (!deleted) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    console.error('[DOTVEX] Delete conversation error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function listMessagesHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Conversation ID is required.' } });
    return;
  }

  try {
    const userId = getFirebaseUserId(req) || 'default';
    const conv = conversationService.getConversation(id, userId);
    if (!conv) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
      return;
    }

    const messages = conversationService.getMessages(id, userId);
    res.json(messages);
  } catch (err: any) {
    console.error('[DOTVEX] List messages error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function createMessageHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Conversation ID is required.' } });
    return;
  }

  const body = req.body as { messages?: Array<{ id?: string; role: string; content: string; timestamp?: number }> };
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Messages array is required.' } });
    return;
  }

  const validRoles = ['user', 'assistant', 'system'] as const;

  const validatedMessages = body.messages.map((msg) => {
    const role = msg.role as string;
    if (!validRoles.includes(role as any)) {
      throw new Error(`Invalid role: ${msg.role}`);
    }
    if (!msg.content || msg.content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }
    if (msg.content.length > 100000) {
      throw new Error('Message content is too long (max 100000 characters)');
    }
    return {
      id: msg.id ?? 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      conversationId: id,
      role: role as typeof validRoles[number],
      content: msg.content,
      createdAt: msg.timestamp ?? Date.now(),
      metadata: null,
    };
  });

  try {
    const userId = getFirebaseUserId(req) || 'default';
    const conv = conversationService.getConversation(id, userId);
    if (!conv) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
      return;
    }

    conversationService.replaceAllMessages(id, validatedMessages, userId);

    res.status(201).json({ created: validatedMessages.length });
  } catch (err: any) {
    console.error('[DOTVEX] Create message error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}
