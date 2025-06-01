import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Observable } from "rxjs";
import { BookModel } from "../../core/model/bookModel";
import { BookService, PaginatedResponse } from "../../core/service/book.service";
import { ListComponent, TableColumn } from "../../shared/component/list/list.component";
import { ModalComponent } from "../../shared/component/modal/modal.component";

// برای تعیین وضعیت فرم (افزودن یا ویرایش)
export enum FormOperation {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
}

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    ListComponent,
    ModalComponent
  ],
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent implements OnInit {
  tableTitle = 'لیست کتاب‌ها';
  columns: TableColumn[] = [];
  data: BookModel[] = []; // تایپ دقیق‌تر برای داده‌ها

  isBookModalVisible = false; // نام متغیر خواناتر شد
  bookForm: FormGroup;
  selectedFileName: string | null = null;
  isSubmitting: boolean = false;
  fileError: string | null = null;

  currentFormOperation: FormOperation = FormOperation.ADD;
  private currentEditingBookId: number | null = null;

  // آبجکت فیلترها (اگر در آینده استفاده شود)
  // bookFilters: Partial<BookModel> = {}; 

  constructor(private fb: FormBuilder, private bookService: BookService) {
    this.bookForm = this.fb.group({
      // id: [null], // اگر آی‌دی را در فرم برای ارسال نیاز دارید، در غیر اینصورت currentEditingBookId کافیست
      isbn10: [null, Validators.required],
      title: [null, Validators.required],
      author: [null, Validators.required],
      translator: [null],
      description: [''],
      publisher: [null],
      isbn13: [null],
      deweyDecimal: [null],
      congressClassification: [null],
      subject: [null],
      summary: [''],
      publicationDate: [null], // می‌توانید از یک DatePicker استفاده کنید و نوع داده را Date قرار دهید
      pageCount: [null, [Validators.min(1), Validators.pattern('^[0-9]*$')]],
      language: [null],
      edition: [null],
      active: [true, Validators.required], // مقدار پیش‌فرض و Validator
      bookCoverFile: [null], // برای آپلود فایل جلد کتاب (نیاز به بررسی نحوه ارسال به بک‌اند)
      copyCount: [null],
      librarySection: [null],
      shelfCode: [null],
      rowNumber: [null],
      columnNumber: [null],
      positionNote: [''],
    });
  }

  ngOnInit(): void {
    this.setupTableColumns();
    this.loadBooks();
  }

  setupTableColumns(): void {
    this.columns = [
      {
        columnDef: 'id',
        header: 'ردیف',
        cell: (element: BookModel) => `${element.id}`,
      },
      {
        columnDef: 'title',
        header: 'عنوان کتاب',
        cell: (element: BookModel) => `${element.title}`,
        cellClass: () => 'emphasize'
      },
      {
        columnDef: 'author',
        header: 'نویسنده',
        cell: (element: BookModel) => `${element.author}`,
        cellClass: () => 'emphasize'
      },
      {
        columnDef: 'subject',
        header: 'موضوع',
        cell: (element: BookModel) => `${element.subject}`,
        cellClass: () => 'emphasize'
      },
      {
        columnDef: 'translator',
        header: 'مترجم',
        cell: (element: BookModel) => `${element.translator || '---'}` // نمایش پیش‌فرض اگر خالی بود
      },
      {
        columnDef: 'isbn10',
        header: 'شابک',
        cell: (element: BookModel) => `${element.isbn10 || '---'}` // نمایش پیش‌فرض اگر خالی بود
      },
      {
        columnDef: 'deweyDecimal',
        header: 'رده بندی دیویی',
        cell: (element: BookModel) => `${element.deweyDecimal || '---'}` // نمایش پیش‌فرض اگر خالی بود
      },
      {
        columnDef: 'congressClassification',
        header: 'رده بندی کنگره',
        cell: (element: BookModel) => `${element.congressClassification || '---'}` // نمایش پیش‌فرض اگر خالی بود
      },
      {
        columnDef: 'status', // این پراپرتی باید در BookModel یا در map ایجاد شود
        header: 'وضعیت',
        cell: (element: BookModel & { status?: string }) => `${element.status || (element.active ? 'فعال' : 'غیر فعال')}`,
      }
    ];
  }

  loadBooks(): void {
    // اگر از فیلترها استفاده می‌کنید: this.bookService.getBookList(this.bookFilters)
    this.bookService.getBookList().subscribe({
      next: (response: PaginatedResponse<BookModel>) => {
        this.data = response.content;
      },
      error: (err) => {
        console.error('Error loading books:', err);
        alert('خطا در بارگذاری لیست کتاب‌ها. لطفاً کنسول را بررسی کنید.');
        this.data = []; // خالی کردن داده‌ها در صورت خطا
      }
    });
  }

  openBookModal(operation: FormOperation, book?: BookModel): void {
    this.currentFormOperation = operation;
    this.bookForm.reset({ active: true }); // ریست کردن فرم و تنظیم مقدار پیش‌فرض برای active
    this.selectedFileName = null;
    this.fileError = null;
    this.currentEditingBookId = null;

    if (operation === FormOperation.UPDATE && book) {
      this.bookForm.patchValue(book);
      this.currentEditingBookId = book.id ?? null;
      // اگر جلد کتاب قبلا آپلود شده و اطلاعات آن را دارید، اینجا selectedFileName را تنظیم کنید
    }
    this.isBookModalVisible = true;
  }

  onBookModalClose(): void {
    this.isBookModalVisible = false;
  }

  onBookSubmit(): void {
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched(); // نمایش خطاهای ولیدیشن
      alert('لطفاً تمامی فیلدهای ضروری را به درستی پر کنید.');
      return;
    }

    this.isSubmitting = true;
    const bookDataFromForm: BookModel = this.bookForm.value;
    let serviceCall: Observable<BookModel | void>;
    let successMessage: string;

    if (this.currentFormOperation === FormOperation.UPDATE && this.currentEditingBookId) {
      serviceCall = this.bookService.updateBook(this.currentEditingBookId, bookDataFromForm);
      successMessage = 'کتاب با موفقیت بروزرسانی شد!';
    } else {
      serviceCall = this.bookService.addBook(bookDataFromForm);
      successMessage = 'کتاب با موفقیت اضافه شد!';
    }

    serviceCall.subscribe({
      next: () => {
        alert(successMessage);
        this.isSubmitting = false;
        this.isBookModalVisible = false;
        this.loadBooks(); // بارگذاری مجدد لیست کتاب‌ها
        // ریست کردن selectedFileName و fileError همراه با فرم انجام شده است
      },
      error: (error) => {
        console.error('Error submitting book:', error);
        // نمایش پیام خطای مناسب‌تر از بک‌اند اگر وجود دارد
        const backendError = error.error?.message || error.error?.title || 'خطا در ثبت اطلاعات کتاب.';
        alert(`خطا: ${backendError} لطفاً دوباره تلاش کنید.`);
        this.isSubmitting = false;
      }
    });
  }

  onFileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];
      // ولیدیشن‌های پایه فایل
      if (file.size > 2 * 1024 * 1024) { // حداکثر ۲ مگابایت
        this.fileError = 'حجم فایل نباید بیشتر از ۲ مگابایت باشد.';
        this.selectedFileName = 'فایل نامعتبر';
        this.bookForm.patchValue({ bookCoverFile: null });
        inputElement.value = ''; // پاک کردن مقدار input
        return;
      }
      if (!file.type.startsWith('image/')) {
        this.fileError = 'فقط فایل‌های تصویری مجاز هستند.';
        this.selectedFileName = 'فایل نامعتبر';
        this.bookForm.patchValue({ bookCoverFile: null });
        inputElement.value = '';
        return;
      }

      this.selectedFileName = file.name;
      this.bookForm.patchValue({ bookCoverFile: file }); // فایل در فرم ذخیره می‌شود
      this.fileError = null;
      // نکته: ارسال فایل به همراه JSON نیاز به بررسی روش سرور دارد (معمولا FormData یا Base64)
      // اگر سرور فایل را جداگانه می‌گیرد، باید پس از ثبت موفق کتاب، فایل آپلود شود.
    } else {
      this.selectedFileName = null;
      this.bookForm.patchValue({ bookCoverFile: null });
      this.fileError = null;
    }
  }

  deleteBook(book: BookModel): void {
    if (!book.id) {
      alert('امکان حذف کتاب بدون شناسه وجود ندارد.');
      return;
    }
    // استفاده از confirm برای تاییدیه بهتر از alert است
    if (confirm(`آیا از حذف کتاب "${book.title}" با شناسه ${book.id} مطمئن هستید؟`)) {
      this.bookService.deleteBook(book.id).subscribe({
        next: () => {
          alert(`کتاب "${book.title}" با موفقیت حذف شد.`);
          this.loadBooks(); // بارگذاری مجدد لیست
        },
        error: (err) => {
          console.error('Error deleting book:', err);
          alert('خطا در حذف کتاب. لطفاً دوباره تلاش کنید.');
        }
      });
    }
  }

  // این متد برای استفاده در قالب HTML جهت دسترسی به enum
  get FormOperationEnum() {
    return FormOperation;
  }
}
