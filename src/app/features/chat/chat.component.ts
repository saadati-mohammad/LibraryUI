import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';

// WebSocket imports
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { v4 as uuidv4 } from 'uuid';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { SearchService } from '../../core/service/search.service';
import { ChatService } from '../../core/service/chat.service';
import { MessageService } from '../../core/service/message.service';
import { FileAttachment } from '../../core/model/file-attachment.model';
import { ChatState } from '../../core/model/chat-state.model';
import { Message } from '../../core/model/message.model';
import { SearchCriteria } from '../../core/interface/search-criteria.interface';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FileSizePipe } from "../../shared/pipe/file-size.pipe";
import { SafeHtmlPipe } from "../../shared/pipe/safe-html.pipe";

// WebSocket Message interface
interface WebSocketMessage {
    id: string;
    sender: string;
    senderFarsiTitle: string;
    recipient?: string;
    recipientFarsiTitle?: string;
    subject?: string;
    message: string;
    parentMessageId?: string;
    timestamp: number;
    messageType?: 'edit' | 'delete' | 'reply' | 'new' | 'error' | 'sent_confirmation';
    originalMessageId?: string;
    priority?: string;
    nationalCode?: string;
    recipients?: string;
    enableSendSms?: boolean;
    fileAttachment?: FileAttachment;
}

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    standalone: true,
    imports: [FormsModule, CommonModule, FileSizePipe, SafeHtmlPipe],
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
    @ViewChild('chatContainer') chatContainer!: ElementRef;
    @ViewChild('chatInput') chatInput!: ElementRef;
    @ViewChild('fileInput') fileInput!: ElementRef;

    // State management
    chatState: ChatState = {
        messages: [],
        loading: false,
        hasMore: true,
        searchActive: false,
        searchResults: [],
        currentSearchIndex: -1
    };

    // WebSocket properties
    client!: Client;
    subscription?: StompSubscription;
    connected = false;
    currentUsername = ''; // username کاربر فعلی
    currentUserFarsiTitle = ''; // نام فارسی کاربر فعلی
    targetUsername = ''; // username مخاطب
    targetUserFarsiTitle = ''; // نام فارسی مخاطب
    isReconnecting = false;
    private processedMessageIds = new Set<string>();
    private pendingMessageTimeouts = new Map<string, any>();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    // UI state
    showHeaderMenu = false;
    showSearchSection = false;
    showAdvancedSearch = false;
    showAdvancedInput = false;
    showReplyPreview = false;
    showEditPreview = false;
    showContextMenu = false;
    showSearchResultsModal = false;
    showFilePreview = false;

    // Context menu position
    contextMenuPosition = { x: 0, y: 0 };
    selectedMessageForAction?: Message;

    // Search
    searchQuery = '';
    searchSender = '';
    searchSubjects: string = '';
    searchPriority = '';
    searchResults: Message[] = [];

    // Input form
    messageText = '';
    messageSubject = '';
    messagePriority = 'normal';
    nationalCode = '';
    recipients = '';
    enableSendSms = false;
    selectedFile?: File;
    selectedFileName = '';

    // Pagination
    currentPage = 0;
    pageSize = 15;

    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();
    @Output() onCloseDialog: EventEmitter<any> = new EventEmitter<any>();
    isTyping: boolean = false;

    constructor(
        private chatService: ChatService,
        private messageService: MessageService,
        private searchService: SearchService
    ) {
        // تنظیم debounce برای جستجو
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(query => {
            this.performSearch();
        });
    }

    ngOnInit(): void {
        this.initializeChat();
        this.setupSubscriptions();
        this.loadInitialMessages();
        this.initializeWebSocket();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.cleanupWebSocket();
    }

    // WebSocket Methods
    private initializeWebSocket(): void {
        this.getCurrentUserInfo();

        this.client = new Client({
            webSocketFactory: () => new SockJS(environment.wsUrl),
            reconnectDelay: 5000,
            debug: () => { /* debug off */ },
            onConnect: () => this.handleWebSocketConnect(),
            onStompError: (frame) => this.handleStompError(frame),
            onDisconnect: () => this.handleWebSocketDisconnect(),
            onWebSocketError: (error) => this.handleWebSocketError(error)
        });

        this.client.activate();
    }

    private getCurrentUserInfo(): void {
        // دریافت اطلاعات کاربر از سرویس
        this.currentUsername = this.messageService.getCurrentUsername() || 'user_' + Date.now();
        this.currentUserFarsiTitle = this.messageService.getCurrentUserFarsiTitle() || 'کاربر';
        this.targetUsername = this.messageService.getTargetUsername() || 'target_user';
        this.targetUserFarsiTitle = this.messageService.getTargetUserFarsiTitle() || 'مخاطب';
    }

    private handleWebSocketError(wsMessage: WebSocketMessage): void {
        console.error('WebSocket error:', wsMessage.message);

        // پیدا کردن پیام مربوطه و تغییر وضعیت آن به failed
        const messageIndex = this.chatState.messages.findIndex(m =>
            m.status === 'pending' && m.sender === this.currentUsername
        );

        if (messageIndex !== -1) {
            this.chatState.messages[messageIndex].status = 'failed';
        }

        // نمایش خطا به کاربر (می‌توانید toast یا alert استفاده کنید)
        console.warn('خطا در ارسال پیام:', wsMessage.message);
    }
    private handleWebSocketConnect(): void {
        console.log('WebSocket connected');
        this.connected = true;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;

        if (this.currentUsername) {
            this.subscribeToUserMessages(this.currentUsername);
        }
    }

    private handleStompError(frame: any): void {
        console.error('STOMP error:', frame.headers['message']);
        this.connected = false;
        this.handleConnectionError();
    }

    private handleWebSocketDisconnect(): void {
        console.log('WebSocket disconnected');
        this.connected = false;
    }



    private handleConnectionError(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isReconnecting) {
            this.isReconnecting = true;
            this.reconnectAttempts++;

            this.markPendingMessagesAsFailed();

            console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                if (!this.client.connected) {
                    this.client.activate();
                }
            }, 2000 * this.reconnectAttempts);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.markPendingMessagesAsFailed();
        }
    }

    private markPendingMessagesAsFailed(): void {
        this.chatState.messages.forEach(msg => {
            if (msg.status === 'pending') {
                msg.status = 'failed';
            }
        });

        this.pendingMessageTimeouts.forEach(timeout => clearTimeout(timeout));
        this.pendingMessageTimeouts.clear();
    }

    private subscribeToUserMessages(username: string): void {
        if (!this.client.connected) {
            console.warn('WebSocket not connected, waiting...');
            return;
        }

        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }

        this.processedMessageIds.clear();

        const destination = `/topic/user/${username}`;

        try {
            this.subscription = this.client.subscribe(destination, (msg: IMessage) => {
                this.handleIncomingWebSocketMessage(msg);
            });

            console.log(`Subscribed to user messages: ${username}`);
        } catch (error) {
            console.error('Error subscribing to user messages:', error);
        }
    }

    private handleIncomingWebSocketMessage(msg: IMessage): void {
        try {
            const wsMessage = JSON.parse(msg.body) as WebSocketMessage;

            // جلوگیری از پردازش مجدد
            if (this.processedMessageIds.has(wsMessage.id)) {
                return;
            }

            this.processedMessageIds.add(wsMessage.id);
            console.log('Processing WebSocket message:', wsMessage.messageType, wsMessage.id);

            const message = this.convertWebSocketMessageToMessage(wsMessage);

            switch (wsMessage.messageType) {
                case 'sent_confirmation':
                    this.handleSentConfirmation(message, wsMessage);
                    break;
                case 'edit':
                    this.handleEditMessageFromWebSocket(message, wsMessage.originalMessageId);
                    break;
                case 'delete':
                    this.handleDeleteMessageFromWebSocket(wsMessage.originalMessageId);
                    break;
                case 'reply':
                case 'new':
                    this.handleNewMessageFromWebSocket(message, wsMessage);
                    break;
                case 'error':
                    this.handleWebSocketError(wsMessage);
                    break;
                default:
                    this.handleNewMessageFromWebSocket(message, wsMessage);
            }

            this.scrollToBottom();

        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    }
    private handleSentConfirmation(message: Message, wsMessage: WebSocketMessage): void {
        console.log('Handling sent confirmation for:', wsMessage.id);

        const existingIndex = this.chatState.messages.findIndex(m =>
            m.status === 'pending' && m.sender === wsMessage.sender
        );

        if (existingIndex !== -1) {
            this.chatState.messages[existingIndex].status = 'sent';

            const timeoutId = this.pendingMessageTimeouts.get(wsMessage.id);
            if (timeoutId) {
                clearTimeout(timeoutId);
                this.pendingMessageTimeouts.delete(wsMessage.id);
            }
        }
    }

    private convertWebSocketMessageToMessage(wsMessage: WebSocketMessage): Message {
        const isCurrentUser = wsMessage.sender === this.currentUsername;

        return {
            id: parseInt(wsMessage.id.split('_')[1]) || Date.now(),
            sender: wsMessage.sender,
            senderFarsiTitle: wsMessage.senderFarsiTitle,
            subject: wsMessage.subject,
            message: wsMessage.message,
            isActive: true,
            parentMessageId: wsMessage.parentMessageId ? parseInt(wsMessage.parentMessageId) : undefined,
            createDate: new Date(wsMessage.timestamp),
            enableSendSms: wsMessage.enableSendSms || false,

            // فیلدهای محاسبه شده برای UI
            type: isCurrentUser ? 'user' : 'bot',
            author: isCurrentUser ? this.currentUserFarsiTitle : wsMessage.senderFarsiTitle,
            time: new Date(wsMessage.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(wsMessage.timestamp),
            deleted: false,
            edited: false,
            priority: (wsMessage.priority as any) || 'normal',
            nationalCode: wsMessage.nationalCode,
            recipients: wsMessage.recipients,
            replyTo: wsMessage.parentMessageId ? parseInt(wsMessage.parentMessageId) : undefined,
            file: wsMessage.fileAttachment,
            status: isCurrentUser ? 'sent' : 'received'
        };
    }

    private handleNewMessageFromWebSocket(message: Message, wsMessage: WebSocketMessage): void {
        const existingIndex = this.chatState.messages.findIndex(m => m.id === message.id);

        if (existingIndex !== -1) {
            // اگر پیام از فرستنده فعلی است، فقط وضعیت را به‌روزرسانی کن
            if (wsMessage.sender === this.currentUsername) {
                this.chatState.messages[existingIndex].status = 'sent';

                const timeoutId = this.pendingMessageTimeouts.get(wsMessage.id);
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    this.pendingMessageTimeouts.delete(wsMessage.id);
                }
            }
            // اگر از مخاطب است، پیام را اضافه کن
            else {
                this.chatState.messages[existingIndex] = { ...this.chatState.messages[existingIndex], ...message, status: 'received' };
            }
        } else {
            // فقط پیام‌های مخاطب را اضافه کن (نه پیام‌های خودمان)
            if (wsMessage.sender !== this.currentUsername) {
                this.addMessageToChat(message);
            }
        }
    }

    private handleEditMessageFromWebSocket(message: Message, originalMessageId?: string): void {
        if (!originalMessageId) return;

        const messageIndex = this.chatState.messages.findIndex(m => m.id.toString() === originalMessageId);
        if (messageIndex > -1) {
            this.chatState.messages[messageIndex] = {
                ...this.chatState.messages[messageIndex],
                message: message.message,
                edited: true,
                modifyDate: new Date()
            };
            this.messageService.updateMessages(this.chatState.messages);
        }
    }

    private handleDeleteMessageFromWebSocket(originalMessageId?: string): void {
        if (!originalMessageId) return;

        const messageIndex = this.chatState.messages.findIndex(m => m.id.toString() === originalMessageId);
        if (messageIndex > -1) {
            this.chatState.messages[messageIndex].deleted = true;
            this.chatState.messages[messageIndex].deleteDate = new Date();
            this.chatState.messages[messageIndex].message = '';
            this.messageService.updateMessages(this.chatState.messages);
        }
    }

    private handleReplyMessageFromWebSocket(message: Message): void {
        this.addMessageToChat(message);
    }

    private cleanupWebSocket(): void {
        this.processedMessageIds.clear();

        this.pendingMessageTimeouts.forEach(timeout => clearTimeout(timeout));
        this.pendingMessageTimeouts.clear();

        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }

        if (this.client) {
            this.client.deactivate();
        }
    }

    // Enhanced methods
    private initializeChat(): void {
        this.focusInput();
    }

    private setupSubscriptions(): void {
        this.chatService.chatState$
            .pipe(takeUntil(this.destroy$))
            .subscribe(state => {
                this.chatState = state;
            });
    }

    private loadInitialMessages(): void {
        this.chatService.setLoading(true);

        // ارسال درخواست برای پیام‌های بین کاربر فعلی و مخاطب
        const criteria = {
            senderUsername: this.currentUsername,
            recipientUsername: this.targetUsername,
            page: this.currentPage,
            size: this.pageSize
        };

        this.messageService.getConversationMessages(criteria)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    const mappedMessages = response.data.map((msg: any) => this.mapBackendMessageToFrontend(msg));
                    this.chatState.messages = mappedMessages;
                    this.chatState.hasMore = Boolean(response.hasMore);
                    this.messageService.updateMessages(mappedMessages);
                    this.chatService.setLoading(false);

                    setTimeout(() => this.scrollToBottom(), 100);
                },
                error: (error) => {
                    console.error('Error loading messages:', error);
                    this.chatService.setLoading(false);
                    this.loadMockMessages();
                }
            });
    }

    private mapBackendMessageToFrontend(backendMessage: any): Message {
        const isCurrentUser = backendMessage.sender === this.currentUsername;

        return {
            id: backendMessage.id,
            sender: backendMessage.sender,
            senderFarsiTitle: backendMessage.senderFarsiTitle,
            subject: backendMessage.subject,
            message: backendMessage.message,
            isActive: backendMessage.isActive,
            parentMessage: backendMessage.parentMessage,
            parentMessageId: backendMessage.parentMessage?.id,
            dataState: backendMessage.dataState,
            createUser: backendMessage.createUser,
            createDate: new Date(backendMessage.createDate),
            modifyUser: backendMessage.modifyUser,
            modifyDate: backendMessage.modifyDate ? new Date(backendMessage.modifyDate) : undefined,
            deleteUser: backendMessage.deleteUser,
            deleteDate: backendMessage.deleteDate ? new Date(backendMessage.deleteDate) : undefined,
            enableSendSms: backendMessage.enableSendSms,

            // فیلدهای محاسبه شده برای UI
            type: isCurrentUser ? 'user' : 'bot',
            author: isCurrentUser ? this.currentUserFarsiTitle : backendMessage.senderFarsiTitle,
            time: new Date(backendMessage.createDate).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(backendMessage.createDate),
            deleted: !!backendMessage.deleteDate,
            edited: !!backendMessage.modifyDate,
            priority: 'normal',
            replyTo: backendMessage.parentMessage?.id,
            status: 'sent'
        };
    }

    loadOlderMessages(): void {
        if (this.chatState.loading || !this.chatState.hasMore) {
            return;
        }

        this.chatService.setLoading(true);
        this.currentPage++;

        const criteria = {
            senderUsername: this.currentUsername,
            recipientUsername: this.targetUsername,
            page: this.currentPage,
            size: this.pageSize
        };

        this.messageService.getConversationMessages(criteria)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    const oldScrollHeight = this.chatContainer.nativeElement.scrollHeight;

                    const mappedMessages = response.data.map((msg: any) => this.mapBackendMessageToFrontend(msg));
                    this.chatState.messages = [...mappedMessages, ...this.chatState.messages];
                    this.chatState.hasMore = Boolean(response.hasMore);
                    this.messageService.updateMessages(this.chatState.messages);

                    setTimeout(() => {
                        const newScrollHeight = this.chatContainer.nativeElement.scrollHeight;
                        this.chatContainer.nativeElement.scrollTop = newScrollHeight - oldScrollHeight;
                    }, 50);

                    this.chatService.setLoading(false);
                },
                error: (error) => {
                    console.error('Error loading older messages:', error);
                    this.chatService.setLoading(false);
                }
            });
    }

    // Enhanced sendMessage with WebSocket
    sendMessage(): void {
        // اگر در حالت ویرایش هستیم، پیام را به‌روزرسانی کن
        if (this.chatState.editingMessageId) {
            this.updateMessage();
            return;
        }

        const text = this.messageText.trim();
        if (!text && !this.selectedFile) {
            return;
        }

        // بررسی اینکه آیا در حال پاسخ دادن هستیم
        const isReplyMessage = !!this.chatState.replyingToMessage;

        console.log('Sending message:', { text, isReply: isReplyMessage });

        if (this.selectedFile) {
            this.uploadFileAndSendMessage(text);
        } else {
            this.sendTextMessage(text);
        }
    }


    private sendTextMessage(text: string): void {
        const messageId = uuidv4();
        const timestamp = Date.now();
        const replyToMessage = this.chatState.replyingToMessage;

        console.log('Sending text message with reply to:', replyToMessage?.id);

        // ایجاد پیام محلی
        const localMessage: Message = {
            id: parseInt(messageId.split('-')[0], 16) || timestamp,
            sender: this.currentUsername,
            senderFarsiTitle: this.currentUserFarsiTitle,
            subject: this.messageSubject || undefined,
            message: text,
            isActive: true,
            parentMessageId: replyToMessage?.id,
            createDate: new Date(timestamp),
            enableSendSms: this.enableSendSms,

            // فیلدهای UI
            type: 'user',
            author: this.currentUserFarsiTitle,
            time: new Date(timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(timestamp),
            deleted: false,
            edited: false,
            priority: this.messagePriority as any,
            nationalCode: this.nationalCode || undefined,
            recipients: this.recipients || undefined,
            replyTo: replyToMessage?.id,
            status: 'pending'
        };

        this.addMessageToChat(localMessage);

        // ایجاد پیام WebSocket
        const wsMessage: WebSocketMessage = {
            id: messageId,
            sender: this.currentUsername,
            senderFarsiTitle: this.currentUserFarsiTitle,
            recipient: this.targetUsername,
            recipientFarsiTitle: this.targetUserFarsiTitle,
            subject: this.messageSubject || undefined,
            message: text,
            parentMessageId: replyToMessage?.id?.toString(),
            timestamp,
            messageType: replyToMessage ? 'reply' : 'new',
            priority: this.messagePriority !== 'normal' ? this.messagePriority : undefined,
            nationalCode: this.nationalCode || undefined,
            recipients: this.recipients || undefined,
            enableSendSms: this.enableSendSms
        };

        // ارسال WebSocket
        this.sendWebSocketMessage(wsMessage, localMessage);

        // پاک کردن فرم و حالت‌ها
        this.clearInputForm();
        this.scrollToBottom();
    }

    private sendWebSocketMessage(wsMessage: WebSocketMessage, localMessage: Message): void {
        // تنظیم timeout
        const timeoutId = setTimeout(() => {
            const msgIndex = this.chatState.messages.findIndex(m => m.id === localMessage.id);
            if (msgIndex !== -1 && this.chatState.messages[msgIndex].status === 'pending') {
                this.chatState.messages[msgIndex].status = 'failed';
            }
            this.pendingMessageTimeouts.delete(wsMessage.id);
        }, 10000);

        this.pendingMessageTimeouts.set(wsMessage.id, timeoutId);

        // ارسال از طریق WebSocket
        if (this.connected && this.client) {
            try {
                console.log('Sending via WebSocket:', wsMessage);
                this.client.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify(wsMessage)
                });
            } catch (error) {
                console.error('Error sending WebSocket message:', error);
                this.fallbackToHttpSend(localMessage, wsMessage.message);
            }
        } else {
            console.warn('WebSocket not connected, using HTTP fallback');
            this.fallbackToHttpSend(localMessage, wsMessage.message);
        }
    }

    private fallbackToHttpSend(localMessage: Message, text: string): void {
        const messageData = {
            sender: this.currentUsername,
            senderFarsiTitle: this.currentUserFarsiTitle,
            recipient: this.targetUsername,
            subject: this.messageSubject || undefined,
            message: text,
            parentMessageId: this.chatState.replyingToMessage?.id,
            priority: this.messagePriority !== 'normal' ? this.messagePriority : undefined,
            nationalCode: this.nationalCode || undefined,
            recipients: this.recipients || undefined,
            enableSendSms: this.enableSendSms
        };

        this.messageService.sendMessage(messageData)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        const msgIndex = this.chatState.messages.findIndex(m => m.id === localMessage.id);
                        if (msgIndex !== -1) {
                            const backendMessage = this.mapBackendMessageToFrontend(response.data);
                            this.chatState.messages[msgIndex] = {
                                ...this.chatState.messages[msgIndex],
                                ...backendMessage,
                                status: 'sent'
                            };
                        }
                    }
                },
                error: (error) => {
                    console.error('Error sending message:', error);
                    const msgIndex = this.chatState.messages.findIndex(m => m.id === localMessage.id);
                    if (msgIndex !== -1) {
                        this.chatState.messages[msgIndex].status = 'failed';
                    }
                }
            });
    }

    private uploadFileAndSendMessage(text: string): void {
        if (!this.selectedFile) {
            return;
        }

        console.log('File upload not implemented yet');
        this.addMockMessageWithFile(text);
    }

    // Enhanced updateMessage with WebSocket
    private updateMessage(): void {
        if (!this.chatState.editingMessageId) {
            return;
        }

        const newText = this.messageText.trim();
        if (!newText) {
            this.cancelEdit();
            return;
        }

        const messageId = uuidv4();
        const wsMessage: WebSocketMessage = {
            id: messageId,
            sender: this.currentUsername,
            senderFarsiTitle: this.currentUserFarsiTitle,
            recipient: this.targetUsername,
            message: newText,
            timestamp: Date.now(),
            messageType: 'edit',
            originalMessageId: this.chatState.editingMessageId.toString()
        };

        if (this.connected && this.client) {
            try {
                this.client.publish({
                    destination: '/app/chat.edit',
                    body: JSON.stringify(wsMessage)
                });

                // به‌روزرسانی محلی پیام
                const messageIndex = this.chatState.messages.findIndex(m => m.id === this.chatState.editingMessageId);
                if (messageIndex > -1) {
                    this.chatState.messages[messageIndex].message = newText;
                    this.chatState.messages[messageIndex].edited = true;
                    this.chatState.messages[messageIndex].modifyDate = new Date();
                    this.messageService.updateMessages(this.chatState.messages);
                }

                this.cancelEdit();
            } catch (error) {
                console.error('Error sending edit via WebSocket:', error);
                this.fallbackUpdateMessage(newText);
            }
        } else {
            this.fallbackUpdateMessage(newText);
        }
    }

    private fallbackUpdateMessage(newText: string): void {
        if (!this.chatState.editingMessageId) return;

        fetch(`/api/messages/${this.chatState.editingMessageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newText)
        })
            .then(response => response.json())
            .then(response => {
                if (response.success && response.data) {
                    const updatedMessage = this.mapBackendMessageToFrontend(response.data);
                    this.updateMessageInChat(updatedMessage);
                    this.cancelEdit();
                }
            })
            .catch(error => {
                console.error('Error updating message:', error);
                // fallback به به‌روزرسانی محلی
                this.updateMockMessage(this.chatState.editingMessageId!, newText);
            });
    }

    // Enhanced deleteMessage with WebSocket
    deleteMessage(messageId: number): void {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این پیام را حذف کنید؟')) {
            return;
        }

        const wsMessageId = uuidv4();
        const wsMessage: WebSocketMessage = {
            id: wsMessageId,
            sender: this.currentUsername,
            senderFarsiTitle: this.currentUserFarsiTitle,
            message: '',
            timestamp: Date.now(),
            messageType: 'delete',
            originalMessageId: messageId.toString()
        };

        if (this.connected && this.client) {
            try {
                this.client.publish({
                    destination: '/app/chat.delete',
                    body: JSON.stringify(wsMessage)
                });

                this.removeMessageFromChat(messageId);
            } catch (error) {
                console.error('Error sending delete via WebSocket:', error);
                this.fallbackDeleteMessage(messageId);
            }
        } else {
            this.fallbackDeleteMessage(messageId);
        }
    }

    private fallbackDeleteMessage(messageId: number): void {
        this.messageService.deleteMessage(messageId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.removeMessageFromChat(messageId);
                    }
                },
                error: (error) => {
                    console.error('Error deleting message:', error);
                    this.deleteMockMessage(messageId);
                }
            });
    }

    // Retry failed message
    retryFailedMessage(messageId: number): void {
        const msgIndex = this.chatState.messages.findIndex(m => m.id === messageId);
        if (msgIndex !== -1 && this.chatState.messages[msgIndex].status === 'failed') {
            const message = this.chatState.messages[msgIndex];

            this.chatState.messages[msgIndex].status = 'pending';

            const wsMessageId = uuidv4();
            const wsMessage: WebSocketMessage = {
                id: wsMessageId,
                sender: this.currentUsername,
                senderFarsiTitle: this.currentUserFarsiTitle,
                recipient: this.targetUsername,
                recipientFarsiTitle: this.targetUserFarsiTitle,
                subject: message.subject,
                message: message.message,
                parentMessageId: message.parentMessageId?.toString(),
                timestamp: Date.now(),
                messageType: 'new',
                priority: message.priority,
                nationalCode: message.nationalCode,
                recipients: message.recipients,
                enableSendSms: message.enableSendSms
            };

            const timeoutId = setTimeout(() => {
                const currentMsgIndex = this.chatState.messages.findIndex(m => m.id === messageId);
                if (currentMsgIndex !== -1 && this.chatState.messages[currentMsgIndex].status === 'pending') {
                    this.chatState.messages[currentMsgIndex].status = 'failed';
                }
                this.pendingMessageTimeouts.delete(wsMessageId);
            }, 10000);

            this.pendingMessageTimeouts.set(wsMessageId, timeoutId);

            try {
                if (this.connected && this.client) {
                    this.client.publish({
                        destination: '/app/chat.send',
                        body: JSON.stringify(wsMessage)
                    });
                } else {
                    throw new Error('WebSocket not connected');
                }
            } catch (error) {
                console.error('Error retrying message:', error);
                this.chatState.messages[msgIndex].status = 'failed';
                clearTimeout(timeoutId);
                this.pendingMessageTimeouts.delete(wsMessageId);
            }
        }
    }

    performSearch(): void {
        const criteria = {
            query: this.searchQuery.trim() || undefined,
            sender: this.searchSender || undefined,
            subject: this.searchSubjects || undefined,
            priority: this.searchPriority || undefined,
            page: 0,
            size: 100
        };

        // بررسی اینکه حداقل یک معیار جستجو وجود داشته باشد
        if (!criteria.query && !criteria.sender && !criteria.subject && !criteria.priority) {
            this.clearSearch();
            return;
        }

        console.log('Performing search with criteria:', criteria);

        // ساخت URL با query parameters
        const queryParams = new URLSearchParams();
        if (criteria.query) queryParams.append('query', criteria.query);
        if (criteria.sender) queryParams.append('sender', criteria.sender);
        if (criteria.subject) queryParams.append('subject', criteria.subject);
        if (criteria.priority) queryParams.append('priority', criteria.priority);
        queryParams.append('page', criteria.page.toString());
        queryParams.append('size', criteria.size.toString());

        // فراخوانی HTTP به جای سرویس Angular
        fetch(`/api/messages/search?${queryParams.toString()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(response => {
                if (response.success) {
                    this.searchResults = response.data.content.map((msg: any) => this.mapBackendMessageToFrontend(msg));
                    this.updateSearchResults();
                    console.log(`Found ${this.searchResults.length} messages`);
                } else {
                    throw new Error(response.message || 'Search failed');
                }
            })
            .catch(error => {
                console.error('Error searching messages:', error);
                // fallback به جستجوی محلی
                this.performLocalSearch();
            });
    }

    // UI Event Handlers
    onScroll(): void {
        const element = this.chatContainer.nativeElement;
        if (element.scrollTop === 0) {
            this.loadOlderMessages();
        }
    }

    onInputKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            if (this.chatState.editingMessageId) {
                this.cancelEdit();
            } else if (this.chatState.replyingToMessage) {
                this.hideReplyPreview();
            }
        }
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            this.selectedFileName = file.name;
            this.showFilePreview = true;
            this.cancelEdit();
        }
    }

    onSearchInput(): void {
        this.searchSubject.next(this.searchQuery);
    }

    // Context Menu Handlers
    onMessageRightClick(event: MouseEvent, message: Message): void {
        if (message.deleted) {
            return;
        }

        event.preventDefault();
        this.selectedMessageForAction = message;
        const dialogElement = (event.target as HTMLElement).closest('.p-dialog');
        const dialogRect = dialogElement ? dialogElement.getBoundingClientRect() : { left: 0, top: 0 };

        const relativeX = event.clientX - dialogRect.left;
        const relativeY = event.clientY - dialogRect.top;

        const dialogWidth = dialogElement ? dialogElement.clientWidth : window.innerWidth;
        const dialogHeight = dialogElement ? dialogElement.clientHeight : window.innerHeight;

        this.contextMenuPosition = {
            x: Math.min(relativeX, dialogWidth - 160),
            y: Math.min(relativeY, dialogHeight - 120)
        };

        this.showContextMenu = true;
    }

    onReplyToMessage(): void {
        if (this.selectedMessageForAction === undefined) return;

        this.chatService.setReplyingToMessage(this.selectedMessageForAction);
        this.showReplyPreview = true;
        this.focusInput();
        this.hideContextMenu();
    }

    onEditMessage(): void {
        if (this.selectedMessageForAction === undefined) return;

        this.startEdit(this.selectedMessageForAction);
        this.hideContextMenu();
    }

    onDeleteMessage(): void {
        if (this.selectedMessageForAction === undefined) return;

        this.deleteMessage(this.selectedMessageForAction.id);

        this.hideContextMenu();
    }

    onCopyMessage(): void {
        if (this.selectedMessageForAction === undefined) return;

        // کپی کردن کامل اطلاعات پیام
        const messageInfo = `فرستنده: ${this.selectedMessageForAction.author}زمان: ${this.selectedMessageForAction.time}
        ${this.selectedMessageForAction.subject ? `موضوع: ${this.selectedMessageForAction.subject}` : ''}متن: ${this.selectedMessageForAction.message}`.trim();

        navigator.clipboard.writeText(messageInfo)
            .then(() => {
                console.log('Message copied to clipboard');
                // می‌توانید یک toast notification نمایش دهید
            })
            .catch(err => {
                console.error('Failed to copy message:', err);
                // fallback برای مرورگرهای قدیمی
                const textArea = document.createElement('textarea');
                textArea.value = messageInfo;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            });
        this.hideContextMenu();
    }

    // 4. پیاده‌سازی Forward Modal
    showForwardModal: boolean = false;
    availableContacts: any[] = []; // لیست مخاطبین
    selectedContacts: Set<string> = new Set();

    onForwardMessage(): void {
        if (this.selectedMessageForAction === undefined) return;
        
        // بارگذاری لیست مخاطبین
        this.loadContacts();
        this.showForwardModal = true;
        this.hideContextMenu();
    }
    loadContacts(): void {
        // این متد باید لیست مخاطبین را از سرور بگیرد
        // فعلاً داده‌های نمونه
        this.availableContacts = [
            { id: 'user1', name: 'احمد احمدی', username: 'ahmad' },
            { id: 'user2', name: 'فاطمه محمدی', username: 'fatemeh' },
            { id: 'user3', name: 'علی رضایی', username: 'ali' }
        ];
    }

    toggleContactSelection(contact: any): void {
        if (this.selectedContacts.has(contact.username)) {
            this.selectedContacts.delete(contact.username);
        } else {
            this.selectedContacts.add(contact.username);
        }
    }

    forwardMessage(): void {
        if (this.selectedContacts.size === 0 || !this.selectedMessageForAction) {
            return;
        }

        const forwardText = `[هدایت شده از ${this.selectedMessageForAction.author}]\n${this.selectedMessageForAction.message}`;

        // ارسال به هر مخاطب انتخاب شده
        this.selectedContacts.forEach(username => {
            const messageId = uuidv4();
            const wsMessage: WebSocketMessage = {
                id: messageId,
                sender: this.currentUsername,
                senderFarsiTitle: this.currentUserFarsiTitle,
                recipient: username,
                message: forwardText,
                timestamp: Date.now(),
                messageType: 'new'
            };

            if (this.connected && this.client) {
                this.client.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify(wsMessage)
                });
            }
        });

        this.closeForwardModal();
        console.log(`Message forwarded to ${this.selectedContacts.size} contacts`);
    }

    closeForwardModal(): void {
        this.showForwardModal = false;
        this.selectedContacts.clear();
    }

    // Edit functionality
    startEdit(message: Message): void {
        console.log('Starting edit for message:', message.id);

        // بررسی اینکه آیا این پیام قابل ویرایش است
        if (message.type !== 'user' || message.deleted || message.file) {
            console.warn('Message cannot be edited');
            return;
        }

        this.hideReplyPreview(); // پنهان کردن reply preview
        this.chatService.setEditingMessage(message.id);
        this.messageText = message.message;
        this.showEditPreview = true;
        this.focusInput();
        this.autoResizeTextarea();
    }

    cancelEdit(): void {
        console.log('Cancelling edit');
        this.chatService.setEditingMessage(undefined);
        this.messageText = '';
        this.showEditPreview = false;
        this.autoResizeTextarea();
    }

    // Reply functionality
    hideReplyPreview(): void {
        console.log('Hiding reply preview');
        this.chatService.setReplyingToMessage(undefined);
        this.showReplyPreview = false;
    }
    scrollToMessage(messageId: number): void {
        const element = document.querySelector(`[data-message-id="${messageId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlighted');
            setTimeout(() => {
                element.classList.remove('highlighted');
            }, 1000);
        }
    }

    // Search functionality
    toggleSearch(): void {
        this.showSearchSection = !this.showSearchSection;
        if (!this.showSearchSection) {
            this.clearSearch();
        }
    }

    toggleAdvancedSearch(): void {
        this.showAdvancedSearch = !this.showAdvancedSearch;
    }

    clearSearch(): void {
        this.chatState.searchActive = false;
        this.chatState.searchResults = [];
        this.chatState.currentSearchIndex = -1;

        this.searchResults = [];
        this.searchQuery = '';
        this.searchSender = '';
        this.searchSubjects = '';
        this.searchPriority = '';

        this.clearSearchHighlights();

        console.log('Search cleared');
    }

    goToPreviousSearchResult(): void {
        this.searchService.goToPrevious();
        this.scrollToCurrentSearchResult();
    }

    goToNextSearchResult(): void {
        this.searchService.goToNext();
        this.scrollToCurrentSearchResult();
    }

    showSearchResultsList(): void {
        this.showSearchResultsModal = true;
    }

    hideSearchResultsList(): void {
        this.showSearchResultsModal = false;
    }

    goToSearchResult(index: number): void {
        this.searchService.goToResult(index);
        this.scrollToCurrentSearchResult();
        this.hideSearchResultsList();
    }

    // File functionality
    removeSelectedFile(): void {
        this.selectedFile = undefined;
        this.selectedFileName = '';
        this.showFilePreview = false;
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    downloadFile(file: FileAttachment): void {
        if (file.id) {
            console.log('Downloading file:', file.name);
        } else if (file.blob) {
            const url = URL.createObjectURL(file.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    // UI Helpers
    toggleHeaderMenu(): void {
        this.showHeaderMenu = !this.showHeaderMenu;
    }

    closeModal(): void {
        this.onCloseDialog.emit();
    }

    toggleAdvancedInput(): void {
        this.showAdvancedInput = !this.showAdvancedInput;
    }

    hideContextMenu(): void {
        this.showContextMenu = false;
        this.selectedMessageForAction = undefined;
    }

    focusInput(): void {
        setTimeout(() => {
            if (this.chatInput) {
                this.chatInput.nativeElement.focus();
            }
        }, 100);
    }

    autoResizeTextarea(): void {
        setTimeout(() => {
            if (this.chatInput) {
                const element = this.chatInput.nativeElement;
                element.style.height = 'auto';
                element.style.height = element.scrollHeight + 'px';
            }
        }, 0);
    }

    scrollToBottom(): void {
        setTimeout(() => {
            if (this.chatContainer) {
                const element = this.chatContainer.nativeElement;
                element.scrollTop = element.scrollHeight;
            }
        }, 100);
    }

    clearInputForm(): void {
        this.messageText = '';
        this.messageSubject = '';
        this.messagePriority = 'normal';
        this.nationalCode = '';
        this.recipients = '';
        this.enableSendSms = false;
        this.removeSelectedFile();

        // پاک کردن حالت‌های reply و edit
        this.hideReplyPreview();
        this.cancelEdit();

        this.autoResizeTextarea();
    }

    // Host listeners
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        const target = event.target as HTMLElement;

        if (!target.closest('.context-menu')) {
            this.hideContextMenu();
        }

        if (!target.closest('.header-menu') && !target.closest('.header-menu-btn')) {
            this.showHeaderMenu = false;
        }
    }

    @HostListener('document:keydown', ['$event'])
    onDocumentKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            if (this.showSearchResultsModal) {
                this.hideSearchResultsList();
            } else if (this.showSearchSection) {
                this.toggleSearch();
            }
        }

        if (this.chatState.searchActive && this.chatState.searchResults.length > 0) {
            if (event.key === 'ArrowUp' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                this.goToPreviousSearchResult();
            } else if (event.key === 'ArrowDown' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                this.goToNextSearchResult();
            }
        }
    }

    // Helper methods for development/testing
    private loadMockMessages(): void {
        const mockMessages: Message[] = [];
        const sampleTexts = [
            'سلام! چطوری؟', 'امروز چه خبر؟', 'این پروژه خیلی جالبه', 'کارت عالی بود!',
            'بیا فردا قرار بذاریم', 'اون فیلم رو دیدی؟', 'هوا امروز خیلی خوبه'
        ];

        for (let i = 50; i > 0; i--) {
            const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
            const isCurrentUser = Math.random() > 0.5;
            const messageDate = new Date(Date.now() - (50 - i) * 60000);

            mockMessages.push({
                id: i,
                sender: isCurrentUser ? this.currentUsername : this.targetUsername,
                senderFarsiTitle: isCurrentUser ? this.currentUserFarsiTitle : this.targetUserFarsiTitle,
                subject: undefined,
                message: `${randomText} - پیام ${i}`,
                isActive: true,
                createDate: messageDate,
                enableSendSms: false,

                type: isCurrentUser ? 'user' : 'bot',
                author: isCurrentUser ? this.currentUserFarsiTitle : this.targetUserFarsiTitle,
                time: messageDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
                date: messageDate,
                deleted: false,
                edited: false,
                priority: 'normal',
                status: 'sent'
            });
        }

        this.chatState.messages = mockMessages;
        this.messageService.updateMessages(mockMessages);
        setTimeout(() => this.scrollToBottom(), 100);
    }

    private addMockMessage(text: string): void {
        const newMessage: Message = {
            id: Date.now(),
            sender: this.currentUsername,
            senderFarsiTitle: this.currentUserFarsiTitle,
            subject: this.messageSubject || undefined,
            message: text,
            isActive: true,
            parentMessageId: this.chatState.replyingToMessage?.id,
            createDate: new Date(),
            enableSendSms: this.enableSendSms,

            type: 'user',
            author: this.currentUserFarsiTitle,
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(),
            deleted: false,
            edited: false,
            priority: this.messagePriority as any,
            nationalCode: this.nationalCode || undefined,
            recipients: this.recipients || undefined,
            replyTo: this.chatState.replyingToMessage?.id,
            status: 'sent'
        };

        this.addMessageToChat(newMessage);
        this.clearInputForm();

        // شبیه‌سازی پاسخ بات
        setTimeout(() => {
            const botResponse: Message = {
                id: Date.now() + 1,
                sender: this.targetUsername,
                senderFarsiTitle: this.targetUserFarsiTitle,
                subject: undefined,
                message: 'دریافت شد! ممنون از پیامت.',
                isActive: true,
                createDate: new Date(),
                enableSendSms: false,

                type: 'bot',
                author: this.targetUserFarsiTitle,
                time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
                date: new Date(),
                deleted: false,
                edited: false,
                priority: 'normal',
                status: 'received'
            };
            this.addMessageToChat(botResponse);
        }, 1000);
    }

    validateNationalCode(): boolean {
        if (!this.nationalCode) {
            return true;
        }

        const code = this.nationalCode.toString();
        if (code.length !== 10) {
            return false;
        }

        return /^[0-9]{10}$/.test(code);
    }

    isFormValid(): boolean {
        const hasText = this.messageText.trim().length > 0;
        const hasFile = !!this.selectedFile;
        const validNationalCode = this.validateNationalCode();

        // در حالت ویرایش، فقط متن کافی است
        if (this.isEditing) {
            return hasText && validNationalCode;
        }

        return (hasText || hasFile) && validNationalCode;
    }

    private addMockMessageWithFile(text: string): void {
        if (!this.selectedFile) {
            return;
        }

        const mockFile: FileAttachment = {
            id: Date.now().toString(),
            name: this.selectedFile.name,
            size: this.selectedFile.size,
            type: this.selectedFile.type,
            icon: this.getFileIcon(this.selectedFile.type),
            uploadStatus: 'completed',
            blob: this.selectedFile
        };

        const newMessage: Message = {
            id: Date.now(),
            sender: this.currentUsername,
            senderFarsiTitle: this.currentUserFarsiTitle,
            subject: undefined,
            message: text,
            isActive: true,
            createDate: new Date(),
            enableSendSms: false,

            type: 'user',
            author: this.currentUserFarsiTitle,
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(),
            deleted: false,
            edited: false,
            priority: 'normal',
            file: mockFile,
            status: 'sent'
        };

        this.addMessageToChat(newMessage);
        this.clearInputForm();
    }

    private getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel')) return '📊';
        return '📎';
    }

    private updateMockMessage(messageId: number, newText: string): void {
        const messageIndex = this.chatState.messages.findIndex(m => m.id === messageId);
        if (messageIndex > -1) {
            this.chatState.messages[messageIndex].message = newText;
            this.chatState.messages[messageIndex].edited = true;
            this.chatState.messages[messageIndex].modifyDate = new Date();
            this.messageService.updateMessages(this.chatState.messages);
            this.cancelEdit();
        }
    }

    private deleteMockMessage(messageId: number): void {
        const messageIndex = this.chatState.messages.findIndex(m => m.id === messageId);
        if (messageIndex > -1) {
            this.chatState.messages[messageIndex].deleted = true;
            this.chatState.messages[messageIndex].deleteDate = new Date();
            this.chatState.messages[messageIndex].message = '';
            this.messageService.updateMessages(this.chatState.messages);
        }
    }

    private addMessageToChat(message: Message): void {
        this.chatState.messages.push(message);
        this.messageService.updateMessages(this.chatState.messages);
        this.scrollToBottom();
    }

    private updateMessageInChat(updatedMessage: Message): void {
        const messageIndex = this.chatState.messages.findIndex(m => m.id === updatedMessage.id);
        if (messageIndex > -1) {
            this.chatState.messages[messageIndex] = updatedMessage;
            this.messageService.updateMessages(this.chatState.messages);
        }
    }

    private removeMessageFromChat(messageId: number): void {
        const messageIndex = this.chatState.messages.findIndex(m => m.id === messageId);
        if (messageIndex > -1) {
            this.chatState.messages[messageIndex].deleted = true;
            this.chatState.messages[messageIndex].deleteDate = new Date();
            this.messageService.updateMessages(this.chatState.messages);
        }
    }

    private updateSearchResults(): void {
        const messageIds = this.searchResults.map(msg => msg.id);
        this.chatState.searchResults = messageIds;
        this.chatState.searchActive = messageIds.length > 0;
        this.chatState.currentSearchIndex = messageIds.length > 0 ? 0 : -1;

        this.highlightSearchResults();

        // اسکرول به اولین نتیجه
        if (messageIds.length > 0) {
            setTimeout(() => {
                this.scrollToCurrentSearchResult();
            }, 100);
        }
    }
    private performLocalSearch(): void {
        const query = this.searchQuery.toLowerCase().trim();
        const sender = this.searchSender.toLowerCase().trim();
        const subject = this.searchSubjects;
        const priority = this.searchPriority;

        const results = this.chatState.messages.filter(msg => {
            if (msg.deleted) {
                return false;
            }

            let matches = true;

            // جستجو در محتوای پیام
            if (query && !msg.message.toLowerCase().includes(query)) {
                matches = false;
            }

            // فیلتر بر اساس فرستنده
            if (sender &&
                !msg.sender.toLowerCase().includes(sender) &&
                !msg.senderFarsiTitle.toLowerCase().includes(sender)) {
                matches = false;
            }

            // فیلتر بر اساس موضوع
            if (subject && msg.subject !== subject) {
                matches = false;
            }

            // فیلتر بر اساس اولویت
            if (priority && msg.priority !== priority) {
                matches = false;
            }

            return matches;
        });

        this.searchResults = results;
        this.updateSearchResults();
        console.log(`Local search found ${this.searchResults.length} messages`);
    }

    validateSearchSender(): boolean {
        if (!this.searchSender) {
            return true;
        }
        return this.searchSender.trim().length > 0;
    }

    private highlightSearchResults(): void {
        this.clearSearchHighlights();

        this.chatState.searchResults.forEach((messageId, index) => {
            const element = document.querySelector(`[data-message-id="${messageId}"]`);
            if (element) {
                element.classList.add('search-highlight');
                if (index === this.chatState.currentSearchIndex) {
                    element.classList.add('search-current');
                }

                // هایلایت کردن کلمات جستجو در محتوای پیام
                if (this.searchQuery.trim()) {
                    const contentElement = element.querySelector('.message-content');
                    if (contentElement) {
                        const message = this.findMessageById(messageId);
                        if (message && !message.deleted) {
                            const highlightedText = this.searchService.highlightSearchTerm(
                                message.message,
                                this.searchQuery.trim()
                            );
                            contentElement.innerHTML = highlightedText;
                        }
                    }
                }
            }
        });
    }

    private clearSearchHighlights(): void {
        document.querySelectorAll('.message').forEach(element => {
            element.classList.remove('search-highlight', 'search-current');

            // بازگرداندن متن اصلی بدون هایلایت
            const contentElement = element.querySelector('.message-content');
            if (contentElement) {
                const messageId = parseInt(element.getAttribute('data-message-id') || '0');
                const message = this.findMessageById(messageId);
                if (message) {
                    contentElement.textContent = message.message;
                }
            }
        });
    }

    private scrollToCurrentSearchResult(): void {
        if (this.chatState.currentSearchIndex >= 0 &&
            this.chatState.currentSearchIndex < this.chatState.searchResults.length) {

            const messageId = this.chatState.searchResults[this.chatState.currentSearchIndex];
            const element = document.querySelector(`[data-message-id="${messageId}"]`);

            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // اضافه کردن انیمیشن فلش
                element.classList.add('search-flash');
                setTimeout(() => {
                    element.classList.remove('search-flash');
                }, 1000);
            }
        }
    }

    private findMessageById(messageId: number): Message | undefined {
        return this.chatState.messages.find(msg => msg.id === messageId);
    }

    private updateFileUploadProgress(fileId: string, progress: number): void {
        const fileElement = document.querySelector(`[data-file-id="${fileId}"] .progress-bar-inner`);
        if (fileElement) {
            (fileElement as HTMLElement).style.width = `${progress}%`;
        }
    }

    // Getters for template
    get isEditing(): boolean {
        return !!this.chatState.editingMessageId;
    }

    get isReplying(): boolean {
        return !!this.chatState.replyingToMessage;
    }

    get hasSearchResults(): boolean {
        return this.chatState.searchResults.length > 0;
    }

    get searchResultsCount(): number {
        return this.chatState.searchResults.length;
    }

    get currentSearchPosition(): number {
        return this.chatState.currentSearchIndex + 1;
    }

    get canEditMessage(): boolean {
        return this.selectedMessageForAction?.type === 'user' &&
            !this.selectedMessageForAction?.file &&
            !this.selectedMessageForAction?.deleted;
    }

    get canDeleteMessage(): boolean {
        return this.selectedMessageForAction?.type === 'user' &&
            !this.selectedMessageForAction?.deleted;
    }

    get totalMessagesCount(): number {
        return this.chatState.messages.length;
    }

    get connectionStatus(): string {
        if (this.connected) return 'متصل';
        if (this.isReconnecting) return 'در حال اتصال مجدد...';
        return 'قطع شده';
    }

    get isConnected(): boolean {
        return this.connected;
    }
    getMessageGroups(): { date: string, messages: Message[] }[] {
        const groups: { [key: string]: Message[] } = {};

        this.chatState.messages.forEach(message => {
            const dateKey = message.date.toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(message);
        });

        return Object.keys(groups).map(dateKey => ({
            date: new Date(dateKey).toLocaleDateString('fa-IR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            messages: groups[dateKey]
        }));
    }
    formatMessageTime(date: Date): string {
        const now = new Date();
        const messageDate = new Date(date);

        // اگر همان روز باشد، فقط ساعت نمایش داده شود
        if (messageDate.toDateString() === now.toDateString()) {
            return messageDate.toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // اگر دیروز باشد
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'دیروز ' + messageDate.toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // برای تاریخ‌های قدیمی‌تر
        return messageDate.toLocaleDateString('fa-IR') + ' ' +
            messageDate.toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit'
            });
    }
    private showNotification(title: string, message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        // اینجا می‌توانید از کتابخانه toast استفاده کنید
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);

        // یا یک نمایش ساده
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
    <strong>${title}</strong><br>
    ${message}
  `;

        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
    private handleNetworkError(error: any, operation: string): void {
        console.error(`Network error in ${operation}:`, error);

        let errorMessage = 'خطای شبکه رخ داده است';

        if (!navigator.onLine) {
            errorMessage = 'اتصال اینترنت قطع است';
        } else if (error.status === 404) {
            errorMessage = 'سرویس مورد نظر یافت نشد';
        } else if (error.status === 500) {
            errorMessage = 'خطای داخلی سرور';
        } else if (error.status === 403) {
            errorMessage = 'شما مجوز دسترسی ندارید';
        }

        this.showNotification('خطا', errorMessage, 'error');
    }
    private validateMessage(): { isValid: boolean, errors: string[] } {
        const errors: string[] = [];

        // بررسی طول پیام
        if (this.messageText.length > 1000) {
            errors.push('پیام نمی‌تواند بیشتر از 1000 کاراکتر باشد');
        }

        // بررسی کد ملی
        if (this.messageSubject === 'اختصاصی' && this.nationalCode) {
            if (!this.validateNationalCode()) {
                errors.push('کد ملی وارد شده معتبر نیست');
            }
        }

        // بررسی فایل
        if (this.selectedFile) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (this.selectedFile.size > maxSize) {
                errors.push('حجم فایل نمی‌تواند بیشتر از 10 مگابایت باشد');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
    // Template helper methods
    messageTrackBy(index: number, message: Message): number {
        return message.id;
    }
    private clearCache(): void {
        this.processedMessageIds.clear();
        this.pendingMessageTimeouts.forEach(timeout => clearTimeout(timeout));
        this.pendingMessageTimeouts.clear();
        this.searchResults = [];
    }
    exportConversation(): void {
        const conversation = this.chatState.messages
            .filter(msg => !msg.deleted)
            .map(msg => ({
                time: this.formatMessageTime(msg.date),
                sender: msg.author,
                message: msg.message,
                subject: msg.subject,
                priority: msg.priority
            }));

        const dataStr = JSON.stringify(conversation, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `conversation-${this.targetUserFarsiTitle}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(link.href);
    }

    getConversationStats(): any {
        const messages = this.chatState.messages.filter(msg => !msg.deleted);
        const userMessages = messages.filter(msg => msg.type === 'user');
        const botMessages = messages.filter(msg => msg.type === 'bot');

        return {
            total: messages.length,
            sent: userMessages.length,
            received: botMessages.length,
            withAttachments: messages.filter(msg => msg.file).length,
            highPriority: messages.filter(msg => msg.priority === 'high').length,
            urgent: messages.filter(msg => msg.priority === 'urgent').length
        };
    }

    getMessageClasses(message: Message): string {
        let classes = `${message.type}`;

        if (message.deleted) {
            classes += ' deleted';
        }
        if (message.id === this.chatState.editingMessageId) {
            classes += ' editing';
        }
        if (this.chatState.searchResults.includes(message.id)) {
            classes += ' search-highlight';
            if (this.chatState.searchResults[this.chatState.currentSearchIndex] === message.id) {
                classes += ' search-current';
            }
        }
        if (message.status) {
            classes += ` status-${message.status}`;
        }

        return classes;
    }

    getMessageText(message: Message): string {
        if (message.deleted) {
            return 'این پیام حذف شده است';
        }

        if (this.chatState.searchActive &&
            this.chatState.searchResults.includes(message.id) &&
            this.searchQuery) {
            return this.searchService.highlightSearchTerm(message.message, this.searchQuery);
        }

        return message.message;
    }

    getReplyAuthor(replyToId: number): string {
        const replyMessage = this.findMessageById(replyToId);
        return replyMessage ? replyMessage.author : 'کاربر ناشناس';
    }

    getReplyText(replyToId: number): string {
        const replyMessage = this.findMessageById(replyToId);
        if (!replyMessage) {
            return 'پیام یافت نشد';
        }
        if (replyMessage.deleted) {
            return 'پیام حذف شده';
        }
        return replyMessage.message;
    }

    getEditingMessageText(): string {
        if (!this.chatState.editingMessageId) {
            return '';
        }
        const message = this.findMessageById(this.chatState.editingMessageId);
        return message ? message.message : '';
    }

    getPriorityLabel(priority: string): string {
        const labels: { [key: string]: string } = {
            high: 'مهم',
            urgent: 'فوری'
        };
        return labels[priority] || priority;
    }

    getMessageStatusIcon(status?: string): string {
        switch (status) {
            case 'pending': return '⌛';
            case 'sent': return '✓';
            case 'received': return '✓✓';
            case 'read': return '✓✓';
            case 'failed': return '⚠';
            default: return '';
        }
    }

    getMessageStatusClass(status?: string): string {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'sent': return 'status-sent';
            case 'received': return 'status-received';
            case 'read': return 'status-read';
            case 'failed': return 'status-failed';
            default: return '';
        }
    }

    getInputPlaceholder(): string {
        if (this.isEditing) {
            return 'پیام خود را ویرایش کنید...';
        } else if (this.isReplying) {
            return `در حال پاسخ به ${this.chatState.replyingToMessage?.author}...`;
        } else {
            return 'پیام خود را بنویسید...';
        }
    }

    getSendButtonTitle(): string {
        if (this.isEditing) {
            return 'ذخیره تغییرات';
        } else if (this.isReplying) {
            return 'ارسال پاسخ';
        } else {
            return 'ارسال پیام';
        }
    }

    getSendButtonIcon(): string {
        if (this.isEditing) {
            return '✓'; // تیک برای ویرایش
        } else if (this.isReplying) {
            return '↪'; // پیکان پاسخ
        } else {
            return '➤'; // فلش ارسال
        }
    }

    getMessageStatusDisplay(message: Message): string {
        if (message.type !== 'user') return '';

        switch (message.status) {
            case 'pending':
                return 'در حال ارسال...';
            case 'sent':
                return 'ارسال شده';
            case 'received':
                return 'تحویل داده شده';
            case 'read':
                return 'خوانده شده';
            case 'failed':
                return 'ارسال نشد';
            default:
                return '';
        }
    }


}