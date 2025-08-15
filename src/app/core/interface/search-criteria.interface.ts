export interface SearchCriteria {
  query?: string; // جستجو در محتوای پیام
  sender?: string; // جستجو بر اساس فرستنده
  subject?: string; // جستجو بر اساس موضوع
  priority?: string; // جستجو بر اساس اولویت
  isActive?: boolean; // فقط پیام‌های فعال
  startDate?: Date; // تاریخ شروع
  endDate?: Date; // تاریخ پایان
  page: number;
  size: number;
}