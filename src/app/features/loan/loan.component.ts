import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ActionButtonConfig, ListComponent, TableColumn} from '../../shared/component/list/list.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { BookService } from '../../core/service/book.service';
import { ModalComponent } from "../../shared/component/modal/modal.component";
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BookLoanModel, BookLoanFilterModel, CreateLoanRequest } from '../../core/model/bookLoanModel';
import { BookModel } from '../../core/model/bookModel';
import { PersonModel } from '../../core/model/personModel';
import { BookLoanService } from '../../core/service/book-loan.service';
import { PersonService } from '../../core/service/person.service';


@Component({
  selector: 'app-loan',
  standalone: true,
  imports: [ /* All necessary Angular Material and custom modules */
    ReactiveFormsModule, CommonModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatProgressSpinnerModule,
    MatExpansionModule, MatCheckboxModule, MatCardModule, MatSnackBarModule, ListComponent, ModalComponent
  ],
  templateUrl: './loan.component.html',
  styleUrls: ['./loan.component.css']
})
export class LoanComponent implements OnInit {

  tableTitle = 'لیست امانت‌ها';
  columns: TableColumn[] = [];
  data: BookLoanModel[] = [];

  // Modal & Form state
  isLoanModalVisible = false;
  loanForm: FormGroup;
  isSubmitting = false;

  // For populating modal dropdowns
  allActivePersons: PersonModel[] = [];
  allAvailableBooks: BookModel[] = [];

  // Pagination & Loading state
  isLoadingTable = false;
  totalElements = 0;
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  // Filtering
  filtersForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private loanService: BookLoanService,
    private personService: PersonService, // To get persons for dropdown
    private bookService: BookService,   // To get books for dropdown
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loanForm = this.fb.group({
      personId: [null, Validators.required],
      bookId: [null, Validators.required],
      notes: ['']
    });

    this.filtersForm = this.fb.group({
      personNationalId: [''],
      bookIsbn: [''],
      status: [null]
    });
  }

  ngOnInit(): void {
    this.setupTableColumns();
    this.loadLoans();

    this.filtersForm.valueChanges.pipe(
      debounceTime(700),
      distinctUntilChanged()
    ).subscribe(() => this.applyFilters());
  }

  setupTableColumns(): void {
    this.columns = [
      { columnDef: 'bookTitle', header: 'عنوان کتاب', cell: (el: BookLoanModel) => el.bookTitle, cellClass: () => 'emphasize' },
      { columnDef: 'personName', header: 'نام عضو', cell: (el: BookLoanModel) => `${el.personFirstName} ${el.personLastName}` },
      { columnDef: 'loanDate', header: 'تاریخ امانت', cell: (el: BookLoanModel) => el.loanDate },
      { columnDef: 'dueDate', header: 'تاریخ سررسید', cell: (el: BookLoanModel) => el.dueDate },
      { columnDef: 'returnDate', header: 'تاریخ بازگشت', cell: (el: BookLoanModel) => el.returnDate || '---' },
      {
        columnDef: 'status', header: 'وضعیت',
        cell: (el: BookLoanModel) => `<span class="status-badge ${this.getStatusClass(el.status)}">${this.translateStatus(el.status)}</span>`
      },
    ];
  }

  loadLoans(): void {
    this.isLoadingTable = true;
    const filters: BookLoanFilterModel = this.filtersForm.value;
    this.loanService.getLoanList(filters, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.data = response.content;
        this.totalElements = response.totalElements;
        this.isLoadingTable = false;
      },
      error: () => this.isLoadingTable = false
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLoans();
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadLoans();
  }

  resetFilters(): void {
    this.filtersForm.reset({ status: null });
    this.applyFilters();
  }

  openLoanModal(): void {
    this.loanForm.reset();
    this.isLoanModalVisible = true;
    // Load data for dropdowns
    this.personService.getPersonList({ active: true }, 0, 1000).subscribe(res => this.allActivePersons = res.content);
    // Note: A better approach would be an endpoint to get only available books
    this.bookService.getBookList({ active: true }, 0, 1000).subscribe(res => this.allAvailableBooks = res.content);
  }

  onLoanModalClose(): void {
    this.isLoanModalVisible = false;
  }

  onLoanSubmit(): void {
    if (this.loanForm.invalid) return;

    this.isSubmitting = true;
    const request: CreateLoanRequest = this.loanForm.value;

    this.loanService.createLoan(request).subscribe({
      next: () => {
        this.snackBar.open('امانت با موفقیت ثبت شد.', 'بستن', { duration: 3000, direction: 'rtl' });
        this.isSubmitting = false;
        this.isLoanModalVisible = false;
        this.loadLoans();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'خطا در ثبت امانت. ممکن است کتاب در دسترس نباشد.';
        this.snackBar.open(errorMessage, 'بستن', { duration: 5000, direction: 'rtl' });
        this.isSubmitting = false;
      }
    });
  }

  returnBook(loan: BookLoanModel): void {
    if (isPlatformBrowser(this.platformId)) {
      if (confirm(`آیا از ثبت بازگشت کتاب "${loan.bookTitle}" توسط "${loan.personFirstName} ${loan.personLastName}" مطمئن هستید؟`)) {
        this.loanService.returnLoan(loan.id).subscribe({
          next: () => {
            this.snackBar.open('کتاب با موفقیت بازگردانده شد.', 'بستن', { duration: 3000, direction: 'rtl' });
            this.loadLoans();
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'خطا در ثبت بازگشت کتاب.';
            this.snackBar.open(errorMessage, 'بستن', { duration: 5000, direction: 'rtl' });
          }
        });
      }
    }
  }

  // --- Helper methods for display ---
  getStatusClass(status: string): string {
    switch (status) {
      case 'ON_LOAN': return 'status-on-loan';
      case 'RETURNED': return 'status-returned';
      case 'OVERDUE': return 'status-overdue';
      default: return '';
    }
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'ON_LOAN': return 'در امانت';
      case 'RETURNED': return 'بازگشتی';
      case 'OVERDUE': return 'دیرکرد';
      default: return status;
    }
  }
}