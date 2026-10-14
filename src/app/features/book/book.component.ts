import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, DestroyRef, inject, Input, OnDestroy, OnInit, PLATFORM_ID, ChangeDetectionStrategy } from "@angular/core";
import { ReactiveFormsModule, FormGroup, FormBuilder } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Observable, Subscription, catchError, interval, of, switchMap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BookFilterModel, BookModel } from "../../core/model/bookModel";
import { BookService } from "../../core/service/book.service";
import { ExcelImportResult, PaginatedResponse } from "../../core/model/paginated-response.model";
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
import { PhoneBarcodeRelayService, PhoneScannerSession } from "../../core/service/phone-barcode-relay.service";
import { isValidIsbn, isbn13To10, normalizeIsbn } from "../../core/util/isbn.util";
import { PagedFilterPage } from '../../shared/component/paged-filter-page';
import { BookFormFactory, todayIso } from './book-form.factory';
import { InputDeviceService } from '../../core/service/input-device.service';
import { CameraBarcodeScannerService } from '../../core/service/camera-barcode-scanner.service';
import type { InputDeviceRuntimeProfile, InputFormPolicy } from '../../core/model/input-device.model';
import { KeyboardWedgeScannerDirective } from '../../shared/directive/keyboard-wedge-scanner.directive';

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
    MatSlideToggleModule,
    MatCardModule,
    MatSnackBarModule,
    ListComponent,
    ModalComponent,
    DateInputComponent,
    FilePickerComponent,
    KeyboardWedgeScannerDirective,
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
  private readonly bookForms = inject(BookFormFactory);

  // مربوط به بارگذاری اکسل
  isExcelImportModalVisible = false;
  isImporting = false;
  importError: string | null = null;
  importPreview: ExcelImportResult | null = null;
  private previewedImportFile: File | null = null;
  excelFilePath = 'book-import-template.xlsx'; // مسیر فایل اکسل


  private fb = inject(FormBuilder);
  private bookService = inject(BookService);
  private imageLoader = inject(ImageLoaderService);
  private snackBar = inject(MatSnackBar);
  private confirmation = inject(ConfirmationService);
  private readonly metadata = inject(BookMetadataService);
  private readonly inputDevices = inject(InputDeviceService);
  private readonly cameraScanner = inject(CameraBarcodeScannerService);
  private readonly phoneBarcodeRelay = inject(PhoneBarcodeRelayService);
  private platformId = inject(PLATFORM_ID);

  barcodeValue = '';
  inputPolicy: InputFormPolicy | null = null;
  catalogSearchQuery = '';
  scanStatus: string | null = null;
  isLookingUpMetadata = false;
  isStartingCamera = false;
  isCameraScanning = false;
  cameraDevices: MediaDeviceInfo[] = [];
  selectedCameraId = '';
  torchSupported = false;
  torchEnabled = false;
  continuousScanMode = false;
  /** Review-first alternative to automatic continuous registration. */
  reviewBatchMode = false;
  private lastCameraIsbn: string | null = null;
  private emptyCameraFrames = 0;
  metadataCandidates: BookMetadata[] = [];
  metadataSelectionOpen = false;
  phoneScannerSession: PhoneScannerSession | null = null;
  phoneScannerUrl = '';
  private phoneScannerPoll?: Subscription;
  private lastPhoneScanSequence = 0;
  private readonly completedScans = new Set<string>();
  private readonly pendingBatchIsbns: string[] = [];
  readonly reviewBatchIsbns: string[] = [];
  private isReviewingBatchItem = false;

  constructor() {
    super();
    this.bookForm = this.bookForms.createEditorForm();
    this.bookFiltersForm = this.bookForms.createFiltersForm();
  }

  ngOnInit(): void {
    this.setupTableColumns();
    this.loadBooks();
    this.inputDevices.effectivePolicy('book-registration').subscribe({
      next: policy => { this.inputPolicy = policy; },
      error: () => { this.inputPolicy = null; },
    });

    this.watchFilters(this.bookFiltersForm);
  }

  isInputSourceAllowed(source: string): boolean {
    const allowed = this.inputPolicy?.allowedSources;
    if (!allowed) return true;
    if (allowed.includes(source)) return true;
    return source === 'KEYBOARD_WEDGE' && !!this.keyboardWedgeProfile;
  }

  get keyboardWedgeProfile(): InputDeviceRuntimeProfile | null {
    return this.inputPolicy?.deviceProfiles?.find(profile => profile.typeKey === 'KEYBOARD_WEDGE') ?? null;
  }

  handleKeyboardWedgeScan(value: string): void {
    this.barcodeValue = value;
    this.lookupScannedIsbn();
  }

  ngOnDestroy(): void {
    this.stopCameraScan();
    this.closePhoneScannerSession();
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
    this.closePhoneScannerSession();
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
    this.reviewBatchMode = false;
    this.lastCameraIsbn = null;
    this.emptyCameraFrames = 0;
    this.scanStatus = null;
    this.metadataCandidates = [];
    this.completedScans.clear();
    this.pendingBatchIsbns.length = 0;
    this.reviewBatchIsbns.length = 0;

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

  /** Loads a reviewed queue item into the existing metadata lookup flow. */
  reviewBatchItem(isbn: string): void {
    if (this.isLookingUpMetadata || this.isSubmitting) return;
    this.barcodeValue = isbn;
    this.isReviewingBatchItem = true;
    this.lookupScannedIsbn();
    this.isReviewingBatchItem = false;
  }

  removeReviewBatchItem(isbn: string): void {
    const index = this.reviewBatchIsbns.indexOf(isbn);
    if (index >= 0) this.reviewBatchIsbns.splice(index, 1);
    this.scanStatus = `مورد از صف بازبینی حذف شد؛ ${this.reviewBatchIsbns.length} مورد باقی مانده است.`;
  }

  setContinuousScanMode(enabled: boolean): void {
    this.continuousScanMode = enabled;
    if (enabled) this.reviewBatchMode = false;
  }

  setReviewBatchMode(enabled: boolean): void {
    this.reviewBatchMode = enabled;
    if (enabled) this.continuousScanMode = false;
  }

  /** Handles only the focused scanner field, so normal keyboard input remains untouched. */
  lookupScannedIsbn(): void {
    const isbn = normalizeIsbn(this.barcodeValue);
    if (!isbn) { this.scanStatus = 'اسکن خالی است؛ شابک را وارد کنید.'; return; }
    if (!isValidIsbn(isbn)) { this.scanStatus = 'بارکد شابک معتبر نیست. رقم کنترلی را بررسی یا اطلاعات را دستی وارد کنید.'; return; }
    this.barcodeValue = '';
    if (this.reviewBatchMode && !this.isReviewingBatchItem) {
      if (this.reviewBatchIsbns.includes(isbn)) {
        this.scanStatus = 'این شابک از قبل در صف بازبینی است.';
      } else if (this.reviewBatchIsbns.length >= 50) {
        this.scanStatus = 'صف بازبینی به سقف ۵۰ مورد رسیده؛ ابتدا چند مورد را بررسی یا حذف کنید.';
      } else {
        this.reviewBatchIsbns.push(isbn);
        this.scanStatus = `شابک به صف بازبینی اضافه شد (${this.reviewBatchIsbns.length} مورد).`;
      }
      return;
    }
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
    this.metadataSelectionOpen = false;
    this.scanStatus = 'در حال جست‌وجوی اطلاعات کتاب…';
    this.metadata.lookup(isbn).subscribe({
      next: (candidates) => {
        this.completedScans.add(isbn);
        const reviewedIndex = this.reviewBatchIsbns.indexOf(isbn);
        if (reviewedIndex >= 0) this.reviewBatchIsbns.splice(reviewedIndex, 1);
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

  async startPhoneScanner(): Promise<void> {
    if (this.phoneScannerSession || !isPlatformBrowser(this.platformId)) return;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.scanStatus = 'برای اتصال گوشی، برنامه را با نشانی شبکهٔ رایانه و HTTPS باز کنید؛ localhost روی گوشی به خود گوشی اشاره می‌کند.';
      return;
    }
    this.isLookingUpMetadata = true;
    this.scanStatus = 'در حال ایجاد اتصال امن و موقت با گوشی…';
    this.phoneBarcodeRelay.createSession().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: async session => {
        this.phoneScannerSession = session;
        this.lastPhoneScanSequence = 0;
        const phoneUrl = new URL('phone-scan', document.baseURI);
        phoneUrl.hash = `pair=${session.sessionId}.${session.pairingToken}`;
        this.phoneScannerUrl = phoneUrl.toString();
        this.scanStatus = 'اتصال ۱۰ دقیقه فعال است؛ QR را با PWA یا دوربین گوشی اسکن کنید.';
        try {
          const QRCode = await import('qrcode');
          const canvas = document.getElementById('phoneScannerQr') as HTMLCanvasElement | null;
          if (canvas) await QRCode.toCanvas(canvas, this.phoneScannerUrl, { width: 240, margin: 1, errorCorrectionLevel: 'M' });
        } catch {
          this.scanStatus = 'اتصال ساخته شد؛ لینک امن را با دکمهٔ بازکردن روی گوشی منتقل کنید.';
        }
        this.phoneScannerPoll = interval(800).pipe(
          switchMap(() => this.phoneBarcodeRelay.poll(session.sessionId, this.lastPhoneScanSequence).pipe(catchError(() => of([])))),
          takeUntilDestroyed(this.destroyRef),
        ).subscribe(scans => this.receivePhoneScans(scans));
        this.isLookingUpMetadata = false;
      },
      error: () => {
        this.isLookingUpMetadata = false;
        this.scanStatus = 'اتصال گوشی ایجاد نشد؛ شبکه و ورود کاربری را بررسی کنید.';
      },
    });
  }

  closePhoneScannerSession(): void {
    this.phoneScannerPoll?.unsubscribe();
    this.phoneScannerPoll = undefined;
    const sessionId = this.phoneScannerSession?.sessionId;
    this.phoneScannerSession = null;
    this.phoneScannerUrl = '';
    this.lastPhoneScanSequence = 0;
    if (sessionId) this.phoneBarcodeRelay.closeSession(sessionId).subscribe({ error: () => undefined });
  }

  private receivePhoneScans(scans: { sequence: number; barcode: string }[]): void {
    if (!scans.length) return;
    if (!this.continuousScanMode && (this.isLookingUpMetadata || this.metadataCandidates.length > 0
      || Boolean(this.bookForm.get('title')?.value))) return;
    for (const scan of scans) {
      if (!this.continuousScanMode && (this.isLookingUpMetadata || this.metadataCandidates.length > 0
        || Boolean(this.bookForm.get('title')?.value))) break;
      this.lastPhoneScanSequence = scan.sequence;
      this.barcodeValue = scan.barcode;
      this.lookupScannedIsbn();
      if (!this.continuousScanMode) break;
    }
  }

  /** Search global catalogs by Persian or Latin title/author before manual entry. */
  searchBookCatalog(): void {
    const query = this.catalogSearchQuery.trim();
    if (query.length < 2) {
      this.scanStatus = 'برای جست‌وجو، دست‌کم دو نویسه از عنوان یا نام نویسنده را بنویسید.';
      return;
    }
    if (this.isLookingUpMetadata) return;
    this.isLookingUpMetadata = true;
    this.metadataCandidates = [];
    this.metadataSelectionOpen = true;
    this.scanStatus = 'در حال جست‌وجوی فهرست‌های کتاب…';
    this.metadata.search(query).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (candidates) => {
        this.metadataCandidates = candidates;
        this.scanStatus = candidates.length
          ? `${candidates.length} نتیجه از فهرست‌های کتاب پیدا شد؛ مورد درست را انتخاب کنید.`
          : 'نتیجه‌ای پیدا نشد؛ اطلاعات را دستی وارد کنید یا با شابک جست‌وجو کنید.';
        this.isLookingUpMetadata = false;
      },
      error: () => {
        this.scanStatus = 'فهرست‌های برخط در دسترس نیستند؛ اطلاعات را دستی وارد کنید یا دوباره تلاش کنید.';
        this.isLookingUpMetadata = false;
      },
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
      const session = await this.cameraScanner.start(video, this.selectedCameraId, rawValue => {
          if (!this.isCameraScanning) return;
          if (!rawValue) {
            if (++this.emptyCameraFrames >= 8) this.lastCameraIsbn = null;
            return;
          }
          const cameraIsbn = normalizeIsbn(rawValue);
          if (!cameraIsbn) return;
          this.emptyCameraFrames = 0;
          if (cameraIsbn && cameraIsbn === this.lastCameraIsbn) return;
          this.lastCameraIsbn = cameraIsbn;
          this.barcodeValue = rawValue;
          if (!this.continuousScanMode) this.stopCameraScan();
          this.lookupScannedIsbn();
        });
      this.isCameraScanning = true;
      this.cameraDevices = session.devices;
      this.selectedCameraId = session.selectedDeviceId;
      this.torchSupported = session.torchSupported;
      this.torchEnabled = false;
      this.scanStatus = this.torchSupported
        ? 'دوربین فعال است؛ بارکد را در قاب نگه دارید. چراغ‌قوه در دسترس است.'
        : 'دوربین فعال است؛ بارکد را در قاب نگه دارید.';
    } catch (error) {
      this.cameraScanner.stop();
      this.isCameraScanning = false;
      this.scanStatus = this.cameraErrorMessage(error);
    } finally {
      this.isStartingCamera = false;
    }
  }

  /** Stops the video stream immediately when a code is read or the dialog is closed. */
  stopCameraScan(): void {
    this.cameraScanner.stop();
    this.isCameraScanning = false;
    this.torchEnabled = false;
  }

  async selectCamera(deviceId: string, video: HTMLVideoElement): Promise<void> {
    if (!deviceId || deviceId === this.selectedCameraId) return;
    this.selectedCameraId = deviceId;
    this.stopCameraScan();
    await this.startCameraScan(video);
  }

  async toggleCameraTorch(): Promise<void> {
    if (!this.torchSupported) {
      this.scanStatus = 'چراغ‌قوه توسط این دوربین یا مرورگر پشتیبانی نمی‌شود.';
      return;
    }
    try {
      this.torchEnabled = await this.cameraScanner.switchTorch(!this.torchEnabled);
      if (!this.torchEnabled) this.scanStatus = 'کنترل چراغ‌قوه در این دستگاه در دسترس نیست.';
    } catch {
      this.torchSupported = false;
      this.torchEnabled = false;
      this.scanStatus = 'کنترل چراغ‌قوه در این دستگاه در دسترس نیست.';
    }
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
    this.metadataSelectionOpen = false;
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
    this.closePhoneScannerSession();
    this.pendingBatchIsbns.length = 0;
    this.reviewBatchIsbns.length = 0;
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
          this.closePhoneScannerSession();
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
    this.importPreview = null;
    this.previewedImportFile = null;
  }

  onExcelImportModalClose(): void {
    this.isExcelImportModalVisible = false;
    this.importPreview = null;
    this.previewedImportFile = null;
  }

  onExcelFileChange(): void {
    this.importPreview = null;
    this.previewedImportFile = null;
    this.importError = null;
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

    if (!this.importPreview || this.previewedImportFile !== excelFile) {
      this.bookService.previewBooksFromExcel(excelFile).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (preview) => {
          this.isImporting = false;
          this.importPreview = preview;
          this.previewedImportFile = excelFile;
        },
        error: (err) => this.handleExcelImportError(err),
      });
      return;
    }

    this.bookService.importBooksFromExcel(excelFile).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.isImporting = false;
        this.isExcelImportModalVisible = false;
        this.excelImportForm.reset({ excelFile: null });
        this.importPreview = null;
        this.previewedImportFile = null;
        const skipped = result.skippedDuplicates ?? 0;
        const duplicateRows = result.duplicateRows?.length
          ? ` ردیف‌های تکراری: ${result.duplicateRows.join('، ')}.`
          : '';
        const message = skipped
          ? `${result.imported ?? 0} کتاب وارد شد و ${skipped} ردیف تکراری نادیده گرفته شد.${duplicateRows}`
          : `${result.imported ?? 0} کتاب از فایل اکسل با موفقیت وارد شد.`;
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(message, 'بستن', { duration: 9000, direction: 'rtl' });
        }
        this.loadBooks(); // Refresh the book list
      },
      error: (err) => {
        this.handleExcelImportError(err);
      }
    });
  }

  private handleExcelImportError(err: unknown): void {
    this.isImporting = false;
    console.error('Excel import operation failed:', err);
    const response = err && typeof err === 'object' ? err as { error?: unknown; message?: string } : {};
    const apiMessage = response.error && typeof response.error === 'object'
      ? (response.error as { message?: string }).message
      : typeof response.error === 'string' ? response.error : undefined;
    const errorMessage = apiMessage || response.message || 'خطا در پردازش فایل. لطفاً فایل را بررسی کرده و دوباره تلاش کنید.';
    this.importError = errorMessage;
    if (isPlatformBrowser(this.platformId)) {
      this.snackBar.open(`خطا: ${errorMessage}`, 'بستن', { duration: 7000, direction: 'rtl' });
    }
  }

  downloadExcelTemplate(): void {
    downloadUrl('./assets/excel/book-import-template.xlsx', 'book-import-template.xlsx', this.platformId);
  }

}
