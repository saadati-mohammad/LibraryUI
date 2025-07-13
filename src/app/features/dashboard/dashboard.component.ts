import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

// --- Chart.js Imports ---
import { BaseChartDirective } from 'ng2-charts'; // <--- FIX: ADD THIS LINE
import { ChartConfiguration, ChartOptions, ChartType, Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns'; // برای کار با تاریخ‌ها

// --- Project Services & Models ---
import { BookService } from '../../core/service/book.service';
import { PersonService } from '../../core/service/person.service';
import { BookLoanService } from '../../core/service/book-loan.service';
import { BookModel } from '../../core/model/bookModel';
import { PersonModel } from '../../core/model/personModel';
import { BookLoanModel } from '../../core/model/bookLoanModel';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BookComponent, FormOperation as BookFormOperation } from '../book/book.component';
import { PersonComponent, FormOperation as PersonFormOperation } from '../person/person.component';


// مدل برای نگهداری آمار
interface DashboardStats {
  totalBooks: number;
  activeMembers: number;
  onLoanBooks: number;
  overdueBooks: number;
}
@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    BookComponent,
    PersonComponent,
    BaseChartDirective // from ng2-charts
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @ViewChild('bookManager') bookManager!: BookComponent;
  @ViewChild('personManager') personManager!: PersonComponent;

  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  isLoading = true;
  stats: DashboardStats = {
    totalBooks: 0,
    activeMembers: 0,
    onLoanBooks: 0,
    overdueBooks: 0
  };
  recentBooks: BookModel[] = [];
  recentMembers: PersonModel[] = [];
  overdueLoans: BookLoanModel[] = [];

  // Bar Chart: Loan Activity
  public loanActivityChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280' }
      },
      y: {
        beginAtZero: true,
        // --- FIX STARTS HERE ---
        grid: {
          color: '#e5e7eb', // text-gray-200
        },
        border: { // The 'dash' property is now inside the 'border' object
          dash: [5, 5]
        },
        // --- FIX ENDS HERE ---
        ticks: {
          color: '#6b7280', // text-gray-500
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        bodySpacing: 4,
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: (context) => `${context.parsed.y} امانت`
        }
      }
    }
  };
  public loanActivityChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'تعداد امانت‌ها',
      backgroundColor: 'rgba(79, 70, 229, 0.7)', // indigo-600
      hoverBackgroundColor: 'rgba(79, 70, 229, 1)',
      borderColor: 'rgba(79, 70, 229, 1)',
      borderRadius: 6,
      barThickness: 20
    }]
  };
  public loanActivityChartType: ChartType = 'bar';

  // Pie Chart: Loan Status
  public loanStatusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#374151', // text-gray-700
          font: { size: 12, family: 'Vazirmatn' }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value}`;
          }
        }
      }
    }
  };
  public loanStatusChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['در امانت', 'دیرکرد'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#3b82f6' /* blue-500 */, '#ef4444' /* red-500 */],
      hoverBackgroundColor: ['#2563eb' /* blue-600 */, '#dc2626' /* red-600 */],
      borderColor: '#ffffff',
      hoverBorderColor: '#f9fafb' // bg-gray-50
    }]
  };
  public loanStatusChartType: ChartType = 'pie';


  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private bookService: BookService,
    private personService: PersonService,
    private loanService: BookLoanService,
    private snackBar: MatSnackBar,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      Chart.register(...registerables);
    }
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // A list of observables to fetch all data in parallel
    const dataSources = {
      books: this.bookService.getBookList(undefined, 0, 1), // for total count
      activePersons: this.personService.getPersonList({ active: true }, 0, 1),
      onLoan: this.loanService.getLoanList({ status: 'ON_LOAN' }, 0, 1),
      overdue: this.loanService.getLoanList({ status: 'OVERDUE' }, 0, 10), // Get up to 10 overdue loans for the list
      recentBooks: this.bookService.getBookList({}, 0, 5, 'id,desc'),
      recentMembers: this.personService.getPersonList({}, 0, 5, 'id,desc')
    };

    forkJoin(dataSources)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          // --- Populate Stats Cards ---
          this.stats = {
            totalBooks: results.books.totalElements,
            activeMembers: results.activePersons.totalElements,
            onLoanBooks: results.onLoan.totalElements,
            overdueBooks: results.overdue.totalElements,
          };

          // --- Populate Lists ---
          this.recentBooks = results.recentBooks.content;
          this.recentMembers = results.recentMembers.content;
          this.overdueLoans = results.overdue.content;

          // --- Setup Charts ---
          this.setupLoanStatusChart();
          this.setupLoanActivityChart();

          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading dashboard data:', err);
          if (this.isBrowser) {
            this.snackBar.open('خطا در بارگذاری اطلاعات داشبورد.', 'بستن', { duration: 5000, direction: 'rtl' });
          }
          this.isLoading = false;
        }
      });
  }

  private setupLoanStatusChart(): void {
    this.loanStatusChartData.datasets[0].data = [
      this.stats.onLoanBooks,
      this.stats.overdueBooks,
    ];
    this.chart?.update();
  }

  private setupLoanActivityChart(): void {
    // NOTE: This is mock data as there is no backend endpoint for daily loan counts.
    // In a real application, you would fetch this data from an API.
    const labels: string[] = [];
    const data: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }));
      // Generate random data for demonstration
      data.push(Math.floor(Math.random() * 15) + 1);
    }

    this.loanActivityChartData.labels = labels;
    this.loanActivityChartData.datasets[0].data = data;
    this.chart?.update();
  }

  viewBook(book: BookModel): void {
    // فراخوانی متد پابلیک کامپوننت کتاب
    this.bookManager.openBookModal(BookFormOperation.VIEW, book);
  }

  viewPerson(person: PersonModel): void {
    // فراخوانی متد پابلیک کامپوننت اعضا
    this.personManager.openPersonModal(PersonFormOperation.VIEW, person);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}