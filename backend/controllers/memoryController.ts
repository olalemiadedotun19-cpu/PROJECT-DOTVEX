import { Request, Response } from 'express';
import { MemoryService, memoryService } from '../services/memoryService';
import { ErrorResponse, MemoryCreateRequest, MemoryUpdateRequest, MemoryMigrateRequest } from '../types/api';
 import { MemoryCategory, MemoryItem, MemorySourceType } from '../../src/types/memory';

const VALID_CATEGORIES: string[] = ['preference', 'fact', 'project', 'instruction', 'entity'];

function isValidCategory(cat: string): cat is MemoryCategory {
  return VALID_CATEGORIES.includes(cat);
}

function validateMemoryInput(body: any, isUpdate: boolean = false): string | null {
  if (!isUpdate && (!body.concept || typeof body.concept !== 'string' || body.concept.trim().length === 0)) {
    return 'Concept is required.';
  }
  if (!isUpdate && (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0)) {
    return 'Content is required.';
  }
  if (body.category && !isValidCategory(body.category)) {
    return `Invalid category. Valid categories: ${VALID_CATEGORIES.join(', ')}`;
  }
  if (body.confidence !== undefined && (typeof body.confidence !== 'number' || body.confidence < 0 || body.confidence > 1)) {
    return 'Confidence must be a number between 0 and 1.';
  }
  if (body.importance !== undefined && (typeof body.importance !== 'number' || body.importance < 0 || body.importance > 1)) {
    return 'Importance must be a number between 0 and 1.';
  }
  if (body.lifespan && !['permanent', 'long_term', 'short_term', 'temporary'].includes(body.lifespan)) {
    return 'Invalid lifespan value.';
  }
  if (body.tags && (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== 'string'))) {
    return 'Tags must be an array of strings.';
  }
  if (body.content && typeof body.content === 'string' && body.content.length > 10000) {
    return 'Content is too long (max 10000 characters).';
  }
  if (body.concept && typeof body.concept === 'string' && body.concept.length > 200) {
    return 'Concept is too long (max 200 characters).';
  }
  return null;
}

