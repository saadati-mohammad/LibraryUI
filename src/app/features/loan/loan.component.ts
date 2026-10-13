import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Observable, Subject, switchMap } from 'rxjs';
import { BookLoanFilterModel, BookLoanModel, CreateLoanRequest, LoanStatus } from '../../core/model/bookLoanModel';
import { BookModel } from '../../core/model/bookModel';
import { PersonModel } from '../../core/model/personModel';
import { BookLoanService } from '../../core/service/book-loan.service';
import { BookService } from '../../core/service/book.service';
import { PersonService } from '../../core/service/person.service';
import { InputDeviceService } from '../../core/service/input-device.service';
import { isValidIsbn, normalizeIsbn } from '../../core/util/isbn.util';
import { ListComponent, TableColumn } from '../../shared/component/list/list.component';
import { ModalComponent } from '../../shared/component/modal/modal.component';
import { ConfirmationService } from '../../shared/service/confirmation.service';
import { PagedFilterPage } from '../../shared/component/paged-filter-page';

/** Bounded autocomplete page size — never fetch a thousand rows to fill a picker. */
const SEARCH_PAGE_SIZE = 25;

/** Debounce for the type-ahead searches (ms). */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Validator for a `<mat-autocomplete>`-backed control.
 *
 * `mat-autocomplete` writes the raw *string* into the control while the user types, so a
 * free-typed name would otherwise be posted as `personId`. Requiring a number forces a
 * real option selection.
 */
function requireSelectedId(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    typeof control.value === 'number' ? null : { selectionRequired: true };
}

@Component({
  selector: 'app-loan',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
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
  templateUrl: './loan.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./loan.component.css'],
})
export class LoanComponent extends PagedFilterPage<BookLoanModel> implements OnInit {
  tableTitle = 'لیست امانت‌ها';
  columns: TableColumn[] = [];

  // Modal & Form state
  isLoanModalVisible = false;
  loanForm: FormGroup;
  isSubmitting = false;
  scanValue = '';
  scanStatus = '';
  scannerInputAllowed = true;
  scanTarget: 'book' | 'member' = 'book';

  // Bounded type-ahead option lists for the create form.
  readonly personOptions = signal<PersonModel[]>([]);
  readonly bookOptions = signal<BookModel[]>([]);
  readonly isSearchingPersons = signal(false);
  readonly isSearchingBooks = signal(false);

  /** Status filter options — typed so the control value cannot mix `null` and strings. */
  readonly statusOptions: { value: LoanStatus | null; label: string }[] = [
    { value: null, label: 'همه' },
    { value: 'ON_LOAN', label: 'در امانت' },
    { value: 'OVERDUE', label: 'دیرکرد' },
    { value: 'RETURNED', label: 'بازگشتی' },
  ];

  // Pagination & Loading state
  /** Persian message of the last failed list request (previously swallowed silently). */
  loadError: string | null = null;

  // Filtering
  filtersForm: FormGroup;

  private readonly destroyRef = inject(DestroyRef);
  private readonly personSearch$ = new Subject<string>();
  private readonly bookSearch$ = new Subject<string>();

  private fb = inject(FormBuilder);
  private loanService = inject(BookLoanService);
  private personService = inject(PersonService);
  private bookService = inject(BookService);
  private inputDevices = inject(InputDeviceService);
  private snackBar = inject(MatSnackBar);
  private confirmation = inject(ConfirmationService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    super();
    this.loanForm = this.fb.group({
      personId: [null, [Validators.required, requireSelectedId()]],
      bookId: [null, [Validators.required, requireSelectedId()]],
      notes: [''],
    });

    this.filtersForm = this.fb.group({
      personNationalId: [''],
      bookIsbn: [''],
      status: [null as LoanStatus | null],
    });
  }

  ngOnInit(): void {
    this.setupTableColumns();
    this.loadLoans();

    // `takeUntilDestroyed` replaces the subscription that previously leaked for the whole
    // lifetime of the SPA after the route was left.
    this.watchFilters(this.filtersForm);

    this.wireSearch(this.personSearch$, this.personOptions, this.isSearchingPersons, (term) =>
      this.personService.getPersonList(
        { active: true, ...(term ? { firstName: term } : {}) },
        0,
        SEARCH_PAGE_SIZE,
      ),
    );
    this.wireSearch(this.bookSearch$, this.bookOptions, this.isSearchingBooks, (term) =>
      this.bookService.getBookList(
        { active: true, ...(term ? { title: term } : {}) },
        0,
        SEARCH_PAGE_SIZE,
      ),
    );
  }

