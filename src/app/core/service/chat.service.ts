import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatState } from '../model/chat-state.model';
import { Message } from '../model/message.model';


@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private initialState: ChatState = {
    messages: [],
    loading: false,
    hasMore: true,
    searchActive: false,
    searchResults: [],
    currentSearchIndex: -1,
    connectionStatus: 'disconnected'
  };

  private chatStateSubject = new BehaviorSubject<ChatState>(this.initialState);
  public chatState$ = this.chatStateSubject.asObservable();

  constructor() {}

  // دریافت state فعلی
  getCurrentState(): ChatState {
    return this.chatStateSubject.value;
  }

  // به‌روزرسانی کامل state
  updateState(newState: Partial<ChatState>): void {
    const currentState = this.chatStateSubject.value;
    this.chatStateSubject.next({ ...currentState, ...newState });
  }

  // تنظیم وضعیت بارگذاری
  setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  // تنظیم وضعیت hasMore
  setHasMore(hasMore: boolean): void {
    this.updateState({ hasMore });
  }

  // تنظیم پیام‌ها
  setMessages(messages: Message[]): void {
    this.updateState({ messages });
  }

  // اضافه کردن پیام جدید
  addMessage(message: Message): void {
    const currentState = this.getCurrentState();
    const updatedMessages = [...currentState.messages, message];
    this.updateState({ messages: updatedMessages });
  }

  // به‌روزرسانی پیام موجود
  updateMessage(messageId: number, updates: Partial<Message>): void {
    const currentState = this.getCurrentState();
    const updatedMessages = currentState.messages.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
    this.updateState({ messages: updatedMessages });
  }

  // حذف پیام
  deleteMessage(messageId: number): void {
    const currentState = this.getCurrentState();
    const updatedMessages = currentState.messages.map(msg =>
      msg.id === messageId 
        ? { ...msg, deleted: true, deleteDate: new Date(), message: '' } 
        : msg
    );
    this.updateState({ messages: updatedMessages });
  }

  // تنظیم پیام برای پاسخ
  setReplyingToMessage(message?: Message): void {
    this.updateState({ replyingToMessage: message });
  }

  // تنظیم پیام برای ویرایش
  setEditingMessage(messageId?: number): void {
    this.updateState({ editingMessageId: messageId });
  }

  // تنظیم نتایج جستجو
  setSearchResults(results: number[], active: boolean = true): void {
    this.updateState({ 
      searchResults: results, 
      searchActive: active,
      currentSearchIndex: results.length > 0 ? 0 : -1
    });
  }

  // تنظیم ایندکس جستجوی فعلی
  setCurrentSearchIndex(index: number): void {
    this.updateState({ currentSearchIndex: index });
  }

  // پاک کردن جستجو
  clearSearch(): void {
    this.updateState({ 
      searchResults: [], 
      searchActive: false,
      currentSearchIndex: -1
    });
  }

  // تنظیم وضعیت اتصال
  setConnectionStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
    this.updateState({ connectionStatus: status });
  }

  // تنظیم خطا
  setError(error?: string): void {
    this.updateState({ error });
  }

  // پاک کردن خطا
  clearError(): void {
    this.updateState({ error: undefined });
  }

  // ریست کردن state
  resetState(): void {
    this.chatStateSubject.next(this.initialState);
  }

  // جستجوی محلی در پیام‌ها
  searchInMessages(query: string, filters?: {
    sender?: string;
    subject?: string;
    priority?: string;
    startDate?: Date;
    endDate?: Date;
  }): number[] {
    const currentState = this.getCurrentState();
    const queryLower = query.toLowerCase();
    
    const matchingIds = currentState.messages
      .filter(msg => {
        if (msg.deleted) return false;
        
        // جستجو در محتوای پیام
        const messageMatch = !query || msg.message.toLowerCase().includes(queryLower);
        
        // فیلتر بر اساس فرستنده
        const senderMatch = !filters?.sender || 
          msg.sender.toLowerCase().includes(filters.sender.toLowerCase()) ||
          msg.senderFarsiTitle.toLowerCase().includes(filters.sender.toLowerCase());
        
        // فیلتر بر اساس موضوع
        const subjectMatch = !filters?.subject || msg.subject === filters.subject;
        
        // فیلتر بر اساس اولویت
        const priorityMatch = !filters?.priority || msg.priority === filters.priority;
        
        // فیلتر بر اساس تاریخ
        const dateMatch = (!filters?.startDate || msg.createDate >= filters.startDate) &&
                          (!filters?.endDate || msg.createDate <= filters.endDate);
        
        return messageMatch && senderMatch && subjectMatch && priorityMatch && dateMatch;
      })
      .map(msg => msg.id);
    
    return matchingIds;
  }

  // دریافت پیام بر اساس ID
  getMessageById(messageId: number): Message | undefined {
    const currentState = this.getCurrentState();
    return currentState.messages.find(msg => msg.id === messageId);
  }

  // دریافت آخرین پیام
  getLastMessage(): Message | undefined {
    const currentState = this.getCurrentState();
    return currentState.messages[currentState.messages.length - 1];
  }

  // دریافت تعداد پیام‌ها
  getMessageCount(): number {
    const currentState = this.getCurrentState();
    return currentState.messages.length;
  }

  // دریافت تعداد پیام‌های خوانده نشده
  getUnreadMessageCount(): number {
    const currentState = this.getCurrentState();
    return currentState.messages.filter(msg => 
      msg.type === 'bot' && msg.status !== 'read'
    ).length;
  }
}