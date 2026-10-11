import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PagedFilterPage } from './paged-filter-page';

@Component({ standalone: true, template: '' })
class TestPagedPage extends PagedFilterPage<string> implements OnInit {
  readonly filters = inject(FormBuilder).group({ query: [''] });
  reloadCount = 0;

  ngOnInit(): void { this.watchFilters(this.filters, 10); }
  protected override reloadPage(): void { this.reloadCount++; }
}

describe('PagedFilterPage', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestPagedPage] }));

  it('debounces filter changes, resets the page, and stops watching after destruction', fakeAsync(() => {
    const fixture = TestBed.createComponent(TestPagedPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();
    page.currentPage = 3;
    page.filters.controls.query.setValue('search');
    tick(9);
    expect(page.reloadCount).toBe(0);
    tick(1);
    expect(page.currentPage).toBe(0);
    expect(page.reloadCount).toBe(1);
    fixture.destroy();
    page.filters.controls.query.setValue('after destroy');
    tick(20);
    expect(page.reloadCount).toBe(1);
  }));

  it('updates pagination state and reloads the selected page', () => {
    const page = TestBed.createComponent(TestPagedPage).componentInstance;
    page.handlePageEvent({ pageIndex: 2, pageSize: 25, length: 70 } satisfies PageEvent);
    expect(page.currentPage).toBe(2);
    expect(page.pageSize).toBe(25);
    expect(page.reloadCount).toBe(1);
  });
});
