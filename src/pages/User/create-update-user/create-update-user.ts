import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { FloatLabel } from 'primeng/floatlabel';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';

import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import { Select } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { filter, finalize, map, Subscription } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { SelectButton } from 'primeng/selectbutton';
import { Checkbox } from 'primeng/checkbox';

import { RoleService } from '../../../services/Role.service';
import { RoleDto } from '../../..//dto/Role.dto';

import { IUser, UserDto } from '../../../dto/User.dto';
import { UserService } from '../../../services/User.service';

@Component({
  selector: 'app-create-update-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FloatLabel,
    ButtonModule,
    InputTextModule,
    DatePicker,
    PasswordModule,
    SelectButton,
    DropdownModule,
    Select,
    Checkbox,
    FormsModule,
  ],
  templateUrl: './create-update-user.html',
  styleUrl: './create-update-user.scss',
  providers: [ConfirmationService, DialogService, UserService, RoleService],
})
export class CreateUpdateUser implements OnInit, OnDestroy {
  user: UserDto = {};
  private subscription: Subscription = new Subscription();
  submitted: boolean = false;
  userForm!: FormGroup;
  isLoadingClient: boolean = false;
  isLoading: boolean = false;

  tempRoleData: RoleDto = {};
  rolesData: RoleDto[] = [];

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    public config: DynamicDialogConfig,
    public ref: DynamicDialogRef,
    private fb: FormBuilder,

    public roleService: RoleService
  ) {}

  ngOnInit(): void {
    //set default data

    //Form Control with Validation
    this.userForm = this.fb.group({
      UserId: [''],
      FirstName: [''],
      LastName: [''],
      Email: [''],
      RoleId: [''],
      RoleName: [''],
      BranchId: [''],
    });

    this.userForm.get('RoleId')!.valueChanges.subscribe((selectedRoleId) => {
      const selectedRole = this.rolesData.find(
        (role) => role.RoleId === selectedRoleId
      );
      if (selectedRole) {
        this.userForm.patchValue({
          RoleName: selectedRole.Name,
        });
      }
    });
    this.findAllRoles({});

    //edit user if requested by the row click
    if (this.config.data != null) {
      this.editUser(this.config.data);
    }
  }

  findAllRoles(params: any) {
    this.isLoadingClient = true;
    this.subscription.add(
      this.roleService
        .findAllRole(params)
        .pipe(
          filter((res: HttpResponse<RoleDto[]>) => res.ok),
          map((res: HttpResponse<RoleDto[]>) => res.body)
        )
        .subscribe(
          (res: RoleDto[] | null) => {
            if (res != null) {
              this.rolesData = res;

              this.tempRoleData =
                res.find((resp) => {
                  return resp.RoleId === this.user.RoleId;
                }) || {};
            } else {
              this.rolesData = [];
            }
            this.isLoadingClient = false;
          },

          (res: HttpErrorResponse) => {
            this.isLoadingClient = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Unable To Load Clients',
            });
          }
        )
    );
  }
  onClientChange() {
    this.user.RoleId = this.tempRoleData.RoleId;
    this.user.RoleName = this.tempRoleData.Name;
  }

  save() {
    this.submitted = true;

    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach((key) => {
        const control = this.userForm.get(key);
        if (control) {
          control.markAsTouched();
          control.markAsDirty();
        }
      });
      return;
    }

    this.isLoading = true;

    const user = this.userForm.value;

    if (user.RoleName == "Branch-Manager"){
      const branchId = sessionStorage.getItem('BranchId') || '';
      user.BranchId = branchId
    }

    if (user.UserId) {
      this.subscription.add(
        this.userService
          .updateUser(user)
          .pipe(
            finalize(() => {
              this.isLoading = false;
            })
          )
          .subscribe(
            (res) => {
              if (res.body) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Successful',
                  detail: `User Updated Successfully.`,
                  life: 3000,
                });
              }
              this.CloseInstances();
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Failed',
                detail: `Failed To Update User.`,
                life: 3000,
              });
            }
          )
      );
    } else {
      this.subscription.add(
        this.userService
          .createUser(user)
          .pipe(
            finalize(() => {
              this.isLoading = false;
            })
          )
          .subscribe(
            (res) => {
              if (res.body) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Successful',
                  detail: `User Created Successfully.`,
                  life: 3000,
                });
              }
              this.CloseInstances();
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Failed',
                detail: `Failed To Create User.`,
                life: 3000,
              });
            }
          )
      );
    }
  }

  //close dialog instances
  CloseInstances(event?: Event) {
    event?.preventDefault();
    this.ref.close(this.userForm.value);
    this.userForm.reset();
    this.submitted = false;
    this.user = {};
  }

  //unsubscribe all the services
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  //edit user
  editUser(user: UserDto) {
    this.user = { ...user };
    this.userForm.patchValue({ ...user });
  }
}
