import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, DestroyRef, inject, Input, OnDestroy, OnInit, PLATFORM_ID, ChangeDetectionStrategy } from "@angular/core";
import { AbstractControl, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Observable, Subscription } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BookFilterModel, BookModel } from "../../core/model/bookModel";
import { BookService } from "../../core/service/book.service";
import { PaginatedResponse } from "../../core/model/paginated-response.model";
import { notFutureDate } from "../../core/util/date.util";
import { ListComponent, TableColumn } from "../../shared/component/list/list.component";
import { ModalComponent } from "../../shared/component/modal/modal.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatCardModule } from "@angular/material/card";
import { ImageLoaderService } from "../../core/service/image-loader.service";
import { downloadUrl, EXCEL_FILE_RULES, IMAGE_FILE_RULES, storedImageToFile } from "../../shared/util/file.util";
import { ConfirmationService } from "../../shared/service/confirmation.service";
import { DateInputComponent } from "../../shared/component/date-input/date-input.component";
import { FilePickerComponent } from "../../shared/component/file-picker/file-picker.component";
import { BookMetadata, BookMetadataService } from "../../core/service/book-metadata.service";
import { isValidIsbn, isbn13To10, normalizeIsbn } from "../../core/util/isbn.util";
import { PagedFilterPage } from '../../shared/component/paged-filter-page';
import type { IScannerControls } from '@zxing/browser';
import type { DecodeHintType as DecodeHintKey } from '@zxing/library';

export enum FormOperation {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  VIEW = 'VIEW' // اضافه کردن حالت مشاهده
}

/** ISO date of today — the upper bound of the publication-date field. */
function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isbnRequired(control: AbstractControl): { isbnRequired: true } | null {
  const isbn10 = String(control.get('isbn10')?.value ?? '').trim();
  const isbn13 = String(control.get('isbn13')?.value ?? '').trim();
  return isbn10 || isbn13 ? null : { isbnRequired: true };
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
    MatSlideToggleModule,
    MatCardModule,
    MatSnackBarModule,
    ListComponent,
    ModalComponent,
    DateInputComponent,
    FilePickerComponent,
  ],
  templateUrl: './book.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./book.component.css']
})
export class BookComponent extends PagedFilterPage<BookModel> implements OnInit, OnDestroy {
  @Input() isSlaveMode = false;

  tableTitle = 'لیست کتاب‌ها';
  columns: TableColumn[] = [];

  isBookModalVisible = false;
  bookForm: FormGroup;
  isSubmitting = false;
  /** Persian message emitted by the cover picker (type/size rejection). */
  fileError: string | null = null;
  /**
   * Legacy inline cover value from a response (URL or base64). Normally null now: the API
   * no longer serialises the bytes and the image comes from the loader instead.
   */
  currentCoverUrl: string | null = null;
  /** Whether the record being edited has a stored cover (`hasCover`). */
  hasStoredCover = false;
  /** Set only when the operator cleared the picker of a record that had a cover. */
  private coverRemovalArmed = false;
  private coverRemovalSubscription?: Subscription;

  /** Upper bounds for the two date controls (publication ≤ today). */
  readonly today = todayIso();
  readonly imageRules = IMAGE_FILE_RULES;
  readonly excelRules = EXCEL_FILE_RULES;

  currentFormOperation: FormOperation = FormOperation.ADD;
  private currentEditingBookId: number | null = null;

  override pageSizeOptions: number[] = [5, 10, 25, 50, 100];

  bookFiltersForm: FormGroup;
  filterPanelOpenState = false;

  private readonly destroyRef = inject(DestroyRef);

  // مربوط به بارگذاری اکسل
  isExcelImportModalVisible = false;
  isImporting = false;
  importError: string | null = null;
  excelFilePath = 'book-import-template.xlsx'; // مسیر فایل اکسل


  private fb = inject(FormBuilder);
  private bookService = inject(BookService);
  private imageLoader = inject(ImageLoaderService);
  private snackBar = inject(MatSnackBar);
  private confirmation = inject(ConfirmationService);
  private readonly metadata = inject(BookMetadataService);
  private platformId = inject(PLATFORM_ID);

  barcodeValue = '';
  scanStatus: string | null = null;
  isLookingUpMetadata = false;
  isStartingCamera = false;
  isCameraScanning = false;
  continuousScanMode = false;
  private lastCameraIsbn: string | null = null;
  private emptyCameraFrames = 0;
  metadataCandidates: BookMetadata[] = [];
  private readonly completedScans = new Set<string>();
  private readonly pendingBatchIsbns: string[] = [];
  private scannerControls: IScannerControls | null = null;

