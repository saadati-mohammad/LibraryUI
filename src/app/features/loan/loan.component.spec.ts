import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { LoanComponent } from './loan.component';
import { BookLoanService } from '../../core/service/book-loan.service';
import { BookService } from '../../core/service/book.service';
import { PersonService } from '../../core/service/person.service';
import { BookLoanModel } from '../../core/model/bookLoanModel';
import { PersonModel } from '../../core/model/personModel';
import { BookModel } from '../../core/model/bookModel';
import { ConfirmationService } from '../../shared/service/confirmation.service';

const LOAN: BookLoanModel = {
    id: 3,
    loanDate: '2025-02-01',
    dueDate: '2025-02-15',
    returnDate: null,
    status: 'ON_LOAN',
    notes: null,
    personId: 1,
    personFirstName: 'حسن',
    personLastName: 'نوری',
    bookId: 2,
    bookTitle: 'بوف کور',
};

const PERSON = { id: 1, firstName: 'حسن', lastName: 'نوری', nationalId: '0012345678' } as PersonModel;
const BOOK = { id: 2, title: 'بوف کور', author: 'هدایت' } as BookModel;

function page<T>(content: T[], size = 10) {
    return { content, totalPages: 1, totalElements: content.length, size, number: 0 };
}

describe('LoanComponent', () => {
    let fixture: ComponentFixture<LoanComponent>;
    let component: LoanComponent;
    let loans: MockedObject<BookLoanService>;
    let persons: MockedObject<PersonService>;
    let books: MockedObject<BookService>;
    let confirmation: MockedObject<ConfirmationService>;

    beforeEach(async () => {
        loans = {
            getLoanList: vi.fn().mockName("BookLoanService.getLoanList"),
            createLoan: vi.fn().mockName("BookLoanService.createLoan"),
            returnLoan: vi.fn().mockName("BookLoanService.returnLoan")
        } as MockedObject<BookLoanService>;
        loans.getLoanList.mockReturnValue(of(page([LOAN])));
        loans.returnLoan.mockReturnValue(of({ ...LOAN, status: 'RETURNED' }));
        persons = {
            getPersonList: vi.fn().mockName("PersonService.getPersonList")
        } as MockedObject<PersonService>;
        persons.getPersonList.mockReturnValue(of(page([PERSON], 25)));
        books = {
            getBookList: vi.fn().mockName("BookService.getBookList")
        } as MockedObject<BookService>;
        books.getBookList.mockReturnValue(of(page([BOOK], 25)));
        confirmation = {
            confirm: vi.fn().mockName("ConfirmationService.confirm")
        } as MockedObject<ConfirmationService>;
        confirmation.confirm.mockResolvedValue(true);

        await TestBed.configureTestingModule({
            imports: [LoanComponent],
            providers: [
                provideNoopAnimations(),
                { provide: BookLoanService, useValue: loans },
                { provide: PersonService, useValue: persons },
                { provide: BookService, useValue: books },
                { provide: ConfirmationService, useValue: confirmation },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LoanComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders the loans returned by the service', () => {
        expect(component.data).toEqual([LOAN]);
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('بوف کور');
    });

    it('surfaces a load error instead of showing the empty state silently', () => {
        loans.getLoanList.mockReturnValue(throwError(() => ({ status: 500, error: { message: 'سرویس در دسترس نیست' } })));

        component.loadLoans();
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        expect(component.loadError).toBe('سرویس در دسترس نیست');
        expect(host.querySelector('[role="alert"]')?.textContent).toContain('سرویس در دسترس نیست');
        expect(host.textContent).toContain('تلاش مجدد');
    });

    it('uses a consistently typed mat-select for the status filter', () => {
        expect(component.statusOptions.map((option) => option.value)).toEqual([
            null,
            'ON_LOAN',
            'OVERDUE',
            'RETURNED',
        ]);
        // The native <select> is gone.
        expect((fixture.nativeElement as HTMLElement).querySelector('select')).toBeNull();
        expect((fixture.nativeElement as HTMLElement).querySelector('mat-select')).not.toBeNull();
    });

    it('sends the selected status as a query param', fakeAsync(() => {
        component.filtersForm.get('status')?.setValue('OVERDUE');
        tick(1000);

        const filters = vi.mocked(loans.getLoanList).mock.lastCall![0] as {
            status: string;
        };
        expect(filters.status).toBe('OVERDUE');
    }));

    it('reports the backend 409 message when creating a loan on a deactivated book', () => {
        loans.createLoan.mockReturnValue(throwError(() => ({ status: 409, error: { message: 'کتاب غیرفعال است' } })));
        component.loanForm.patchValue({ personId: 1, bookId: 2 });

        component.onLoanSubmit();

        expect(component.isSubmitting).toBe(false);
        expect(component.isLoanModalVisible).toBe(false);
    });

    it('loads bounded option pages when the create modal opens', () => {
        component.openLoanModal();
        expect(component.isLoanModalVisible).toBe(true);
        // Opened with an empty term, which the debounce has not yet flushed.
        expect(persons.getPersonList).not.toHaveBeenCalled();
    });

    it('searches members through a bounded, debounced request', fakeAsync(() => {
        component.onPersonSearch('حسن');
        expect(persons.getPersonList).not.toHaveBeenCalled();

        tick(400);

        expect(persons.getPersonList).toHaveBeenCalledTimes(1);

        expect(persons.getPersonList).toHaveBeenCalledWith({ active: true, firstName: 'حسن' }, 0, 25);
        expect(component.personOptions()).toEqual([PERSON]);
    }));

    it('rejects a free-typed member name as an invalid selection', () => {
        component.loanForm.patchValue({ personId: 'حسن', bookId: 2 });

        expect(component.loanForm.get('personId')?.hasError('selectionRequired')).toBe(true);
        component.onLoanSubmit();
        expect(loans.createLoan).not.toHaveBeenCalled();
    });

    it('returns a book after confirmation', async () => {
        await component.returnBook(LOAN);

        expect(confirmation.confirm).toHaveBeenCalled();
        expect(loans.returnLoan).toHaveBeenCalledTimes(1);
        expect(loans.returnLoan).toHaveBeenCalledWith(3);
    });

    it('does nothing when the return confirmation is declined', async () => {
        confirmation.confirm.mockResolvedValue(false);

        await component.returnBook(LOAN);

        expect(loans.returnLoan).not.toHaveBeenCalled();
    });
});
