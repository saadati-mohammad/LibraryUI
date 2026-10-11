import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, TemplateRef, ViewChild, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { PersianPaginatorIntl } from '../../service/persian-paginator-intl';

/**
 * A table row. The list is generic over the features' models; callers pass their own
 * typed model (BookModel/PersonModel/BookLoanModel) to the accessor callbacks below.
 *
 * The accessor members are declared with *method* syntax rather than property syntax
 * (`cell(element: T): string` instead of `cell: (element: T) => string`) on purpose:
 * TypeScript compares method parameters bivariantly even under `strictFunctionTypes`, so a
 * caller's `cell: (element: BookModel) => string` remains assignable to `TableColumn`. With
 * property syntax the parameter would have to be contravariant, and no concrete model is
 * assignable to this generic row type — the field would collapse back to `any`.
 */
export type TableRow = unknown;

export interface TableColumn<T = TableRow> {
  columnDef: string; // نام پراپرتی در آبجکت داده
  header: string;    // متنی که در هدر نمایش داده می‌شود
  cell(element: T): string; // تابعی برای نمایش محتوای سلول
  cellClass?(element: T): string; // برای کلاس‌دهی خاص به سلول‌ها (مثلا برای badge)
  isSticky?: boolean; // برای ستون‌های چسبان (sticky)
  isStickyEnd?: boolean; // برای ستون‌های چسبان در انتها (مانند عملیات)
  isImageColumn?: boolean; // برای شناسایی ستون تصویر
  imageSrc?(element: T): string | null; // برای دریافت منبع تصویر
  defaultImage?: string; // مسیر تصویر پیش‌فرض
}

export interface ActionButtonConfig<T = TableRow> {
  icon: string;
  tooltip: string;
  actionId: string; // برای شناسایی دکمه کلیک شده
  color?: 'primary' | 'accent' | 'warn'; // رنگ دکمه متریال
  disabled?(element: T): boolean;
  condition?(element: T): boolean; // شرط نمایش دکمه
  onClick?(element: T, event: MouseEvent): void; // تابعی برای کلیک روی دکمه
}

/** Payload of {@link ListComponent.actionClicked}. */
export interface TableActionEvent {
  actionId: string;
  element: TableRow;
}

@Component({
  selector: 'app-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule],
  providers: [{ provide: MatPaginatorIntl, useClass: PersianPaginatorIntl }],
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './list.component.css'
})
export class ListComponent implements AfterViewInit, OnChanges {
  @Input() tableTitle?: string;
  @Input() columns: TableColumn[] = [];
  @Input() data: TableRow[] = [];
  @Input() pageSizeOptions: number[] = [5, 10, 25, 100];
  @Input() showPaginator = false;
  @Input() actionsTemplate: TemplateRef<unknown> | null = null;

  @Input() isLoading = false; // برای نمایش حالت بارگذاری (اسکلتون)
  @Input() totalItems = 0;
  @Input() currentPage = 0; // صفحه فعلی (0-indexed)
  @Input() pageSize = 10; // آیتم در هر صفحه
  /** Number of placeholder rows rendered while loading. */
  @Input() skeletonRows = 5;
  /** Material icon shown by the empty state. */
  @Input() emptyIcon = 'inbox';
  /** Main line of the empty state. */
  @Input() emptyMessage = 'داده‌ای برای نمایش وجود ندارد.';
  /** Secondary line of the empty state, explaining what to do next. */
  @Input() emptyHint: string | null = null;
  @Output() pageChanged = new EventEmitter<PageEvent>();

  @Output() actionClicked = new EventEmitter<TableActionEvent>();
  dataSource!: MatTableDataSource<TableRow>;
  displayedColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Placeholder rows used by the loading skeleton. A real (typed) array rather than a
   * magic `*ngFor` count so the template stays strict-template clean.
   */
  get skeletonRowList(): number[] {
    return Array.from({ length: Math.max(1, this.skeletonRows) }, (_value, index) => index);
  }

