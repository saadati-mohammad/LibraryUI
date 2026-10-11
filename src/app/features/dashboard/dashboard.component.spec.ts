import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DashboardComponent, toPersianDigits } from './dashboard.component';
import { DashboardService } from '../../core/service/dashboard.service';
import { DashboardSummaryModel } from '../../core/model/dashboard.model';
import { BookLoanModel } from '../../core/model/bookLoanModel';

const LOAN: BookLoanModel = {
    id: 5,
    loanDate: '2025-05-02',
    dueDate: '2025-05-16',
    returnDate: null,
    status: 'OVERDUE',
    notes: null,
    personId: 2,
    personFirstName: 'سارا',
    personLastName: 'احمدی',
    bookId: 4,
    bookTitle: 'صد سال تنهایی',
};

const SUMMARY: DashboardSummaryModel = {
    totalBooks: 1240,
    totalPersons: 318,
    activeLoans: 42,
    overdueLoans: 7,
    activeReservations: 11,
    recentLoans: [LOAN],
    monthlyLoans: [
        { month: '2025-01', count: 12 },
        { month: '2025-02', count: 19 },
    ],
};

describe('DashboardComponent', () => {
    let fixture: ComponentFixture<DashboardComponent>;
    let component: DashboardComponent;
    let dashboard: MockedObject<DashboardService>;

    beforeEach(async () => {
        dashboard = {
            getSummary: vi.fn().mockName("DashboardService.getSummary")
        } as MockedObject<DashboardService>;
        dashboard.getSummary.mockReturnValue(of(SUMMARY));

        await TestBed.configureTestingModule({
            imports: [DashboardComponent],
            providers: [provideNoopAnimations(), { provide: DashboardService, useValue: dashboard }],
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders every KPI from the summary response', () => {
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

        expect(dashboard.getSummary).toHaveBeenCalled();
        // Rendered in Persian digits.
        expect(text).toContain(toPersianDigits(1240));
        expect(text).toContain(toPersianDigits(318));
        expect(text).toContain(toPersianDigits(42));
        expect(text).toContain(toPersianDigits(7));
        expect(text).toContain(toPersianDigits(11));
    });

    it('builds the monthly chart and its accessible table fallback from real data', () => {
        expect(component.monthlyLoansChartData.labels?.length).toBe(2);
        expect(component.monthlyLoansChartData.datasets[0].data).toEqual([12, 19]);
        expect(component.monthlyRows()).toEqual([
            { label: 'ژانویه ۲۰۲۵', count: 12 },
            { label: 'فوریه ۲۰۲۵', count: 19 },
        ]);

        // The old implementation invented the series with Math.random(); make sure the
        // rendered values are exactly the API's.
        const numbers = component.monthlyLoansChartData.datasets[0].data as number[];
        expect(numbers.reduce((sum, value) => sum + value, 0)).toBe(31);
    });

    it('renders the recent loans table with the member, book and status', () => {
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

        expect(text).toContain('صد سال تنهایی');
        expect(text).toContain('سارا احمدی');
        expect(text).toContain('دیرکرد');
    });

    it('shows a retry affordance when the summary request fails', () => {
        dashboard.getSummary.mockReturnValue(throwError(() => ({ status: 500, error: { message: 'خطای سرور' } })));

        component.loadSummary();
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        expect(component.error()).toBe('خطای سرور');
        expect(component.summary()).toBeNull();
        expect(host.querySelector('[role="alert"]')?.textContent).toContain('خطای سرور');
        expect(host.textContent).toContain('تلاش مجدد');
    });

    it('reloads the summary when the refresh button is pressed', () => {
        const refresh = (fixture.nativeElement as HTMLElement).querySelector('.refresh-button') as HTMLButtonElement;

        expect(refresh).not.toBeNull();
        refresh.click();

        expect(dashboard.getSummary).toHaveBeenCalledTimes(2);
    });

    it('translates Arabic-Indic digits for a consistent Persian UI', () => {
        expect(toPersianDigits(2025)).toBe('۲۰۲۵');
        expect(toPersianDigits('۱۲')).toBe('۱۲');
    });
});
