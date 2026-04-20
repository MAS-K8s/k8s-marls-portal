import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { filter, map, Subscription } from 'rxjs';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';

import { IOrganization, OrganizationDto } from '../../dto/Organization.dto';
import { OrganizationService } from '../../services/Organization.service';
import { roleConfig } from '../../app/access-control/roleConfig';
import { UserComponent } from '../User/User.component';
import { RoleComponent } from '../Role/Role.component';

interface Currency {
  name: string;
  code: string;
  symbol: string;
}

@Component({
  standalone: true,
  selector: 'app-organization',
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    ConfirmDialog,
    SkeletonModule,
    TabViewModule,
    DropdownModule,
    UserComponent,
    RoleComponent,
  ],
  templateUrl: './Organization.component.html',
  host: {
    class:
      'h-full flex-1 flex flex-col overflow-hidden border border-surface rounded-2xl p-6',
  },
  providers: [ConfirmationService, MessageService, OrganizationService],
})
export class OrganizationComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  organizationData: OrganizationDto = new OrganizationDto();
  isEditing: boolean = false;
  isLoading: boolean = false;
  uploadingLogo: boolean = false;
  roleConfig = roleConfig;
  activeTabIndex: number = 0;
  private subscription: Subscription = new Subscription();

  // Currency options
  currencies: Currency[] = [
    { name: 'Sri Lankan Rupee', code: 'LKR', symbol: 'Rs' },
    { name: 'US Dollar', code: 'USD', symbol: '$' },
    { name: 'Euro', code: 'EUR', symbol: '€' },
    { name: 'British Pound', code: 'GBP', symbol: '£' },
    { name: 'Japanese Yen', code: 'JPY', symbol: '¥' },
    { name: 'Canadian Dollar', code: 'CAD', symbol: 'CA$' },
    { name: 'Australian Dollar', code: 'AUD', symbol: 'A$' },
    { name: 'Swiss Franc', code: 'CHF', symbol: 'CHF' },
    { name: 'Chinese Yuan', code: 'CNY', symbol: '¥' },
    { name: 'Indian Rupee', code: 'INR', symbol: '₹' },
  ];

  constructor(
    private organizationService: OrganizationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadOrganizationInformation();
  }

  loadOrganizationInformation() {
    this.isLoading = true;
    this.subscription.add(
      this.organizationService
        .findAllOrganization({})
        .pipe(
          filter((res) => res.ok),
          map((res) => res.body)
        )
        .subscribe(
          (res: IOrganization[] | null) => {
            if (res && res.length > 0) {
              this.organizationData = res[0];
              // If currency is saved in the organization data, update local storage
              if (this.organizationData.Currency) {
                this.updateCurrencyInLocalStorage(this.organizationData.Currency);
              } else {
                // If no currency is set in organization data, get from local storage
                const savedCurrency = localStorage.getItem('selectedCurrency');
                if (savedCurrency) {
                  this.organizationData.Currency = savedCurrency;
                } else {
                  // Default to USD if no currency is set
                  this.organizationData.Currency = 'USD';
                  this.updateCurrencyInLocalStorage('USD');
                }
              }
            }
            setTimeout(() => {
              this.isLoading = false;
            }, 1000);
          },
          (error: HttpErrorResponse) => {
            this.isLoading = false;
          }
        )
    );
  }

  onEdit() {
    this.isEditing = true;
  }

  onCancel() {
    this.loadOrganizationInformation();
    this.isEditing = false;
  }

  onSave() {
    this.isLoading = true;
    
    // Save the selected currency to local storage
    if (this.organizationData.Currency) {
      this.updateCurrencyInLocalStorage(this.organizationData.Currency);
    }
    
    const operation = this.organizationData.OrganizationId
      ? this.organizationService.updateOrganization(this.organizationData)
      : this.organizationService.createOrganization(this.organizationData);

    this.subscription.add(
      operation.subscribe(
        (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Organization information saved successfully',
            life: 3000,
          });
          this.isEditing = false;
          this.isLoading = false;
          this.loadOrganizationInformation();
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save organization information',
            life: 3000,
          });
          this.isLoading = false;
        }
      )
    );
  }

  updateCurrencyInLocalStorage(currencyCode: string) {
    localStorage.setItem('selectedCurrency', currencyCode);
    const currencyObj = this.currencies.find(c => c.code === currencyCode);
    if (currencyObj) {
      localStorage.setItem('currencySymbol', currencyObj.symbol);
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'File size must not exceed 10MB',
          life: 3000,
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      this.uploadingLogo = true;

      this.subscription.add(
        this.organizationService.fileUpload(formData).subscribe(
          (response) => {
            this.uploadingLogo = false;

            let imageUrl = '';

            if (typeof response.body === 'string') {
              imageUrl = response.body;
            } else if (response.body && response.body.filePath) {
              imageUrl = response.body.filePath;
            } else if (response.body) {
              const bodyStr = JSON.stringify(response.body);
              const urlMatch = bodyStr.match(
                /(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif))/i
              );
              if (urlMatch && urlMatch[0]) {
                imageUrl = urlMatch[0];
              }
            }

            if (imageUrl) {

              if (imageUrl.startsWith('"') && imageUrl.endsWith('"')) {
                imageUrl = imageUrl.substring(1, imageUrl.length - 1);
              }

              const testImg = new Image();
              testImg.onload = () => {

                this.organizationData.CompanyLogo = imageUrl;

                this.organizationData = { ...this.organizationData };
              };

              testImg.onerror = () => {
                console.error('Failed to load image from URL:', imageUrl);
                this.messageService.add({
                  severity: 'warning',
                  summary: 'Warning',
                  detail:
                    'Logo uploaded but cannot be displayed. URL may be inaccessible.',
                  life: 5000,
                });

                this.organizationData.CompanyLogo = imageUrl;

                this.organizationData = { ...this.organizationData };
              };

              testImg.src = imageUrl;

              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Logo uploaded successfully',
                life: 3000,
              });
            } else {
              console.error('Upload response:', response.body);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Invalid upload response format',
                life: 3000,
              });
            }
          },
          (error) => {
            this.uploadingLogo = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail:
                'Failed to upload logo: ' + (error.message || 'Unknown error'),
              life: 3000,
            });
          }
        )
      );
    }
  }

  hasAccess(dtoId: string, accessType: string): boolean {
    const roleName = localStorage.getItem('roleName');
    if (roleName !== null) {
      const rolePermissions = roleConfig[roleName];
      if (rolePermissions && rolePermissions[dtoId]) {
        return rolePermissions[dtoId]?.includes(accessType) || false;
      }
    }
    return false;
  }

  getFormattedLines(text: string | undefined): string[] {
    if (!text) return [];

    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}