import { Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { TableColumn, ActionButtonConfig, ListComponent } from '../../shared/component/list/list.component';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, Subject, debounceTime, distinctUntilChanged, tap, Observable } from 'rxjs';
import { PersonModel, PersonFilterModel } from '../../core/model/personModel';
import { PaginatedResponse, PersonService } from '../../core/service/person.service';

export enum FormOperation {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  VIEW = 'VIEW' // اضافه کردن حالت مشاهده
}

@Component({
  selector: 'app-person',
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatIconModule, MatButtonModule, MatTooltipModule,
    MatMenuModule, MatProgressSpinnerModule, MatExpansionModule, MatCheckboxModule,
    MatCardModule, MatSnackBarModule, ListComponent, ModalComponent
  ],
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.css'],
})
export class PersonComponent implements OnInit, OnDestroy {
  @Input() isSlaveMode = false;

  tableTitle = 'لیست اعضا';
  columns: TableColumn[] = [];
  data: PersonModel[] = [];

  isPersonModalVisible = false;
  personForm: FormGroup;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  isSubmitting: boolean = false;
  fileError: string | null = null;
  currentPictureUrl: string | null = null;
  shouldRemovePicture: boolean = false;

  currentFormOperation: FormOperation = FormOperation.ADD;
  private currentEditingPersonId: number | null = null;

