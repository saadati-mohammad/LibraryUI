import { Component, TemplateRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PageEvent } from '@angular/material/paginator';

import { ListComponent, TableColumn } from './list.component';

interface Row {
  title: string;
  active: boolean;
}

const COLUMNS: TableColumn<Row>[] = [
  { columnDef: 'title', header: 'عنوان', cell: (row) => row.title },
  {
    columnDef: 'status',
    header: 'وضعیت',
    cell: (row) => (row.active ? 'فعال' : 'غیرفعال'),
    cellClass: (row) => (row.active ? 'is-active' : 'is-inactive'),
  },
];

const ROWS: Row[] = [
  { title: 'شازده کوچولو', active: true },
  { title: 'بوف کور', active: false },
];

/** Host used to obtain a real TemplateRef for the projected actions column. */
@Component({
  imports: [ListComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ng-template #rowActions>actions</ng-template>
    <app-list [columns]="columns" [data]="rows" [actionsTemplate]="rowActions"></app-list>
  `,
})
class HostComponent {
  @ViewChild('rowActions', { static: true }) rowActions!: TemplateRef<unknown>;
  readonly columns = COLUMNS;
  readonly rows = ROWS;
}

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ListComponent] }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
  });

  it('creates one column per config and no actions column without an actions template', () => {
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.detectChanges();

    expect(component.displayedColumns).toEqual(['title', 'status']);
    expect(component.dataSource.data).toEqual(ROWS);
  });

  it('appends the actions column when an actions template is projected', () => {
    const host = TestBed.createComponent(HostComponent);
    host.detectChanges();

    const list = host.debugElement.query(By.directive(ListComponent))
      .componentInstance as ListComponent;

    expect(list.displayedColumns).toEqual(['title', 'status', 'actions']);
    expect(list.actionsTemplate).not.toBeNull();
  });

  it('renders the cells produced by the column accessors', () => {
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('tableTitle', 'کتاب‌ها');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('کتاب‌ها');
    expect(text).toContain('شازده کوچولو');
    expect(text).toContain('غیرفعال');
  });

  it('rebuilds the table when the data input changes', () => {
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.detectChanges();
    const firstDataSource = component.dataSource;

    fixture.componentRef.setInput('data', [ROWS[0]]);
    fixture.detectChanges();

    expect(component.dataSource).not.toBe(firstDataSource);
    expect(component.dataSource.data.length).toBe(1);
  });

  it('applies the column cellClass, defaulting to an empty string', () => {
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.detectChanges();

    expect(component.getCellClass(COLUMNS[0], ROWS[0])).toBe('');
    expect(component.getCellClass(COLUMNS[1], ROWS[0])).toBe('is-active');
    expect(component.getCellClass(COLUMNS[1], ROWS[1])).toBe('is-inactive');
  });

  it('re-emits paginator events', () => {
    const emitted: PageEvent[] = [];
    component.pageChanged.subscribe((event) => emitted.push(event));

    const event = { pageIndex: 2, pageSize: 25, length: 100 } as PageEvent;
    component.onPageChange(event);

    expect(emitted).toEqual([event]);
  });

  it('falls back to the default image when a column has no imageSrc', () => {
    const imageColumn: TableColumn<Row> = {
      columnDef: 'cover',
      header: 'جلد',
      cell: () => 'cover',
      defaultImage: 'assets/default.png',
    };

    expect(component.getImageUrl({ title: 't', active: true }, imageColumn)).toBe(
      'assets/default.png',
    );
  });

  it('emits the action payload with the action id and the row', () => {
    const emitted: { actionId: string; element: unknown }[] = [];
    component.actionClicked.subscribe((event) => emitted.push(event));
    const event = { stopPropagation: () => undefined } as unknown as MouseEvent;

    component.onActionClick('edit', ROWS[0], event);

    expect(emitted).toEqual([{ actionId: 'edit', element: ROWS[0] }]);
  });
});
