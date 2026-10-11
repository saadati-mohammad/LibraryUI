import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class PersianPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'تعداد در هر صفحه';
  override nextPageLabel = 'صفحهٔ بعد';
  override previousPageLabel = 'صفحهٔ قبل';
  override firstPageLabel = 'صفحهٔ نخست';
  override lastPageLabel = 'صفحهٔ پایانی';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const format = new Intl.NumberFormat('fa-IR').format;
    if (length === 0 || pageSize === 0) return `۰ از ${format(length)}`;
    const start = page * pageSize + 1;
    const end = Math.min(start + pageSize - 1, length);
    return `${format(start)} تا ${format(end)} از ${format(length)}`;
  };
}
