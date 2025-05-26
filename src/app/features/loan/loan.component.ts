import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ActionButtonConfig, ListComponent, TableColumn} from '../../shared/component/list/list.component';

@Component({
  selector: 'app-loan',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ListComponent
  ],
  templateUrl: './loan.component.html',
  styleUrl: './loan.component.css'
})
export class LoanComponent  implements OnInit {
  loanTableTitle = 'لیست امانت‌ها';
  loanColumns: TableColumn[] = [];
  loanData: any[] = [];
  loanActionButtons: ActionButtonConfig[] = [];

  ngOnInit(): void {
    this.setupTableColumns();
    this.loadSampleData();
    this.setupActionButtons();
  }

  setupTableColumns(): void {
    this.loanColumns = [
      {
        columnDef: 'id',
        header: 'ردیف',
        cell: (element: any) => `${element.id}`,
        isSortable: true
      },
      {
        columnDef: 'bookTitle',
        header: 'عنوان کتاب',
        cell: (element: any) => `${element.bookTitle}`,
        isSortable: true,
        cellClass: () => 'emphasize'
      },
      {
        columnDef: 'memberName',
        header: 'نام عضو',
        cell: (element: any) => `${element.memberName}`,
        isSortable: true,
        cellClass: () => 'emphasize'
      },
      {
        columnDef: 'memberCode',
        header: 'کد عضو',
        cell: (element: any) => `${element.memberCode}`
      },
      {
        columnDef: 'loanDate',
        header: 'تاریخ امانت',
        cell: (element: any) => `${element.loanDate}`
      },
      {
        columnDef: 'dueDate',
        header: 'تاریخ سررسید',
        cell: (element: any) => `${element.dueDate}`,
        cellClass: (element: any) => `date-due ${element.dueDateStatus || ''}` // کلاس‌های due-soon یا overdue
      },
      {
        columnDef: 'status',
        header: 'وضعیت',
        cell: (element: any) => this.getStatusBadge(element.status),
        isSortable: true
      },
    ];
  }

  getStatusBadge(status: { text: string, type: string, icon: string }): string {
    return `<span class="status-badge status-${status.type}">
              <mat-icon role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font">${status.icon}</mat-icon>
              ${status.text}
            </span>`;
  }

  loadSampleData(): void {
    this.loanData = [
      {
        id: 1,
        bookTitle: 'جنگ و صلح',
        memberName: 'آنا کارنینا',
        memberCode: 'C00123',
        loanDate: '۱۴۰۳/۰۲/۱۰',
        dueDate: '۱۴۰۳/۰۲/۲۴',
        dueDateRaw: '2024-05-13', // برای مرتب سازی و محاسبات احتمالی
        dueDateStatus: 'overdue', // اضافه شده برای استایل خاص تاریخ سررسید
        status: { text: 'سررسید شده', type: 'overdue', icon: 'error_outline' },
      },
      {
        id: 2,
        bookTitle: 'غرور و تعصب',
        memberName: 'الیزابت بنت',
        memberCode: 'C00456',
        loanDate: '۱۴۰۳/۰۳/۰۵',
        dueDate: '۱۴۰۳/0۳/۱۹',
        dueDateRaw: '2024-06-08',
        dueDateStatus: 'due-soon',
        status: { text: 'نزدیک به سررسید', type: 'due-soon', icon: 'warning_amber' },
      },
      {
        id: 3,
        bookTitle: 'کیمیاگر',
        memberName: 'سانتیاگو چوپان',
        memberCode: 'C00789',
        loanDate: '۱۴۰۳/۰۳/۱۰',
        dueDate: '۱۴۰۳/۰۳/۲۴',
        dueDateRaw: '2024-06-13',
        status: { text: 'در حال امانت', type: 'active', icon: 'hourglass_empty' },
      },
      {
        id: 4,
        bookTitle: 'صد سال تنهایی',
        memberName: 'اورسولا ایگواران',
        memberCode: 'C00101',
        loanDate: '۱۴۰۳/۰۱/۱۵',
        dueDate: '۱۴۰۳/۰۱/۲۹',
        dueDateRaw: '2024-04-18',
        status: { text: 'بازگشت داده شده', type: 'returned', icon: 'check_circle_outline' },
      }
    ];
  }

  setupActionButtons(): void {
    this.loanActionButtons = [
      {
        icon: 'check_circle_outline',
        tooltip: 'ثبت بازگشت',
        actionId: 'return',
        color: 'primary',
        condition: (element: any) => element.status.type === 'active' || element.status.type === 'due-soon' || element.status.type === 'overdue'
      },
      {
        icon: 'autorenew',
        tooltip: 'تمدید',
        actionId: 'renew',
        color: 'accent',
        condition: (element: any) => element.status.type === 'active' || element.status.type === 'due-soon',
        disabled: (element: any) => element.bookTitle === 'جنگ و صلح' // مثال: تمدید برای این کتاب غیرفعال است
      },
      {
        icon: 'notifications_active',
        tooltip: 'ارسال یادآوری',
        actionId: 'remind',
        condition: (element: any) => element.status.type === 'overdue'
      },
      {
        icon: 'visibility',
        tooltip: 'مشاهده جزئیات',
        actionId: 'viewDetails',
        condition: (element: any) => element.status.type === 'returned'
      }
    ];
  }

  addNewLoan(): void {
    console.log('Open modal to add new loan');
    alert('باز کردن مودال ثبت امانت جدید');
  }
}
