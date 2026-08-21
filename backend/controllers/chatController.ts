import { Request, Response } from 'express';
import { aiService, AIServiceNotConfiguredError, AIServiceUnavailableError } from '../services/aiService';
import { conversationService } from '../services/conversationService';
import { memoryService } from '../services/memoryService';
import { AIMessage, AIProviderConfig } from '../ai/provider';
import { ChatRequest, ChatSuccessResponse, ErrorResponse } from '../types/api';
import { ChatMessage } from '../../src/types/chat';
import { CustomInstructions as ApiCustomInstructions } from '../types/api';
import { logger } from '../utils/logger';

function buildCustomInstructionsText(customInstructions?: ApiCustomInstructions): string {
  if (!customInstructions) return '';

  const parts: string[] = [];

  if (customInstructions.aboutUser) {
    parts.push(`ABOUT THE USER:\n${customInstructions.aboutUser}`);
  }

  if (customInstructions.responseStyle) {
    parts.push(`RESPONSE STYLE GUIDELINES:\n${customInstructions.responseStyle}`);
  }

  if (customInstructions.traits && customInstructions.traits.length > 0) {
    parts.push(`EXPERTISE TRAITS:\n${customInstructions.traits.join(', ')}`);
  }

  if (parts.length === 0) return '';

  return `CUSTOM INSTRUCTIONS:\n${parts.join('\n\n')}`;
}

function validateId(id: string | undefined): boolean {
  return typeof id === 'string' && id.length > 0 && id.length <= 256;
}

function validateRole(role: string | undefined): boolean {
  return role === 'user' || role === 'assistant' || role === 'system';
}

export async function chatHandler(req: Request, res: Response) {
  const body = req.body as ChatRequest;

  const message = body.message || body.userMessage;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INVALID_REQUEST',
        message: 'Missing or empty field: message or userMessage.',
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  if (message.length > 100000) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INVALID_REQUEST',
        message: 'Message content is too long (max 100000 characters).',
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  const conversationId = body.conversationId || undefined;
  if (conversationId && !validateId(conversationId)) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INVALID_REQUEST',
        message: 'Invalid conversation ID.',
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  const modelId = body.modelId ?? 'dotvex-2.0-pro';
  const enableThinking = body.enableThinking ?? true;
  const enableWebSearch = body.enableWebSearch ?? false;
  const systemPrompt = body.systemPrompt ?? '';
  const temperature = body.temperature ?? 0.7;
  const topP = body.topP ?? 0.9;
  const maxTokens = body.maxTokens ?? 128;
  const customInstructions = body.customInstructions;

  const aiMessages: AIMessage[] = [];

  if (systemPrompt) {
    aiMessages.push({ role: 'system', content: systemPrompt });
  }

  if (body.messages) {
    for (const msg of body.messages) {
      if (!validateRole(msg.role)) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'INVALID_REQUEST',
            message: `Invalid message role: ${msg.role}.`,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }
      if (!msg.content || typeof msg.content !== 'string' || msg.content.trim().length === 0) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Message content cannot be empty.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }
      aiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  aiMessages.push({ role: 'user', content: message });

  const options: AIProviderConfig = {
    modelId,
    temperature,
    topP,
    maxTokens,
    enableThinking,
    enableWebSearch,
    systemPrompt,
  };

  try {
    const memoryContext = memoryService.buildMemoryContext(message);
    let contextText = memoryContext.contextText;

    if (memoryContext.personalizationContext?.contextText) {
      contextText = contextText
        ? `${contextText}\n\n${memoryContext.personalizationContext.contextText}`
        : memoryContext.personalizationContext.contextText;
    }

    const customInstrText = buildCustomInstructionsText(customInstructions);

    let combinedSystemPrompt = systemPrompt || '';
    if (contextText) {
      combinedSystemPrompt = combinedSystemPrompt
        ? `${combinedSystemPrompt}\n\n${contextText}`
        : contextText;
    }
    if (customInstrText) {
      combinedSystemPrompt = combinedSystemPrompt
        ? `${combinedSystemPrompt}\n\n${customInstrText}`
        : customInstrText;
    }

    if (combinedSystemPrompt) {
      options.systemPrompt = combinedSystemPrompt;
    }
  } catch (err: any) {
    console.error('[DOTVEX] Memory context build error:', err.message);
  }

  const resolvedConversationId = conversationService.ensureConversation(conversationId).id;

  const userMessage: ChatMessage = {
    id: 'usr_' + Date.now(),
    conversationId: resolvedConversationId,
    role: 'user',
    content: message,
    timestamp: Date.now(),
    status: 'completed',
    modelName: modelId,
  };

  try {
    conversationService.saveMessage(userMessage);
  } catch (err: any) {
    console.error('[DOTVEX] Failed to save user message:', err.message);
  }

  try {
    const commandResult = memoryService.handleMemoryCommands(message);
    if (commandResult.handled) {
      const assistantMessage: ChatMessage = {
        id: 'ast_' + Date.now(),
        conversationId: resolvedConversationId,
        role: 'assistant',
        content: commandResult.response,
        timestamp: Date.now(),
        status: 'completed',
        modelName: modelId,
      };

      try {
        conversationService.saveMessage(assistantMessage);
      } catch (err: any) {
        console.error('[DOTVEX] Failed to save assistant message:', err.message);
      }

      res.json({
        text: commandResult.response,
        conversationId: resolvedConversationId,
        modelName: modelId,
      });
      return;
    }
  } catch (err: any) {
    console.error('[DOTVEX] Memory command handling error:', err.message);
  }

  try {
    const genStart = Date.now();
    const result = await aiService.generate(aiMessages, options);
    const genTimeMs = Date.now() - genStart;

    logger.info('CHAT REQUEST', {
      model: modelId,
      generationTimeMs: genTimeMs,
      conversationId: resolvedConversationId,
    });

    const assistantMessage: ChatMessage = {
      id: 'ast_' + Date.now(),
      conversationId: resolvedConversationId,
      role: 'assistant',
      content: result.text,
      timestamp: Date.now(),
      status: 'completed',
      modelName: modelId,
    };

    try {
      conversationService.saveMessage(assistantMessage);
    } catch (err: any) {
      console.error('[DOTVEX] Failed to save assistant message:', err.message);
    }

    try {
      memoryService.extractWithIntent(message, resolvedConversationId);
    } catch (err: any) {
      console.error('[DOTVEX] Memory extraction error:', err.message);
    }

    const response: ChatSuccessResponse = {
      text: result.text,
      reasoning: result.reasoning,
      modelName: modelId,
      conversationId: resolvedConversationId,
      usage: result.usage,
    };

    res.json(response);
  } catch (err: any) {
    logger.error('Chat generation error', {
      error: err.message || err,
      code: err.code,
      conversationId: resolvedConversationId,
    });

    if (err instanceof AIServiceNotConfiguredError) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: err.message,
        },
      };
      res.status(503).json(errorResponse);
      return;
    }

    if (err instanceof AIServiceUnavailableError) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'AI_UNAVAILABLE',
          message: err.message,
        },
      };
      res.status(503).json(errorResponse);
      return;
    }

    if (err?.code === 'QWEN3_GENERATION_ERROR') {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'AI_UNAVAILABLE',
          message: err.message,
        },
      };
      res.status(503).json(errorResponse);
      return;
    }

    logger.error('Chat controller internal error', { error: err.message || err });
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred while processing the chat request.',
      },
    };
    res.status(500).json(errorResponse);
  }
}
