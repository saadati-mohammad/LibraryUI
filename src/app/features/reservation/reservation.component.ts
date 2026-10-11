import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  inject,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  signal,
  WritableSignal,
  ChangeDetectionStrategy
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Observable, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BookModel } from '../../core/model/bookModel';
import { PersonModel } from '../../core/model/personModel';
import {
  CreateReservationRequest,
  DEFAULT_RESERVATION_DAYS,
  ReservationModel,
  defaultExpiryIso,
  todayIso,
} from '../../core/model/reservation.model';
import { BookService } from '../../core/service/book.service';
import { PersonService } from '../../core/service/person.service';
import { ReservationService } from '../../core/service/reservation.service';
import { notPastDate, parseIsoDate } from '../../core/util/date.util';
import { ListComponent, TableColumn } from '../../shared/component/list/list.component';
import { ModalComponent } from '../../shared/component/modal/modal.component';
import { ConfirmationService } from '../../shared/service/confirmation.service';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { viewChild } from '@angular/core';
import type { CalendarOptions, DayCellInfo, EventInput } from 'fullcalendar';
import dayGridPlugin from 'fullcalendar/daygrid';
import classicTheme from 'fullcalendar/themes/classic';
import faLocale from 'fullcalendar/locales/fa';
import { toGregorian, toJalaali } from 'jalaali-js';
import { DateInputComponent } from '../../shared/component/date-input/date-input.component';

/** Bounded autocomplete page size — never fetch a thousand rows to fill a picker. */
const SEARCH_PAGE_SIZE = 25;

/** Debounce for the type-ahead searches (ms). */
const SEARCH_DEBOUNCE_MS = 300;
const JALALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/**
 * Validator for a `<mat-autocomplete>`-backed control: a typed-but-unconfirmed value
 * must not pass as a selection.
 *
 * `mat-autocomplete` writes the raw *string* into the control while the user types, so a
 * control that only carries `Validators.required` would accept "علی" as a member id and
 * post `personId=علی` (or, worse, silently clear it server-side). Requiring a number
 * forces the operator to actually pick an option.
 */
export function requireSelectedId(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (typeof control.value === 'number' && !Number.isNaN(control.value)) {
      return null;
    }
    return { selectionRequired: true };
  };
}

/** Persian date rendering of an ISO `yyyy-MM-dd` value; falls back to the raw value. */
function formatPersianDate(value: string | null | undefined): string {
  const date = parseIsoDate(value);
  if (!date) {
    return value ?? '---';
  }
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** ISO date one year after today — the upper bound of the expiry field. */
function oneYearFromTodayIso(): string {
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() + 1);
  return defaultExpiryIso(limit);
}

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'فعال',
  FULFILLED: 'تحویل شده',
  EXPIRED: 'منقضی',
  CANCELLED: 'لغو شده',
};

const RESERVATION_STATUS_CLASSES: Record<string, string> = {
  ACTIVE: 'status-active',
  FULFILLED: 'status-returned',
  EXPIRED: 'status-overdue',
  CANCELLED: 'status-inactive',
};

/**
 * Reservations page: lists every active reservation and lets the operator create one
 * (member + book searched through bounded, debounced autocomplete requests) or fulfil
 * an existing one after an accessible confirmation.
 */
@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    ListComponent,
    ModalComponent,
    FullCalendarModule,
    DateInputComponent
],
  templateUrl: './reservation.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './reservation.component.css',
})
export class ReservationComponent implements OnInit {
  calendarVisible = false;
  calendarTitle = '';
  calendarOptions: CalendarOptions = {};
  private readonly calendarComponent = viewChild(FullCalendarComponent);
  private calendarYear = toJalaali(new Date()).jy;
  private calendarMonth = toJalaali(new Date()).jm;
  tableTitle = 'رزروهای فعال';
  columns: TableColumn[] = [];
  reservations: ReservationModel[] = [];

  isLoading = false;
  loadError: string | null = null;

