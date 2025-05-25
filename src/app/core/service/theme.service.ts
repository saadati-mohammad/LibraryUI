import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme$: any;
  toggleTheme() {
    throw new Error('Method not implemented.');
  }

  constructor() { }
}
