export interface FileAttachment {
  id?: string;
  name: string;
  size: number;
  type: string;
  icon: string;
  uploadStatus: 'uploading' | 'completed' | 'failed';
  uploadProgress?: number;
  blob?: Blob; // برای فایل‌های محلی
  url?: string; // برای فایل‌های آپلود شده
  messageId?: number; // ارتباط با پیام
}