import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Renderer2,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './modal.component.css'
})
export class ModalComponent implements OnChanges, AfterViewInit {
  @Input() isVisible = false;
  @Input() title = 'عنوان مودال';
  @Input() titleAccent?: string;
  @Input() submitButtonText = 'ذخیره';
  @Input() submitButtonIcon?: string; // مثلا 'save' یا SVG path
  @Input() cancelButtonText = 'انصراف';
  @Input() hideFooter = false;
  @Input() hideCancelButton = false;
  @Input() hideSubmitButton = false;
  @Input() disableSubmit = false;
  @Input() isLoading = false; // برای نمایش اسپینر روی دکمه تایید
  @Input() maxWidth = '700px'; // امکان تنظیم حداکثر عرض مودال

  @Output() isVisibleChange = new EventEmitter<boolean>();
  // Named `submitted`/`cancelled`, not `submit`/`cancel`: those are native DOM event names,
  // so `(submit)`/`(cancel)` bindings on <app-modal> would be ambiguous (and are rejected by
  // the Angular ESLint `no-output-native` rule).
  @Output() submitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('modalContent') modalContent!: ElementRef;
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  private readonly renderer = inject(Renderer2);
  private readonly el = inject(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isBrowser) {
      if (this.isVisible) {
        this.previouslyFocusedElement = document.activeElement as HTMLElement;
        this.renderer.addClass(document.body, 'modal-open');
        // Defer focus trapping to AfterViewInit or when modal content is fully ready
        setTimeout(() => this.trapFocus(), 0);
      } else {
        this.renderer.removeClass(document.body, 'modal-open');
        if (this.previouslyFocusedElement) {
          this.previouslyFocusedElement.focus();
          this.previouslyFocusedElement = null;
        }
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isVisible && this.isBrowser) {
       // Wait for content projection to be ready before trapping focus
      Promise.resolve().then(() => this.trapFocus());
    }
  }

  private trapFocus(): void {
    if (!this.isVisible || !this.modalContent || !this.isBrowser) return;

    const focusableElements = this.el.nativeElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    this.firstFocusableElement = focusableElements[0];
    this.lastFocusableElement = focusableElements[focusableElements.length - 1];

    this.firstFocusableElement.focus();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isVisible || !this.isBrowser) return;

    if (event.key === 'Escape') {
      this.closeModal();
    }

    if (event.key === 'Tab') {
      if (event.shiftKey) { // Shift + Tab
        if (document.activeElement === this.firstFocusableElement) {
          this.lastFocusableElement?.focus();
          event.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === this.lastFocusableElement) {
          this.firstFocusableElement?.focus();
          event.preventDefault();
        }
      }
    }
  }

  closeModal(): void {
    if (this.isLoading) return; // Don't close if loading
    this.isVisible = false;
    this.isVisibleChange.emit(false);
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.disableSubmit || this.isLoading) return;
    this.submitted.emit();
  }

  // بستن مودال با کلیک روی پس‌زمینه
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }
}