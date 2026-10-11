import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, OnInit, PLATFORM_ID, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BookLoanModel } from '../../core/model/bookLoanModel';
import { DashboardSummaryModel, MonthlyLoanCount } from '../../core/model/dashboard.model';
import { DashboardService } from '../../core/service/dashboard.service';
import { parseIsoDate } from '../../core/util/date.util';

// chart.js is configured exactly once, at module load. `registerables` is idempotent, so
// this also covers the (unlikely) case of the dashboard chunk being evaluated twice.
Chart.register(...registerables);

/** Persian month names indexed by `Date.getMonth()`. */
const PERSIAN_MONTHS = [
  'ژانویه',
  'فوریه',
  'مارس',
  'آوریل',
  'مه',
  'ژوئن',
  'ژوئیه',
  'اوت',
  'سپتامبر',
  'اکتبر',
  'نوامبر',
  'دسامبر',
];

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** Converts the ASCII digits of a number to Persian digits for a consistently RTL UI. */
export function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

/** `yyyy-MM` → `ژانویه ۲۰۲۵`; falls back to the raw label when the shape is unexpected. */
function formatMonthLabel(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month ?? '');
  if (!match) {
    return month ?? '';
  }
  const monthIndex = Number(match[2]) - 1;
  const name = PERSIAN_MONTHS[monthIndex] ?? match[2];
  return `${name} ${toPersianDigits(match[1])}`;
}

/** Persian rendering of an ISO `yyyy-MM-dd` date. */
function formatPersianDate(value: string | null | undefined): string {
  const date = parseIsoDate(value);
  if (!date) {
    return value ?? '---';
  }
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

const LOAN_STATUS_LABELS: Record<string, string> = {
  ON_LOAN: 'در امانت',
  RETURNED: 'بازگشتی',
  OVERDUE: 'دیرکرد',
};

/**
 * Management dashboard.
 *
 * Every figure is read from `GET /api/dashboard/summary`. The previous version issued six
 * list requests and **fabricated the loan-activity series with `Math.random()`** while
 * labelling it as real data; that mock chart is gone, and the monthly series now comes
 * from the API. The chart is also paired with an accessible table fallback, because a
 * `<canvas>` has no accessible content of its own.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    BaseChartDirective
],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal<DashboardSummaryModel | null>(null);
  /** Month labels paired with counts, used by the accessible table fallback. */
  readonly monthlyRows = signal<{ label: string; count: number }[]>([]);

  readonly monthlyLoansChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'تعداد امانت‌ها',
        backgroundColor: 'rgba(79, 70, 229, 0.75)',
        hoverBackgroundColor: 'rgba(79, 70, 229, 1)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  readonly monthlyLoansChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#4b5563', font: { family: 'Vazirmatn, Tahoma, sans-serif' } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#4b5563',
          precision: 0,
          font: { family: 'Vazirmatn, Tahoma, sans-serif' },
        },
        grid: { color: '#e5e7eb' },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: (context) => `${toPersianDigits(context.parsed.y ?? 0)} امانت`,
        },
      },
    },
  };

  readonly monthlyLoansChartType = 'bar' as const;

  ngOnInit(): void {
    this.loadSummary();
  }

  /** Reloads the summary; bound to the refresh button and to the error-state retry. */
  loadSummary(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.dashboardService
      .getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.applySummary(summary);
          this.isLoading.set(false);
        },
        error: (httpError: unknown) => {
          this.summary.set(null);
          this.monthlyRows.set([]);
          this.resetChart();
          this.error.set(this.describeError(httpError));
          this.isLoading.set(false);
        },
      });
  }

  formatDate(value: string | null | undefined): string {
    return formatPersianDate(value);
  }

  toPersian(value: number | string | null | undefined): string {
    return value === null || value === undefined ? '---' : toPersianDigits(value);
  }

  personName(loan: BookLoanModel): string {
    return `${loan.personFirstName ?? ''} ${loan.personLastName ?? ''}`.trim() || '---';
  }

  statusLabel(status: string): string {
    return LOAN_STATUS_LABELS[status] ?? status;
  }

  // --- Internals ------------------------------------------------------------

  private applySummary(summary: DashboardSummaryModel): void {
    this.summary.set(summary);

    const series: MonthlyLoanCount[] = Array.isArray(summary?.monthlyLoans)
      ? summary.monthlyLoans
      : [];
    const labels = series.map((point) => formatMonthLabel(point.month));
    const counts = series.map((point) => Number(point.count) || 0);

    this.monthlyLoansChartData.labels = labels;
    this.monthlyLoansChartData.datasets[0].data = counts;
    this.monthlyRows.set(
      series.map((point, index) => ({
        label: labels[index],
        count: counts[index],
      })),
    );
  }

  private resetChart(): void {
    this.monthlyLoansChartData.labels = [];
    this.monthlyLoansChartData.datasets[0].data = [];
  }

  private describeError(error: unknown): string {
    if (!this.isBrowser) {
      return 'خطا در بارگذاری اطلاعات داشبورد.';
    }
    const httpError = error as { error?: { message?: string }; message?: string; status?: number };
    if (httpError?.status === 403) {
      return 'دسترسی به اطلاعات داشبورد مجاز نیست.';
    }
    return (
      httpError?.error?.message ||
      httpError?.message ||
      'خطا در بارگذاری اطلاعات داشبورد. لطفاً دوباره تلاش کنید.'
    );
  }
}
