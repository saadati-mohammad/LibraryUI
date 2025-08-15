import { Message } from './message.model';

export interface ChatState {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  searchActive: boolean;
  searchResults: number[]; // آرایه‌ای از ID های پیام‌های یافت شده
  currentSearchIndex: number;
  replyingToMessage?: Message;
  editingMessageId?: number;
  error?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
}