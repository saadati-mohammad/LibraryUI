import { Component, DestroyRef, inject, Input, OnDestroy, OnInit, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { TableColumn, ListComponent } from '../../shared/component/list/list.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ModalComponent } from '../../shared/component/modal/modal.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PersonModel, PersonFilterModel } from '../../core/model/personModel';
import { PersonService } from '../../core/service/person.service';
import { ImageLoaderService } from '../../core/service/image-loader.service';
import { PaginatedResponse } from '../../core/model/paginated-response.model';
import { notFutureDate } from '../../core/util/date.util';
import { downloadUrl, EXCEL_FILE_RULES, IMAGE_FILE_RULES, storedImageToFile } from '../../shared/util/file.util';
import { ConfirmationService } from '../../shared/service/confirmation.service';
import { DateInputComponent } from '../../shared/component/date-input/date-input.component';
import { FilePickerComponent } from '../../shared/component/file-picker/file-picker.component';
import { PagedFilterPage } from '../../shared/component/paged-filter-page';

export enum FormOperation {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  VIEW = 'VIEW' // اضافه کردن حالت مشاهده
}

/** ISO date of today — the upper bound of the birth-date field. */
function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

@Component({
  selector: 'app-person',
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatIconModule, MatButtonModule, MatTooltipModule,
    MatMenuModule, MatProgressSpinnerModule, MatExpansionModule, MatCheckboxModule,
    MatSlideToggleModule, MatCardModule, MatSnackBarModule, ListComponent, ModalComponent,
    DateInputComponent, FilePickerComponent,
  ],
  templateUrl: './person.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./person.component.css'],
})
export class PersonComponent extends PagedFilterPage<PersonModel> implements OnInit, OnDestroy {
  @Input() isSlaveMode = false;

  tableTitle = 'لیست اعضا';
  columns: TableColumn[] = [];

  isPersonModalVisible = false;
  personForm: FormGroup;
  isSubmitting = false;
  /** Persian message emitted by the picture picker (type/size rejection). */
  fileError: string | null = null;
  currentPictureUrl: string | null = null;

  /** Upper bound for the birth-date control. */
  readonly today = todayIso();
  readonly imageRules = IMAGE_FILE_RULES;
  readonly excelRules = EXCEL_FILE_RULES;

  currentFormOperation: FormOperation = FormOperation.ADD;
  private currentEditingPersonId: number | null = null;
  /** Whether the record being edited has a stored picture (`hasPicture`). */
  hasStoredPicture = false;
  /** Set only when the operator cleared the picker of a member who had a picture. */
  private pictureRemovalArmed = false;
  private pictureRemovalSubscription?: Subscription;

  override pageSizeOptions: number[] = [5, 10, 25, 50, 100];

  personFiltersForm: FormGroup;
  filterPanelOpenState = false;

  isExcelImportModalVisible = false;
  isImporting = false;
  importError: string | null = null;
  readonly excelImportForm: FormGroup;

  private readonly destroyRef = inject(DestroyRef);