  /** True while the first page is loading, i.e. when the skeleton should replace the table. */
  get showSkeleton(): boolean {
    return this.isLoading && (this.dataSource?.data?.length ?? 0) === 0;
  }

  /** True when the request finished and there is genuinely nothing to show. */
  get showEmptyState(): boolean {
    return !this.isLoading && (this.dataSource?.data?.length ?? 0) === 0;
  }

  // The table is built in ngOnChanges (not ngOnInit) so that changing `data`, `columns` or
  // `actionsTemplate` re-renders the table instead of requiring a fresh component.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['columns'] || changes['actionsTemplate']) {
      this.setupTable();
    }
  }

  setupTable(): void {
    this.displayedColumns = this.columns.map(c => c.columnDef);
    if (this.actionsTemplate) {
      this.displayedColumns.push('actions'); // ستون عملیات
    }
    this.dataSource = new MatTableDataSource(this.data);
    this.configureAndPaginators();
  }

  ngAfterViewInit(): void {
    this.configureAndPaginators();
  }

  configureAndPaginators(): void {
    if (this.dataSource) {
      if (this.showPaginator && this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }
  }

  getCellHtml(column: TableColumn, element: TableRow): SafeHtml {
    const rawHtml = column.cell(element);
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  onActionClick(actionId: string, element: TableRow, event: MouseEvent): void {
    event.stopPropagation(); // جلوگیری از تریگر شدن رویداد کلیک روی سطر
    this.actionClicked.emit({ actionId, element });
  }

  // برای استایل‌دهی خاص به سلول بر اساس وضعیت
  getCellClass(column: TableColumn, element: TableRow): string {
    return column.cellClass ? column.cellClass(element) : '';
  }

  // برای tooltip تاریخ‌ها یا متن‌های طولانی
  getCellTooltip(column: TableColumn, element: TableRow): string {
    return column.cell(element); // به طور پیش‌فرض همان محتوای سلول
  }

  isButtonVisible(button: ActionButtonConfig, element: TableRow): boolean {
    if (button.condition) {
      return button.condition(element);
    }
    return true; // Default to visible
  }

  handleImageError(event: Event, defaultImage: string | undefined): void {
    const element = event.target as HTMLImageElement;
    if (element) {
      element.src = defaultImage || 'assets/images/placeholder.png';
    }
  }

  isButtonDisabled(button: ActionButtonConfig, element: TableRow): boolean {
    if (button.disabled) {
      return button.disabled(element);
    }
    return false; // Default to enabled
  }

  onPageChange(event: PageEvent): void {
    this.pageChanged.emit(event);
  }

  getImageUrl(element: TableRow, column: TableColumn): SafeUrl {
    const rawSrc = column.imageSrc ? column.imageSrc(element) : null;

    // اگر منبع تصویر وجود ندارد یا خالی است، از تصویر پیش‌فرض استفاده کن
    if (!rawSrc) {
      return column.defaultImage || 'assets/images/placeholder.png'; // مسیر تصویر پیش‌فرض خود را اینجا قرار دهید
    }

    // اگر منبع یک URL کامل است (با http شروع می‌شود)
    if (rawSrc.startsWith('http')) {
      return this.sanitizer.bypassSecurityTrustUrl(rawSrc);
    }

    // اگر منبع داده Base64 است
    if (rawSrc.startsWith('data:image')) {
      return this.sanitizer.bypassSecurityTrustUrl(rawSrc);
    }

    // اگر داده باینری (رشته‌ای) است، آن را به Base64 تبدیل کن
    // این حالت برای داده‌ای است که از API به صورت رشته باینری می‌آید
    try {
      const base64Image = `data:image/jpeg;base64,${rawSrc}`;
      return this.sanitizer.bypassSecurityTrustUrl(base64Image);
    } catch (e) {
      console.error("Error converting binary string to Base64", e);
      return column.defaultImage || 'assets/images/placeholder.png';
    }
  }
}