  constructor() {
    super();
    this.bookForm = this.fb.group({
      isbn10: [null],
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
      publicationDate: [null, [notFutureDate]],
      pageCount: [null, [Validators.min(1), Validators.max(100000)]],
      language: [null],
      edition: [null],
      active: [true, Validators.required],
      copyCount: [null, [Validators.min(0), Validators.max(100000)]],
      librarySection: [null],
      shelfCode: [null],
      rowNumbers: [null],
      columnNumber: [null],
      positionNote: [''],
      /**
       * Cover is held in the form so `<app-file-picker formControlName="bookCoverFile">`
       * can clear it (`null`) — the tri-state signal that tells the API to delete the
       * stored cover. It is stripped from the JSON payload before submit.
       */
      bookCoverFile: [null as File | null],
    }, { validators: isbnRequired });

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
      publicationDate: [null],
      pageCount: [null, [Validators.min(1)]],
      language: [''],
      edition: [''],
      // Defaults to "فعال" so a soft-deleted (active=false) book disappears from the list
      // as operators expect; "همه"/"غیرفعال" remain one click away.
      active: [true],
      copyCount: [null, [Validators.min(0)]],
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

    this.watchFilters(this.bookFiltersForm);
  }

  ngOnDestroy(): void {
    this.stopCameraScan();
    this.coverRemovalSubscription?.unsubscribe();
    // Release the object URLs for every cover this page loaded.
    [...this.imageLoader.covers.keys()].forEach((id) => this.imageLoader.forget('cover', id));
  }

