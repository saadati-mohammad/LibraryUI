import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../../environments/environment';

type MessageStatus = 'pending' | 'sent' | 'received' | 'read' | 'failed';

interface MessageDto {
  id: string;
  from: string;
  roomId: string;
  content: string;
  timestamp: number;
  status: MessageStatus;
}

@Component({
  selector: 'app-chat',
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {

  client!: Client;
  subscription?: StompSubscription;

  connected = false;
  username = '';
  currentRoom = '';
  messageText = '';
  isReconnecting = false;

  messages: MessageDto[] = [];
  availableRooms: string[] = ['room-1', 'room-2', 'room-3'];
  
  // برای جلوگیری از duplicate messages
  private processedMessageIds = new Set<string>();
  
  // برای مدیریت timeout پیام‌های pending
  private pendingMessageTimeouts = new Map<string, any>();
  
  // برای retry connection
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  ngOnInit(): void {
    this.initializeClient();
  }

  private initializeClient(): void {
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 5000,
      debug: () => { /* debug off */ },
      onConnect: () => this.handleConnect(),
      onStompError: (frame) => this.handleStompError(frame),
      onDisconnect: () => this.handleDisconnect(),
      onWebSocketError: (error) => this.handleWebSocketError(error)
    });

    this.client.activate();
  }

  private handleConnect(): void {
    console.log('STOMP connected');
    this.connected = true;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    
    // اگر قبلاً username و room تنظیم شده بود، دوباره subscribe کن
    if (this.currentRoom && this.username) {
      this.subscribeToRoom(this.currentRoom);
    }
  }

  private handleStompError(frame: any): void {
    console.error('Broker error: ' + frame.headers['message']);
    this.connected = false;
    this.handleConnectionError();
  }

  private handleDisconnect(): void {
    console.log('STOMP disconnected');
    this.connected = false;
  }

  private handleWebSocketError(error: any): void {
    console.error('WebSocket error:', error);
    this.handleConnectionError();
  }

  private handleConnectionError(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isReconnecting) {
      this.isReconnecting = true;
      this.reconnectAttempts++;
      
      // Mark pending messages as failed
      this.markPendingMessagesAsFailed();
      
      console.log(`Connection error. Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.client.connected) {
          this.client.activate();
        }
      }, 2000 * this.reconnectAttempts); // exponential backoff
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.markPendingMessagesAsFailed();
    }
  }

  private markPendingMessagesAsFailed(): void {
    this.messages.forEach(msg => {
      if (msg.status === 'pending') {
        msg.status = 'failed';
      }
    });
    
    // Clear all pending timeouts
    this.pendingMessageTimeouts.forEach(timeout => clearTimeout(timeout));
    this.pendingMessageTimeouts.clear();
  }

  connectAs(username: string): void {
    this.username = username;
    if (this.currentRoom && this.connected) {
      this.subscribeToRoom(this.currentRoom);
    }
  }

  subscribeToRoom(roomId: string): void {
    // اگر هنوز متصل نیست، منتظر اتصال باش
    if (!this.client.connected) {
      console.warn('Waiting for STOMP connection...');
      // کد موجود در handleConnect این کار را انجام خواهد داد
      return;
    }

    // Unsubscribe از room قبلی
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }

    // Clear messages و processed IDs برای room جدید
    this.messages = [];
    this.processedMessageIds.clear();
    this.currentRoom = roomId;

    const dest = `/topic/rooms/${roomId}`;
    
    try {
      this.subscription = this.client.subscribe(dest, (msg: IMessage) => {
        this.handleIncomingMessage(msg);
      });
      
      console.log(`Subscribed to room: ${roomId}`);
    } catch (error) {
      console.error('Error subscribing to room:', error);
    }
  }

  private handleIncomingMessage(msg: IMessage): void {
    try {
      const incoming = JSON.parse(msg.body) as MessageDto;
      
      // جلوگیری از پردازش پیام‌های تکراری
      if (this.processedMessageIds.has(incoming.id)) {
        return;
      }
      
      this.processedMessageIds.add(incoming.id);

      // بررسی وجود پیام با همان id در لیست local
      const index = this.messages.findIndex(m => m.id === incoming.id);
      
      if (index !== -1) {
        // پیام قبلی وجود دارد، وضعیت و محتوای آن را آپدیت کن
        const currentMessage = this.messages[index];
        
        if (incoming.from === this.username) {
          // پیام از خود کاربر - تأیید ارسال موفق
          this.messages[index] = { ...currentMessage, ...incoming, status: 'sent' };
          
          // حذف timeout برای این پیام
          const timeoutId = this.pendingMessageTimeouts.get(incoming.id);
          if (timeoutId) {
            clearTimeout(timeoutId);
            this.pendingMessageTimeouts.delete(incoming.id);
          }
        } else {
          // پیام از کاربر دیگر
          this.messages[index] = { ...currentMessage, ...incoming, status: 'received' };
        }
      } else {
        // پیام جدید
        const status: MessageStatus = (incoming.from === this.username) ? 'sent' : 'received';
        this.messages.push({ ...incoming, status });
      }

      // اسکرول به پایین برای نمایش آخرین پیام
      this.scrollToBottom();
      
    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }

  sendMessage(): void {
    if (!this.username || !this.currentRoom || !this.messageText.trim() || !this.connected) {
      return;
    }

    const messageId = uuidv4();
    const newMessage: MessageDto = {
      id: messageId,
      from: this.username,
      roomId: this.currentRoom,
      content: this.messageText.trim(),
      timestamp: Date.now(),
      status: 'pending'
    };

    // پیام را به لیست اضافه کن با وضعیت pending (برای نمایش فوری)
    this.messages.push(newMessage);
    
    // تنظیم timeout برای تغییر وضعیت به failed در صورت عدم تأیید
    const timeoutId = setTimeout(() => {
      const msgIndex = this.messages.findIndex(m => m.id === messageId);
      if (msgIndex !== -1 && this.messages[msgIndex].status === 'pending') {
        this.messages[msgIndex].status = 'failed';
      }
      this.pendingMessageTimeouts.delete(messageId);
    }, 10000); // 10 seconds timeout
    
    this.pendingMessageTimeouts.set(messageId, timeoutId);

    try {
      // ارسال پیام به سرور
      this.client.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(newMessage)
      });
      
      this.messageText = '';
      this.scrollToBottom();
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // در صورت خطا، پیام را به عنوان failed علامت‌گذاری کن
      const msgIndex = this.messages.findIndex(m => m.id === messageId);
      if (msgIndex !== -1) {
        this.messages[msgIndex].status = 'failed';
      }
      
      // حذف timeout
      clearTimeout(timeoutId);
      this.pendingMessageTimeouts.delete(messageId);
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatWindow = document.querySelector('.chat-window');
      if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    }, 10);
  }

  createRoom(): void {
    const newRoom = `room-${Math.floor(Math.random() * 10000)}`;
    this.availableRooms.push(newRoom);
    this.subscribeToRoom(newRoom);
  }

  // متد برای retry ارسال پیام‌های failed
  retryFailedMessage(messageId: string): void {
    const msgIndex = this.messages.findIndex(m => m.id === messageId);
    if (msgIndex !== -1 && this.messages[msgIndex].status === 'failed') {
      const message = this.messages[msgIndex];
      
      // تغییر وضعیت به pending
      this.messages[msgIndex].status = 'pending';
      
      try {
        this.client.publish({
          destination: '/app/chat.send',
          body: JSON.stringify(message)
        });
        
        // تنظیم timeout جدید
        const timeoutId = setTimeout(() => {
          const currentMsgIndex = this.messages.findIndex(m => m.id === messageId);
          if (currentMsgIndex !== -1 && this.messages[currentMsgIndex].status === 'pending') {
            this.messages[currentMsgIndex].status = 'failed';
          }
          this.pendingMessageTimeouts.delete(messageId);
        }, 10000);
        
        this.pendingMessageTimeouts.set(messageId, timeoutId);
        
      } catch (error) {
        console.error('Error retrying message:', error);
        this.messages[msgIndex].status = 'failed';
      }
    }
  }

  ngOnDestroy(): void {
    // تمیز کردن تمام منابع
    this.processedMessageIds.clear();
    
    // حذف تمام timeouts
    this.pendingMessageTimeouts.forEach(timeout => clearTimeout(timeout));
    this.pendingMessageTimeouts.clear();
    
    // بستن subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
    
    // بستن client
    if (this.client) {
      this.client.deactivate();
    }
  }
}