  isReservationModalVisible = false;
  reservationForm: FormGroup;
  isSubmitting = false;

  // Type-ahead state for the two pickers.
  readonly personOptions = signal<PersonModel[]>([]);
  readonly bookOptions = signal<BookModel[]>([]);
  readonly isSearchingPersons = signal(false);
  readonly isSearchingBooks = signal(false);

  /** Bounds for the expiry field: today … one year out. */
  readonly today = todayIso();
  readonly maxExpiry = oneYearFromTodayIso();
  readonly defaultExpiryDays = DEFAULT_RESERVATION_DAYS;

  private readonly destroyRef = inject(DestroyRef);
  private readonly personSearch$ = new Subject<string>();
  private readonly bookSearch$ = new Subject<string>();

  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationService);
  private readonly personService = inject(PersonService);
  private readonly bookService = inject(BookService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmation = inject(ConfirmationService);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    this.reservationForm = this.fb.group({
      personId: [null, [Validators.required, requireSelectedId()]],
      bookId: [null, [Validators.required, requireSelectedId()]],
      // Defaults to today + 14 days; `todayIso()` (not `toISOString()`) keeps the value
      // on the local calendar day.
      expiryDate: [defaultExpiryIso(), [Validators.required, notPastDate]],
    });
  }

  ngOnInit(): void {
    this.setupTableColumns();
    this.setupCalendar();
    this.loadReservations();
    this.wireSearch(this.personSearch$, this.personOptions, this.isSearchingPersons, (term) =>
      this.personService.getPersonList({ active: true, ...(term ? { firstName: term } : {}) }, 0, SEARCH_PAGE_SIZE),
    );
    // Books are matched on title; the persons lookup above is the same bounded shape.
    this.wireSearch(this.bookSearch$, this.bookOptions, this.isSearchingBooks, (term) =>
      this.bookService.getBookList({ active: true, ...(term ? { title: term } : {}) }, 0, SEARCH_PAGE_SIZE),
    );
  }

  /** Opens the create modal with a clean form and a today+14 expiry default. */
  openReservationModal(): void {
    this.reservationForm.reset({ personId: null, bookId: null, expiryDate: defaultExpiryIso() });
    this.reservationForm.markAsPristine();
    this.isReservationModalVisible = true;
    // Seed both pickers so the first click already shows sensible choices.
    this.personSearch$.next('');
    this.bookSearch$.next('');
  }

  onReservationModalClose(): void {
    this.isReservationModalVisible = false;
  }

  onPersonSearch(term: string): void {
    this.personSearch$.next(term ?? '');
  }

  onBookSearch(term: string): void {
    this.bookSearch$.next(term ?? '');
  }

  /** `displayWith` for the member picker: resolves an id to a label, free text to `''`. */
  formatPerson = (value: number | string | null): string => {
    if (value === null || value === undefined || typeof value !== 'number') {
      return '';
    }
    const person = this.personOptions().find((candidate) => candidate.id === value);
    return person ? `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() : '';
  };

  /** `displayWith` for the book picker. */
  formatBook = (value: number | string | null): string => {
    if (value === null || value === undefined || typeof value !== 'number') {
      return '';
    }
    const book = this.bookOptions().find((candidate) => candidate.id === value);
    return book ? `${book.title ?? ''}${book.author ? ` — ${book.author}` : ''}` : '';
  };

  onPersonSelected(person: PersonModel): void {
    // A confirmed option replaces any free text; the id is already in the control.
    this.personOptions.update((options) =>
      options.some((candidate) => candidate.id === person.id) ? options : [person, ...options],
    );
  }

  onBookSelected(book: BookModel): void {
    this.bookOptions.update((options) =>
      options.some((candidate) => candidate.id === book.id) ? options : [book, ...options],
    );
  }

  onSubmit(): void {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    const raw = this.reservationForm.getRawValue() as {
      personId: number;
      bookId: number;
      expiryDate: string;
    };

    const request: CreateReservationRequest = {
      personId: raw.personId,
      bookId: raw.bookId,
      expiryDate: raw.expiryDate,
    };

    this.isSubmitting = true;
    this.reservationService
      .createReservation(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.isReservationModalVisible = false;
          this.notify('رزرو با موفقیت ثبت شد.', 'بستن');
          this.loadReservations();
        },
        error: (error: unknown) => {
          this.isSubmitting = false;
          this.notify(`خطا در ثبت رزرو: ${this.describeError(error)}`, 'بستن');
        },
      });
  }

  loadReservations(): void {
    this.isLoading = true;
    this.loadError = null;
    this.reservationService
      .getActiveReservations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reservations) => {
          this.reservations = Array.isArray(reservations) ? reservations : [];
          this.updateCalendarEvents();
          this.isLoading = false;
        },
        error: (error: unknown) => {
          this.reservations = [];
          this.loadError = this.describeError(error);
          this.isLoading = false;
        },
      });
  }

  async fulfillReservation(reservation: ReservationModel): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'تحویل رزرو',
      message: `آیا از تحویل کتاب «${reservation.bookTitle ?? '---'}» به «${this.personName(reservation)}» مطمئن هستید؟`,
      confirmLabel: 'تحویل شد',
    });
    if (!confirmed) {
      return;
    }

    this.reservationService
      .fulfillReservation(reservation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notify('رزرو با موفقیت تحویل شد.', 'بستن');
          this.loadReservations();
        },
        error: (error: unknown) => {
          this.notify(`خطا در تحویل رزرو: ${this.describeError(error)}`, 'بستن');
        },
      });
  }

  async cancelReservation(reservation: ReservationModel): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'لغو رزرو',
      message: `آیا از لغو رزرو کتاب «${reservation.bookTitle ?? '---'}» برای «${this.personName(reservation)}» مطمئن هستید؟`,
      confirmLabel: 'لغو رزرو',
    });
    if (!confirmed) {
      return;
    }

    this.reservationService
      .cancelReservation(reservation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notify('رزرو لغو شد.', 'بستن');
          this.loadReservations();
        },
        error: (error: unknown) => {
          this.notify(`خطا در لغو رزرو: ${this.describeError(error)}`, 'بستن');
        },
      });
  }

  personName(reservation: ReservationModel): string {
    return `${reservation.personFirstName ?? ''} ${reservation.personLastName ?? ''}`.trim() || '---';
  }

  statusLabel(status: string): string {
    return RESERVATION_STATUS_LABELS[status] ?? status;
  }

  statusClass(status: string): string {
    return RESERVATION_STATUS_CLASSES[status] ?? 'status-inactive';
  }

  formatDate(value: string | null | undefined): string {
    return formatPersianDate(value);
  }

  // --- Internals ------------------------------------------------------------

  private setupTableColumns(): void {
    this.columns = [
      {
        columnDef: 'personName',
        header: 'نام عضو',
        cell: (element: ReservationModel) => this.personName(element),
        cellClass: () => 'emphasize',
      },
      {
        columnDef: 'bookTitle',
        header: 'عنوان کتاب',
        cell: (element: ReservationModel) => element.bookTitle || '---',
        cellClass: () => 'emphasize',
      },
      {
        columnDef: 'reservationDate',
        header: 'تاریخ رزرو',
        cell: (element: ReservationModel) => formatPersianDate(element.reservationDate),
      },
      {
        columnDef: 'expiryDate',
        header: 'تاریخ انقضا',
        cell: (element: ReservationModel) => formatPersianDate(element.expiryDate),
      },
      {
        columnDef: 'status',
        header: 'وضعیت',
        cell: (element: ReservationModel) =>
          `<span class="status-badge ${this.statusClass(element.status)}">${this.statusLabel(element.status)}</span>`,
      },
    ];
  }

  toggleCalendar(): void {
    this.calendarVisible = !this.calendarVisible;
    if (this.calendarVisible) this.updateCalendarEvents();
  }

  moveCalendarMonth(delta: number): void {
    this.calendarMonth += delta;
    if (this.calendarMonth < 1) { this.calendarYear--; this.calendarMonth = 12; }
    if (this.calendarMonth > 12) { this.calendarYear++; this.calendarMonth = 1; }
    this.calendarTitle = `${JALALI_MONTHS[this.calendarMonth - 1]} ${new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(this.calendarYear)}`;
    this.calendarComponent()?.getApi().gotoDate(this.jalaliGridStart(this.calendarYear, this.calendarMonth));
  }

  private setupCalendar(): void {
    const initialGridStart = this.jalaliGridStart(this.calendarYear, this.calendarMonth);
    this.calendarTitle = `${JALALI_MONTHS[this.calendarMonth - 1]} ${new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(this.calendarYear)}`;
    this.calendarOptions = {
      plugins: [dayGridPlugin, classicTheme],
      initialView: 'jalaliMonth',
      views: {
        jalaliMonth: {
          // Render six complete weeks, anchored to the Saturday before Jalali day 1.
          // FullCalendar's built-in month view always expands to Gregorian month bounds.
          type: 'dayGrid',
          duration: { weeks: 6 },
        },
      },
      initialDate: initialGridStart,
      locale: faLocale,
      direction: 'rtl',
      firstDay: 6,
      fixedWeekCount: false,
      headerToolbar: false,
      height: 'auto',
      dayCellTopContent: (arg: DayCellInfo) => ({ html: new Intl.NumberFormat('fa-IR').format(toJalaali(arg.date).jd) }),
      dayCellClass: (arg: DayCellInfo) => {
        const jalaliDate = toJalaali(arg.date);
        return jalaliDate.jy === this.calendarYear && jalaliDate.jm === this.calendarMonth
          ? undefined
          : 'jalali-other-month';
      },
      events: [],
      eventDisplay: 'block',
      eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: false },
      noEventsContent: 'رزروی در این ماه ثبت نشده است',
    };
  }

  private jalaliGridStart(year: number, month: number): string {
    const firstDay = toGregorian(year, month, 1);
    const date = new Date(firstDay.gy, firstDay.gm - 1, firstDay.gd);
    date.setDate(date.getDate() - ((date.getDay() - 6 + 7) % 7));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private updateCalendarEvents(): void {
    const events: EventInput[] = this.reservations.flatMap((reservation) => [
      { id: `reservation-${reservation.id}`, title: `${reservation.bookTitle || 'کتاب'} · ${this.personName(reservation)}`, start: reservation.reservationDate, allDay: true, classNames: ['reservation-event'] },
      { id: `expiry-${reservation.id}`, title: `انقضا: ${reservation.bookTitle || 'کتاب'}`, start: reservation.expiryDate, allDay: true, classNames: ['reservation-expiry-event'] },
    ]);
    this.calendarOptions = { ...this.calendarOptions, events };
  }

  /**
   * Wires one type-ahead: debounce, switch to the (bounded) request, cancel the previous
   * request on a new keystroke, and drop out-of-order responses.
   */
  private wireSearch<T>(
    trigger: Subject<string>,
    target: WritableSignal<T[]>,
    loading: WritableSignal<boolean>,
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

  private notify(message: string, action: string): void {
    if (isPlatformBrowser(this.platformId)) {
      this.snackBar.open(message, action, { duration: 5000, direction: 'rtl' });
    }
  }

  private describeError(error: unknown): string {
    const httpError = error as { error?: { message?: string }; message?: string; status?: number };
    if (httpError?.status === 409) {
      return httpError.error?.message || 'این درخواست با وضعیت فعلی کتاب یا عضو در تضاد است.';
    }
    return httpError?.error?.message || httpError?.message || 'خطای غیرمنتظره. لطفاً دوباره تلاش کنید.';
  }
}
