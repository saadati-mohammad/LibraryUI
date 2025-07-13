import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from "@angular/core";
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { debounceTime, distinctUntilChanged, Observable, Subject, Subscription, tap } from "rxjs";
import { BookFilterModel, BookModel } from "../../core/model/bookModel";
import { BookService, PaginatedResponse } from "../../core/service/book.service";
import { ListComponent, TableColumn } from "../../shared/component/list/list.component";
import { ModalComponent } from "../../shared/component/modal/modal.component";
import { PageEvent } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatCardModule } from "@angular/material/card";

export enum FormOperation {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  VIEW = 'VIEW' // اضافه کردن حالت مشاهده
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
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatCardModule,
    MatSnackBarModule,
    ListComponent,
    ModalComponent
  ],
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent implements OnInit, OnDestroy {
  @Input() isSlaveMode = false;

  tableTitle = 'لیست کتاب‌ها';
  columns: TableColumn[] = [];
  data: BookModel[] = [];

  isBookModalVisible = false;
  bookForm: FormGroup;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  isSubmitting: boolean = false;
  fileError: string | null = null;
  currentCoverUrl: string | null = null;
  shouldRemoveCover: boolean = false;

  currentFormOperation: FormOperation = FormOperation.ADD;
  private currentEditingBookId: number | null = null;

  isLoadingTable: boolean = false;
  totalElements: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];

  bookFiltersForm: FormGroup;
  private filterSubscription!: Subscription;
  filterPanelOpenState = false;
  // Filtering
  showFilters: boolean = false;
  private filterSubject = new Subject<BookFilterModel>();

  private destroy$ = new Subject<void>();

  // مربوط به بارگذاری اکسل
  isExcelImportModalVisible = false;
  excelFile: File | null = null;
  excelFileName: string | null = null;
  isImporting: boolean = false;
  importError: string | null = null;
  inputElement?: HTMLInputElement;
  excelFilePath: string = 'book-import-template.xlsx'; // مسیر فایل اکسل


  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private snackBar: MatSnackBar, // اضافه شد
    @Inject(PLATFORM_ID) private platformId: Object // اضافه شد
  ) {
    this.bookForm = this.fb.group({
      isbn10: [null, Validators.required],
      title: [null, Validators.required],
      author: [null, Validators.required],
      translator: [null],
      description: [''],
      publisher: [null],
      isbn13: [null],
      deweyDecimal: [null],
      congressClassification: [null],
      subject: [null, Validators.required],
      summary: [''],
      publicationDate: [null],
      pageCount: [null, [Validators.min(1), Validators.pattern('^[0-9]*$')]],
      language: [null],
      edition: [null],
      active: [true, Validators.required],
      copyCount: [null, [Validators.min(0), Validators.pattern('^[0-9]*$')]],
      librarySection: [null],
      shelfCode: [null],
      rowNumbers: [null],
      columnNumber: [null],
      positionNote: [''],
    });

    // --- BEGIN MODIFICATION: Expanded Filter Form ---
    this.bookFiltersForm = this.fb.group({
      title: [''],
      author: [''],
      translator: [''],
      publisher: [''],
      isbn10: [''],
      isbn13: [''],
      description: [''],
      deweyDecimal: [''],
      congressClassification: [''],
      subject: [''],
      summary: [''],
      publicationDate: [''], // برای تاریخ بهتر است از date range picker یا دو فیلد جدا استفاده شود
      pageCount: [null, [Validators.min(1), Validators.pattern('^[0-9]*$')]],
      language: [''],
      edition: [''],
      active: [null], // null: all, true: active, false: inactive
      copyCount: [null, [Validators.min(0), Validators.pattern('^[0-9]*$')]],
      librarySection: [''],
      shelfCode: [''],
      rowNumbers: [''],
      columnNumber: [''],
      positionNote: ['']
    });
    // --- END MODIFICATION ---
  }

  ngOnInit(): void {
    this.setupTableColumns();
    this.loadBooks();

    this.filterSubscription = this.bookFiltersForm.valueChanges.pipe(
      debounceTime(700),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => {
        this.currentPage = 0;
      }),
    ).subscribe(() => {
      this.loadBooks();
    });
  }

  ngOnDestroy(): void {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupTableColumns(): void {
    this.columns = [
      {
        columnDef: 'bookCover',
        header: 'جلد',
        isImageColumn: true,
        imageSrc: (element: BookModel) => element.bookCoverFile,
        defaultImage: './assets/pics/default-pic.png', // تصویر پیش‌فرض مخصوص کتاب
        cell: (element: BookModel) => `جلد کتاب ${element.title}` // برای متن alt
      },
      { columnDef: 'title', header: 'عنوان کتاب', cell: (element: BookModel) => `${element.title}`, cellClass: () => 'emphasize' },
      { columnDef: 'author', header: 'نویسنده', cell: (element: BookModel) => `${element.author}`, cellClass: () => 'emphasize' },
      { columnDef: 'translator', header: 'مترجم', cell: (element: BookModel) => `${element.translator}`, cellClass: () => 'emphasize' },
      { columnDef: 'subject', header: 'موضوع', cell: (element: BookModel) => `${element.subject || '---'}` },
      { columnDef: 'isbn10', header: 'شابک ۱۰', cell: (element: BookModel) => `${element.isbn10 || '---'}` },
      { columnDef: 'deweyDecimal', header: 'رده دیویی', cell: (element: BookModel) => `${element.deweyDecimal || '---'}` },
      { columnDef: 'active', header: 'وضعیت', cell: (element: BookModel) => element.active ? `<span class="status-badge status-active">فعال</span>` : `<span class="status-badge status-inactive">غیرفعال</span>` }
    ];
  }

  loadBooks(): void {
    this.isLoadingTable = true;
    const filters: BookFilterModel = this.bookFiltersForm.value;
    const cleanFilters: Partial<BookFilterModel> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && !(typeof value === 'number' && isNaN(value))) {
        (cleanFilters as any)[key] = value;
      }
    });

    this.bookService.getBookList(cleanFilters, this.currentPage, this.pageSize, 'id,desc').subscribe({
      next: (response: PaginatedResponse<BookModel>) => {
        this.data = response.content.map(book => ({
          ...book,
        }));
        this.totalElements = response.totalElements;
        this.isLoadingTable = false;
      },
      error: (err) => {
        console.error('Error loading books:', err);
        if (isPlatformBrowser(this.platformId)) { // بررسی پلتفرم
          this.snackBar.open('خطا در بارگذاری لیست کتاب‌ها.', 'بستن', { duration: 5000, direction: 'rtl' });
        }
        this.data = [];
        this.totalElements = 0;
        this.isLoadingTable = false;
      }
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBooks();
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadBooks();
    this.filterPanelOpenState = false;
  }

  resetFilters(): void {
    this.bookFiltersForm.reset({
      title: '', author: '', translator: '', publisher: '', isbn10: '', isbn13: '',
      description: '', deweyDecimal: '', congressClassification: '', subject: '', summary: '',
      pageCount: null, language: '', edition: '', active: null, copyCount: null,
      librarySection: '', shelfCode: '', rowNumbers: '', columnNumber: '', positionNote: ''
    });
    this.currentPage = 0;
    this.loadBooks();
    this.filterPanelOpenState = false;
  }


  openBookModal(operation: FormOperation, book?: BookModel): void {
    this.bookForm.enable();
    this.currentFormOperation = operation;
    this.bookForm.reset({ active: true });
    this.selectedFile = null;
    this.selectedFileName = null;
    this.fileError = null;
    this.currentEditingBookId = null;
    this.currentCoverUrl = null;
    this.shouldRemoveCover = false;

    if ((operation === FormOperation.UPDATE || operation === FormOperation.VIEW) && book) {
      this.currentEditingBookId = book.id ?? null;
      const { bookCoverFile, ...bookDetailsToPatch } = book;
      this.bookForm.patchValue(bookDetailsToPatch);
      this.selectedFile = book.bookCoverFile instanceof File ? book.bookCoverFile : this.convertBinaryToFile(book.bookCoverFile, 'profile.jpg', 'image/jpeg');

      if (book.bookCoverFile) {
        try {
          // اگر رشته است
          if (typeof book.bookCoverFile === 'string') {
            const isBase64 = book.bookCoverFile.startsWith('data:image') || book.bookCoverFile.length > 100;
            this.currentCoverUrl = isBase64
              ? book.bookCoverFile.startsWith('data:image')
                ? book.bookCoverFile
                : `data:image/jpeg;base64,${book.bookCoverFile}`
              : book.bookCoverFile; // URL ساده

            // اگر آرایه بایت هست
          } else if (Array.isArray(book.bookCoverFile) || book.bookCoverFile instanceof Uint8Array) {
            const byteArray = new Uint8Array(book.bookCoverFile as any);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            const reader = new FileReader();

            reader.onload = () => {
              this.currentCoverUrl = reader.result as string;
            };

            reader.readAsDataURL(blob);
          }

        } catch (error) {
          console.error('❌ خطا در تبدیل عکس:', error);
          this.currentCoverUrl = null;
        }
      }
      if (operation === FormOperation.VIEW) {
        this.bookForm.disable();
      }
    }
    this.isBookModalVisible = true;
  }

  convertBinaryToFile(binaryString: string, fileName: string, mimeType: string): File {
    const byteArray = new Uint8Array(atob(binaryString).split("").map(char => char.charCodeAt(0)));
    const blob = new Blob([byteArray], { type: mimeType });

    // ساخت فایل از blob
    const file = new File([blob], fileName, { type: mimeType });

    return file;
  }

  onBookModalClose(): void {
    this.isBookModalVisible = false;
  }

  onBookSubmit(): void {
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      if (isPlatformBrowser(this.platformId)) {
        this.snackBar.open('لطفاً تمامی فیلدهای ضروری را به درستی پر کنید.', 'بستن', { duration: 3000, direction: 'rtl' });
      }
      return;
    }

    this.isSubmitting = true;
    const bookDataFromForm: BookModel = this.bookForm.value;
    let serviceCall: Observable<BookModel>;
    let successMessage: string;

    let fileToSend: File | null | undefined = undefined;
    if (this.shouldRemoveCover) {
      fileToSend = null;
    } else if (this.selectedFile) {
      fileToSend = this.selectedFile;
    }

    if (this.currentFormOperation === FormOperation.UPDATE && this.currentEditingBookId) {
      serviceCall = this.bookService.updateBook(this.currentEditingBookId, bookDataFromForm, fileToSend);
      successMessage = 'کتاب با موفقیت بروزرسانی شد!';
    } else {
      serviceCall = this.bookService.addBook(bookDataFromForm, this.selectedFile ?? undefined);
      successMessage = 'کتاب با موفقیت اضافه شد!';
    }

    serviceCall.subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(successMessage, 'بستن', { duration: 3000, direction: 'rtl' });
        }
        this.isSubmitting = false;
        this.isBookModalVisible = false;
        this.loadBooks();
      },
      error: (error) => {
        console.error('Error submitting book:', error);
        const backendError = error.error?.message || error.error?.title || error.message || 'خطا در ثبت اطلاعات کتاب.';
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(`خطا: ${backendError} لطفاً دوباره تلاش کنید.`, 'بستن', { duration: 5000, direction: 'rtl' });
        }
        this.isSubmitting = false;
      }
    });
  }

  onFileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.fileError = 'حجم فایل نباید بیشتر از ۲ مگابایت باشد.';
        this.selectedFileName = 'فایل نامعتبر';
        this.selectedFile = null;
        if (isPlatformBrowser(this.platformId)) inputElement.value = '';
        return;
      }
      if (!file.type.startsWith('image/')) {
        this.fileError = 'فقط فایل‌های تصویری مجاز هستند.';
        this.selectedFileName = 'فایل نامعتبر';
        this.selectedFile = null;
        if (isPlatformBrowser(this.platformId)) inputElement.value = '';
        return;
      }

      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.fileError = null;
      this.shouldRemoveCover = false;

      const reader = new FileReader();
      reader.onload = (e: any) => { this.currentCoverUrl = e.target.result; };
      reader.readAsDataURL(file);

    } else {
      this.selectedFile = null;
      this.selectedFileName = null;
      this.fileError = null;
    }
    if (isPlatformBrowser(this.platformId)) inputElement.value = '';
  }

  removeSelectedCover(): void {
    this.selectedFile = null;
    this.selectedFileName = null;
    this.currentCoverUrl = null;
    this.fileError = null;
    this.shouldRemoveCover = true;
  }

  deleteBook(book: BookModel): void {
    if (!book.id) {
      if (isPlatformBrowser(this.platformId)) {
        this.snackBar.open('امکان حذف کتاب بدون شناسه وجود ندارد.', 'بستن', { duration: 3000, direction: 'rtl' });
      }
      return;
    }
    if (isPlatformBrowser(this.platformId)) {
      if (confirm(`آیا از حذف کتاب "${book.title}" با شناسه ${book.id} مطمئن هستید؟`)) {
        this.performDelete(book);
      }
    } else {
      // در محیط غیرمرورگر (SSR)، confirm کار نمی‌کند، پس یا حذف نکنید یا راه دیگری پیدا کنید
      console.warn("Delete confirmation skipped in non-browser environment.");
      // this.performDelete(book); // اگر می‌خواهید بدون تایید حذف شود
    }
  }

  private performDelete(book: BookModel): void {
    if (!book.id) return;
    this.bookService.deleteBook(book.id).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(`کتاب "${book.title}" با موفقیت حذف شد.`, 'بستن', { duration: 3000, direction: 'rtl' });
        }
        if (this.data.length === 1 && this.currentPage > 0) {
          this.currentPage--;
        }
        this.loadBooks();
      },
      error: (err) => {
        console.error('Error deleting book:', err);
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open('خطا در حذف کتاب. لطفاً دوباره تلاش کنید.', 'بستن', { duration: 5000, direction: 'rtl' });
        }
      }
    });
  }

  get FormOperationEnum() {
    return FormOperation;
  }

  openExcelImportModal(): void {
    this.isExcelImportModalVisible = true;
    // Reset state
    this.excelFile = null;
    this.excelFileName = null;
    this.importError = null;
    this.isImporting = false;
  }

  onExcelImportModalClose(): void {
    this.isExcelImportModalVisible = false;
  }

  onExcelFileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];
      const validExtension = '.xlsx';
      if (!file.name.toLowerCase().endsWith(validExtension)) {
        this.importError = `فرمت فایل نامعتبر است. لطفاً یک فایل با فرمت ${validExtension} انتخاب کنید.`;
        this.excelFile = null;
        this.excelFileName = null;
        inputElement.value = ''; // Reset input
        return;
      }

      this.excelFile = file;
      this.excelFileName = file.name;
      this.importError = null;
    }
  }

  onExcelImportSubmit(): void {
    if (!this.excelFile) {
      this.importError = 'لطفاً ابتدا یک فایل را انتخاب کنید.';
      return;
    }
    this.isImporting = true;
    this.importError = null;

    this.bookService.importBooksFromExcel(this.excelFile).subscribe({
      next: (response) => {
        this.isImporting = false;
        this.isExcelImportModalVisible = false;
        this.excelFile = null;
        this.inputElement!.value = ''; // Reset input element
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open('فایل اکسل با موفقیت بارگذاری و پردازش شد.', 'بستن', { duration: 5000, direction: 'rtl' });
        }
        this.loadBooks(); // Refresh the book list
      },
      error: (err) => {
        this.isImporting = false;
        console.error('Error importing from Excel:', err);
        const errorMessage = err.error?.message || err.error || 'خطا در بارگذاری فایل. لطفاً فایل را بررسی کرده و دوباره تلاش کنید.';
        this.importError = errorMessage;
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(`خطا: ${errorMessage}`, 'بستن', { duration: 7000, direction: 'rtl' });
        }
      }
    });
  }

  downloadExcelTemplate(): void {
    if (isPlatformBrowser(this.platformId)) {
      const link = document.createElement('a');
      link.setAttribute('type', 'hidden');
      link.href = './assets/excel/book-import-template.xlsx';
      link.download = 'book-import-template.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove(); // Optional: remove the link after the download
    }
  }

}