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


import {IReport,ReportDto} from "../../../dto/Report.dto";
import {ReportService} from "../../../services/Report.service";

@Component({
  selector: 'app-create-update-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FloatLabel, ButtonModule, InputTextModule, DatePicker, PasswordModule, SelectButton, DropdownModule, Select, Checkbox, FormsModule],
  templateUrl: './create-update-report.html',
  styleUrl: './create-update-report.scss',
    providers: [
    ConfirmationService,
    DialogService,
    ReportService
    
  ]
})

export class CreateUpdateReport implements OnInit, OnDestroy {

  report: ReportDto = {};
  private subscription: Subscription = new Subscription();
  submitted: boolean = false;
  reportForm!: FormGroup;
    isLoadingClient: boolean = false;
    isLoading: boolean = false;
    
 

 

  constructor(
    private reportService: ReportService,
    private messageService: MessageService,
    public config: DynamicDialogConfig,
    public ref: DynamicDialogRef,
    private fb: FormBuilder
    
  ) { }

    ngOnInit(): void {

        //set default data
        
            
        
            
        
            
        
            
        

        //Form Control with Validation
        this.reportForm = this.fb.group({
                ReportId: [''],
                Title: [''],
                Description: [''],
                Author: [''],
    });

        

        //edit report if requested by the row click
        if (this.config.data != null) {
            this.editReport(this.config.data)
        }

    }







    save() {
        this.submitted = true;   

        if (this.reportForm.invalid) {
            Object.keys(this.reportForm.controls).forEach((key) => {
                const control = this.reportForm.get(key);
                if (control) {
                    control.markAsTouched();
                    control.markAsDirty();
                }
            });
            return;
        }        

        this.isLoading = true;

        const report = this.reportForm.value;

        if (report.ReportId) {
            this.subscription.add(
                this.reportService.updateReport(report).pipe(
                    finalize(() => {
                        this.isLoading = false;
                    })
                ).subscribe((res) => {
                    if (res.body) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: `Report Updated Successfully.`,
                            life: 3000
                        });
                    }
                    this.CloseInstances();
                }, (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Failed',
                        detail: `Failed To Update Report.`,
                        life: 3000
                    });
                })
            );
        } else {
            this.subscription.add(
                this.reportService.createReport(report).pipe(
                    finalize(() => {
                        this.isLoading = false;
                    })
                ).subscribe((res) => {
                    if (res.body) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: `Report Created Successfully.`,
                            life: 3000
                        });
                    }
                    this.CloseInstances();
                }, (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Failed',
                        detail: `Failed To Create Report.`,
                        life: 3000
                    });
                })
            );
        }
    }
    



    //close dialog instances
    CloseInstances(event?: Event) {
        event?.preventDefault();
        this.ref.close(this.reportForm.value);
        this.reportForm.reset();
        this.submitted = false
        this.report = {}

    }

    //unsubscribe all the services
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

//edit report
  editReport(report: ReportDto) {
    this.report = {...report};
    this.reportForm.patchValue({...report});
    
        
    
        
    
        
    
        
    
  }

  
}
