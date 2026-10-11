import { PersianPaginatorIntl } from './persian-paginator-intl';

describe('PersianPaginatorIntl', () => {
  it('localizes the range and navigation labels for the right-to-left application', () => {
    const paginator = new PersianPaginatorIntl();
    expect(paginator.itemsPerPageLabel).toBe('تعداد در هر صفحه');
    expect(paginator.nextPageLabel).toBe('صفحهٔ بعد');
    expect(paginator.getRangeLabel(0, 10, 14)).toBe('۱ تا ۱۰ از ۱۴');
    expect(paginator.getRangeLabel(1, 10, 14)).toBe('۱۱ تا ۱۴ از ۱۴');
    expect(paginator.getRangeLabel(0, 10, 0)).toBe('۰ از ۰');
  });
});
