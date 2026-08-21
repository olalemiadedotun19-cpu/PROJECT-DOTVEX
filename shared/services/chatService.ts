import { ApiClient } from './apiClient';
import { ChatMessage, GenerationChunk, SendMessageOptions, MessageStatus } from '../types/chat';
import { ChatRequest, ChatSuccessResponse } from '../types/api';

export class ChatService {
  private client: ApiClient;
  private abortControllers = new Map<string, AbortController>();

  constructor(client: ApiClient) {
    this.client = client;
  }

  setClient(client: ApiClient): void {
    this.client = client;
  }

  async sendMessage(options: SendMessageOptions): Promise<void> {
    const {
      conversationId,
      userMessage,
      historyMessages = [],
      attachments = [],
      modelId = 'dotvex-2.0-pro',
      enableThinking = true,
      enableWebSearch = false,
      systemPrompt,
      customInstructions,
      temperature = 0.7,
      topP = 0.95,
      maxTokens = 4096,
      onChunk,
      onStatusChange,
    } = options;

    const controller = new AbortController();
    let isUserStopped = false;
    this.abortControllers.set(conversationId, {
      abort: () => {
        isUserStopped = true;
        controller.abort();
      },
    } as any);

    try {
      onStatusChange?.('thinking');

      const body: ChatRequest = {
        conversationId,
        message: userMessage,
        messages: historyMessages
          .filter((m) => m.content?.trim())
          .map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
        attachments,
        modelId,
        enableThinking,
        enableWebSearch,
        systemPrompt,
        customInstructions,
        temperature,
        topP,
        maxTokens,
      };

      const response = await fetch(`${this.client.getBaseUrl()}/api/chat`, {
        method: 'POST',
        headers: this.buildHeaders(),
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = 'An error occurred while communicating with the DOTVEX backend.';
        try {
          const errorData = await response.json();
          if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // Use default error message
        }
        onStatusChange?.('error');
        onChunk({
          text: errorMessage,
          reasoning: '',
          isComplete: true,
          status: 'error',
        });
        return;
      }

      const data: ChatSuccessResponse = await response.json();

      if (isUserStopped) {
        onStatusChange?.('stopped');
        return;
      }

      onStatusChange?.('generating');
      onChunk({
        text: data.text || '',
        reasoning: data.reasoning || '',
        isComplete: true,
        status: 'completed',
      });
      onStatusChange?.('completed');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onStatusChange?.('stopped');
      } else {
        console.error('Chat error:', err);
        onStatusChange?.('error');
        onChunk({
          text: 'An error occurred while connecting to the DOTVEX backend.',
          reasoning: '',
          isComplete: true,
          status: 'error',
        });
      }
    } finally {
      this.abortControllers.delete(conversationId);
    }
  }

  stopGeneration(conversationId: string): void {
    const controller = this.abortControllers.get(conversationId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(conversationId);
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    return headers;
  }
}
