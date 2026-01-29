import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { HtmlReportService } from '../../../services/HtmlReport.service';
import { finalize } from 'rxjs/operators';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-html-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    ProgressSpinnerModule,
    ToastModule,
  ],
  templateUrl: './html-report.component.html',
  styleUrls: ['./html-report.component.scss'],
  providers: [MessageService],
  encapsulation: ViewEncapsulation.None,
})
export class HtmlReportComponent implements OnInit {
  @ViewChild('reportFrame') reportFrame!: ElementRef<HTMLIFrameElement>;

  @Input() reportType:
    | 'sales-summary'
    | 'daily-sales'
    | 'top-selling'
    | 'lowest-selling'
    | 'stock-report' = 'sales-summary';
  @Input() title: string = 'Sales Summary Report';

  fromDate: Date | null = null;
  toDate: Date | null = null;
  singleDate: Date | null = null;
  branchID: string = '';

  isLoading: boolean = false;
  errorMessage: string = '';
  report: string | null = null;

  constructor(
    private reportService: HtmlReportService,
    private messageService: MessageService,
    private config: DynamicDialogConfig,
    private dialogRef: DynamicDialogRef
  ) {}

  ngOnInit(): void {
    this.getBranchIdFromStorage();
    if (this.config.data) {
      if (this.config.data.reportType) {
        this.reportType = this.config.data.reportType;
      }

      if (this.config.data.title) {
        this.title = this.config.data.title;
      }

      if (this.config.data.fromDate) {
        this.fromDate = this.config.data.fromDate;
      }

      if (this.config.data.toDate) {
        this.toDate = this.config.data.toDate;
      }

      if (this.config.data.singleDate) {
        this.singleDate = this.config.data.singleDate;
      }
    }

    if (!this.fromDate && !this.singleDate) {
      const today = new Date();
      if (
        this.reportType === 'daily-sales' ||
        this.reportType === 'stock-report'
      ) {
        this.singleDate = today;
      } else {
        this.toDate = today;
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        this.fromDate = firstDay;
      }
    }
  }

  getBranchIdFromStorage(): void {
    try {
      const branchId = sessionStorage.getItem('BranchId');
      if (branchId) {
        this.branchID = branchId;
      }
    } catch (error) {
      console.error('Error accessing session storage:', error);
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateReport(): void {
    if (
      (this.reportType === 'sales-summary' ||
        this.reportType === 'top-selling' ||
        this.reportType === 'lowest-selling') &&
      (!this.fromDate || !this.toDate)
    ) {
      this.messageService.add({
        severity: 'error',
        summary: 'Date Error',
        detail: 'Please select both From Date and To Date',
        life: 3000,
      });
      return;
    } else if (
      (this.reportType === 'daily-sales' ||
        this.reportType === 'stock-report') &&
      !this.singleDate
    ) {
      this.messageService.add({
        severity: 'error',
        summary: 'Date Error',
        detail: 'Please select a date',
        life: 3000,
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.report = null;

    let observable;

    switch (this.reportType) {
      case 'sales-summary':
        observable = this.reportService.generateSalesSummaryReport(
          this.formatDate(this.fromDate),
          this.formatDate(this.toDate),
          this.branchID
        );
        break;
      case 'daily-sales':
        observable = this.reportService.generateDailySalesReport(
          this.formatDate(this.singleDate),
          this.branchID
        );
        break;
      case 'top-selling':
        observable = this.reportService.generateTopSellingReport(
          this.formatDate(this.fromDate),
          this.formatDate(this.toDate),
          this.branchID
        );
        break;
      case 'lowest-selling':
        observable = this.reportService.generateLowestSellingReport(
          this.formatDate(this.fromDate),
          this.formatDate(this.toDate),
          this.branchID
        );
        break;
      case 'stock-report':
        observable = this.reportService.generateStockReport(
          this.formatDate(this.singleDate),
          this.branchID
        );
        break;
      default:
        observable = this.reportService.generateSalesSummaryReport(
          this.formatDate(this.fromDate),
          this.formatDate(this.toDate),
          this.branchID
        );
    }

    observable
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response && response.body) {
            this.report = response.body;

            setTimeout(() => {
              if (response.body) {
                this.updateIframeContent(response.body);
              }
            }, 100);

            this.messageService.add({
              severity: 'success',
              summary: 'Report Generated',
              detail: `The ${this.title} has been generated successfully.`,
              life: 3000,
            });
          } else {
            this.errorMessage = 'No data received from server';
          }
        },
        error: (error) => {
          console.error('Error generating report:', error);
          if (error.url && (
              error.url.includes('GenerateTopMovingProductsReport') || 
              error.url.includes('GenerateDailySalesReport') ||
              error.url.includes('GenerateSalesSummaryReport') ||
              error.url.includes('GenerateLowMovingProductsReport') ||
              error.url.includes('GenerateStockReport')
            )) {
            this.errorMessage = 'Unable to generate report. Please try again later or contact support.';
            
            this.messageService.add({
              severity: 'error',
              summary: 'Report Error',
              detail: 'Unable to generate report. Please try again later.',
              life: 3000,
            });
          } else {
            this.errorMessage = 'An error occurred while generating the report.';
            
            this.messageService.add({
              severity: 'error',
              summary: 'Report Error',
              detail: this.errorMessage,
              life: 3000,
            });
          }
        },
      });
  }

  updateIframeContent(html: string): void {
    if (this.reportFrame && this.reportFrame.nativeElement) {
      const iframe = this.reportFrame.nativeElement;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }

  printReport(): void {
    if (
      this.reportFrame &&
      this.reportFrame.nativeElement &&
      this.reportFrame.nativeElement.contentWindow
    ) {
      this.reportFrame.nativeElement.contentWindow.print();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Print Error',
        detail: 'Could not print the report. Please try again.',
        life: 3000,
      });
    }
  }

  exportToPDF(): void {
    if (
      this.reportFrame &&
      this.reportFrame.nativeElement &&
      this.reportFrame.nativeElement.contentWindow
    ) {
      this.messageService.add({
        severity: 'info',
        summary: 'Export to PDF',
        detail: 'Use the browser\'s "Save as PDF" option in the print dialog.',
        life: 4000,
      });

      setTimeout(() => {
        this.reportFrame.nativeElement.contentWindow?.print();
      }, 500);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Export Error',
        detail: 'Could not export the report to PDF. Please try again.',
        life: 3000,
      });
    }
  }
}
