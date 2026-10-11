import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService, LoginResponse } from '../../core/service/auth.service';

const SESSION: LoginResponse = {
    token: 'jwt.token.value',
    username: 'admin',
    role: 'ADMIN',
    expiresInSeconds: 3600,
};

describe('LoginComponent', () => {
    let fixture: ComponentFixture<LoginComponent>;
    let component: LoginComponent;
    let auth: MockedObject<AuthService>;
    let router: MockedObject<Router>;

    async function create(query: Record<string, string> = {}): Promise<void> {
        await TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [
                provideNoopAnimations(),
                { provide: AuthService, useValue: auth },
                { provide: Router, useValue: router },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    beforeEach(() => {
        auth = {
            login: vi.fn().mockName("AuthService.login"),
            logout: vi.fn().mockName("AuthService.logout"),
            role: vi.fn(() => 'ADMIN').mockName("AuthService.role")
        } as MockedObject<AuthService>;
        auth.login.mockReturnValue(of(SESSION));
        router = {
            navigate: vi.fn().mockName("Router.navigate"),
            navigateByUrl: vi.fn().mockName("Router.navigateByUrl")
        } as MockedObject<Router>;
        router.navigateByUrl.mockResolvedValue(true);
    });

    it('renders the username and password fields with accessible names', async () => {
        await create();
        const host = fixture.nativeElement as HTMLElement;

        expect(host.querySelector('#loginUsername')).not.toBeNull();
        expect(host.querySelector('#loginPassword')).not.toBeNull();
        expect(host.textContent).toContain('نام کاربری');
        expect(host.textContent).toContain('رمز عبور');
    });

    it('keeps submit disabled until both credentials are present', async () => {
        await create();

        expect(component.canSubmit).toBe(false);
        component.username = 'admin';
        expect(component.canSubmit).toBe(false);
        component.password = 'admin';
        expect(component.canSubmit).toBe(true);
    });

    it('toggles password visibility with a labelled, stateful button', async () => {
        await create();
        const host = fixture.nativeElement as HTMLElement;
        const toggle = host.querySelector('.password-toggle') as HTMLButtonElement;

        expect(toggle).not.toBeNull();
        expect(toggle.getAttribute('aria-label')).toBe('نمایش رمز عبور');
        expect(toggle.getAttribute('aria-pressed')).toBe('false');
        expect((host.querySelector('#loginPassword') as HTMLInputElement).type).toBe('password');

        toggle.click();
        fixture.detectChanges();

        expect(component.showPassword()).toBe(true);
        expect((host.querySelector('#loginPassword') as HTMLInputElement).type).toBe('text');
        expect(toggle.getAttribute('aria-label')).toBe('مخفی کردن رمز عبور');
    });

    it('signs in with trimmed credentials and follows the returnUrl', async () => {
        await create({ returnUrl: '/dashboard' });
        component.username = '  admin  ';
        component.password = 'secret';

        component.onSubmit();

        expect(auth.login).toHaveBeenCalledTimes(1);

        expect(auth.login).toHaveBeenCalledWith('admin', 'secret');
        expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
        expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
        expect(component.loading()).toBe(false);
    });

    it('falls back to the books route when no returnUrl is supplied', async () => {
        await create();
        component.username = 'admin';
        component.password = 'secret';

        component.onSubmit();

        expect(router.navigateByUrl).toHaveBeenCalledTimes(1);

        expect(router.navigateByUrl).toHaveBeenCalledWith('/book');
    });

    it('shows an inline error and stays put for wrong credentials', async () => {
        await create();
        auth.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })));
        component.username = 'admin';
        component.password = 'nope';

        component.onSubmit();
        fixture.detectChanges();

        expect(component.error()).toContain('نادرست');
        expect(router.navigateByUrl).not.toHaveBeenCalled();
        expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).not.toBeNull();
    });

    it('explains a network failure separately from bad credentials', async () => {
        await create();
        auth.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' })));
        component.username = 'admin';
        component.password = 'admin';

        component.onSubmit();

        expect(component.error()).toContain('ارتباط با سرور');
    });

    it('renders the session-expiry notice when redirected with reason=session-expired', async () => {
        await create({ reason: 'session-expired', returnUrl: '/book' });

        expect(component.sessionExpired()).toBe(true);
        const notice = (fixture.nativeElement as HTMLElement).querySelector('.login-notice');
        expect(notice?.textContent).toContain('نشست شما منقضی شده است');
    });

    it('does not render the expiry notice on a normal visit', async () => {
        await create();

        expect(component.sessionExpired()).toBe(false);
        expect((fixture.nativeElement as HTMLElement).querySelector('.login-notice')).toBeNull();
    });
});
