import type { MockedObject } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService, LoginResponse } from '../../core/service/auth.service';
import { MemberProfile } from '../../core/model/public-catalog.model';

const SESSION: LoginResponse = { token: 'token', username: 'member@example.test', role: 'MEMBER', expiresInSeconds: 3600 };

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let auth: MockedObject<AuthService>;
  let router: MockedObject<Router>;

  beforeEach(async () => {
    auth = {
      register: vi.fn().mockName('AuthService.register'),
      login: vi.fn().mockName('AuthService.login'),
    } as MockedObject<AuthService>;
    auth.register.mockReturnValue(of({ id: 1, firstName: 'سارا', lastName: 'احمدی', email: 'member@example.test', phone: null, membershipDate: null, membershipType: null, active: true } satisfies MemberProfile));
    auth.login.mockReturnValue(of(SESSION));
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideNoopAnimations(), provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
    router = TestBed.inject(Router) as MockedObject<Router>;
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps submit available and reports field errors after an invalid submission', () => {
    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    button.click();
    fixture.detectChanges();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('موارد مشخص‌شده');
    expect(host.textContent).toContain('نام را وارد کنید');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('offers accessible visibility toggles for both password fields', () => {
    const host = fixture.nativeElement as HTMLElement;
    const toggles = host.querySelectorAll('button.reveal');
    expect(toggles.length).toBe(2);
    expect(toggles[0].getAttribute('aria-pressed')).toBe('false');
    (toggles[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect((host.querySelector('[name="password"]') as HTMLInputElement).type).toBe('text');
    expect(toggles[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('reports a password mismatch inline and does not call the API', () => {
    component.firstName = 'سارا'; component.lastName = 'احمدی'; component.email = 'sara@example.test';
    component.nationalId = '1234567890'; component.password = 'a-long-password'; component.confirmPassword = 'another-password';
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('تکرار گذرواژه با گذرواژه یکسان نیست');
    expect(auth.register).not.toHaveBeenCalled();
  });
});
