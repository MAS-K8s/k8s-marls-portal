import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { FloatLabel } from 'primeng/floatlabel';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

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


import {PermissionDto} from '../../../dto/Role.dto';
import { PermissionCategories } from '../../../app/access-control/roleConfig';

import {IRole,RoleDto} from "../../../dto/Role.dto";
import {RoleService} from "../../../services/Role.service";

@Component({
  selector: 'app-create-update-role',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FloatLabel, ButtonModule, InputTextModule, DatePicker, PasswordModule, SelectButton, DropdownModule, Select, Checkbox, FormsModule],
  templateUrl: './create-update-role.html',
  styleUrl: './create-update-role.scss',
    providers: [
    ConfirmationService,
    DialogService,
    RoleService
    
  ]
})

export class CreateUpdateRole implements OnInit, OnDestroy {

  role: RoleDto = {};
  private subscription: Subscription = new Subscription();
  submitted: boolean = false;
  roleForm!: FormGroup;
    isLoadingClient: boolean = false;
    isLoading: boolean = false;
    


    PermissionCategories = PermissionCategories;
    cruds: PermissionDto[] = [
        { Name: 'Add', Key: 'A' },
        { Name: 'Update', Key: 'U' },
        { Name: 'Read', Key: 'R' },
        { Name: 'Delete', Key: 'D' },
    ];
 

 

  constructor(
    private roleService: RoleService,
    private messageService: MessageService,
    public config: DynamicDialogConfig,
    public ref: DynamicDialogRef,
    private fb: FormBuilder
    
  ) { }

    ngOnInit(): void {

        //set default data
        
            
        
            
        
            
        
            
        

        //Form Control with Validation
        this.roleForm = this.fb.group({
                RoleId: [''],
                Name: [''],
                Description: [''],
                PermissionCategories: [''],
    });

        

        //edit role if requested by the row click
        if (this.config.data != null) {
            this.editRole(this.config.data)
        }

    }




    save() {
        this.submitted = true;
        this.role.PermissionCategories = this.PermissionCategories;

        if (this.checkValidation()) {
            //update if their is an objectId
            this.isLoading = true
            if (this.role.RoleId) {
                this.subscription.add(
                    this.roleService.updateRole(this.role).subscribe(
                        () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Update Successfully',
                                life: 3000,
                            });
                            this.isLoading = false
                            this.CloseInstances();
                        },
                        (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Failed',
                                detail: `Failed to update`,
                                life: 3000,
                            });
                            this.isLoading = false
                        }
                    )
                );
            }
            //else create role
            else {
                this.subscription.add(
                    this.roleService.createRole(this.role).subscribe(
                        () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Create Successfully ',
                                life: 3000,
                            });
                            this.isLoading = false
                            this.CloseInstances();
                        },
                        (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Failed',
                                detail: `Failed to create`,
                                life: 3000,
                            });
                            this.isLoading = false
                        }
                    )
                );
            }
        }
    }

    checkValidation() {
        if (this.role && this.role.Name && this.role.Description) {
            return true;
        } else {
            return false;
        }
    }




    //close dialog instances
    CloseInstances(event?: Event) {
        event?.preventDefault();
        this.ref.close(this.roleForm.value);
        this.roleForm.reset();
        this.submitted = false
        this.role = {}

    }

    //unsubscribe all the services
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

//edit role
  editRole(role: RoleDto) {
    this.role = {...role};
    this.roleForm.patchValue({...role});
    
        
    
        
    
        
    
        
    
  }

  
}
