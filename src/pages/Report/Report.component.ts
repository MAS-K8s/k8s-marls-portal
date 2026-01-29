import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, Subscription, from } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ReportService } from '../../services/Report.service';
import { roleConfig } from '../../app/access-control/roleConfig';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { HtmlReportComponent } from './html-report/html-report.component';

interface DateRange {
  fromDate: Date | null;
  toDate: Date | null;
}

interface SalesData {
  date: string;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ProductSalesData {
  product: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface StockData {
  product: string;
  currentStock: number;
  reorderLevel: number;
  status: string;
}

@Component({
  standalone: true,
  selector: 'app-Report',
  imports: [
    CommonModule,
    ToastModule,
    ButtonModule,
    ConfirmDialog,
    CalendarModule,
    FormsModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './Report.component.html',
  host: {
    class:
      'h-full flex-1 flex flex-col overflow-hidden border border-surface rounded-2xl p-6',
  },
  styleUrl: '././Report.component.scss',
  providers: [
    ConfirmationService,
    MessageService,
    ReportService,
    DialogService,
  ],
})
export class ReportComponent implements OnInit, OnDestroy {
  salesSummaryDates: DateRange = { fromDate: null, toDate: null };
  dailySalesSummaryDate: Date | null = null;
  topSellingDates: DateRange = { fromDate: null, toDate: null };
  lowestSellingDates: DateRange = { fromDate: null, toDate: null };
  stockReportDate: Date | null = null;

  isLoading: boolean = false;
  roleConfig = roleConfig;
  private subscription: Subscription = new Subscription();
  private dialogRef: DynamicDialogRef | null = null;
  branchId: string = '';

  constructor(
    private route: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.salesSummaryDates = { fromDate: firstDay, toDate: lastDay };
    this.dailySalesSummaryDate = today;
    this.topSellingDates = { fromDate: firstDay, toDate: lastDay };
    this.lowestSellingDates = { fromDate: firstDay, toDate: lastDay };
    this.stockReportDate = today;
    this.getBranchIdFromStorage();
  }

  getBranchIdFromStorage(): void {
    try {
      const branchId = sessionStorage.getItem('BranchId');
      if (branchId) {
        this.branchId = branchId;
      }
    } catch (error) {
      console.error('Error accessing session storage:', error);
    }
  }

  showSalesSummaryDialog() {
    this.dialogRef = this.dialogService.open(HtmlReportComponent, {
      header: 'Sales Summary Report',
      width: '80%',
      closable: true,
      modal: true,
      data: {
        reportType: 'sales-summary',
        title: 'Sales Summary Report',
        fromDate: this.salesSummaryDates.fromDate,
        toDate: this.salesSummaryDates.toDate,
      },
      appendTo: 'body',
      baseZIndex: 1000,
    });

    this.dialogRef.onClose.subscribe(() => {});
  }

  showDailySalesSummaryDialog() {
    this.dialogRef = this.dialogService.open(HtmlReportComponent, {
      header: 'Daily Sales Summary',
      width: '80%',
      closable: true,
      modal: true,
      data: {
        reportType: 'daily-sales',
        title: 'Daily Sales Summary',
        singleDate: this.dailySalesSummaryDate,
      },
      appendTo: 'body',
      baseZIndex: 1000,
    });

    this.dialogRef.onClose.subscribe(() => {});
  }

  showTopSellingDialog() {
    this.dialogRef = this.dialogService.open(HtmlReportComponent, {
      header: 'Top Selling Products',
      width: '80%',
      closable: true,
      modal: true,
      data: {
        reportType: 'top-selling',
        title: 'Top Selling Products',
        fromDate: this.topSellingDates.fromDate,
        toDate: this.topSellingDates.toDate,
      },
      appendTo: 'body',
      baseZIndex: 1000,
    });

    this.dialogRef.onClose.subscribe(() => {});
  }

  showLowestSellingDialog() {
    this.dialogRef = this.dialogService.open(HtmlReportComponent, {
      header: 'Lowest Selling Products',
      width: '80%',
      closable: true,
      modal: true,
      data: {
        reportType: 'lowest-selling',
        title: 'Lowest Selling Products',
        fromDate: this.lowestSellingDates.fromDate,
        toDate: this.lowestSellingDates.toDate,
      },
      appendTo: 'body',
      baseZIndex: 1000,
    });

    this.dialogRef.onClose.subscribe(() => {});
  }

  showStockReportDialog() {
    this.dialogRef = this.dialogService.open(HtmlReportComponent, {
      header: 'Stock Report',
      width: '80%',
      closable: true,
      modal: true,
      data: {
        reportType: 'stock-report',
        title: 'Stock Report',
        singleDate: this.stockReportDate,
      },
      appendTo: 'body',
      baseZIndex: 1000,
    });

    this.dialogRef.onClose.subscribe(() => {});
  }

  downloadSalesSummaryPDF() {
    if (!this.salesSummaryDates.fromDate || !this.salesSummaryDates.toDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Date Error',
        detail: 'Please select both From Date and To Date',
        life: 3000,
      });
      return;
    }

    this.isLoading = true;
    const fromDate = this.formatDate(this.salesSummaryDates.fromDate);
    const toDate = this.formatDate(this.salesSummaryDates.toDate);

    from(this.fetchSalesData(fromDate, toDate))
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (salesData: SalesData[]) => {
          this.generateSalesSummaryPDF(salesData, fromDate, toDate);
          this.messageService.add({
            severity: 'success',
            summary: 'Download Successful',
            detail: 'Sales Summary Report successfully downloaded as PDF.',
            life: 3000,
          });
        },
        error: (error: Error) => {
          console.error('Error fetching sales data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Download Failed',
            detail:
              'Failed to generate Sales Summary Report. Please try again.',
            life: 3000,
          });
        },
      });
  }

  downloadDailySalesSummaryPDF() {
    if (!this.dailySalesSummaryDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Date Error',
        detail: 'Please select a date',
        life: 3000,
      });
      return;
    }

    this.isLoading = true;
    const date = this.formatDate(this.dailySalesSummaryDate);

    from(this.fetchDailySalesData(date))
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (salesData: SalesData[]) => {
          this.generateDailySalesSummaryPDF(salesData, date);
          this.messageService.add({
            severity: 'success',
            summary: 'Download Successful',
            detail: 'Daily Sales Summary successfully downloaded as PDF.',
            life: 3000,
          });
        },
        error: (error: Error) => {
          console.error('Error fetching daily sales data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Download Failed',
            detail: 'Failed to generate Daily Sales Summary. Please try again.',
            life: 3000,
          });
        },
      });
  }

  downloadTopSellingPDF() {
    if (!this.topSellingDates.fromDate || !this.topSellingDates.toDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Date Error',
        detail: 'Please select both From Date and To Date',
        life: 3000,
      });
      return;
    }

    this.isLoading = true;
    const fromDate = this.formatDate(this.topSellingDates.fromDate);
    const toDate = this.formatDate(this.topSellingDates.toDate);

    from(this.fetchTopSellingData(fromDate, toDate))
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (productData: ProductSalesData[]) => {
          this.generateTopSellingPDF(productData, fromDate, toDate);
          this.messageService.add({
            severity: 'success',
            summary: 'Download Successful',
            detail:
              'Top Selling Products Report successfully downloaded as PDF.',
            life: 3000,
          });
        },
        error: (error: Error) => {
          console.error('Error fetching top selling products data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Download Failed',
            detail:
              'Failed to generate Top Selling Products Report. Please try again.',
            life: 3000,
          });
        },
      });
  }

  downloadLowestSellingPDF() {
    if (!this.lowestSellingDates.fromDate || !this.lowestSellingDates.toDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Date Error',
        detail: 'Please select both From Date and To Date',
        life: 3000,
      });
      return;
    }

    this.isLoading = true;
    const fromDate = this.formatDate(this.lowestSellingDates.fromDate);
    const toDate = this.formatDate(this.lowestSellingDates.toDate);

    from(this.fetchLowestSellingData(fromDate, toDate))
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (productData: ProductSalesData[]) => {
          this.generateLowestSellingPDF(productData, fromDate, toDate);
          this.messageService.add({
            severity: 'success',
            summary: 'Download Successful',
            detail:
              'Lowest Selling Products Report successfully downloaded as PDF.',
            life: 3000,
          });
        },
        error: (error: Error) => {
          console.error('Error fetching lowest selling products data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Download Failed',
            detail:
              'Failed to generate Lowest Selling Products Report. Please try again.',
            life: 3000,
          });
        },
      });
  }

  downloadStockReportPDF() {
    if (!this.stockReportDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Date Error',
        detail: 'Please select a date',
        life: 3000,
      });
      return;
    }

    this.isLoading = true;
    const date = this.formatDate(this.stockReportDate);

    from(this.fetchStockData(date))
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (stockData: StockData[]) => {
          this.generateStockReportPDF(stockData, date);
          this.messageService.add({
            severity: 'success',
            summary: 'Download Successful',
            detail: 'Stock Report successfully downloaded as PDF.',
            life: 3000,
          });
        },
        error: (error: Error) => {
          console.error('Error fetching stock data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Download Failed',
            detail: 'Failed to generate Stock Report. Please try again.',
            life: 3000,
          });
        },
      });
  }

  private fetchSalesData(
    fromDate: string,
    toDate: string
  ): Promise<SalesData[]> {
    return new Promise<SalesData[]>((resolve) => {
      setTimeout(() => {
        const mockData: SalesData[] = [
          {
            date: '2025-02-01',
            product: 'Product A',
            quantity: 10,
            unitPrice: 25.99,
            total: 259.9,
          },
          // More data items...
        ];
        resolve(mockData);
      }, 500);
    });
  }

  private fetchDailySalesData(date: string): Promise<SalesData[]> {
    return new Promise<SalesData[]>((resolve) => {
      setTimeout(() => {
        const mockData: SalesData[] = [
          {
            date: date,
            product: 'Product A',
            quantity: 5,
            unitPrice: 25.99,
            total: 129.95,
          },
        ];
        resolve(mockData);
      }, 500);
    });
  }

  private fetchTopSellingData(
    fromDate: string,
    toDate: string
  ): Promise<ProductSalesData[]> {
    return new Promise<ProductSalesData[]>((resolve) => {
      setTimeout(() => {
        const mockData: ProductSalesData[] = [
          {
            product: 'Product A',
            totalQuantity: 150,
            totalRevenue: 3898.5,
          },
          // More data items...
        ];
        resolve(mockData);
      }, 500);
    });
  }

  private fetchLowestSellingData(
    fromDate: string,
    toDate: string
  ): Promise<ProductSalesData[]> {
    return new Promise<ProductSalesData[]>((resolve) => {
      setTimeout(() => {
        const mockData: ProductSalesData[] = [
          {
            product: 'Product Z',
            totalQuantity: 2,
            totalRevenue: 51.98,
          },
        ];
        resolve(mockData);
      }, 500);
    });
  }

  private fetchStockData(date: string): Promise<StockData[]> {
    return new Promise<StockData[]>((resolve) => {
      setTimeout(() => {
        const mockData: StockData[] = [
          {
            product: 'Product A',
            currentStock: 45,
            reorderLevel: 20,
            status: 'In Stock',
          },
          // More data items...
        ];
        resolve(mockData);
      }, 500);
    });
  }

  private generateSalesSummaryPDF(
    salesData: SalesData[],
    fromDate: string,
    toDate: string
  ) {
    const doc = new jsPDF();
    // PDF generation code...
    doc.save(`Sales_Summary_${fromDate}_to_${toDate}.pdf`);
  }

  private generateDailySalesSummaryPDF(salesData: SalesData[], date: string) {
    const doc = new jsPDF();
    doc.save(`Daily_Sales_Summary_${date}.pdf`);
  }

  private generateTopSellingPDF(
    productData: ProductSalesData[],
    fromDate: string,
    toDate: string
  ) {
    const doc = new jsPDF();
    doc.save(`Top_Selling_Products_${fromDate}_to_${toDate}.pdf`);
  }

  private generateLowestSellingPDF(
    productData: ProductSalesData[],
    fromDate: string,
    toDate: string
  ) {
    const doc = new jsPDF();
    doc.save(`Lowest_Selling_Products_${fromDate}_to_${toDate}.pdf`);
  }

  private generateStockReportPDF(stockData: StockData[], date: string) {
    const doc = new jsPDF();
    doc.save(`Stock_Report_${date}.pdf`);
  }

  downloadReport(reportType: string, format: 'pdf' | 'excel') {
    if (format === 'pdf') {
      switch (reportType) {
        case 'sales-summary':
          this.showSalesSummaryDialog();
          break;
        case 'daily-sales-summary':
          this.showDailySalesSummaryDialog();
          break;
        case 'top-selling':
          this.showTopSellingDialog();
          break;
        case 'lowest-selling':
          this.showLowestSellingDialog();
          break;
        case 'stock-report':
          this.showStockReportDialog();
          break;
        default:
          console.log(
            `Download ${reportType} as ${format} - Not implemented yet`
          );
      }
    } else {
      console.log(`Download ${reportType} as ${format} - Not implemented yet`);
    }
  }

  private formatDate(date: Date): string {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
