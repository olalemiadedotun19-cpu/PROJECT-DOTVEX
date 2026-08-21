import { ChatMessage } from './chat';

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessagePreview?: string;
  isPinned?: boolean;
  projectId?: string;
}

export type ChronologicalGroup = 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Previous 30 Days' | 'Older';

export interface GroupedConversations {
  group: ChronologicalGroup;
  conversations: Conversation[];
}

export interface ProjectFolder {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  conversationIds: string[];
}

export interface ScheduledTask {
  id: string;
  title: string;
  prompt: string;
  runAt: number;
  isRecurring: boolean;
  status: 'pending' | 'completed' | 'cancelled';
  conversationId?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  content: string;
  category: 'code' | 'note' | 'prompt' | 'image';
  createdAt: number;
  tags: string[];
}

export type ConversationWithMessages = Conversation & {
  messages: ChatMessage[];
};
