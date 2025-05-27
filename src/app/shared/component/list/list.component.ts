import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';

export interface TableColumn {
  columnDef: string; // نام پراپرتی در آبجکت داده
  header: string;    // متنی که در هدر نمایش داده می‌شود
  cell: (element: any) => string; // تابعی برای نمایش محتوای سلول
  cellClass?: (element: any) => string; // برای کلاس‌دهی خاص به سلول‌ها (مثلا برای badge)
  isSticky?: boolean; // برای ستون‌های چسبان (sticky)
  isStickyEnd?: boolean; // برای ستون‌های چسبان در انتها (مانند عملیات)
}

export interface ActionButtonConfig {
  icon: string;
  tooltip: string;
  actionId: string; // برای شناسایی دکمه کلیک شده
  color?: 'primary' | 'accent' | 'warn'; // رنگ دکمه متریال
  disabled?: (element: any) => boolean;
  condition?: (element: any) => boolean; // شرط نمایش دکمه
}
@Component({
  selector: 'app-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent  implements OnInit, AfterViewInit, OnChanges {
  @Input() tableTitle?: string;
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actionButtons: ActionButtonConfig[] = [];
  @Input() pageSizeOptions: number[] = [5, 10, 25, 100];
  @Input() showPaginator: boolean = false;

  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['columns']) {
      this.setupTable();
    }
  }

  ngOnInit(): void {
    // this.setupTable(); // به ngOnChanges منتقل شد تا با تغییرات ورودی هم آپدیت شود
  }

  setupTable(): void {
    this.displayedColumns = this.columns.map(c => c.columnDef);
    if (this.actionButtons.length > 0) {
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

  onActionClick(actionId: string, element: any, event: MouseEvent): void {
    event.stopPropagation(); // جلوگیری از تریگر شدن رویداد کلیک روی سطر
    // TODO: Emit an event or handle action here
    console.log(`Action '${actionId}' clicked for element:`, element);
    alert(`عملیات '${actionId}' برای آیتم ${element.id || ''} کلیک شد.`);
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

  isButtonDisabled(button: ActionButtonConfig, element: any): boolean {
    if (button.disabled) {
      return button.disabled(element);
    }
    return false; // Default to enabled
  }
}