  isLoadingTable: boolean = false;
  totalElements: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];

  personFiltersForm: FormGroup;
  private filterSubscription!: Subscription;
  filterPanelOpenState = false;

  isExcelImportModalVisible = false;
  excelFile: File | null = null;
  excelFileName: string | null = null;
  isImporting: boolean = false;
  importError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private personService: PersonService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.personForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      nationalId: ['', Validators.required],
      phone: [''],
      birthDate: [null],
      membershipType: [''],
      address: [''],
      notes: [''],
      active: [true, Validators.required],
    });

    this.personFiltersForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      nationalId: [''],
      membershipType: [''],
      active: [null], // null: all, true: active, false: inactive
    });
  }

  ngOnInit(): void {
    this.setupTableColumns();
    this.loadPersons();

    this.filterSubscription = this.personFiltersForm.valueChanges.pipe(
      debounceTime(700),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => this.currentPage = 0),
    ).subscribe(() => {
      this.loadPersons();
    });
  }

  ngOnDestroy(): void {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  setupTableColumns(): void {
    this.columns = [
      {
        columnDef: 'profilePicture',
        header: 'عکس',
        isImageColumn: true,
        imageSrc: (element: PersonModel) => element.profilePicture,
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

    this.personService.getPersonList(filters, this.currentPage, this.pageSize, 'id,desc').subscribe({
      next: (response: PaginatedResponse<PersonModel>) => {
        this.data = response.content;
        this.totalElements = response.totalElements;
        this.isLoadingTable = false;
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

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPersons();
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadPersons();
    this.filterPanelOpenState = false;
  }

  resetFilters(): void {
    this.personFiltersForm.reset({ active: null });
    this.currentPage = 0;
    this.loadPersons();
  }

  openPersonModal(operation: FormOperation, person?: PersonModel): void {
    this.personForm.enable();
    this.currentFormOperation = operation;
    this.personForm.reset({ active: true });
    this.resetFileState();

    if ((operation === FormOperation.UPDATE || operation === FormOperation.VIEW) && person) {
      this.currentEditingPersonId = person.id ?? null;
      const { profilePicture, ...personDetails } = person;
      this.personForm.patchValue(personDetails);
      this.selectedFile = profilePicture instanceof File ? profilePicture : this.convertBinaryToFile(profilePicture, 'profile.jpg', 'image/jpeg');
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
            const byteArray = new Uint8Array(profilePicture as any);
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
    this.isPersonModalVisible = true;
  }

  convertBinaryToFile(binaryData: any, fileName: string, mimeType: string): File | null {
    // اگر ورودی از نوع رشته نباشد یا یک رشته خالی باشد، عملیات را متوقف کن
    if (typeof binaryData !== 'string' || binaryData.length === 0) {
      return null;
    }

    // اگر ورودی یک data URL بود (مثلا: data:image/jpeg;base64,...)، فقط بخش Base64 آن را جدا کن
    const base64String = binaryData.split(',')[1] || binaryData;

    try {
      const byteArray = new Uint8Array(atob(base64String).split("").map(char => char.charCodeAt(0)));
      const blob = new Blob([byteArray], { type: mimeType });
      const file = new File([blob], fileName, { type: mimeType });
      return file;
    } catch (e) {
      // این خطا زمانی که رشته ورودی Base64 نباشد (مثلا یک URL معمولی باشد) طبیعی است
      // در این حالت null برمی‌گردانیم چون فایلی ساخته نمی‌شود
      return null;
    }
  }

  onPersonModalClose(): void {
    this.isPersonModalVisible = false;
  }

  onPersonSubmit(): void {
    if (this.personForm.invalid) {
      this.personForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const personData: PersonModel = this.personForm.value;
    const serviceCall = this.currentFormOperation === FormOperation.ADD
      ? this.personService.addPerson(personData, this.selectedFile ?? undefined)
      : this.personService.updatePerson(this.currentEditingPersonId!, personData, this.shouldRemovePicture ? null : (this.selectedFile ?? undefined));

    const successMessage = this.currentFormOperation === FormOperation.ADD ? 'عضو با موفقیت اضافه شد!' : 'عضو با موفقیت بروزرسانی شد!';

    serviceCall.subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open(successMessage, 'بستن', { duration: 3000, direction: 'rtl' });
        }
        this.isSubmitting = false;
        this.isPersonModalVisible = false;
        this.loadPersons();
      },
      error: (error) => {
        console.error('Error submitting person:', error);
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open('خطا در ثبت اطلاعات. لطفاً دوباره تلاش کنید.', 'بستن', { duration: 5000, direction: 'rtl' });
        }
        this.isSubmitting = false;
      }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // ولیدیشن‌های فایل مشابه بخش کتاب
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.fileError = null;
      this.shouldRemovePicture = false;
      const reader = new FileReader();
      reader.onload = (e: any) => { this.currentPictureUrl = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedPicture(): void {
    this.resetFileState();
    this.shouldRemovePicture = true;
  }

  private resetFileState(): void {
    this.selectedFile = null;
    this.selectedFileName = null;
    this.currentPictureUrl = null;
    this.fileError = null;
    this.shouldRemovePicture = true;
  }

  deactivatePerson(person: PersonModel): void {
    if (!person.id) return;
    if (isPlatformBrowser(this.platformId)) {
      if (confirm(`آیا از غیرفعال سازی عضو "${person.firstName} ${person.lastName}" مطمئن هستید؟`)) {
        this.personService.deactivatePerson(person.id).subscribe({
          next: () => {
            this.snackBar.open('عضو با موفقیت غیرفعال شد.', 'بستن', { duration: 3000, direction: 'rtl' });
            this.loadPersons();
          },
          error: (err) => {
            this.snackBar.open('خطا در غیرفعال سازی عضو.', 'بستن', { duration: 5000, direction: 'rtl' });
            console.error(err);
          }
        });
      }
    }
  }

  // --- Excel Import Methods ---
  openExcelImportModal(): void {
    this.isExcelImportModalVisible = true;
    this.excelFile = null;
    this.excelFileName = null;
    this.importError = null;
    this.isImporting = false;
  }

  onExcelImportModalClose(): void {
    this.isExcelImportModalVisible = false;
  }

  onExcelFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.excelFile = input.files[0];
      this.excelFileName = this.excelFile.name;
      this.importError = null;
    }
  }

  onExcelImportSubmit(): void {
    if (!this.excelFile) return;
    this.isImporting = true;
    this.personService.importPersonsFromExcel(this.excelFile).subscribe({
      next: () => {
        this.isImporting = false;
        this.isExcelImportModalVisible = false;
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open('فایل اکسل اعضا با موفقیت بارگذاری شد.', 'بستن', { duration: 5000, direction: 'rtl' });
        }
        this.loadPersons();
      },
      error: (err) => {
        this.isImporting = false;
        this.snackBar.open(err.error, 'بستن', { duration: 5000, direction: 'rtl' });
        this.importError = err.error?.message || 'خطا در بارگذاری فایل.';
        console.error(err);
      }
    });
  }

  downloadExcelTemplate(): void {
    if (isPlatformBrowser(this.platformId)) {
      const link = document.createElement('a');
      link.href = './assets/excel/person-import-template.xlsx';
      link.download = 'person-import-template.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  get FormOperationEnum() {
    return FormOperation;
  }
}