  private fb = inject(FormBuilder);
  private personService = inject(PersonService);
  private imageLoader = inject(ImageLoaderService);
  private snackBar = inject(MatSnackBar);
  private confirmation = inject(ConfirmationService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    super();
    this.personForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      nationalId: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      phone: [''],
      birthDate: [null, [notFutureDate]],
      membershipType: [''],
      address: [''],
      notes: [''],
      active: [true, Validators.required],
      /**
       * Held in the form so `<app-file-picker formControlName="profilePicture">` can clear
       * it (`null` = "delete the stored picture"). Stripped from the JSON before submit.
       */
      profilePicture: [null as File | null],
    });

    this.personFiltersForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      nationalId: [''],
      membershipType: [''],
      // Defaults to "فعال": a soft-deleted member disappears from the list as operators
      // expect, while "همه" and "غیرفعال" stay one click away.
      active: [true],
    });

    this.excelImportForm = this.fb.group({
      excelFile: [null as File | null],
    });
  }

  ngOnInit(): void {
    this.setupTableColumns();
    this.loadPersons();

    this.watchFilters(this.personFiltersForm);
  }

  ngOnDestroy(): void {
    this.pictureRemovalSubscription?.unsubscribe();
    // Release the object URLs for every picture this page loaded.
    [...this.imageLoader.pictures.keys()].forEach((id) => this.imageLoader.forget('picture', id));
  }

  setupTableColumns(): void {
    this.columns = [
      {
        columnDef: 'profilePicture',
        header: 'عکس',
        isImageColumn: true,
        // The DTO never carried the bytes; the picture is served by
        // GET /api/person/{id}/picture and cached by `ImageLoaderService`. `hasPicture`
        // gates the request so a member without a photo costs no round trip.
        imageSrc: (element: PersonModel) =>
          element.hasPicture && element.id !== undefined
            ? this.imageLoader.getCached('picture', element.id)
            : null,
        defaultImage: './assets/pics/default-pic.png', // تصویر پیش‌فرض مخصوص پروفایل
        cell: (element: PersonModel) => `پروفایل ${element.firstName} ${element.lastName}` // برای متن alt
      },
      { columnDef: 'fullName', header: 'نام و نام خانوادگی', cell: (el: PersonModel) => `${el.firstName} ${el.lastName}`, cellClass: () => 'emphasize' },
      { columnDef: 'nationalId', header: 'کد ملی', cell: (el: PersonModel) => el.nationalId || '---' },
      { columnDef: 'email', header: 'ایمیل', cell: (el: PersonModel) => el.email || '---' },
      { columnDef: 'phone', header: 'تلفن', cell: (el: PersonModel) => el.phone || '---' },
      { columnDef: 'membershipType', header: 'نوع عضویت', cell: (el: PersonModel) => el.membershipType || '---' },
      { columnDef: 'active', header: 'وضعیت', cell: (el: PersonModel) => el.active ? `<span class="status-badge status-active">فعال</span>` : `<span class="status-badge status-inactive">غیرفعال</span>` }
    ];
  }

  loadPersons(): void {
    this.isLoadingTable = true;
    const filters: PersonFilterModel = this.personFiltersForm.value;

    this.personService.getPersonList(filters, this.currentPage, this.pageSize, 'id,desc')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: PaginatedResponse<PersonModel>) => {
          this.data = response.content;
          this.totalElements = response.totalElements;
          this.isLoadingTable = false;
          // Pictures are not part of the DTO: fetch the ones this page actually has.
          this.imageLoader.preloadPictures(
            this.data.filter((person) => person.hasPicture && person.id !== undefined).map((person) => person.id as number),
          );
        },
        error: (err) => {
          console.error('Error loading persons:', err);
          if (isPlatformBrowser(this.platformId)) {
            this.snackBar.open('خطا در بارگذاری لیست اعضا.', 'بستن', { duration: 5000, direction: 'rtl' });
          }
          this.isLoadingTable = false;
        }
      });
  }

  protected override reloadPage(): void { this.loadPersons(); }

  applyFilters(): void {
    this.resetPageAndReload();
    this.filterPanelOpenState = false;
  }

  resetFilters(): void {
    this.personFiltersForm.reset({ active: true });
    this.resetPageAndReload();
  }

  openPersonModal(operation: FormOperation, person?: PersonModel): void {
    this.personForm.enable();
    this.currentFormOperation = operation;
    this.personForm.reset({ active: true, profilePicture: null });
    this.resetFileState();

    if ((operation === FormOperation.UPDATE || operation === FormOperation.VIEW) && person) {
      this.currentEditingPersonId = person.id ?? null;
      const { profilePicture, ...personDetails } = person;
      this.personForm.patchValue(personDetails);
      // Pre-fill the picker only when the API handed back a real File or decodable base64.
      // A plain URL cannot be rebuilt into a File, and treating that failure as "cleared"
      // is exactly the bug that silently deleted members' pictures.
      this.personForm.patchValue({ profilePicture: this.pictureToFile(profilePicture) });

      // The authoritative "this record has a picture" signal is the DTO flag (the bytes
      // are deliberately not serialised).
      this.hasStoredPicture = person.hasPicture === true || profilePicture != null;

      if (profilePicture) {
        try {
          // اگر رشته است
          if (typeof profilePicture === 'string') {
            const isBase64 = profilePicture.startsWith('data:image') || profilePicture.length > 100;
            this.currentPictureUrl = isBase64
              ? profilePicture.startsWith('data:image')
                ? profilePicture
                : `data:image/jpeg;base64,${profilePicture}`
              : profilePicture; // URL ساده

            // اگر آرایه بایت است
          } else if (Array.isArray(profilePicture) || profilePicture instanceof Uint8Array) {
            const byteArray = new Uint8Array(profilePicture as ArrayLike<number>);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            const reader = new FileReader();

            reader.onload = () => {
              this.currentPictureUrl = reader.result as string;
            };

            reader.readAsDataURL(blob);
          }

        } catch (error) {
          console.error('❌ خطا در تبدیل عکس پروفایل:', error);
          this.currentPictureUrl = null;
        }
      }
      if (operation === FormOperation.VIEW) {
        this.personForm.disable();
      }
    }

    // Track removal from the form control: armed only when the operator cleared the picker
    // of a member who HAS a stored picture. Merely opening the modal never arms a deletion.
    this.pictureRemovalArmed = false;
    this.pictureRemovalSubscription?.unsubscribe();
    this.pictureRemovalSubscription = this.personForm
      .get('profilePicture')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.pictureRemovalArmed = this.hasStoredPicture && value === null;
      });

    this.isPersonModalVisible = true;
  }

  /**
   * URL for the stored-picture preview in the modal: the fetched object URL, or a legacy
   * inline URL/base64 value. Hidden while a removal is pending or a new file is selected
   * (the picker previews that one itself).
   */
  get picturePreviewUrl(): string | null {
    if (this.pictureRemovalArmed || this.personForm?.get('profilePicture')?.value instanceof File) {
      return null;
    }
    const id = this.currentEditingPersonId;
    const fromLoader = id !== null && this.hasStoredPicture
      ? this.imageLoader.getCached('picture', id)
      : null;
    return fromLoader ?? this.currentPictureUrl;
  }

  /**
   * Rebuilds the editable `File` for a stored picture, or null when there is none.
   *
   * A `File` is returned as-is; a `data:` URL / bare base64 blob is decoded; a plain URL
   * yields null. Null here means "nothing to pre-fill", **not** "delete the picture" —
   * removal is only ever armed by an explicit clear (see {@link shouldRemovePicture}).
   */
  private pictureToFile(picture: PersonModel['profilePicture']): File | null {
    return storedImageToFile(picture, 'profile.jpg');
  }

  onPersonModalClose(): void {
    this.isPersonModalVisible = false;
  }

  onPersonSubmit(): void {
    if (this.personForm.invalid) {
      this.personForm.markAllAsTouched();
      if (isPlatformBrowser(this.platformId)) {
        this.snackBar.open('لطفاً تمامی فیلدهای ضروری را به درستی پر کنید.', 'بستن', { duration: 3000, direction: 'rtl' });
      }
      return;
    }

    this.isSubmitting = true;

    // Strip the file control from the JSON DTO; the binary (or its deletion) travels in
    // the multipart part / the entity's explicit `profilePicture: null`.
    const rawFormValue = this.personForm.getRawValue() as PersonModel & { profilePicture: File | null };
    const { profilePicture, ...personFields } = rawFormValue;
    const personData: PersonModel = {
      ...personFields,
      // `''` is not a valid LocalDate; the API expects null/absent for "no date".
      birthDate: personFields.birthDate || null,
    };

    let pictureToSend: File | null | undefined = undefined;
    if (this.shouldRemovePicture) {
      pictureToSend = null;
    } else if (profilePicture instanceof File) {
      pictureToSend = profilePicture;
    }

    const serviceCall = this.currentFormOperation === FormOperation.ADD
      ? this.personService.addPerson(personData, pictureToSend ?? undefined)
      : this.personService.updatePerson(this.currentEditingPersonId!, personData, pictureToSend);

    const successMessage = this.currentFormOperation === FormOperation.ADD ? 'عضو با موفقیت اضافه شد!' : 'عضو با موفقیت بروزرسانی شد!';

    serviceCall.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(successMessage, 'بستن', { duration: 3000, direction: 'rtl' });
        }
        // The stored bytes changed (or were deleted): drop the cached object URL so the
        // list re-reads instead of showing a stale picture.
        this.imageLoader.forget('picture', this.currentEditingPersonId);
        this.isSubmitting = false;
        this.isPersonModalVisible = false;
        this.loadPersons();
      },
      error: (error) => {
        console.error('Error submitting person:', error);
        const backendError = error?.error?.message || error?.error?.title || error?.message || 'خطا در ثبت اطلاعات.';
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(`خطا: ${backendError} لطفاً دوباره تلاش کنید.`, 'بستن', { duration: 5000, direction: 'rtl' });
        }
        this.isSubmitting = false;
      }
    });
  }

  /** Mirrors the picker's validation message (the picker does the type/size check). */
  onPictureValidationError(message: string | null): void {
    this.fileError = message;
  }

  /** A newly selected picture cancels any pending removal. */
  onPictureFileChange(): void {
    this.fileError = null;
  }

  /**
   * True only while the operator has actually cleared the picture of a member who had
   * one.
   *
   * This used to be a plain flag that `openPersonModal` set through `resetFileState()`,
   * so **opening the edit modal and saving silently deleted the member's picture**. It is
   * now derived from the form control, so merely opening the modal can never arm removal.
   */
  get shouldRemovePicture(): boolean {
    return (
      this.currentFormOperation === FormOperation.UPDATE &&
      this.currentEditingPersonId !== null &&
      this.pictureRemovalArmed
    );
  }

  private resetFileState(): void {
    this.currentPictureUrl = null;
    this.fileError = null;
    this.hasStoredPicture = false;
  }

  async deactivatePerson(person: PersonModel): Promise<void> {
    if (!person.id) return;
    const confirmed = await this.confirmation.confirm({
      title: 'غیرفعال‌سازی عضو',
      message: `آیا از غیرفعال سازی عضو "${person.firstName} ${person.lastName}" مطمئن هستید؟`,
      confirmLabel: 'غیرفعال‌سازی',
    });
    if (!confirmed) {
      return;
    }
    this.personService.deactivatePerson(person.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open(`عضو "${person.firstName} ${person.lastName}" با موفقیت غیرفعال شد.`, 'بستن', { duration: 3000, direction: 'rtl' });
        this.loadPersons();
      },
      error: (err) => {
        const backendError = err?.error?.message || 'خطا در غیرفعال سازی عضو.';
        this.snackBar.open(backendError, 'بستن', { duration: 5000, direction: 'rtl' });
        console.error(err);
      }
    });
  }

  // --- Excel Import Methods ---
  openExcelImportModal(): void {
    this.isExcelImportModalVisible = true;
    this.excelImportForm.reset({ excelFile: null });
    this.importError = null;
    this.isImporting = false;
  }

  onExcelImportModalClose(): void {
    this.isExcelImportModalVisible = false;
  }

  /** Excel picker validation message (wrong extension or too large). */
  onExcelValidationError(message: string | null): void {
    this.importError = message;
  }

  onExcelImportSubmit(): void {
    const excelFile = this.excelImportForm.get('excelFile')?.value as File | null;
    if (!excelFile) {
      this.importError = 'لطفاً ابتدا یک فایل را انتخاب کنید.';
      return;
    }
    this.isImporting = true;
    this.personService.importPersonsFromExcel(excelFile).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isImporting = false;
        this.isExcelImportModalVisible = false;
        this.excelImportForm.reset({ excelFile: null });
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open('فایل اکسل اعضا با موفقیت بارگذاری شد.', 'بستن', { duration: 5000, direction: 'rtl' });
        }
        this.loadPersons();
      },
      error: (err) => {
        this.isImporting = false;
        // The backend now returns a JSON envelope, so `err.error` is an object.
        const message = err.error?.message || 'خطا در بارگذاری فایل.';
        this.snackBar.open(message, 'بستن', { duration: 5000, direction: 'rtl' });
        this.importError = message;
        console.error(err);
      }
    });
  }

  downloadExcelTemplate(): void {
    downloadUrl('./assets/excel/person-import-template.xlsx', 'person-import-template.xlsx', this.platformId);
  }

  get FormOperationEnum() {
    return FormOperation;
  }
}