  setupTableColumns(): void {
    this.columns = [
      { columnDef: 'bookTitle', header: 'عنوان کتاب', cell: (el: BookLoanModel) => el.bookTitle, cellClass: () => 'emphasize' },
      { columnDef: 'personName', header: 'نام عضو', cell: (el: BookLoanModel) => `${el.personFirstName} ${el.personLastName}` },
      { columnDef: 'loanDate', header: 'تاریخ امانت', cell: (el: BookLoanModel) => el.loanDate },
      { columnDef: 'dueDate', header: 'تاریخ سررسید', cell: (el: BookLoanModel) => el.dueDate },
      { columnDef: 'returnDate', header: 'تاریخ بازگشت', cell: (el: BookLoanModel) => el.returnDate || '---' },
      {
        columnDef: 'status', header: 'وضعیت',
        cell: (el: BookLoanModel) => `<span class="status-badge ${this.getStatusClass(el.status)}">${this.translateStatus(el.status)}</span>`
      },
    ];
  }

  loadLoans(): void {
    this.isLoadingTable = true;
    this.loadError = null;
    const filters: BookLoanFilterModel = this.filtersForm.value;

    this.loanService.getLoanList(filters, this.currentPage, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.data = response.content;
          this.totalElements = response.totalElements;
          this.isLoadingTable = false;
        },
        error: (error: unknown) => {
          // Previously this handler only flipped the loading flag, so a failed request was
          // indistinguishable from "no loans" for the operator.
          this.data = [];
          this.totalElements = 0;
          this.loadError = this.describeError(error);
          this.isLoadingTable = false;
        },
      });
  }

  protected override reloadPage(): void { this.loadLoans(); }

  applyFilters(): void {
    this.resetPageAndReload();
  }

  resetFilters(): void {
    this.filtersForm.reset({ status: null });
    this.applyFilters();
  }

  openLoanModal(): void {
    this.loanForm.reset({ personId: null, bookId: null, notes: '' });
    this.isLoanModalVisible = true;
    this.scanValue = '';
    this.scanStatus = '';
    this.inputDevices.effectivePolicy('loan-checkout').subscribe({
      next: policy => {
        this.scannerInputAllowed = policy.allowedSources.some(source =>
          source === 'KEYBOARD_WEDGE' || source.startsWith('DEVICE:'),
        );
      },
      // Manual entry remains available when the policy service cannot be reached.
      error: () => { this.scannerInputAllowed = true; },
    });
    // Seed both pickers with a bounded first page; the user types to narrow further.
    this.personSearch$.next('');
    this.bookSearch$.next('');
  }

  onLoanModalClose(): void {
    this.isLoanModalVisible = false;
  }

  onPersonSearch(term: string): void {
    this.personSearch$.next(term ?? '');
  }

  onBookSearch(term: string): void {
    this.bookSearch$.next(term ?? '');
  }

  processLoanScan(value = this.scanValue): void {
    const scanned = value.trim();
    this.scanValue = '';
    this.scanStatus = '';
    if (this.scanTarget === 'book') {
      const isbn = normalizeIsbn(scanned);
      if (!isValidIsbn(isbn)) {
        this.scanStatus = 'شابک معتبر نیست؛ شابک کتاب را دوباره اسکن کنید.';
        return;
      }
      this.bookService.getBookList({ active: true, ...(isbn.length === 10 ? { isbn10: isbn } : { isbn13: isbn }) }, 0, SEARCH_PAGE_SIZE)
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: result => {
            const matches = result.content.filter(book => normalizeIsbn((isbn.length === 10 ? book.isbn10 : book.isbn13) ?? '') === isbn);
            if (matches.length !== 1 || result.totalElements > 1 || typeof matches[0]?.id !== 'number') {
              this.scanStatus = matches.length || result.totalElements > 1 ? 'چند کتاب با این شابک پیدا شد؛ کتاب را دستی انتخاب کنید.' : 'کتابی با این شابک پیدا نشد.';
              return;
            }
            this.bookOptions.set([...this.bookOptions().filter(book => book.id !== matches[0].id), matches[0]]);
            this.loanForm.get('bookId')?.setValue(matches[0].id);
            this.scanStatus = `کتاب «${matches[0].title ?? ''}» انتخاب شد.`;
          },
          error: () => { this.scanStatus = 'جست‌وجوی کتاب انجام نشد؛ اتصال شبکه را بررسی کنید یا کتاب را دستی انتخاب کنید.'; },
        });
      return;
    }
    const nationalId = scanned.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
    if (!/^\d{10}$/.test(nationalId)) {
      this.scanStatus = 'کد ملی عضو باید ۱۰ رقم باشد.';
      return;
    }
    this.personService.getPersonList({ active: true, nationalId }, 0, SEARCH_PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: result => {
          const matches = result.content.filter(person => person.nationalId === nationalId);
          if (matches.length !== 1 || result.totalElements > 1 || typeof matches[0]?.id !== 'number') {
            this.scanStatus = matches.length || result.totalElements > 1 ? 'چند عضو با این کد ملی پیدا شد؛ عضو را دستی انتخاب کنید.' : 'عضوی با این کد ملی پیدا نشد.';
            return;
          }
          this.personOptions.set([...this.personOptions().filter(person => person.id !== matches[0].id), matches[0]]);
          this.loanForm.get('personId')?.setValue(matches[0].id);
          this.scanStatus = `عضو «${matches[0].firstName ?? ''} ${matches[0].lastName ?? ''}» انتخاب شد.`;
        },
        error: () => { this.scanStatus = 'جست‌وجوی عضو انجام نشد؛ اتصال شبکه را بررسی کنید یا عضو را دستی انتخاب کنید.'; },
      });
  }

  formatPerson = (value: number | string | null): string => {
    if (typeof value !== 'number') {
      return '';
    }
    const person = this.personOptions().find((candidate) => candidate.id === value);
    return person ? `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() : '';
  };

  formatBook = (value: number | string | null): string => {
    if (typeof value !== 'number') {
      return '';
    }
    const book = this.bookOptions().find((candidate) => candidate.id === value);
    return book ? `${book.title ?? ''}${book.author ? ` — ${book.author}` : ''}` : '';
  };

  onLoanSubmit(): void {
    if (this.loanForm.invalid) {
      this.loanForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const request: CreateLoanRequest = this.loanForm.getRawValue() as CreateLoanRequest;

    this.loanService.createLoan(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify('امانت با موفقیت ثبت شد.');
        this.isSubmitting = false;
        this.isLoanModalVisible = false;
        this.loadLoans();
      },
      error: (err: unknown) => {
        this.notify(this.describeError(err, 'خطا در ثبت امانت. ممکن است کتاب در دسترس نباشد.'));
        this.isSubmitting = false;
      },
    });
  }

  async returnBook(loan: BookLoanModel): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'ثبت بازگشت کتاب',
      message: `آیا از ثبت بازگشت کتاب "${loan.bookTitle}" توسط "${loan.personFirstName} ${loan.personLastName}" مطمئن هستید؟`,
      confirmLabel: 'ثبت بازگشت',
    });
    if (!confirmed) {
      return;
    }
    this.loanService.returnLoan(loan.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify('کتاب با موفقیت بازگردانده شد.');
        this.loadLoans();
      },
      error: (err: unknown) => {
        this.notify(this.describeError(err, 'خطا در ثبت بازگشت کتاب.'));
      },
    });
  }

  // --- Helper methods for display ---
  getStatusClass(status: string): string {
    switch (status) {
      case 'ON_LOAN': return 'status-on-loan';
      case 'RETURNED': return 'status-returned';
      case 'OVERDUE': return 'status-overdue';
      default: return '';
    }
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'ON_LOAN': return 'در امانت';
      case 'RETURNED': return 'بازگشتی';
      case 'OVERDUE': return 'دیرکرد';
      default: return status;
    }
  }

  // --- Internals ------------------------------------------------------------

  /**
   * Wires one type-ahead: debounce, switch to the bounded request (cancelling the previous
   * one), and tear the whole chain down with the component.
   */
  private wireSearch<T>(
    trigger: Subject<string>,
    target: { set(value: T[]): void },
    loading: { set(value: boolean): void },
    fetch: (term: string) => Observable<{ content: T[] }>,
  ): void {
    trigger
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((term) => {
          loading.set(true);
          return fetch(term.trim());
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          target.set(response.content ?? []);
          loading.set(false);
        },
        error: () => {
          target.set([]);
          loading.set(false);
        },
      });
  }

  private notify(message: string, action = 'بستن'): void {
    if (isPlatformBrowser(this.platformId)) {
      this.snackBar.open(message, action, { duration: 5000, direction: 'rtl' });
    }
  }

  /** Surfaces the backend's error envelope, including the new 409 business conflicts. */
  private describeError(error: unknown, fallback = 'خطای غیرمنتظره. لطفاً دوباره تلاش کنید.'): string {
    const httpError = error as { error?: { message?: string }; message?: string; status?: number };
    if (httpError?.status === 409) {
      return httpError.error?.message || 'این عملیات با وضعیت فعلی کتاب یا عضو در تضاد است.';
    }
    if (httpError?.status === 403) {
      return httpError.error?.message || 'شما اجازه انجام این عملیات را ندارید.';
    }
    return httpError?.error?.message || httpError?.message || fallback;
  }
}
