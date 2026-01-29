import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FilterOption, FilterValues } from '../../dto/FilterForm.dto';



@Component({
  selector: 'app-filter-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CalendarModule],
  templateUrl: './filter-form.component.html',
  styleUrl: './filter-form.component.scss',
})
export class FilterFormComponent implements OnInit {
  @Input() componentName: string = '';
  @Input() filterOptions: FilterOption[] = [];
  @Input() defaultValues: FilterValues = {};

  @Output() applyFilter = new EventEmitter<FilterValues>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() closeFilter = new EventEmitter<void>();

  filterValues: FilterValues = {};
  isDialogMode: boolean = false;

  constructor(
    private dialogRef?: DynamicDialogRef,
    private config?: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    if (this.config && this.config.data) {
      this.isDialogMode = true;

      if (this.config.data.componentName) {
        this.componentName = this.config.data.componentName;
      }

      if (this.config.data.filterOptions) {
        this.filterOptions = this.config.data.filterOptions;
      }

      if (this.config.data.defaultValues) {
        this.defaultValues = this.config.data.defaultValues;
      }
    }

    this.configureFilterOptions();
    this.filterValues = { ...this.defaultValues };
  }

  private configureFilterOptions(): void {
    if (!this.componentName || this.filterOptions.length === 0) {
      return;
    }

    if (this.componentName === 'GRNComponent') {
      this.filterOptions.forEach((option) => {
        option.visible =
          option.field === 'fromDate' || option.field === 'toDate';
      });
    } else if (this.componentName === 'InvoiceComponent') {
      this.filterOptions.forEach((option) => {
        option.visible =
          option.field === 'fromDate' || option.field === 'toDate';
      });
    } else if (this.componentName === 'InternalMoveComponent') {
      this.filterOptions.forEach((option) => {
        option.visible =
          option.field === 'fromDate' || option.field === 'toDate';
      });
    } else if (this.componentName === 'InventoryHistoryComponent') {
      this.filterOptions.forEach((option) => {
        option.visible =
          option.field === 'fromDate' || option.field === 'toDate';
      });
    }
  }

  get visibleFilterOptions(): FilterOption[] {
    return this.filterOptions.filter((option) => option.visible);
  }

  onApplyFilter(): void {
    const appliedFilters = Object.entries(this.filterValues)
      .filter(([_, value]) => {
        if (value === null || value === undefined) {
          return false;
        }
        return true;
      })
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as FilterValues);

    if (this.isDialogMode && this.dialogRef) {
      this.dialogRef.close(appliedFilters);
    } else {
      this.applyFilter.emit(appliedFilters);
    }
  }

  onResetFilter(): void {
    this.filterValues = {};

    if (this.isDialogMode && this.dialogRef) {
      this.dialogRef.close({});
    } else {
      this.resetFilter.emit();
    }
  }

  onCloseFilter(): void {
    if (this.isDialogMode && this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.closeFilter.emit();
    }
  }
}
