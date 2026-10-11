import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { PersonComponent } from './person.component';
import { PersonService } from '../../core/service/person.service';
import { PersonModel } from '../../core/model/personModel';
import { ConfirmationService } from '../../shared/service/confirmation.service';
import { FilePickerComponent } from '../../shared/component/file-picker/file-picker.component';
import { ListComponent } from '../../shared/component/list/list.component';

const PERSON: PersonModel = {
    id: 4,
    firstName: 'مریم',
    lastName: 'رضایی',
    email: 'maryam@example.com',
    nationalId: '0012345678',
    phone: '09120000000',
    active: true,
    profilePicture: 'https://example.test/p.jpg',
};

/** A `File`-shaped value that survives the component's `instanceof File` checks. */
function fakeImageFile(): File {
    return new File(['x'], 'avatar.png', { type: 'image/png' });
}

describe('PersonComponent', () => {
    let fixture: ComponentFixture<PersonComponent>;
    let component: PersonComponent;
    let persons: MockedObject<PersonService>;
    let confirmation: MockedObject<ConfirmationService>;

    function page<T>(content: T[]) {
        return { content, totalPages: 1, totalElements: content.length, size: 10, number: 0 };
    }

    beforeEach(async () => {
        persons = {
            getPersonList: vi.fn().mockName("PersonService.getPersonList"),
            addPerson: vi.fn().mockName("PersonService.addPerson"),
            updatePerson: vi.fn().mockName("PersonService.updatePerson"),
            deactivatePerson: vi.fn().mockName("PersonService.deactivatePerson"),
            importPersonsFromExcel: vi.fn().mockName("PersonService.importPersonsFromExcel")
        } as MockedObject<PersonService>;
        persons.getPersonList.mockReturnValue(of(page<PersonModel>([PERSON])));
        persons.updatePerson.mockReturnValue(of(PERSON));
        persons.addPerson.mockReturnValue(of(PERSON));
        persons.deactivatePerson.mockReturnValue(of(undefined));
        confirmation = {
            confirm: vi.fn().mockName("ConfirmationService.confirm")
        } as MockedObject<ConfirmationService>;
        confirmation.confirm.mockResolvedValue(true);

        await TestBed.configureTestingModule({
            imports: [PersonComponent],
            providers: [
                provideNoopAnimations(),
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                { provide: PersonService, useValue: persons },
                { provide: ConfirmationService, useValue: confirmation },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PersonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('defaults the active filter to true so soft-deleted members stay hidden', () => {
        expect(component.personFiltersForm.get('active')?.value).toBe(true);

        const filters = vi.mocked(persons.getPersonList).mock.lastCall![0] as {
            active: boolean;
        };
        expect(filters.active).toBe(true);
    });

    it('still offers فعال / غیرفعال / همه in the status select', () => {
        // Scoped to the filter panel: the modal's `mat-slide-toggle` also renders an internal
        // `mat-select`, so a document-wide query would be ambiguous.
        const filtersForm = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLElement;
        expect(filtersForm).not.toBeNull();
        expect(filtersForm.querySelector('mat-select[formcontrolname="active"]')).not.toBeNull();

        component.personFiltersForm.get('active')?.setValue(false);
        expect(component.personFiltersForm.get('active')?.value).toBe(false);
        component.personFiltersForm.get('active')?.setValue(null);
        expect(component.personFiltersForm.get('active')?.value).toBeNull();
    });

    it('resetFilters returns to the active-only default', fakeAsync(() => {
        component.personFiltersForm.get('active')?.setValue(null);
        component.resetFilters();
        tick(1000);

        expect(component.personFiltersForm.get('active')?.value).toBe(true);
    }));

    /**
     * Regression guard for the silent picture deletion: editing a member used to call
     * `resetFileState()`, which armed `shouldRemovePicture`, so saving always sent `null`
     * and wiped the stored picture.
     */
    it('does NOT arm picture removal just by opening the edit modal', () => {
        component.openPersonModal(component.FormOperationEnum.UPDATE, PERSON);

        expect(component.shouldRemovePicture).toBe(false);
        expect(component.hasStoredPicture).toBe(true);

        component.onPersonSubmit();

        const pictureArg = vi.mocked(persons.updatePerson).mock.lastCall![2];
        // `undefined` = "leave the stored picture alone".
        expect(pictureArg).toBeUndefined();
    });

    it('sends null (delete) only after the picture is explicitly cleared', () => {
        component.openPersonModal(component.FormOperationEnum.UPDATE, PERSON);
        // What the picker's clear button does.
        component.personForm.patchValue({ profilePicture: null });

        expect(component.shouldRemovePicture).toBe(true);

        component.onPersonSubmit();

        expect(vi.mocked(persons.updatePerson).mock.lastCall![2]).toBeNull();
    });

    it('sends the picked File when a new picture is chosen', () => {
        const file = fakeImageFile();
        component.openPersonModal(component.FormOperationEnum.UPDATE, PERSON);
        component.personForm.patchValue({ profilePicture: file });

        expect(component.shouldRemovePicture).toBe(false);

        component.onPersonSubmit();

        expect(vi.mocked(persons.updatePerson).mock.lastCall![2]).toBe(file);
    });

    it('never arms removal when creating a new member', () => {
        component.openPersonModal(component.FormOperationEnum.ADD);

        expect(component.shouldRemovePicture).toBe(false);
    });

    it('rejects an invalid national id and does not call the API', () => {
        component.openPersonModal(component.FormOperationEnum.ADD);
        component.personForm.patchValue({
            firstName: 'علی',
            lastName: 'محمدی',
            email: 'ali@example.com',
            nationalId: '123',
        });

        expect(component.personForm.invalid).toBe(true);
        component.onPersonSubmit();

        expect(persons.addPerson).not.toHaveBeenCalled();
    });

    it('surfaces the backend message when deactivation fails', async () => {
        persons.deactivatePerson.mockReturnValue(throwError(() => ({ status: 409, error: { message: 'عضو امانت فعال دارد' } })));

        await component.deactivatePerson(PERSON);

        expect(confirmation.confirm).toHaveBeenCalled();
        expect(persons.deactivatePerson).toHaveBeenCalledTimes(1);
        expect(persons.deactivatePerson).toHaveBeenCalledWith(4);
    });

    it('uses the accessible file picker instead of a raw file input in the modal', () => {
        component.openPersonModal(component.FormOperationEnum.UPDATE, PERSON);
        fixture.detectChanges();

        const picker = fixture.debugElement.query((node) => node.componentInstance instanceof FilePickerComponent);
        expect(picker).not.toBeNull();
    });

    it('renders the shared list with an empty-state hint', () => {
        const list = fixture.debugElement.query((node) => node.componentInstance instanceof ListComponent).componentInstance as ListComponent;

        expect(list.emptyMessage).toContain('عضوی');
    });
});
