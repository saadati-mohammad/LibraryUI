import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { BookComponent } from './book.component';
import { BookService } from '../../core/service/book.service';
import { BookModel } from '../../core/model/bookModel';
import { ConfirmationService } from '../../shared/service/confirmation.service';
import { FilePickerComponent } from '../../shared/component/file-picker/file-picker.component';
import { InputDeviceService } from '../../core/service/input-device.service';

const BOOK: BookModel = {
    id: 21,
    isbn10: '964-321-000-0',
    title: 'شازده کوچولو',
    author: 'اگزوپری',
    subject: 'داستان',
    active: true,
    bookCoverFile: 'https://example.test/cover.jpg',
    pageCount: 120,
    copyCount: 3,
};

describe('BookComponent', () => {
    let fixture: ComponentFixture<BookComponent>;
    let component: BookComponent;
    let books: MockedObject<BookService>;
    let confirmation: MockedObject<ConfirmationService>;

    beforeEach(async () => {
        books = {
            getBookList: vi.fn().mockName("BookService.getBookList"),
            addBook: vi.fn().mockName("BookService.addBook"),
            updateBook: vi.fn().mockName("BookService.updateBook"),
            deleteBook: vi.fn().mockName("BookService.deleteBook"),
            importBooksFromExcel: vi.fn().mockName("BookService.importBooksFromExcel")
        } as MockedObject<BookService>;
        books.getBookList.mockReturnValue(of({ content: [BOOK], totalPages: 1, totalElements: 1, size: 10, number: 0 }));
        books.updateBook.mockReturnValue(of(BOOK));
        books.addBook.mockReturnValue(of(BOOK));
        books.deleteBook.mockReturnValue(of(undefined));
        confirmation = {
            confirm: vi.fn().mockName("ConfirmationService.confirm")
        } as MockedObject<ConfirmationService>;
        confirmation.confirm.mockResolvedValue(true);

        await TestBed.configureTestingModule({
            imports: [BookComponent],
            providers: [
                provideNoopAnimations(),
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                { provide: BookService, useValue: books },
                { provide: InputDeviceService, useValue: { effectivePolicy: vi.fn().mockReturnValue(of({
                    formKey: 'book-registration', station: '', allowedSources: ['MANUAL', 'KEYBOARD_WEDGE'],
                    defaultSource: 'MANUAL', scope: 'system-default', updatedBy: null, updatedAt: null, version: 0,
                })) } },
                { provide: ConfirmationService, useValue: confirmation },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BookComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('defaults the active filter to true', () => {
        expect(component.bookFiltersForm.get('active')?.value).toBe(true);
        const filters = vi.mocked(books.getBookList).mock.lastCall![0] as {
            active: boolean;
        };
        expect(filters.active).toBe(true);
    });

    it('uses the effective form input policy to control scanner entry points', () => {
        expect(component.isInputSourceAllowed('KEYBOARD_WEDGE')).toBe(true);
        expect(component.isInputSourceAllowed('PHONE_CAMERA')).toBe(false);
    });

    it('does not arm cover removal just by opening the edit modal', () => {
        component.openBookModal(component.FormOperationEnum.UPDATE, BOOK);

        expect(component.shouldRemoveCover).toBe(false);
        expect(component.hasStoredCover).toBe(true);

        component.onBookSubmit();

        expect(vi.mocked(books.updateBook).mock.lastCall![2]).toBeUndefined();
    });

    it('arms cover removal only after the picker clears it', () => {
        component.openBookModal(component.FormOperationEnum.UPDATE, BOOK);
        component.bookForm.patchValue({ bookCoverFile: null });

        expect(component.shouldRemoveCover).toBe(true);

        component.onBookSubmit();

        expect(vi.mocked(books.updateBook).mock.lastCall![2]).toBeNull();
    });

    it('keeps the cover File out of the JSON entity and sends it as the multipart file', () => {
        const file = new File(['x'], 'cover.png', { type: 'image/png' });
        component.openBookModal(component.FormOperationEnum.UPDATE, BOOK);
        component.bookForm.patchValue({ bookCoverFile: file });

        component.onBookSubmit();

        const [, entity, picture] = vi.mocked(books.updateBook).mock.lastCall!;
        expect(picture).toBe(file);
        expect((entity as unknown as Record<string, unknown>)['bookCoverFile']).toBeUndefined();
    });

    it('normalises an empty publication date to null for LocalDate', () => {
        component.openBookModal(component.FormOperationEnum.ADD);
        component.bookForm.patchValue({
            isbn10: '964-321-000-1',
            title: 'ت',
            author: 'ن',
            subject: 'م',
            publicationDate: '',
        });

        component.onBookSubmit();

        const entity = vi.mocked(books.addBook).mock.lastCall![0] as BookModel;
        expect(entity.publicationDate).toBeNull();
    });

    it('rejects a publication date in the future', () => {
        component.openBookModal(component.FormOperationEnum.ADD);
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        const iso = `${future.getFullYear()}-01-01`;

        component.bookForm.patchValue({ publicationDate: iso });

        expect(component.bookForm.get('publicationDate')?.hasError('notFutureDate')).toBe(true);
        component.onBookSubmit();
        expect(books.addBook).not.toHaveBeenCalled();
    });

    it('renders the accessible file picker inside the cover section', () => {
        component.openBookModal(component.FormOperationEnum.ADD);
        fixture.detectChanges();

        const picker = fixture.debugElement.query((node) => node.componentInstance instanceof FilePickerComponent);
        expect(picker).not.toBeNull();
    });

    it('confirms before deleting and reports success', async () => {
        const deleted = component.deleteBook(BOOK);
        await deleted;

        expect(confirmation.confirm).toHaveBeenCalled();
        expect(books.deleteBook).toHaveBeenCalledTimes(1);
        expect(books.deleteBook).toHaveBeenCalledWith(21);
    });
});
