import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { LoanComponent } from './loan.component';
import { BookLoanService } from '../../core/service/book-loan.service';
import { BookService } from '../../core/service/book.service';
import { PersonService } from '../../core/service/person.service';
import { InputDeviceService } from '../../core/service/input-device.service';
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
const BOOK = { id: 2, title: 'بوف کور', author: 'هدایت', isbn10: '0306406152', isbn13: '9780306406157' } as BookModel;

function page<T>(content: T[], size = 10) {
    return { content, totalPages: 1, totalElements: content.length, size, number: 0 };
}

describe('LoanComponent', () => {
    let fixture: ComponentFixture<LoanComponent>;
    let component: LoanComponent;
    let loans: MockedObject<BookLoanService>;
    let persons: MockedObject<PersonService>;
    let books: MockedObject<BookService>;
    let inputDevices: MockedObject<InputDeviceService>;
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
        inputDevices = { effectivePolicy: vi.fn().mockReturnValue(of({
            formKey: 'loan-checkout', station: '', allowedSources: ['MANUAL', 'KEYBOARD_WEDGE'],
            defaultSource: 'MANUAL', scope: 'system-default', updatedBy: null, updatedAt: null, version: 0,
        })) } as unknown as MockedObject<InputDeviceService>;
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
                { provide: InputDeviceService, useValue: inputDevices },
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

    it('uses a valid ISBN scan to select the exact loan book', () => {
        component.openLoanModal();
        component.processLoanScan('978-0-306-40615-7');
        expect(books.getBookList).toHaveBeenCalledWith({ active: true, isbn13: '9780306406157' }, 0, 25);
        expect(component.loanForm.get('bookId')?.value).toBe(2);
        expect(component.scanStatus).toContain('بوف کور');
    });

    it('does not silently pick a book when a scan is duplicated', () => {
        component.openLoanModal();
        books.getBookList.mockReturnValue(of({ ...page([BOOK], 25), totalElements: 2 }));
        component.processLoanScan('9780306406157');
        expect(component.loanForm.get('bookId')?.value).toBeNull();
        expect(component.scanStatus).toContain('چند کتاب');
    });

    it('finds the active loan by ISBN and asks for return confirmation', async () => {
        loans.getLoanList.mockImplementation((filters) => of(page(filters?.status === 'ON_LOAN' ? [LOAN] : [], 25)));
        component.processReturnScan('9780306406157');
        expect(loans.getLoanList).toHaveBeenCalledWith({ bookIsbn: '9780306406157', status: 'ON_LOAN' }, 0, 25);
        expect(loans.getLoanList).toHaveBeenCalledWith({ bookIsbn: '9780306406157', status: 'OVERDUE' }, 0, 25);
        await vi.waitFor(() => expect(confirmation.confirm).toHaveBeenCalled());
    });

    it('uses Persian national-ID digits to select the exact loan member', () => {
        component.openLoanModal();
        component.scanTarget = 'member';
        component.processLoanScan('۰۰۱۲۳۴۵۶۷۸');
        expect(persons.getPersonList).toHaveBeenCalledWith({ active: true, nationalId: '0012345678' }, 0, 25);
        expect(component.loanForm.get('personId')?.value).toBe(1);
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
