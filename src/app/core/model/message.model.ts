import { FileAttachment } from "./file-attachment.model";

export interface Message {
  id: number;
  sender: string;
  senderFarsiTitle: string;
  subject?: string;
  message: string; // متن اصلی پیام
  isActive: boolean;
  parentMessage?: Message; // برای reply ها
  parentMessageId?: number;
  dataState?: number;
  createUser?: string;
  createDate: Date;
  modifyUser?: string;
  modifyDate?: Date;
  deleteUser?: string;
  deleteDate?: Date;
  enableSendSms?: boolean;
  
  // فیلدهای اضافی برای UI
  type: 'user' | 'bot'; // محاسبه شده بر اساس sender
  author: string; // محاسبه شده بر اساس senderFarsiTitle
  time: string; // محاسبه شده بر اساس createDate
  date: Date; // همان createDate
  deleted: boolean; // محاسبه شده بر اساس deleteDate
  edited: boolean; // محاسبه شده بر اساس modifyDate
  priority?: 'normal' | 'high' | 'urgent'; // برای UI
  nationalCode?: string; // برای UI
  recipients?: string; // برای UI
  replyTo?: number; // همان parentMessageId
  file?: FileAttachment; // برای فایل‌های ضمیمه
  tags?: string[]; // برای تگ‌ها
  status?: 'pending' | 'sent' | 'received' | 'read' | 'failed'; // وضعیت ارسال
}