  setupTableColumns(): void {
    this.columns = [
      {
        columnDef: 'bookCover',
        header: 'جلد',
        isImageColumn: true,
        // The DTO never carried the bytes; the cover is served by GET /api/book/{id}/cover
        // and cached by `ImageLoaderService`. `hasCover` gates the request, so a book with
        // no cover renders the placeholder without a wasted round trip.
        imageSrc: (element: BookModel) =>
          element.hasCover && element.id !== undefined
            ? this.imageLoader.getCached('cover', element.id)
            : null,
        defaultImage: './assets/pics/default-pic.png', // تصویر پیش‌فرض مخصوص کتاب
        cell: (element: BookModel) => `جلد کتاب ${element.title}` // برای متن alt
      },
      { columnDef: 'title', header: 'عنوان کتاب', cell: (element: BookModel) => `${element.title}`, cellClass: () => 'emphasize' },
      { columnDef: 'author', header: 'نویسنده', cell: (element: BookModel) => `${element.author}`, cellClass: () => 'emphasize' },
      { columnDef: 'translator', header: 'مترجم', cell: (element: BookModel) => `${element.translator || '---'}`, cellClass: () => 'emphasize' },
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
        (cleanFilters as Record<string, unknown>)[key] = value;
      }
    });

    this.bookService.getBookList(cleanFilters, this.currentPage, this.pageSize, 'id,desc')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response: PaginatedResponse<BookModel>) => {
        this.data = response.content.map(book => ({
          ...book,
        }));
        this.totalElements = response.totalElements;
        this.isLoadingTable = false;
        // Covers are not part of the DTO: fetch the ones this page actually has. The
        // request goes through HttpClient, so the bearer token is attached (a plain
        // <img src="/api/..."> would 401).
        this.imageLoader.preloadCovers(
          this.data.filter((book) => book.hasCover && book.id !== undefined).map((book) => book.id as number),
        );
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

  protected override reloadPage(): void { this.loadBooks(); }

  applyFilters(): void {
    this.resetPageAndReload();
    this.filterPanelOpenState = false;
  }

  resetFilters(): void {
    this.bookFiltersForm.reset({
      title: '', author: '', translator: '', publisher: '', isbn10: '', isbn13: '',
      description: '', deweyDecimal: '', congressClassification: '', subject: '', summary: '',
      publicationDate: null, pageCount: null, language: '', edition: '', active: true, copyCount: null,
      librarySection: '', shelfCode: '', rowNumbers: '', columnNumber: '', positionNote: ''
    });
    this.resetPageAndReload();
    this.filterPanelOpenState = false;
  }


  openBookModal(operation: FormOperation, book?: BookModel): void {
    this.stopCameraScan();
    this.bookForm.enable();
    this.currentFormOperation = operation;
    this.bookForm.reset({ active: true, bookCoverFile: null });
    this.fileError = null;
    this.currentEditingBookId = null;
    this.currentCoverUrl = null;
    this.hasStoredCover = false;
    this.barcodeValue = '';
    this.continuousScanMode = false;
    this.lastCameraIsbn = null;
    this.emptyCameraFrames = 0;
    this.scanStatus = null;
    this.metadataCandidates = [];
    this.completedScans.clear();
    this.pendingBatchIsbns.length = 0;

    if ((operation === FormOperation.UPDATE || operation === FormOperation.VIEW) && book) {
      this.currentEditingBookId = book.id ?? null;
      // Omit the binary/file field from the form patch; it is handled separately below.
      const bookDetailsToPatch: Partial<BookModel> = { ...book };
      delete bookDetailsToPatch.bookCoverFile;
      this.bookForm.patchValue(bookDetailsToPatch);
      // The cover control is pre-filled only when the API handed back an actual File or a
      // base64 payload that can be reconstructed into one. A plain URL cannot: rebuilding
      // a File from it fails, which would leave the control `null` and make merely opening
      // the edit modal look like "the operator cleared the cover".
      const existingFile = this.coverToFile(book.bookCoverFile);
      this.bookForm.patchValue({ bookCoverFile: existingFile });

      // The authoritative "this record has an image" signal is the DTO flag; the fetch is
      // what actually makes it visible (the bytes are never part of the response body).
      this.hasStoredCover = book.hasCover === true || book.bookCoverFile != null;

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
            const byteArray = new Uint8Array(book.bookCoverFile as ArrayLike<number>);
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

    // Track removal from the form control: the operator cleared the picker of a record
    // that HAS a stored cover. Merely opening the modal never arms a deletion.
    this.coverRemovalArmed = false;
    this.coverRemovalSubscription?.unsubscribe();
    this.coverRemovalSubscription = this.bookForm
      .get('bookCoverFile')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.coverRemovalArmed = this.hasStoredCover && value === null;
      });

    this.isBookModalVisible = true;
    if (operation === FormOperation.ADD && isPlatformBrowser(this.platformId)) {
      setTimeout(() => document.getElementById('bookBarcodeScan')?.focus(), 0);
    }
  }

  /** Handles only the focused scanner field, so normal keyboard input remains untouched. */
  lookupScannedIsbn(): void {
    const isbn = normalizeIsbn(this.barcodeValue);
    if (!isbn) { this.scanStatus = 'اسکن خالی است؛ شابک را وارد کنید.'; return; }
    if (!isValidIsbn(isbn)) { this.scanStatus = 'بارکد شابک معتبر نیست. رقم کنترلی را بررسی یا اطلاعات را دستی وارد کنید.'; return; }
    this.barcodeValue = '';
    if (this.continuousScanMode) {
      this.pendingBatchIsbns.push(isbn);
      this.processNextBatchScan();
      return;
    }
    if (this.completedScans.has(isbn)) {
      this.scanStatus = 'این شابک قبلاً بررسی شده است.';
      return;
    }
    if (this.isLookingUpMetadata) {
      this.scanStatus = 'جست‌وجوی قبلی هنوز تمام نشده؛ چند لحظه بعد دوباره اسکن کنید.';
      return;
    }
    this.isLookingUpMetadata = true;
    this.scanStatus = 'در حال جست‌وجوی اطلاعات کتاب…';
    this.metadata.lookup(isbn).subscribe({
      next: (candidates) => {
        this.completedScans.add(isbn);
        this.metadataCandidates = candidates;
        if (candidates.length === 1 && candidates[0]) this.applyMetadata(candidates[0]);
        else {
          if (this.continuousScanMode) {
            this.continuousScanMode = false;
            this.stopCameraScan();
          }
          this.scanStatus = candidates.length
            ? `${candidates.length} ویرایش پیدا شد؛ مورد درست را انتخاب کنید.`
            : 'اطلاعاتی پیدا نشد؛ می‌توانید فیلدها را دستی تکمیل کنید.';
        }
        this.isLookingUpMetadata = false;
      },
      error: (error: unknown) => {
        if (this.continuousScanMode) {
          this.continuousScanMode = false;
          this.stopCameraScan();
        }
        if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) {
          this.scanStatus = 'اطلاعاتی پیدا نشد؛ می‌توانید فیلدها را دستی تکمیل کنید.';
        } else {
          this.scanStatus = 'جست‌وجوی اطلاعات انجام نشد. شابک را نگه دارید و اطلاعات را دستی وارد کنید.';
        }
        this.isLookingUpMetadata = false;
      }
    });
  }

  private processNextBatchScan(): void {
    if (!this.continuousScanMode || this.isLookingUpMetadata || this.isSubmitting) return;
    const isbn = this.pendingBatchIsbns.shift();
    if (!isbn) return;
    this.isLookingUpMetadata = true;
    this.scanStatus = `در حال جست‌وجوی شابک ${isbn}…`;
    this.metadata.lookup(isbn).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (candidates) => {
        this.isLookingUpMetadata = false;
        if (candidates.length === 1 && candidates[0]) {
          this.completedScans.add(isbn);
          this.applyMetadata(candidates[0]);
          if (!this.isSubmitting && this.continuousScanMode) {
            this.continuousScanMode = false;
            this.pendingBatchIsbns.length = 0;
            this.stopCameraScan();
          }
          return;
        }
        this.continuousScanMode = false;
        this.pendingBatchIsbns.length = 0;
        this.stopCameraScan();
        this.metadataCandidates = candidates;
        this.scanStatus = candidates.length
          ? `${candidates.length} ویرایش پیدا شد؛ مورد درست را انتخاب کنید. اسکن پیوسته متوقف شد.`
          : 'اطلاعاتی پیدا نشد؛ می‌توانید فیلدها را دستی تکمیل کنید. اسکن پیوسته متوقف شد.';
      },
      error: () => {
        this.isLookingUpMetadata = false;
        this.continuousScanMode = false;
        this.pendingBatchIsbns.length = 0;
        this.stopCameraScan();
        this.scanStatus = 'جست‌وجوی اطلاعات انجام نشد؛ اسکن پیوسته متوقف شد. شابک و اطلاعات را دستی بررسی کنید.';
      },
    });
  }

  /** Starts an in-browser rear-camera scan; keyboard-wedge and manual entry stay available. */
  async startCameraScan(video: HTMLVideoElement): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.isStartingCamera || this.isCameraScanning) return;
    if (!window.isSecureContext) {
      this.scanStatus = 'دسترسی دوربین فقط در اتصال امن HTTPS یا روی localhost امکان‌پذیر است.';
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      this.scanStatus = 'این مرورگر به دوربین دسترسی نمی‌دهد. شابک را با اسکنر یا به‌صورت دستی وارد کنید.';
      return;
    }

    this.isStartingCamera = true;
    this.scanStatus = 'برای شروع اسکن، اجازهٔ دسترسی به دوربین را تأیید کنید.';
    try {
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import('@zxing/browser'),
        import('@zxing/library'),
      ]);
      const hints = new Map<DecodeHintKey, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A, BarcodeFormat.CODE_128]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);
      this.scannerControls = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' } } },
        video,
        (result) => {
          if (!this.isCameraScanning) return;
          if (!result) {
            if (++this.emptyCameraFrames >= 8) this.lastCameraIsbn = null;
            return;
          }
          const cameraIsbn = normalizeIsbn(result.getText());
          this.emptyCameraFrames = 0;
          if (cameraIsbn && cameraIsbn === this.lastCameraIsbn) return;
          this.lastCameraIsbn = cameraIsbn;
          this.barcodeValue = result.getText();
          if (!this.continuousScanMode) this.stopCameraScan();
          this.lookupScannedIsbn();
        },
      );
      this.isCameraScanning = true;
      this.scanStatus = 'دوربین فعال است؛ بارکد را در قاب نگه دارید.';
    } catch (error) {
      this.scannerControls?.stop();
      this.scannerControls = null;
      this.isCameraScanning = false;
      this.scanStatus = this.cameraErrorMessage(error);
    } finally {
      this.isStartingCamera = false;
    }
  }

  /** Stops the video stream immediately when a code is read or the dialog is closed. */
  stopCameraScan(): void {
    this.scannerControls?.stop();
    this.scannerControls = null;
    this.isCameraScanning = false;
  }

  private cameraErrorMessage(error: unknown): string {
    const name = typeof error === 'object' && error !== null && 'name' in error
      ? String((error as { name: unknown }).name)
      : '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'اجازهٔ دوربین داده نشد. دسترسی دوربین را در تنظیمات مرورگر فعال کنید یا اطلاعات را دستی وارد کنید.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'دوربینی در این دستگاه پیدا نشد. می‌توانید از اسکنر یا ورود دستی استفاده کنید.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'دوربین در برنامهٔ دیگری در حال استفاده است. آن را آزاد کنید و دوباره تلاش کنید.';
    }
    return 'شروع دوربین ممکن نشد. مجوزها و اتصال امن را بررسی کنید یا اطلاعات را دستی وارد کنید.';
  }

  applyMetadata(metadata: BookMetadata): void {
    const isbn10 = metadata.isbn10 || (metadata.isbn13 ? isbn13To10(metadata.isbn13) : null);
    this.bookForm.patchValue({
      ...(metadata.title ? { title: metadata.title } : {}),
      ...(metadata.author ? { author: metadata.author } : {}),
      ...(metadata.publisher ? { publisher: metadata.publisher } : {}),
      ...(isbn10 ? { isbn10 } : {}),
      ...(metadata.isbn13 ? { isbn13: normalizeIsbn(metadata.isbn13) } : {}),
      ...(metadata.pageCount ? { pageCount: metadata.pageCount } : {}),
      ...(metadata.language ? { language: metadata.language } : {}),
      ...(metadata.subject ? { subject: metadata.subject } : {}),
    });
    this.metadataCandidates = [];
    this.scanStatus = this.continuousScanMode
      ? 'اطلاعات پیدا شد؛ در حال ثبت کتاب…'
      : 'اطلاعات انتخاب‌شده در فرم قرار گرفت. پیش از ذخیره، فیلدها را بررسی و اصلاح کنید.';
    if (this.continuousScanMode) {
      if (this.bookForm.valid) this.onBookSubmit();
      else {
        this.continuousScanMode = false;
        this.stopCameraScan();
        this.scanStatus = 'اطلاعات بارکد کامل نیست؛ حالت پیوسته متوقف شد تا فیلدهای لازم را بررسی کنید.';
      }
    }
  }

  /**
   * URL shown as the stored-cover preview in the modal: the fetched object URL, or a
   * legacy inline URL/base64 value. Hidden while a removal is pending.
   */
  get coverPreviewUrl(): string | null {
    if (this.coverRemovalArmed || this.bookForm?.get('bookCoverFile')?.value instanceof File) {
      return null;
    }    const id = this.currentEditingBookId;
    const fromLoader = id !== null && this.hasStoredCover
      ? this.imageLoader.getCached('cover', id)
      : null;
    return fromLoader ?? this.currentCoverUrl;
  }

  /**
   * True when the operator cleared the cover of a book that already had one — the only
   * moment a removal may be signalled.
   */
  get shouldRemoveCover(): boolean {
    return this.coverRemovalArmed;
  }


  /**
   * Rebuilds the editable `File` for a stored cover, or null when there is none to rebuild.
   *
   * A `File` is returned as-is; a `data:` URL / bare base64 blob is decoded; a plain URL
   * yields **null**, because it cannot become a `File`. Null here means "nothing to
   * pre-fill" — never "the operator cleared it" (that reading silently deleted covers).
   */
  private coverToFile(cover: BookModel['bookCoverFile']): File | null {
    return storedImageToFile(cover, 'book-cover.jpg');
  }

  onBookModalClose(): void {
    this.continuousScanMode = false;
    this.pendingBatchIsbns.length = 0;
    this.stopCameraScan();
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

    // Strip the file control from the JSON DTO: `book` must stay a plain BookModel, and
    // the binary travels in the multipart part.
    const rawFormValue = this.bookForm.getRawValue() as BookModel & { bookCoverFile: File | null };
    const { bookCoverFile, ...bookFields } = rawFormValue;
    const bookDataFromForm: BookModel = {
      ...bookFields,
      // `''` is not a valid LocalDate; the API expects null/absent for "no date".
      publicationDate: bookFields.publicationDate || null,
    };

    let serviceCall: Observable<BookModel>;
    let successMessage: string;

    let fileToSend: File | null | undefined = undefined;
    if (this.shouldRemoveCover) {
      fileToSend = null;
    } else if (bookCoverFile instanceof File) {
      fileToSend = bookCoverFile;
    }

    if (this.currentFormOperation === FormOperation.UPDATE && this.currentEditingBookId) {
      serviceCall = this.bookService.updateBook(this.currentEditingBookId, bookDataFromForm, fileToSend);
      successMessage = 'کتاب با موفقیت بروزرسانی شد!';
    } else {
      serviceCall = this.bookService.addBook(bookDataFromForm, fileToSend ?? undefined);
      successMessage = 'کتاب با موفقیت اضافه شد!';
    }

    serviceCall.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(successMessage, 'بستن', { duration: 3000, direction: 'rtl' });
        }
        // The stored bytes changed (or were deleted): drop the cached object URL so the
        // list re-reads them instead of showing a stale image.
        this.imageLoader.forget('cover', this.currentEditingBookId);
        this.isSubmitting = false;
        if (this.currentFormOperation === FormOperation.ADD && this.continuousScanMode) {
          this.bookForm.reset({ active: true, bookCoverFile: null });
          this.fileError = null;
          this.coverRemovalArmed = false;
          this.completedScans.clear();
          this.metadataCandidates = [];
          this.scanStatus = 'کتاب ثبت شد؛ بارکد بعدی را اسکن کنید.';
          this.barcodeValue = '';
          setTimeout(() => document.getElementById('bookBarcodeScan')?.focus(), 0);
          this.processNextBatchScan();
        } else {
          this.isBookModalVisible = false;
        }
        this.loadBooks();
      },
      error: (error) => {
        console.error('Error submitting book:', error);
        const backendError = error.error?.message || error.error?.title || error.message || 'خطا در ثبت اطلاعات کتاب.';
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(`خطا: ${backendError} لطفاً دوباره تلاش کنید.`, 'بستن', { duration: 5000, direction: 'rtl' });
        }
        this.isSubmitting = false;
        if (this.continuousScanMode) {
          this.continuousScanMode = false;
          this.pendingBatchIsbns.length = 0;
          this.stopCameraScan();
          this.scanStatus = 'ثبت کتاب انجام نشد؛ اسکن پیوسته متوقف شد تا اطلاعات را بررسی کنید.';
        }
      }
    });
  }

  /**
   * Receives the picker's validation message. The picker rejects bad type/size itself and
   * keeps any previously valid file, so the component only mirrors the message.
   */
  onCoverValidationError(message: string | null): void {
    this.fileError = message;
  }

  /**
   * Mirrors picker state changes. The picker owns the preview of a newly selected file;
   * this only clears any stale validation message.
   */
  onCoverFileChange(): void {
    this.fileError = null;
  }

  async deleteBook(book: BookModel): Promise<void> {
    if (!book.id) {
      if (isPlatformBrowser(this.platformId)) {
        this.snackBar.open('امکان حذف کتاب بدون شناسه وجود ندارد.', 'بستن', { duration: 3000, direction: 'rtl' });
      }
      return;
    }
    const confirmed = await this.confirmation.confirm({
      title: 'حذف کتاب',
      message: `آیا از حذف کتاب "${book.title}" با شناسه ${book.id} مطمئن هستید؟`,
      confirmLabel: 'حذف',
    });
    if (confirmed) {
      this.performDelete(book);
    }
  }

  private performDelete(book: BookModel): void {
    if (!book.id) return;
    this.bookService.deleteBook(book.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(`کتاب "${book.title}" با موفقیت حذف شد.`, 'بستن', { duration: 3000, direction: 'rtl' });
        }
        // Deactivated server-side (soft delete): release its cached cover too.
        this.imageLoader.forget('cover', book.id);
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

  readonly excelImportForm = this.fb.group({
    excelFile: [null as File | null],
  });

  get hasExcelImportFile(): boolean {
    return this.excelImportForm.controls.excelFile.value instanceof File;
  }

  openExcelImportModal(): void {
    this.isExcelImportModalVisible = true;
    // Reset state
    this.excelImportForm.reset({ excelFile: null });
    this.importError = null;
    this.isImporting = false;
  }

  onExcelImportModalClose(): void {
    this.isExcelImportModalVisible = false;
  }

  /** Excel picker validation message (wrong extension or too large). */
  onExcelValidationError(message: string | null): void {
    this.importError = message;
  }

  onExcelImportSubmit(): void {
    const excelFile = this.excelImportForm.get('excelFile')?.value as File | null;
    if (!excelFile) {
      this.importError = 'لطفاً ابتدا یک فایل را انتخاب کنید.';
      return;
    }
    this.isImporting = true;
    this.importError = null;

    this.bookService.importBooksFromExcel(excelFile).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isImporting = false;
        this.isExcelImportModalVisible = false;
        this.excelImportForm.reset({ excelFile: null });
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
    downloadUrl('./assets/excel/book-import-template.xlsx', 'book-import-template.xlsx', this.platformId);
  }

}