export async function listMemoriesHandler(req: Request, res: Response) {
  try {
    const memories = memoryService.getAllMemories();
    res.json(memories);
  } catch (err: any) {
    console.error('[DOTVEX] List memories error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function getMemoryHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id || id.length > 256) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Valid memory ID is required.' } });
    return;
  }

  try {
    const memory = memoryService.getMemory(id);
    if (!memory) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Memory not found.' } });
      return;
    }
    res.json(memory);
  } catch (err: any) {
    console.error('[DOTVEX] Get memory error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function createMemoryHandler(req: Request, res: Response) {
  const body = req.body as MemoryCreateRequest;
  const error = validateMemoryInput(body);
  if (error) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: error } });
    return;
  }

  try {
    const memory = memoryService.createMemory({
         concept: body.concept,
         category: body.category as MemoryCategory,
         content: body.content,
         confidence: body.confidence,
         importance: body.importance,
         lifespan: body.lifespan as any,
        tags: body.tags,
        sourceConversationId: body.sourceConversationId,
        sourceType: body.sourceType as any,
        evidenceCount: body.evidenceCount,
    });
    res.status(201).json(memory);
  } catch (err: any) {
    console.error('[DOTVEX] Create memory error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function updateMemoryHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id || id.length > 256) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Valid memory ID is required.' } });
    return;
  }

  const body = req.body as MemoryUpdateRequest;
  const error = validateMemoryInput(body, true);
  if (error) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: error } });
    return;
  }

  try {
    const existing = memoryService.getMemory(id);
    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Memory not found.' } });
      return;
    }

    const updateData: Partial<Omit<MemoryItem, 'id' | 'createdAt'>> = {};
    if (body.concept !== undefined) updateData.concept = body.concept;
    if (body.category !== undefined) updateData.category = body.category as MemoryCategory;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.confidence !== undefined) updateData.confidence = body.confidence;
    if (body.importance !== undefined) updateData.importance = body.importance;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.sourceConversationId !== undefined) updateData.sourceConversationId = body.sourceConversationId;
    if (body.lifespan !== undefined) (updateData as any).lifespan = body.lifespan;
    if (body.sourceType !== undefined) (updateData as any).sourceType = body.sourceType as MemorySourceType;
    if (body.evidenceCount !== undefined) (updateData as any).evidenceCount = body.evidenceCount;
    if (body.lastConfirmedAt !== undefined) (updateData as any).lastConfirmedAt = body.lastConfirmedAt;
    if (body.lastContradictedAt !== undefined) (updateData as any).lastContradictedAt = body.lastContradictedAt;

    const success = memoryService.updateMemory(id, updateData);
    if (!success) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Memory not found.' } });
      return;
    }

    const updated = memoryService.getMemory(id);
    res.json(updated);
  } catch (err: any) {
    console.error('[DOTVEX] Update memory error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function deleteMemoryHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id || id.length > 256) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Valid memory ID is required.' } });
    return;
  }

  try {
    const deleted = memoryService.deleteMemory(id);
    if (!deleted) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Memory not found.' } });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    console.error('[DOTVEX] Delete memory error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function deleteAllMemoriesHandler(req: Request, res: Response) {
  try {
    const deleted = memoryService.clearAllMemories();
    res.json({ deleted });
  } catch (err: any) {
    console.error('[DOTVEX] Delete all memories error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function memoryStatsHandler(req: Request, res: Response) {
  try {
    const stats = memoryService.getStats();
    res.json(stats);
  } catch (err: any) {
    console.error('[DOTVEX] Memory stats error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function migrateMemoriesHandler(req: Request, res: Response) {
  const body = req.body as MemoryMigrateRequest;
  if (!body.memories || !Array.isArray(body.memories) || body.memories.length === 0) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Memories array is required.' } });
    return;
  }

  try {
    const result = memoryService.migrateFromLocalStorage(body.memories);
    res.json({ imported: result.imported, skipped: result.skipped });
  } catch (err: any) {
    console.error('[DOTVEX] Migrate memories error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function memorySearchHandler(req: Request, res: Response) {
  const { q } = req.query;
  if (typeof q !== 'string' || q.trim().length === 0) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Search query is required.' } });
    return;
  }

  try {
    const memories = memoryService.getAllMemories();
    const qLower = q.toLowerCase();
    const results = memories.filter(
      (m) =>
        m.concept.toLowerCase().includes(qLower) ||
        m.content.toLowerCase().includes(qLower) ||
        m.tags.some((t) => t.toLowerCase().includes(qLower))
    );
    res.json(results);
  } catch (err: any) {
    console.error('[DOTVEX] Memory search error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function userUnderstandingHandler(req: Request, res: Response) {
  try {
    const profile = memoryService.getUserUnderstandingProfile();
    res.json(profile);
  } catch (err: any) {
    console.error('[DOTVEX] User understanding error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function communicationStyleHandler(req: Request, res: Response) {
  try {
    const profile = memoryService.getUserUnderstandingProfile();
    res.json({
      communicationStyle: profile.communicationStyle,
      communicationStyleCount: profile.communicationStyle.length,
    });
  } catch (err: any) {
    console.error('[DOTVEX] Communication style error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function preferencesHandler(req: Request, res: Response) {
  try {
    const profile = memoryService.getUserUnderstandingProfile();
    res.json({
      preferences: profile.preferences,
      preferencesCount: profile.preferences.length,
    });
  } catch (err: any) {
    console.error('[DOTVEX] Preferences error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}

export async function learningEventsHandler(req: Request, res: Response) {
  try {
    const memoryId = req.params.memoryId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    if (memoryId) {
      const events = memoryService.getLearningEvents(memoryId, limit);
      res.json(events);
    } else {
      const events = memoryService.getAllLearningEvents(undefined, limit);
      res.json(events);
    }
  } catch (err: any) {
    console.error('[DOTVEX] Learning events error:', err);
    const errorResponse: ErrorResponse = {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    };
    res.status(500).json(errorResponse);
  }
}
