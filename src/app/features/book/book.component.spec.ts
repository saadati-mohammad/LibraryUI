import type { MockedObject } from "vitest";
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { BookComponent } from './book.component';
import { BookService } from '../../core/service/book.service';
import { BookModel } from '../../core/model/bookModel';
import { ConfirmationService } from '../../shared/service/confirmation.service';
import { FilePickerComponent } from '../../shared/component/file-picker/file-picker.component';
import { InputDeviceService } from '../../core/service/input-device.service';

const BOOK: BookModel = {
    id: 21,
    isbn10: '0-306-40615-2',
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
                { provide: PLATFORM_ID, useValue: 'browser' },
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

    it('collects unique scans in a bounded review queue without looking them up', () => {
        component.openBookModal(component.FormOperationEnum.ADD);
        component.setReviewBatchMode(true);
        component.barcodeValue = '0-306-40615-2';
        component.lookupScannedIsbn();
        component.barcodeValue = '0306406152';
        component.lookupScannedIsbn();

        expect(component.reviewBatchIsbns).toEqual(['0306406152']);
        expect(component.scanStatus).toContain('از قبل');
        expect(component.isLookingUpMetadata).toBe(false);

        for (let n = 0; n < 49; n++) {
            component.reviewBatchIsbns.push(`9780000000${String(n).padStart(3, '0')}`);
        }
        component.barcodeValue = '0-306-40615-2';
        component.lookupScannedIsbn();
        expect(component.reviewBatchIsbns).toHaveLength(50);
        component.barcodeValue = '9780306406157';
        component.lookupScannedIsbn();
        expect(component.reviewBatchIsbns).toHaveLength(50);
        expect(component.scanStatus).toContain('سقف ۵۰');
    });

    it('keeps automatic registration and review-first scan modes mutually exclusive', () => {
        component.setContinuousScanMode(true);
        expect(component.continuousScanMode).toBe(true);
        expect(component.reviewBatchMode).toBe(false);
        component.setReviewBatchMode(true);
        expect(component.reviewBatchMode).toBe(true);
        expect(component.continuousScanMode).toBe(false);
    });

    it('reports skipped duplicate workbook rows after an import', () => {
        books.importBooksFromExcel.mockReturnValue(of({
            success: true, imported: 3, skippedDuplicates: 2, duplicateRows: [4, 8], message: 'ok',
        }));
        const snackBar = (component as unknown as { snackBar: MatSnackBar }).snackBar;
        const open = vi.spyOn(snackBar, 'open');
        component.excelImportForm.controls.excelFile.setValue(new File(['xlsx'], 'books.xlsx'));

        component.onExcelImportSubmit();

        expect(vi.mocked(books.importBooksFromExcel)).toHaveBeenCalledWith(expect.any(File));
        expect(open).toHaveBeenCalledWith(
            expect.stringContaining('3 کتاب وارد شد و 2 ردیف تکراری نادیده گرفته شد. ردیف‌های تکراری: 4، 8.'),
            'بستن',
            expect.objectContaining({ duration: 9000, direction: 'rtl' }),
        );
    });

    it('toggles the camera torch when supported and reports unsupported torch controls', async () => {
        const switchTorch = vi.fn().mockResolvedValue(undefined);
        (component as unknown as { scannerControls: { stop: () => void; switchTorch?: (enabled: boolean) => Promise<void> } | null })
            .scannerControls = { stop: vi.fn(), switchTorch };
        await component.toggleCameraTorch();
        expect(switchTorch).toHaveBeenCalledWith(true);
        expect(component.torchEnabled).toBe(true);
        await component.toggleCameraTorch();
        expect(switchTorch).toHaveBeenLastCalledWith(false);
        expect(component.torchEnabled).toBe(false);

        (component as unknown as { scannerControls: null }).scannerControls = null;
        await component.toggleCameraTorch();
        expect(component.scanStatus).toContain('پشتیبانی نمی‌شود');
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
            isbn10: '0-306-40615-2',
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
