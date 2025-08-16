import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Message } from '../model/message.model';
import { environment } from '../../../environments/environment';
import { SearchCriteria } from '../interface/search-criteria.interface';


export interface MessageResponse {
  success: boolean;
  data: any;
  message?: string;
  hasMore?: boolean;
}

export interface ConversationCriteria {
  senderUsername: string;
  recipientUsername: string;
  page: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = environment.apiUrl + '/messages';
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) { }

  // دریافت پیام‌های مکالمه بین دو کاربر
  getConversationMessages(criteria: ConversationCriteria): Observable<MessageResponse> {
    let params = new HttpParams()
      .set('senderUsername', criteria.senderUsername)
      .set('recipientUsername', criteria.recipientUsername)
      .set('page', criteria.page.toString())
      .set('size', criteria.size.toString());

    return this.http.get<MessageResponse>(`${this.apiUrl}/conversation`, { params });
  }

  // ارسال پیام جدید
  sendMessage(messageData: {
    sender: string;
    senderFarsiTitle: string;
    recipient: string;
    subject?: string;
    message: string;
    parentMessageId?: number;
    priority?: string;
    nationalCode?: string;
    recipients?: string;
    enableSendSms?: boolean;
  }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/send`, messageData);
  }

  // ویرایش پیام
  updateMessage(messageId: number, newMessage: string): Observable<MessageResponse> {
    const updateData = {
      id: messageId,
      message: newMessage
    };
    return this.http.put<MessageResponse>(`${this.apiUrl}/update`, updateData);
  }

  // حذف پیام
  deleteMessage(messageId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/delete/${messageId}`);
  }

  // جستجو در پیام‌ها
  searchMessages(criteria: SearchCriteria): Observable<MessageResponse> {
    const queryParams = new URLSearchParams();

    if (criteria.query) queryParams.append('query', criteria.query);
    if (criteria.sender) queryParams.append('sender', criteria.sender);
    if (criteria.subject) queryParams.append('subject', criteria.subject);
    if (criteria.priority) queryParams.append('priority', criteria.priority);
    queryParams.append('page', criteria.page?.toString() || '0');
    queryParams.append('size', criteria.size?.toString() || '20');

    return this.http.get<MessageResponse>(
      `/api/messages/search?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${this.getToken()}`
        }
      }
    );
  }


  // دریافت پیام‌های ارسال شده توسط کاربر
  getSentMessages(page: number = 0, size: number = 15): Observable<MessageResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<MessageResponse>(`${this.apiUrl}/sent`, { params });
  }

  // دریافت پیام‌های دریافت شده توسط کاربر
  getReceivedMessages(page: number = 0, size: number = 15): Observable<MessageResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<MessageResponse>(`${this.apiUrl}/received`, { params });
  }

  // دریافت جزئیات یک پیام
  getMessageById(messageId: number): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/${messageId}`);
  }

  // علامت‌گذاری پیام به عنوان خوانده شده
  markAsRead(messageId: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/mark-read/${messageId}`, {});
  }

  // دریافت آمار پیام‌ها
  getMessageStats(): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/stats`);
  }

  // آپلود فایل ضمیمه
  uploadAttachment(file: File, messageId?: number): Observable<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (messageId) {
      formData.append('messageId', messageId.toString());
    }

    return this.http.post<MessageResponse>(`${this.apiUrl}/upload-attachment`, formData);
  }

  // دانلود فایل ضمیمه
  downloadAttachment(attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-attachment/${attachmentId}`, {
      responseType: 'blob'
    });
  }

  // به‌روزرسانی لیست پیام‌ها در state
  updateMessages(messages: Message[]): void {
    this.messagesSubject.next(messages);
  }

  // دریافت لیست فعلی پیام‌ها
  getCurrentMessages(): Message[] {
    return this.messagesSubject.value;
  }

  // متدهای کمکی برای مدیریت اطلاعات کاربر
  getCurrentUsername(): string {
    return localStorage.getItem('currentUsername') || '';
  }

  setCurrentUsername(username: string): void {
    localStorage.setItem('currentUsername', username);
  }

  getCurrentUserFarsiTitle(): string {
    return localStorage.getItem('currentUserFarsiTitle') || '';
  }

  setCurrentUserFarsiTitle(title: string): void {
    localStorage.setItem('currentUserFarsiTitle', title);
  }

  getTargetUsername(): string {
    return sessionStorage.getItem('targetUsername') || '';
  }

  setTargetUsername(username: string): void {
    sessionStorage.setItem('targetUsername', username);
  }

  getTargetUserFarsiTitle(): string {
    return sessionStorage.getItem('targetUserFarsiTitle') || '';
  }

  setTargetUserFarsiTitle(title: string): void {
    sessionStorage.setItem('targetUserFarsiTitle', title);
  }

  // پاک‌سازی اطلاعات هنگام خروج
  clearUserData(): void {
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('currentUserFarsiTitle');
    sessionStorage.removeItem('targetUsername');
    sessionStorage.removeItem('targetUserFarsiTitle');
  }

  // متدهای سازگاری با کد قبلی (برای جلوگیری از خرابی)
  getListInfoReceivedMessages(page: number, size: number): Observable<MessageResponse> {
    return this.getReceivedMessages(page, size);
  }

  getListInfoSentMessages(criteria: SearchCriteria): Observable<MessageResponse> {
    return this.searchMessages(criteria);
  }

  deleteSent(messageId: number): Observable<MessageResponse> {
    return this.deleteMessage(messageId);
  }
}