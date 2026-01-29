import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Tag } from 'primeng/tag';
import { PopoverModule } from 'primeng/popover';
import { Tooltip, TooltipModule } from 'primeng/tooltip';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { filter, finalize, map, Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { getDtoNameById } from '../../app/relationships/reationshipConfig';

import { ISupplier, SupplierDto } from '../../dto/Supplier.dto';
import { SupplierService } from '../../services/Supplier.service';
import { CreateUpdateSupplier } from './create-update-supplier/create-update-supplier';
import { roleConfig } from '../../app/access-control/roleConfig';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  standalone: true,
  selector: 'app-Supplier',
  imports: [
    CommonModule,
    ToastModule,
    IconField,
    InputIcon,
    ButtonModule,
    TableModule,
    TooltipModule,
    PopoverModule,
    Tag,
    OverlayBadgeModule,
    AvatarModule,
    DividerModule,
    InputTextModule,
    ConfirmDialog,
    Tooltip,
  ],
  templateUrl: './Supplier.component.html',
  host: {
    class: 'h-full flex-1 flex flex-col overflow-hidden border border-surface rounded-2xl p-6',
  },
  styleUrl: '././Supplier.component.scss',
  providers: [ConfirmationService, MessageService, DialogService, SupplierService],
})
export class SupplierComponent implements OnInit, OnDestroy {
  first = 0;
  rows = 10;
  totalRecords = 0;
  currentPage = 1;
  
  selectedRows: any = [];
  @ViewChild('dt') dt!: Table;
  SupplierData: SupplierDto[] = [];
  isDataLoading: boolean = false;
  canUpdate: boolean = true;
  canDelete: boolean = true;
  roleConfig = roleConfig;
  private subscription: Subscription = new Subscription();
  searchTerm: string = '';
  private searchTerms = new Subject<string>();

  dtoName: string | undefined = 'Supplier';

  constructor(
    private route: ActivatedRoute,
    private supplierService: SupplierService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.searchTerms
        .pipe(
          debounceTime(400), 
          distinctUntilChanged() 
        )
        .subscribe(term => {
          this.searchTerm = term;
          this.currentPage = 1;
          this.first = 0;
          this.loadSuppliersWithPagination();
        })
    );

