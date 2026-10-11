import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ReservationComponent } from './reservation.component';
import { BookService } from '../../core/service/book.service';
import { PersonService } from '../../core/service/person.service';
import { ReservationService } from '../../core/service/reservation.service';
import { ConfirmationService } from '../../shared/service/confirmation.service';
import { ReservationModel, addDays, defaultExpiryIso, toIsoDate, } from '../../core/model/reservation.model';

/** Minimal paginated envelope matching what the book/person services return. */
function page<T>(content: T[]): {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
} {
    return { content, totalPages: 1, totalElements: content.length, size: 25, number: 0 };
}

const RESERVATION: ReservationModel = {
    id: 11,
    personId: 3,
    personFirstName: 'زهرا',
    personLastName: 'کریمی',
    bookId: 8,
    bookTitle: 'کیمیاگر',
    reservationDate: '2025-03-01',
    expiryDate: '2025-03-15',
    status: 'ACTIVE',
};

describe('ReservationComponent', () => {
    let fixture: ComponentFixture<ReservationComponent>;
    let component: ReservationComponent;
    let reservations: MockedObject<ReservationService>;
    let persons: MockedObject<PersonService>;
    let books: MockedObject<BookService>;
    let confirmation: MockedObject<ConfirmationService>;

    beforeEach(async () => {
        reservations = {
            getActiveReservations: vi.fn().mockName("ReservationService.getActiveReservations"),
            createReservation: vi.fn().mockName("ReservationService.createReservation"),
            fulfillReservation: vi.fn().mockName("ReservationService.fulfillReservation")
        } as MockedObject<ReservationService>;
        persons = {
            getPersonList: vi.fn().mockName("PersonService.getPersonList")
        } as MockedObject<PersonService>;
        books = {
            getBookList: vi.fn().mockName("BookService.getBookList")
        } as MockedObject<BookService>;
        confirmation = {
            confirm: vi.fn().mockName("ConfirmationService.confirm")
        } as MockedObject<ConfirmationService>;

        reservations.getActiveReservations.mockReturnValue(of([RESERVATION]));
        persons.getPersonList.mockReturnValue(of(page([{ id: 3, firstName: 'زهرا', lastName: 'کریمی', nationalId: '0012345678' } as never])));
        books.getBookList.mockReturnValue(of(page([{ id: 8, title: 'کیمیاگر', author: 'پائولو' } as never])));
        confirmation.confirm.mockResolvedValue(true);

        await TestBed.configureTestingModule({
            imports: [ReservationComponent],
            providers: [
                provideNoopAnimations(),
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                { provide: ReservationService, useValue: reservations },
                { provide: PersonService, useValue: persons },
                { provide: BookService, useValue: books },
                { provide: ConfirmationService, useValue: confirmation },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ReservationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders the active reservations returned by the service', () => {
        expect(reservations.getActiveReservations).toHaveBeenCalled();
        expect(component.reservations).toEqual([RESERVATION]);

        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('زهرا کریمی');
        expect(text).toContain('کیمیاگر');
        // 2025-03-15 rendered through the Persian calendar, not the ISO string.
        expect(text).not.toContain('2025-03-15');
    });

    it('surfaces a load failure with a retry affordance instead of the empty state', () => {
        reservations.getActiveReservations.mockReturnValue(throwError(() => ({ status: 500, error: { message: 'خطای سرور' } })));

        component.loadReservations();
        fixture.detectChanges();

        expect(component.loadError).toBe('خطای سرور');
        expect(component.reservations).toEqual([]);
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('تلاش مجدد');
    });

    it('defaults the expiry date to today + 14 days and rejects a past date', () => {
        const expiry = component.reservationForm.get('expiryDate');

        expect(expiry?.value).toBe(defaultExpiryIso());
        expect(expiry?.valid).toBe(true);

        expiry?.setValue(toIsoDate(addDays(new Date(), -1)));
        expect(expiry?.hasError('notPastDate')).toBe(true);

        expiry?.setValue(toIsoDate(addDays(new Date(), 1)));
        expect(expiry?.valid).toBe(true);
    });

    it('requires a confirmed member and book selection before submitting', () => {
        component.openReservationModal();

        // Free text typed into the autocomplete must NOT count as a selection.
        component.reservationForm.get('personId')?.setValue('زهرا');
        component.reservationForm.get('bookId')?.setValue(null);
        component.onSubmit();

        expect(component.reservationForm.get('personId')?.hasError('selectionRequired')).toBe(true);
        expect(component.reservationForm.get('bookId')?.hasError('selectionRequired')).toBe(true);
        expect(reservations.createReservation).not.toHaveBeenCalled();
    });

    it('submits the selected ids and the ISO expiry date, then reloads', () => {
        reservations.createReservation.mockReturnValue(of(RESERVATION));
        const reloadsBefore = vi.mocked(reservations.getActiveReservations).mock.calls.length;
        const expiry = toIsoDate(addDays(new Date(), 7));
        component.openReservationModal();
        component.reservationForm.patchValue({
            personId: 3,
            bookId: 8,
            expiryDate: expiry,
        });

        component.onSubmit();

        expect(reservations.createReservation).toHaveBeenCalledTimes(1);

        expect(reservations.createReservation).toHaveBeenCalledWith({
            personId: 3,
            bookId: 8,
            expiryDate: expiry,
        });
        expect(component.isReservationModalVisible).toBe(false);
        expect(vi.mocked(reservations.getActiveReservations).mock.calls.length).toBe(reloadsBefore + 1);
    });

    it('shows the backend 409 message when the reservation conflicts', () => {
        reservations.createReservation.mockReturnValue(throwError(() => ({ status: 409, error: { message: 'کتاب در دسترس نیست' } })));
        component.openReservationModal();
        component.reservationForm.patchValue({ personId: 3, bookId: 8 });

        component.onSubmit();

        expect(component.isSubmitting).toBe(false);
        expect(component.isReservationModalVisible).toBe(true);
    });

    it('searches members through a bounded, debounced request', fakeAsync(() => {
        component.onPersonSearch('رضا');
        // Nothing is requested until the debounce elapses.
        expect(persons.getPersonList).not.toHaveBeenCalled();

        tick(400);

        expect(persons.getPersonList).toHaveBeenCalledTimes(1);

        expect(persons.getPersonList).toHaveBeenCalledWith({ active: true, firstName: 'رضا' }, 0, 25);
        expect(component.personOptions().length).toBe(1);
        flush();
    }));

    it('does not fulfil a reservation when the confirmation is declined', async () => {
        confirmation.confirm.mockResolvedValue(false);

        await component.fulfillReservation(RESERVATION);

        expect(reservations.fulfillReservation).not.toHaveBeenCalled();
    });

    it('fulfils after an accessible confirmation and reloads the list', async () => {
        reservations.fulfillReservation.mockReturnValue(of({ ...RESERVATION, status: 'FULFILLED' }));
        const reloadsBefore = vi.mocked(reservations.getActiveReservations).mock.calls.length;

        await component.fulfillReservation(RESERVATION);

        expect(confirmation.confirm).toHaveBeenCalled();
        expect(reservations.fulfillReservation).toHaveBeenCalledTimes(1);
        expect(reservations.fulfillReservation).toHaveBeenCalledWith(11);
        expect(vi.mocked(reservations.getActiveReservations).mock.calls.length).toBe(reloadsBefore + 1);
    });
});
