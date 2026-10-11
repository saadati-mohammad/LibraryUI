import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';

/** Shared state and lifecycle for staff pages that show a server-paged filtered list. */
export abstract class PagedFilterPage<T> {
  data: T[] = [];
  isLoadingTable = false;
  totalElements = 0;
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  private readonly filterDestroyRef = inject(DestroyRef);

  protected abstract reloadPage(): void;

  /** Connects form changes to one debounced, teardown-safe server reload. */
  protected watchFilters(form: FormGroup, debounceMs = 700): void {
    form.valueChanges
      .pipe(
        debounceTime(debounceMs),
        distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
        tap(() => this.currentPage = 0),
        takeUntilDestroyed(this.filterDestroyRef),
      )
      .subscribe(() => this.reloadPage());
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.reloadPage();
  }

  protected resetPageAndReload(): void {
    this.currentPage = 0;
    this.reloadPage();
  }
}
