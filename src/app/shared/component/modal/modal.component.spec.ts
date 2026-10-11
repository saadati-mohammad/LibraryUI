import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
    let component: ModalComponent;
    let fixture: ComponentFixture<ModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [ModalComponent] }).compileComponents();

        fixture = TestBed.createComponent(ModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    /** Makes the modal visible and returns the rendered host element. */
    function open(): HTMLElement {
        component.isVisible = true;
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    it('renders nothing while it is not visible', () => {
        expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
    });

    it('renders an accessible dialog when visible', () => {
        const host = open();
        const dialog = host.querySelector('[role="dialog"]');

        expect(dialog).not.toBeNull();
        expect(dialog?.getAttribute('aria-modal')).toBe('true');
        expect(host.textContent).toContain('عنوان مودال');
    });

    it('emits submitted from the confirm button', () => {
        const host = open();
        let submittedCount = 0;
        component.submitted.subscribe(() => (submittedCount += 1));

        const button = host.querySelector<HTMLButtonElement>('.modal-submit-btn');
    expect(button).not.toBeNull();
        button?.click();

        expect(submittedCount).toBe(1);
    });

    it('emits cancelled and hides itself from the close button', () => {
        const host = open();
        let cancelledCount = 0;
        const visibility: boolean[] = [];
        component.cancelled.subscribe(() => (cancelledCount += 1));
        component.isVisibleChange.subscribe((value) => visibility.push(value));

        host.querySelector<HTMLButtonElement>('.modal-close-btn')?.click();

        expect(cancelledCount).toBe(1);
        expect(visibility).toEqual([false]);
    });

    it('does not emit submitted while the form is disabled or the modal is loading', () => {
        const host = open();
        let submittedCount = 0;
        component.submitted.subscribe(() => (submittedCount += 1));
        const button = host.querySelector<HTMLButtonElement>('.modal-submit-btn');

        component.disableSubmit = true;
        fixture.detectChanges();
        button?.click();

        component.disableSubmit = false;
        component.isLoading = true;
        fixture.detectChanges();
        button?.click();

        expect(submittedCount).toBe(0);
    });

    it('does not close while loading', () => {
        const host = open();
        let cancelledCount = 0;
        component.cancelled.subscribe(() => (cancelledCount += 1));
        component.isLoading = true;
        fixture.detectChanges();

        host.querySelector<HTMLButtonElement>('.modal-close-btn')?.click();

        expect(cancelledCount).toBe(0);
        expect(component.isVisible).toBe(true);
    });

    it('closes on the cancel button', () => {
        const host = open();
        let cancelledCount = 0;
        component.cancelled.subscribe(() => (cancelledCount += 1));

        host.querySelector<HTMLButtonElement>('.modal-cancel-btn')?.click();

        expect(cancelledCount).toBe(1);
        expect(component.isVisible).toBe(false);
    });
});
