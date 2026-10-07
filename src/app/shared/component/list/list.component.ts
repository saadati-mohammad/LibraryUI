import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * A table row. The list is generic over the features' models; callers pass their
 * own typed model (BookModel/PersonModel/BookLoanModel) and the accessor callbacks
 * narrow it. `any` is deliberate here: the shared component is model-agnostic, and
 * the callers' concrete callback signatures (e.g. `(element: BookModel) => string`)
 * must be assignable to these fields. A narrower type would reject every call site.
 */
export type TableRow = any;

export interface TableColumn<T = TableRow> {
  columnDef: string; // نام پراپرتی در آبجکت داده
  header: string;    // متنی که در هدر نمایش داده می‌شود
  cell: (element: T) => string; // تابعی برای نمایش محتوای سلول
  cellClass?: (element: T) => string; // برای کلاس‌دهی خاص به سلول‌ها (مثلا برای badge)
  isSticky?: boolean; // برای ستون‌های چسبان (sticky)
  isStickyEnd?: boolean; // برای ستون‌های چسبان در انتها (مانند عملیات)
  isImageColumn?: boolean; // برای شناسایی ستون تصویر
  imageSrc?: (element: T) => string | null; // برای دریافت منبع تصویر
  defaultImage?: string; // مسیر تصویر پیش‌فرض
}

export interface ActionButtonConfig<T = TableRow> {
  icon: string;
  tooltip: string;
  actionId: string; // برای شناسایی دکمه کلیک شده
  color?: 'primary' | 'accent' | 'warn'; // رنگ دکمه متریال
  disabled?: (element: T) => boolean;
  condition?: (element: T) => boolean; // شرط نمایش دکمه
  onClick?: (element: T, event: MouseEvent) => void; // تابعی برای کلیک روی دکمه
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
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() tableTitle?: string;
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() pageSizeOptions: number[] = [5, 10, 25, 100];
  @Input() showPaginator = false;
  @Input() actionsTemplate: TemplateRef<any> | null = null;

  @Input() isLoading = false; // برای نمایش اسپینر لودینگ
  @Input() totalItems = 0;
  @Input() currentPage = 0; // صفحه فعلی (0-indexed)
  @Input() pageSize = 10; // آیتم در هر صفحه
  @Output() pageChanged = new EventEmitter<PageEvent>();

  @Output() actionClicked = new EventEmitter<any>();
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly sanitizer = inject(DomSanitizer);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['columns'] || changes['actionsTemplate']) {
      this.setupTable();
    }
  }

  ngOnInit(): void {
    // this.setupTable(); // به ngOnChanges منتقل شد تا با تغییرات ورودی هم آپدیت شود
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

  getCellHtml(column: TableColumn, element: any): SafeHtml {
    const rawHtml = column.cell(element);
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  onActionClick(actionId: string, element: any, event: MouseEvent): void {
    event.stopPropagation(); // جلوگیری از تریگر شدن رویداد کلیک روی سطر
    this.actionClicked.emit({ actionId, element });
  }

  // برای استایل‌دهی خاص به سلول بر اساس وضعیت
  getCellClass(column: TableColumn, element: any): string {
    return column.cellClass ? column.cellClass(element) : '';
  }

  // برای tooltip تاریخ‌ها یا متن‌های طولانی
  getCellTooltip(column: TableColumn, element: any): string {
    // مثال: اگر ستون تاریخ بود و می‌خواستیم فرمت کامل را در tooltip نشان دهیم
    // if (column.columnDef === 'dueDate') return `تاریخ دقیق: ${new Date(element.dueDateRaw).toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    return column.cell(element); // به طور پیش‌فرض همان محتوای سلول
  }

  isButtonVisible(button: ActionButtonConfig, element: any): boolean {
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

  isButtonDisabled(button: ActionButtonConfig, element: any): boolean {
    if (button.disabled) {
      return button.disabled(element);
    }
    return false; // Default to enabled
  }

  onPageChange(event: PageEvent): void {
    this.pageChanged.emit(event);
  }

  getImageUrl(element: any, column: TableColumn): SafeUrl {
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
