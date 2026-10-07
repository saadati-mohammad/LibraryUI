import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideTestProviders } from './testing/test-providers';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      // The root component renders the base layout, which includes the header. The
      // header injects AuthService -> HttpClient, so the shared test providers (router,
      // HttpClient, animations) are required for the component tree to instantiate.
      providers: provideTestProviders(),
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the base layout shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-base-layout')).toBeTruthy();
  });
});
