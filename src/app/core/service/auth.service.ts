import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser$: any;
  logout() {
    throw new Error('Method not implemented.');
  }

  constructor() { }
}