    this.loadSuppliersWithPagination();
  }
  
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerms.next(filterValue);
  }

  loadSuppliersWithPagination() {
    this.isDataLoading = true;
    
    const params: any = {
      page: this.currentPage.toString(),
      size: this.rows.toString(),
    };
    
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      params.searchkeyword = this.searchTerm;
    }
    
    this.subscription.add(
      this.supplierService.findAllSupplierPaginated(params)
        .pipe(
          filter((res: HttpResponse<{ count: number; suppliers: SupplierDto[] }>) => res.ok),
          map((res: HttpResponse<{ count: number; suppliers: SupplierDto[] }>) => res.body)
        )
        .subscribe(
          (res: { count: number; suppliers: SupplierDto[] } | null) => {
            if (res != null) {
              this.SupplierData = res.suppliers;
              this.totalRecords = res.count;
            } else {
              this.SupplierData = [];
              this.totalRecords = 0;
            }
            this.isDataLoading = false;
          },
          (error: HttpErrorResponse) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: `Failed To Load Supplier data.`,
              life: 6000,
            });
            this.isDataLoading = false;
            console.error('Error loading Suppliers:', error);
          }
        )
    );
  }

  downloadFile() {
    this.supplierService.downloadFile().subscribe(
      (response: HttpResponse<Blob>) => {
        const contentDispositionHeader: string | null = response.headers.get('content-disposition');
        const filename: string = this.getFilenameFromContentDisposition(contentDispositionHeader);

        if (response.body) {
          const blobUrl: string = window.URL.createObjectURL(response.body);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.href = blobUrl;
          a.download = filename;
          a.click();

          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(a);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Download Successfull',
          detail: ` Excel successfully downloaded.`,
          life: 3000,
        });
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Download Failed',
          detail: ` Failed to download excel.`,
          life: 3000,
        });
      }
    );
  }

  private getFilenameFromContentDisposition(header: string | null): string {
    const today = new Date();
    const date = today.toISOString().slice(0, 10);

    if (!header) {
      return 'Suppliers_' + date + '.csv';
    }
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(header);
    if (!matches || !matches[1]) {
      return 'Suppliers_' + date + '.csv';
    }
    return matches[1].replace(/['"]/g, '');
  }

  uploadFile(event: any) {
    const file: File = event.target.files[0];
    const formData: FormData = new FormData();
    formData.append('file', file);

    this.supplierService.uploadFile(formData).subscribe(
      (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Upload Successful',
          detail: `File "${file.name}" successfully uploaded.`,
          life: 3000,
        });
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: `Failed to upload file "${file.name}".`,
          life: 3000,
        });
      }
    );
  }

  showCreateSupplierDialog() {
    const ref = this.dialogService.open(CreateUpdateSupplier, {
      header: 'Create Supplier',
      width: '60%',
      closable: true,
      modal: true,
    });
    ref.onClose.subscribe(() => {
      this.loadSuppliersWithPagination();
    });
  }

  showEditSupplierDialog(Supplier: SupplierDto) {
    const ref = this.dialogService.open(CreateUpdateSupplier, {
      data: Supplier,
      header: 'Update Supplier',
      width: '60%',
      closable: true,
      modal: true,
    });
    ref.onClose.subscribe(() => {
      this.loadSuppliersWithPagination();
    });
  }

  deleteSupplier(Supplier: SupplierDto) {
    this.confirmationService.confirm({
      header: 'Are you sure ?',
      message: 'Please confirm to proceed.',
      accept: () => {
        this.ConfirmDeleteSupplier(Supplier);
        this.messageService.add({
          severity: 'error',
          summary: 'Deleted',
          detail: 'You have deleted ',
        });
      },
    });
  }

  ConfirmDeleteSupplier(Supplier: SupplierDto) {
    this.SupplierData = this.SupplierData.filter((val) => val.SupplierId !== Supplier.SupplierId);
    this.subscription.add(
      this.supplierService
        .deleteSupplier({ supplierId: Supplier.SupplierId })
        .subscribe(() => {
          if (this.SupplierData.length === 0 && this.currentPage > 1) {
            this.prev();
          } else {
            this.loadSuppliersWithPagination();
          }
        })
    );
  }

  hasAccess(dtoId: string, accessType: string): boolean {
    const roleName = localStorage.getItem('roleName');
    if (roleName !== null) {
      const rolePermissions = roleConfig[roleName];
      if (rolePermissions && rolePermissions[dtoId]) {
        if (rolePermissions[dtoId]?.includes(accessType)) {
          return true;
        } else {
          if (accessType == 'DELETE') {
            this.canDelete = false;
          }
          if (accessType == 'UPDATE') {
            this.canUpdate = false;
          }
        }
      }
    }
    return false;
  }

  reloadState() {
    this.currentPage = 1;
    this.first = 0;
    this.loadSuppliersWithPagination();
  }

  next() {
    this.first = this.first + this.rows;
    this.currentPage++;
    this.loadSuppliersWithPagination();
  }

  prev() {
    this.first = this.first - this.rows;
    this.currentPage--;
    this.loadSuppliersWithPagination();
  }

  pageChange(event: { first: number; rows: number }) {
    this.first = event.first;
    this.rows = event.rows;
    this.currentPage = Math.floor(this.first / this.rows) + 1;
    this.loadSuppliersWithPagination();
  }

  isLastPage(): boolean {
    return this.totalRecords > 0 ? this.first + this.rows >= this.totalRecords : true;
  }

  isFirstPage(): boolean {
    return this.first === 0;
  }

  get displayCurrentPage(): number {
    return this.currentPage;
  }

  get totalPages(): number {
    return this.totalRecords > 0 ? Math.ceil(this.totalRecords / this.rows) : 0;
  }
  
  
  viewSupplier(supplier: SupplierDto) {
    this.isDataLoading = true;
    
    this.subscription.add(
      this.supplierService
        .findSupplier({ supplierId: supplier.SupplierId })
        .pipe(
          finalize(() => {
            this.isDataLoading = false;
          })
        )
        .subscribe(
          (response) => {
            const fullSupplierData = (response as HttpResponse<ISupplier>).body || supplier;
            this.dialogService.open(CreateUpdateSupplier, {
              data: { ...fullSupplierData, readonly: true },
              header: 'View Supplier',
              width: '70%',
              closable: true,
              modal: true,
            });
          },
          (error) => {
            this.dialogService.open(CreateUpdateSupplier, {
              data: { ...supplier, readonly: true },
              header: 'View Supplier',
              width: '70%',
              closable: true,
              modal: true,
            });
            
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: 'Could not fetch complete Supplier details',
              life: 3000,
            });
          }
        )
    );
  }
}