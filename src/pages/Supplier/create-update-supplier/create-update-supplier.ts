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

import { ISupplier, SupplierDto } from '../../../dto/Supplier.dto';
import { SupplierService } from '../../../services/Supplier.service';

@Component({
  selector: 'app-create-update-supplier',
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
  templateUrl: './create-update-supplier.html',
  styleUrl: './create-update-supplier.scss',
  providers: [ConfirmationService, DialogService, SupplierService],
})
export class CreateUpdateSupplier implements OnInit, OnDestroy {
  supplier: SupplierDto = {};
  private subscription: Subscription = new Subscription();
  submitted: boolean = false;
  supplierForm!: FormGroup;
  isLoadingClient: boolean = false;
  isLoading: boolean = false;

  constructor(
    private supplierService: SupplierService,
    private messageService: MessageService,
    public config: DynamicDialogConfig,
    public ref: DynamicDialogRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    //set default data

    //Form Control with Validation
    this.supplierForm = this.fb.group({
      SupplierId: [''],
      Name: ['', Validators.required],
      ContactNumber: ['', Validators.required],
      Email: [''],
      Address: ['', Validators.required],
      Products: [''],
      OrgnizationId: [''],
      ContactPerson: [''],
      Company: ['', Validators.required],
      Category: [''],
    });

    //edit supplier if requested by the row click
    if (this.config.data != null) {
      this.editSupplier(this.config.data);
    }
  }

  save() {
    this.submitted = true;

    if (this.supplierForm.invalid) {
      Object.keys(this.supplierForm.controls).forEach((key) => {
        const control = this.supplierForm.get(key);
        if (control) {
          control.markAsTouched();
          control.markAsDirty();
        }
      });
      return;
    }

    this.isLoading = true;

    const supplier = this.supplierForm.value;

    if (supplier.SupplierId) {
      this.subscription.add(
        this.supplierService
          .updateSupplier(supplier)
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
                  detail: `Supplier Updated Successfully.`,
                  life: 3000,
                });
              }
              this.CloseInstances();
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Failed',
                detail: `Failed To Update Supplier.`,
                life: 3000,
              });
            }
          )
      );
    } else {
      this.subscription.add(
        this.supplierService
          .createSupplier(supplier)
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
                  detail: `Supplier Created Successfully.`,
                  life: 3000,
                });
              }
              this.CloseInstances();
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Failed',
                detail: `Failed To Create Supplier.`,
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
    this.ref.close(this.supplierForm.value);
    this.supplierForm.reset();
    this.submitted = false;
    this.supplier = {};
  }

  //unsubscribe all the services
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  //edit supplier
  editSupplier(supplier: SupplierDto) {
    this.supplier = { ...supplier };
    this.supplierForm.patchValue({ ...supplier });
  }
}
