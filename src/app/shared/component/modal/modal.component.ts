import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent implements OnChanges, AfterViewInit {
  @Input() isVisible: boolean = false;
  @Input() title: string = 'عنوان مودال';
  @Input() titleAccent?: string;
  @Input() submitButtonText: string = 'ذخیره';
  @Input() submitButtonIcon?: string; // مثلا 'save' یا SVG path
  @Input() cancelButtonText: string = 'انصراف';
  @Input() hideFooter: boolean = false;
  @Input() hideCancelButton: boolean = false;
  @Input() hideSubmitButton: boolean = false;
  @Input() disableSubmit: boolean = false;
  @Input() isLoading: boolean = false; // برای نمایش اسپینر روی دکمه تایید
  @Input() maxWidth: string = '700px'; // امکان تنظیم حداکثر عرض مودال

  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() submit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('modalContent') modalContent!: ElementRef;
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  private isBrowser: boolean;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

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
    this.cancel.emit();
  }

  onSubmit(): void {
    if (this.disableSubmit || this.isLoading) return;
    this.submit.emit();
  }

  // بستن مودال با کلیک روی پس‌زمینه
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }
}