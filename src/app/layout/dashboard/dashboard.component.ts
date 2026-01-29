import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { Router } from '@angular/router';
import { DashboardService } from '../../../services/Dashboard.service';
import { DashboardDto } from '../../../dto/Dashboard.dto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    ChartModule,
    SelectButtonModule,
    TableModule,
  ],
  providers: [DashboardService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  selectedTime: string = 'Monthly';
  timeOptions: string[] = ['Weekly', 'Monthly', 'Yearly'];
  dateRange: Date[] = [];
  currencySymbol: string = 'LKR';
  currencyFormat: string = 'en-LK';

  salesData = { annual: 0, daily: 0 };
  profitData = { annual: 0, daily: 0 };
  stockData = { items: 0, value: 0 };
  wastageData = { items: 0, cost: 0 };

  chartData: any;
  chartOptions: any;
  pieData: any;
  pieOptions: any;

  transactions: {
    id: string;
    product: string;
    amount: number;
    status: string;
  }[] = [];
  dashboardData: DashboardDto | null = null;

  constructor(
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.getCurrencySettings();
    this.loadDashboardData();
    // this.loadRecentTransactions();
  }

  getCurrencySettings(): void {
    try {
      const storedCurrency = localStorage.getItem('selectedCurrency');
      this.currencySymbol = storedCurrency || 'LKR';

      const storedFormat = localStorage.getItem('currencyFormat');
      this.currencyFormat = storedFormat || 'en-LK';
    } catch {
      this.currencySymbol = 'LKR';
      this.currencyFormat = 'en-LK';
    }
  }

  // loadRecentTransactions(): void {
  //   const branchId = sessionStorage.getItem('BranchId') || '';
  //   const params = { page: 1, size: 5, branchId: branchId };

  //   this.dashboardService.findAllInventoryHistoryPaginated(params).subscribe({
  //     next: (response) => {
  //       if (response.body) {
  //         this.mapTransactions(response.body.inventoryHistorys);
  //       } else {
  //         this.transactions = [];
  //       }
  //     },
  //     error: () => {
  //       this.transactions = [];
  //     },
  //   });
  // }

  // mapTransactions(inventoryHistorys: InventoryHistoryDto[]): void {
  //   this.transactions = inventoryHistorys.map((history) => {
  //     let totalAmount = 0;
  //     if (history.Items && Array.isArray(history.Items)) {
  //       totalAmount = history.Items.reduce((sum, item) => {
  //         return sum + (item.UnitPrice || 0) * (item.Quantity || 0);
  //       }, 0);
  //     }

  //     let productDisplay = 'Unknown';
  //     if (history.Items && history.Items.length > 0) {
  //       productDisplay = history.Items[0].ProductId || 'Unknown';
  //       if (history.Items.length > 1) {
  //         productDisplay += ` + ${history.Items.length - 1} more`;
  //       }
  //     }

  //     let status = 'Completed';
  //     switch (history.Action) {
  //       case 'INVOICE':
  //         status = 'Completed';
  //         break;
  //       case 'GRN':
  //         status = 'Received';
  //         break;
  //       case 'RECEIVING-ITEMS':
  //         status = 'Processing';
  //         break;
  //       default:
  //         status = 'Pending';
  //     }

  //     return {
  //       id: history.InventoryHistoryId || '',
  //       product: productDisplay,
  //       amount: totalAmount,
  //       status: status,
  //     };
  //   });
  // }

  loadDashboardData(): void {
    const branchId = sessionStorage.getItem('BranchId') || '';
    this.dashboardService.getDashboardData(branchId).subscribe({
      next: (response) => {
        if (response.body) {
          this.dashboardData = response.body;
          this.updateDashboardDisplay();
        } else {
          this.resetDashboardToZero();
        }
      },
      error: () => {
        this.resetDashboardToZero();
      },
    });
  }

  resetDashboardToZero(): void {
    this.salesData = { annual: 0, daily: 0 };
    this.profitData = { annual: 0, daily: 0 };
    this.stockData = { items: 0, value: 0 };
    this.wastageData = { items: 0, cost: 0 };
    this.transactions = [];
    this.initChartData();
  }

  updateDashboardDisplay(): void {
    if (this.dashboardData) {
      this.salesData = {
        annual: this.dashboardData.AnnualSales || 0,
        daily: this.dashboardData.DailySales || 0,
      };

      this.profitData = {
        annual: this.dashboardData.AnnualProfit || 0,
        daily: this.dashboardData.DailySales
          ? this.dashboardData.DailySales * 0.3
          : 0,
      };

      this.stockData = {
        items: this.dashboardData.StockItems || 0,
        value: this.dashboardData.StockItems
          ? this.dashboardData.StockItems * 3000
          : 0,
      };

      this.wastageData = {
        items: this.dashboardData.Wastage || 0,
        cost: this.dashboardData.Wastage ? this.dashboardData.Wastage * 600 : 0,
      };

      this.initChartData();
    }
  }

  initChartData() {
    const chartLabels = this.getChartLabels();
    const chartValues = this.getChartValues();

    this.chartData = {
      labels: chartLabels,
      datasets: [
        {
          label: 'Sales 2024',
          data: chartValues,
          fill: true,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    };

    this.chartOptions = {
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${this.currencySymbol} ${this.formatCurrency(
                context.raw
              )}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value: number) => {
              return `${this.currencySymbol} ${this.formatCurrency(value)}`;
            },
          },
        },
      },
    };

    this.pieData = {
      labels: [
        'Electronics',
        'Clothing',
        'Food & Beverages',
        'Books',
        'Others',
      ],
      datasets: [
        {
          data: this.dashboardData ? [30, 25, 20, 15, 10] : [0, 0, 0, 0, 0],
          backgroundColor: [
            '#3B82F6',
            '#EC4899',
            '#14B8A6',
            '#F59E0B',
            '#6B7280',
          ],
        },
      ],
    };

    this.pieOptions = {
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    };
  }

  getChartLabels(): string[] {
    switch (this.selectedTime) {
      case 'Weekly':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case 'Monthly':
        return [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
      case 'Yearly':
        return ['2020', '2021', '2022', '2023', '2024'];
      default:
        return [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
    }
  }

  getChartValues(): number[] {
    if (!this.dashboardData) {
      switch (this.selectedTime) {
        case 'Weekly':
          return [0, 0, 0, 0];
        case 'Monthly':
          return Array(12).fill(0);
        case 'Yearly':
          return [0, 0, 0, 0, 0];
        default:
          return Array(12).fill(0);
      }
    } else {
      switch (this.selectedTime) {
        case 'Weekly':
          return this.dashboardData.WeeklySales || [0, 0, 0, 0];
        case 'Monthly':
          return this.dashboardData.MonthlySales || Array(12).fill(0);
        case 'Yearly':
          const monthlyData =
            this.dashboardData.MonthlySales || Array(12).fill(0);
          const yearlyTotal = monthlyData.reduce((sum, val) => sum + val, 0);
          return yearlyTotal > 0
            ? [
                yearlyTotal * 0.6,
                yearlyTotal * 0.7,
                yearlyTotal * 0.8,
                yearlyTotal * 0.9,
                yearlyTotal,
              ]
            : [0, 0, 0, 0, 0];
        default:
          return this.dashboardData.MonthlySales || Array(12).fill(0);
      }
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString(this.currencyFormat);
  }

  getStatusClass(status: string): string {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status.toLowerCase()) {
      case 'completed':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return baseClass;
    }
  }

  navigateToReports() {
    this.router.navigate(['/report']);
  }

  navigateToTransaction() {
    this.router.navigate(['/inventoryhistory']);
  }

  navigateToProduct() {
    this.router.navigate(['/product']);
  }

  changeSelect() {
    this.initChartData();
  }
}
