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


import {IOrganization,OrganizationDto} from "../../../dto/Organization.dto";
import {OrganizationService} from "../../../services/Organization.service";

@Component({
  selector: 'app-create-update-organization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FloatLabel, ButtonModule, InputTextModule, DatePicker, PasswordModule, SelectButton, DropdownModule, Select, Checkbox, FormsModule],
  templateUrl: './create-update-organization.html',
  styleUrl: './create-update-organization.scss',
    providers: [
    ConfirmationService,
    DialogService,
    OrganizationService
    
  ]
})

export class CreateUpdateOrganization implements OnInit, OnDestroy {

  organization: OrganizationDto = {};
  private subscription: Subscription = new Subscription();
  submitted: boolean = false;
  organizationForm!: FormGroup;
    isLoadingClient: boolean = false;
    isLoading: boolean = false;
    
 

 

  constructor(
    private organizationService: OrganizationService,
    private messageService: MessageService,
    public config: DynamicDialogConfig,
    public ref: DynamicDialogRef,
    private fb: FormBuilder
    
  ) { }

    ngOnInit(): void {

        //set default data
        
            
        
            
        
            
        
            
        
            
        
            
        
            
        
            
        
            
        
            
        

        //Form Control with Validation
        this.organizationForm = this.fb.group({
                OrganizationId: [''],
                Name: [''],
                Address: [''],
                Location: [''],
                PhoneNumber: [''],
                Email: [''],
                Website: [''],
                CompanyLogo: [''],
                InvoiceTerms: [''],
                InvoiceNotes: [''],
    });

        

        //edit organization if requested by the row click
        if (this.config.data != null) {
            this.editOrganization(this.config.data)
        }

    }







    save() {
        this.submitted = true;   

        if (this.organizationForm.invalid) {
            Object.keys(this.organizationForm.controls).forEach((key) => {
                const control = this.organizationForm.get(key);
                if (control) {
                    control.markAsTouched();
                    control.markAsDirty();
                }
            });
            return;
        }        

        this.isLoading = true;

        const organization = this.organizationForm.value;

        if (organization.OrganizationId) {
            this.subscription.add(
                this.organizationService.updateOrganization(organization).pipe(
                    finalize(() => {
                        this.isLoading = false;
                    })
                ).subscribe((res) => {
                    if (res.body) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: `Organization Updated Successfully.`,
                            life: 3000
                        });
                    }
                    this.CloseInstances();
                }, (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Failed',
                        detail: `Failed To Update Organization.`,
                        life: 3000
                    });
                })
            );
        } else {
            this.subscription.add(
                this.organizationService.createOrganization(organization).pipe(
                    finalize(() => {
                        this.isLoading = false;
                    })
                ).subscribe((res) => {
                    if (res.body) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: `Organization Created Successfully.`,
                            life: 3000
                        });
                    }
                    this.CloseInstances();
                }, (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Failed',
                        detail: `Failed To Create Organization.`,
                        life: 3000
                    });
                })
            );
        }
    }
    



    //close dialog instances
    CloseInstances(event?: Event) {
        event?.preventDefault();
        this.ref.close(this.organizationForm.value);
        this.organizationForm.reset();
        this.submitted = false
        this.organization = {}

    }

    //unsubscribe all the services
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

//edit organization
  editOrganization(organization: OrganizationDto) {
    this.organization = {...organization};
    this.organizationForm.patchValue({...organization});
    
        
    
        
    
        
    
        
    
        
    
        
    
        
    
        
    
        
    
        
    
  }

  
}
