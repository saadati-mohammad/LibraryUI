import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchResultsSubject = new BehaviorSubject<number[]>([]);
  private currentIndexSubject = new BehaviorSubject<number>(-1);
  private searchActiveSubject = new BehaviorSubject<boolean>(false);

  public searchResults$ = this.searchResultsSubject.asObservable();
  public currentIndex$ = this.currentIndexSubject.asObservable();
  public searchActive$ = this.searchActiveSubject.asObservable();

  constructor() {}

  // شروع جستجو
  startSearch(): void {
    this.searchActiveSubject.next(true);
    if (this.searchResultsSubject.value.length > 0) {
      this.currentIndexSubject.next(0);
    }
  }

  // پایان جستجو
  endSearch(): void {
    this.searchActiveSubject.next(false);
    this.searchResultsSubject.next([]);
    this.currentIndexSubject.next(-1);
  }

  // به‌روزرسانی نتایج جستجو
  updateSearchResults(messageIds: number[]): void {
    this.searchResultsSubject.next(messageIds);
    if (messageIds.length > 0) {
      this.currentIndexSubject.next(0);
    } else {
      this.currentIndexSubject.next(-1);
    }
  }

  // رفتن به نتیجه قبلی
  goToPrevious(): void {
    const currentIndex = this.currentIndexSubject.value;
    const results = this.searchResultsSubject.value;
    
    if (results.length > 0 && currentIndex > 0) {
      this.currentIndexSubject.next(currentIndex - 1);
    }
  }

  // رفتن به نتیجه بعدی
  goToNext(): void {
    const currentIndex = this.currentIndexSubject.value;
    const results = this.searchResultsSubject.value;
    
    if (results.length > 0 && currentIndex < results.length - 1) {
      this.currentIndexSubject.next(currentIndex + 1);
    }
  }

  // رفتن به نتیجه مشخص
  goToResult(index: number): void {
    const results = this.searchResultsSubject.value;
    
    if (index >= 0 && index < results.length) {
      this.currentIndexSubject.next(index);
    }
  }

  // هایلایت کردن کلمات جستجو
  highlightSearchTerm(text: string, searchTerm: string): string {
    if (!searchTerm || !text) {
      return text;
    }

    const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark class="search-match">$1</mark>');
  }

  // فرار از کاراکترهای خاص regex
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // دریافت نتایج فعلی
  getCurrentResults(): number[] {
    return this.searchResultsSubject.value;
  }

  // دریافت ایندکس فعلی
  getCurrentIndex(): number {
    return this.currentIndexSubject.value;
  }

  // بررسی وضعیت فعال بودن جستجو
  isSearchActive(): boolean {
    return this.searchActiveSubject.value;
  }
}