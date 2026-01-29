import { Component, OnInit, ViewChild } from '@angular/core';
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
import { filter, map, Subscription } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { getDtoNameById } from '../../app/relationships/reationshipConfig';

import {IRole,RoleDto} from '../../dto/Role.dto';
import {RoleService} from '../../services/Role.service';
import {CreateUpdateRole } from "./create-update-role/create-update-role";
import { roleConfig } from '../../app/access-control/roleConfig';

@Component({
  standalone: true,
  selector: 'app-Role',
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
    Tooltip
  ],
  templateUrl: './Role.component.html',
  host: {
    class: 'h-full flex-1 flex flex-col overflow-hidden border border-surface rounded-2xl p-6'
  },
  styleUrl: '././Role.component.scss',
  providers:[ConfirmationService, MessageService, DialogService, RoleService]
})
export class RoleComponent implements OnInit {
  first = 0;
  rows = 10;
  selectedRows: any = [];
  @ViewChild('dt') dt!: Table;
  RoleData: RoleDto[] = [];
  isDataLoading: boolean = false;
  canUpdate: boolean = true;
  canDelete: boolean = true;
  roleConfig=roleConfig
  private subscription: Subscription = new Subscription();

    
    dtoName :string | undefined = "Role"
    

    

  constructor(private route: ActivatedRoute, private roleService: RoleService, private messageService: MessageService, private confirmationService: ConfirmationService, private router: Router, private dialogService: DialogService) {
  }

  ngOnInit() {
    
      this.findAllRole({})
      this.isDataLoading = true;
    
  }

    
  

  downloadFile() {
    this.roleService.downloadFile().subscribe(
      (response: HttpResponse<Blob>) => {
        // Extract filename from content-disposition header
        const contentDispositionHeader: string | null =
          response.headers.get('content-disposition');
        const filename: string = this.getFilenameFromContentDisposition(
          contentDispositionHeader
        );

        if (response.body) {
          // Create URL for the blob data
          const blobUrl: string = window.URL.createObjectURL(
            response.body
          );
          // Create an anchor element and trigger download
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.href = blobUrl;
          a.download = filename;
          a.click();

          // Clean up
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
      return 'Products_' + date + '.csv';
    }
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(header);
    if (!matches || !matches[1]) {
      return 'Products_' + date + '.csv';
    }
    return matches[1].replace(/['"]/g, '');
  }

  uploadFile(event: any) {
    const file: File = event.target.files[0];
    const formData: FormData = new FormData();
    formData.append('file', file);

    this.roleService.uploadFile(formData).subscribe(
      (response) => {
        // Handle success
        this.messageService.add({
          severity: 'success',
          summary: 'Upload Successful',
          detail: `File "${file.name}" successfully uploaded.`,
          life: 3000,
        });
      },
      (error) => {
        // Handle error
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: `Failed to upload file "${file.name}".`,
          life: 3000,
        });
      }
    );
  }


      

    //--find all--
    findAllRole(params: any) {
    this.subscription.add(
                this.roleService.findAllRole(params).pipe(
                filter((res: HttpResponse<IRole[]>) => res.ok),
                map((res: HttpResponse<IRole[]>) => res.body)
            )
                .subscribe(
                    (res: IRole[] | null) => {
                        if (res != null) {
                            this.RoleData = res;
                        } else {
                            this.RoleData = [];
                        }
                        this.isDataLoading = false;
                    },

                    (res: HttpErrorResponse) => {
                      this.messageService.add({
                        severity: 'error',
                        summary: 'Failed',
                        detail: `Failed To Load all Role.`,
                        life: 6000
                    });
                      this.isDataLoading = false;
                      console.log("error in extracting all Role", res)
                  }
                )
            );
        }


    //dynamic dialog
    showCreateRoleDialog() {
        
                this.showCreateRoleDialogDefault()
        
    }


    
    //dynamic dialog
    showCreateRoleDialogDefault() {
        const ref = this.dialogService.open(CreateUpdateRole, {
            header: 'Create Role',
            width: '60%',
            closable: true,
            modal: true,
        })
        ref.onClose.subscribe(() => {
            this.findAllRole({})
        })
    }
    

    
    showEditRoleDialog(Role: RoleDto) {
        const ref = this.dialogService.open(CreateUpdateRole , {
            data: Role,
            header: 'Update Role',
            width: '60%',
            closable: true,
            modal: true,
        })
        ref.onClose.subscribe(() => {
            this.findAllRole({})
        })
    }
    

    //delete Role
    deleteRole(Role: RoleDto) {
      this.confirmationService.confirm({
          header: 'Are you sure ?',
          message: 'Please confirm to proceed.',
          accept: () => {
            this.ConfirmDeleteRole(Role)
            this.messageService.add({
                severity: 'error',
                summary: 'Deleted',
                detail: 'You have deleted ' 
            });
        },
      });
    }

    ConfirmDeleteRole(Role: RoleDto) {
    this.RoleData = this.RoleData.filter(val => val.RoleId !== Role.RoleId);
    this.subscription.add(
        this.roleService.deleteRole({ roleId: Role.RoleId }).subscribe(() => {
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
      this.isDataLoading = true
      this.findAllRole({});
  }
  

  onGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dt.filterGlobal(filterValue, 'contains');
  }

  next() {
    this.first = this.first + this.rows;
  }

  prev() {
    this.first = this.first - this.rows;
  }

  pageChange(event: { first: number; rows: number; }) {
    this.first = event.first;
    this.rows = event.rows;
  }

  isLastPage(): boolean {
    return this.dt?.totalRecords ? this.first + this.rows >= this.dt?.totalRecords : true;
  }

  isFirstPage(): boolean {
    return this.dt?.totalRecords ? this.first === 0 : true;
  }

  get currentPage(): number {
    return Math.floor(this.first / this.rows) + 1;
  }

  get totalPages(): number {
    return this.dt?.totalRecords ? Math.ceil(this.dt.totalRecords / this.rows) : 0;
  }
}



