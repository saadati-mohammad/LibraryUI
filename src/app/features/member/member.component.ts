import { Component, OnInit } from '@angular/core';
import { TableColumn, ActionButtonConfig, ListComponent } from '../../shared/component/list/list.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BookService } from '../../core/service/book.service';
import { ModalComponent } from '../../shared/component/modal/modal.component';

@Component({
  selector: 'app-member',
  standalone: true,
  imports: [ListComponent, CommonModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatIconModule, ModalComponent, ReactiveFormsModule],
  templateUrl: './member.component.html',
  styleUrl: './member.component.css'
})
export class MemberComponent implements OnInit {
  tableTitle = 'لیست امانت ها';
  columns: TableColumn[] = [];
  data: any[] = [];
  actionButtons: ActionButtonConfig[] = [];

  isAddBookModalVisible = false;
  addBookForm: FormGroup;
  selectedFileName: string | null = null;
  isSubmitting: boolean = false;
  fileError: string | null = null;

  constructor(private fb: FormBuilder, private bookService: BookService) {
    this.addBookForm = this.fb.group({
      bookTitle: ['', Validators.required],
      bookAuthor: ['', Validators.required],
      bookCategory: ['', Validators.required],
      bookCopies: [1, [Validators.required, Validators.min(1)]],
      bookCoverFile: [null]
      // ... other fields
    });
  }

  openAddBookModal(): void {
    this.addBookForm.reset({ bookCopies: 1 }); // Reset form with defaults
    this.selectedFileName = null;
    this.fileError = null;
    this.isAddBookModalVisible = true;
  }

  onAddBookModalClose(): void {
    this.isAddBookModalVisible = false;
  }

  onAddBookSubmit(): void {
    if (this.addBookForm.valid) {
      this.isSubmitting = true;
      console.log('Form Data:', this.addBookForm.value);
      // Simulate API call
      setTimeout(() => {
        alert('کتاب با موفقیت اضافه شد! (اطلاعات در کنسول)');
        this.isSubmitting = false;
        this.isAddBookModalVisible = false;
      }, 1500);
    } else {
      console.error('Form is invalid');
      // Optionally touch all fields to show errors
      this.addBookForm.markAllAsTouched();
    }
  }

  onFileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];
      // Basic validation (example: file size < 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.fileError = 'حجم فایل نباید بیشتر از 2 مگابایت باشد.';
        this.selectedFileName = 'فایل نامعتبر';
        this.addBookForm.patchValue({ bookCoverFile: null });
        inputElement.value = ''; // Clear the input
        return;
      }
      if (!file.type.startsWith('image/')) {
        this.fileError = 'فقط فایل‌های تصویری مجاز هستند.';
        this.selectedFileName = 'فایل نامعتبر';
        this.addBookForm.patchValue({ bookCoverFile: null });
        inputElement.value = ''; // Clear the input
        return;
      }

      this.selectedFileName = file.name;
      this.addBookForm.patchValue({ bookCoverFile: file });
      this.fileError = null;
    } else {
      this.selectedFileName = null;
      this.addBookForm.patchValue({ bookCoverFile: null });
      this.fileError = null;
    }
  }







  ngOnInit(): void {
    this.setupTableColumns();
    this.loadSampleData();
    this.setupActionButtons();
  }

  setupTableColumns(): void {
    this.columns = [
      {
        columnDef: 'id',
        header: 'ردیف',
        cell: (element: any) => `${element.id}`,
      },
      {
        columnDef: 'bookTitle',
        header: 'عنوان کتاب',
        cell: (element: any) => `${element.bookTitle}`,
        cellClass: () => 'emphasize'
      },
      {
        columnDef: 'memberName',
        header: 'نام عضو',
        cell: (element: any) => `${element.memberName}`,
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
    this.bookService.getBookList().subscribe((data: any) => {
      console.log(data);
    })
    this.data = [
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
    this.actionButtons = [
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
