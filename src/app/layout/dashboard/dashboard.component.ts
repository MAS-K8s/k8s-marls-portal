import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';

interface AgentActivity {
  id: string;
  service: string;
  action: 'scale-up' | 'scale-down' | 'no-action';
  replicas: string;
  reward: number;
  timestamp: string;
}

interface Deployment {
  name: string;
  namespace: string;
  replicas: string;
  status: 'healthy' | 'scaling' | 'warning';
  progress: number;
  maxReplicas: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule,
    CardModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  // Main metrics
  avgReward: number = 0.480;
  epsilon: number = 0.6200;
  latency: number = 91;
  latencyTrend: string = '↓5 ↑2';
  replicas: number = 14;
  replicasTrend: string = '↓5 ↑2';

  // Training status
  trainingActive: boolean = true;
  networkStatus: string = 'LIVE';

  // Resource utilization
  cpuUsage: number = 65;
  memoryUsage: number = 59;
  cpuAvg: number = 65.3;
  memAvg: number = 57.8;

  // Chart data
  rewardProgressData: any;
  rewardProgressOptions: any;
  epsilonDecayData: any;
  epsilonDecayOptions: any;
  neuralNetworkNodes: any[] = [];

  // Agent activities
  agentActivities: AgentActivity[] = [
    {
      id: '1',
      service: 'api-gateway',
      action: 'scale-up',
      replicas: '3 → 5',
      reward: 0.650,
      timestamp: '17:15:36'
    },
    {
      id: '2',
      service: 'api-gateway',
      action: 'scale-up',
      replicas: '5 → 5',
      reward: 0.450,
      timestamp: '17:15:36'
    },
    {
      id: '3',
      service: 'payment-service',
      action: 'scale-up',
      replicas: '2 → 3',
      reward: 0.720,
      timestamp: '17:15:36'
    },
    {
      id: '4',
      service: 'user-service',
      action: 'scale-down',
      replicas: '5 → 4',
      reward: 0.300,
      timestamp: '17:15:36'
    },
    {
      id: '5',
      service: 'notification-worker',
      action: 'no-action',
      replicas: '2 → 2',
      reward: 0.280,
      timestamp: '17:15:36'
    },
    {
      id: '6',
      service: 'api-gateway',
      action: 'scale-up',
      replicas: '4 → 6',
      reward: 0.580,
      timestamp: '17:15:36'
    }
  ];

  // Deployments
  deployments: Deployment[] = [
    {
      name: 'api-gateway',
      namespace: 'production',
      replicas: '5 /20',
      status: 'healthy',
      progress: 25,
      maxReplicas: 20
    },
    {
      name: 'payment-service',
      namespace: 'production',
      replicas: '3 /10',
      status: 'scaling',
      progress: 30,
      maxReplicas: 10
    },
    {
      name: 'user-service',
      namespace: 'production',
      replicas: '4 /15',
      status: 'healthy',
      progress: 27,
      maxReplicas: 15
    },
    {
      name: 'notification-worker',
      namespace: 'workers',
      replicas: '2 /8',
      status: 'healthy',
      progress: 25,
      maxReplicas: 8
    }
  ];

  totalDecisions: number = 10;
  activeDeployments: number = 4;

  constructor(private router: Router) {}

  ngOnInit() {
    this.initCharts();
    this.generateNeuralNetworkVisualization();
  }

  initCharts() {
    // Reward progression chart
    this.rewardProgressData = {
      labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      datasets: [
        {
          data: [0.5, 0.45, 0.55, 0.4, 0.58, 0.52, 0.65, 0.72, 0.68, 0.62],
          fill: true,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    };

    this.rewardProgressOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#94a3b8',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: false
        }
      },
      scales: {
        x: {
          display: true,
          grid: { color: '#1e293b', drawBorder: false },
          ticks: { color: '#64748b', font: { size: 11 } }
        },
        y: {
          display: true,
          grid: { color: '#1e293b', drawBorder: false },
          ticks: { 
            color: '#64748b',
            font: { size: 11 },
            callback: function(value: any) {
              return value.toFixed(1);
            }
          },
          min: 0,
          max: 0.8
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };

    // Epsilon decay chart
    this.epsilonDecayData = {
      labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      datasets: [
        {
          data: [100, 95, 88, 82, 76, 71, 67, 64, 62, 61],
          fill: true,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          tension: 0.1,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    };

    this.epsilonDecayOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#94a3b8',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context: any) {
              return context.parsed.y.toFixed(0) + '%';
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { color: '#1e293b', drawBorder: false },
          ticks: { color: '#64748b', font: { size: 11 } }
        },
        y: {
          display: true,
          grid: { color: '#1e293b', drawBorder: false },
          ticks: { 
            color: '#64748b',
            font: { size: 11 },
            callback: function(value: any) {
              return value + '%';
            }
          },
          min: 0,
          max: 100
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  }

  generateNeuralNetworkVisualization() {
    // Generate node positions for neural network visualization
    const layers = [8, 12, 16, 12, 8];
    this.neuralNetworkNodes = [];

    layers.forEach((nodeCount, layerIndex) => {
      for (let i = 0; i < nodeCount; i++) {
        this.neuralNetworkNodes.push({
          x: (layerIndex * 20) + 10,
          y: (i * (80 / nodeCount)) + 10,
          active: Math.random() > 0.3
        });
      }
    });
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'scale-up':
        return 'pi-arrow-up';
      case 'scale-down':
        return 'pi-arrow-down';
      case 'no-action':
        return 'pi-minus';
      default:
        return 'pi-circle';
    }
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'scale-up':
        return 'action-scale-up';
      case 'scale-down':
        return 'action-scale-down';
      case 'no-action':
        return 'action-no-action';
      default:
        return '';
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'scaling':
        return 'info';
      case 'warning':
        return 'warn';
      default:
        return 'danger';
    }
  }

  formatReward(reward: number): string {
    return (reward >= 0 ? '+' : '') + reward.toFixed(3);
  }
}


// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { CalendarModule } from 'primeng/calendar';
// import { ChartModule } from 'primeng/chart';
// import { SelectButtonModule } from 'primeng/selectbutton';
// import { TableModule } from 'primeng/table';
// import { Router } from '@angular/router';
// import { DashboardService } from '../../../services/Dashboard.service';
// import { DashboardDto } from '../../../dto/Dashboard.dto';

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ButtonModule,
//     CalendarModule,
//     ChartModule,
//     SelectButtonModule,
//     TableModule,
//   ],
//   providers: [DashboardService],
//   templateUrl: './dashboard.component.html',
//   styleUrl: './dashboard.component.scss',
// })
// export class DashboardComponent implements OnInit {
//   selectedTime: string = 'Monthly';
//   timeOptions: string[] = ['Weekly', 'Monthly', 'Yearly'];
//   dateRange: Date[] = [];
//   currencySymbol: string = 'LKR';
//   currencyFormat: string = 'en-LK';

//   salesData = { annual: 0, daily: 0 };
//   profitData = { annual: 0, daily: 0 };
//   stockData = { items: 0, value: 0 };
//   wastageData = { items: 0, cost: 0 };

//   chartData: any;
//   chartOptions: any;
//   pieData: any;
//   pieOptions: any;

//   transactions: {
//     id: string;
//     product: string;
//     amount: number;
//     status: string;
//   }[] = [];
//   dashboardData: DashboardDto | null = null;

//   constructor(
//     private router: Router,
//     private dashboardService: DashboardService
//   ) {}

//   ngOnInit() {
//     this.getCurrencySettings();
//     this.loadDashboardData();
//     // this.loadRecentTransactions();
//   }

//   getCurrencySettings(): void {
//     try {
//       const storedCurrency = localStorage.getItem('selectedCurrency');
//       this.currencySymbol = storedCurrency || 'LKR';

//       const storedFormat = localStorage.getItem('currencyFormat');
//       this.currencyFormat = storedFormat || 'en-LK';
//     } catch {
//       this.currencySymbol = 'LKR';
//       this.currencyFormat = 'en-LK';
//     }
//   }

//   // loadRecentTransactions(): void {
//   //   const branchId = sessionStorage.getItem('BranchId') || '';
//   //   const params = { page: 1, size: 5, branchId: branchId };

//   //   this.dashboardService.findAllInventoryHistoryPaginated(params).subscribe({
//   //     next: (response) => {
//   //       if (response.body) {
//   //         this.mapTransactions(response.body.inventoryHistorys);
//   //       } else {
//   //         this.transactions = [];
//   //       }
//   //     },
//   //     error: () => {
//   //       this.transactions = [];
//   //     },
//   //   });
//   // }

//   // mapTransactions(inventoryHistorys: InventoryHistoryDto[]): void {
//   //   this.transactions = inventoryHistorys.map((history) => {
//   //     let totalAmount = 0;
//   //     if (history.Items && Array.isArray(history.Items)) {
//   //       totalAmount = history.Items.reduce((sum, item) => {
//   //         return sum + (item.UnitPrice || 0) * (item.Quantity || 0);
//   //       }, 0);
//   //     }

//   //     let productDisplay = 'Unknown';
//   //     if (history.Items && history.Items.length > 0) {
//   //       productDisplay = history.Items[0].ProductId || 'Unknown';
//   //       if (history.Items.length > 1) {
//   //         productDisplay += ` + ${history.Items.length - 1} more`;
//   //       }
//   //     }

//   //     let status = 'Completed';
//   //     switch (history.Action) {
//   //       case 'INVOICE':
//   //         status = 'Completed';
//   //         break;
//   //       case 'GRN':
//   //         status = 'Received';
//   //         break;
//   //       case 'RECEIVING-ITEMS':
//   //         status = 'Processing';
//   //         break;
//   //       default:
//   //         status = 'Pending';
//   //     }

//   //     return {
//   //       id: history.InventoryHistoryId || '',
//   //       product: productDisplay,
//   //       amount: totalAmount,
//   //       status: status,
//   //     };
//   //   });
//   // }

//   loadDashboardData(): void {
//     const branchId = sessionStorage.getItem('BranchId') || '';
//     this.dashboardService.getDashboardData(branchId).subscribe({
//       next: (response) => {
//         if (response.body) {
//           this.dashboardData = response.body;
//           this.updateDashboardDisplay();
//         } else {
//           this.resetDashboardToZero();
//         }
//       },
//       error: () => {
//         this.resetDashboardToZero();
//       },
//     });
//   }

//   resetDashboardToZero(): void {
//     this.salesData = { annual: 0, daily: 0 };
//     this.profitData = { annual: 0, daily: 0 };
//     this.stockData = { items: 0, value: 0 };
//     this.wastageData = { items: 0, cost: 0 };
//     this.transactions = [];
//     this.initChartData();
//   }

//   updateDashboardDisplay(): void {
//     if (this.dashboardData) {
//       this.salesData = {
//         annual: this.dashboardData.AnnualSales || 0,
//         daily: this.dashboardData.DailySales || 0,
//       };

//       this.profitData = {
//         annual: this.dashboardData.AnnualProfit || 0,
//         daily: this.dashboardData.DailySales
//           ? this.dashboardData.DailySales * 0.3
//           : 0,
//       };

//       this.stockData = {
//         items: this.dashboardData.StockItems || 0,
//         value: this.dashboardData.StockItems
//           ? this.dashboardData.StockItems * 3000
//           : 0,
//       };

//       this.wastageData = {
//         items: this.dashboardData.Wastage || 0,
//         cost: this.dashboardData.Wastage ? this.dashboardData.Wastage * 600 : 0,
//       };

//       this.initChartData();
//     }
//   }

//   initChartData() {
//     const chartLabels = this.getChartLabels();
//     const chartValues = this.getChartValues();

//     this.chartData = {
//       labels: chartLabels,
//       datasets: [
//         {
//           label: 'Sales 2024',
//           data: chartValues,
//           fill: true,
//           borderColor: '#3B82F6',
//           backgroundColor: 'rgba(59, 130, 246, 0.1)',
//           tension: 0.4,
//         },
//       ],
//     };

//     this.chartOptions = {
//       plugins: {
//         legend: {
//           display: false,
//         },
//         tooltip: {
//           callbacks: {
//             label: (context: any) => {
//               return `${this.currencySymbol} ${this.formatCurrency(
//                 context.raw
//               )}`;
//             },
//           },
//         },
//       },
//       scales: {
//         y: {
//           ticks: {
//             callback: (value: number) => {
//               return `${this.currencySymbol} ${this.formatCurrency(value)}`;
//             },
//           },
//         },
//       },
//     };

//     this.pieData = {
//       labels: [
//         'Electronics',
//         'Clothing',
//         'Food & Beverages',
//         'Books',
//         'Others',
//       ],
//       datasets: [
//         {
//           data: this.dashboardData ? [30, 25, 20, 15, 10] : [0, 0, 0, 0, 0],
//           backgroundColor: [
//             '#3B82F6',
//             '#EC4899',
//             '#14B8A6',
//             '#F59E0B',
//             '#6B7280',
//           ],
//         },
//       ],
//     };

//     this.pieOptions = {
//       plugins: {
//         legend: {
//           position: 'bottom',
//         },
//       },
//     };
//   }

//   getChartLabels(): string[] {
//     switch (this.selectedTime) {
//       case 'Weekly':
//         return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
//       case 'Monthly':
//         return [
//           'January',
//           'February',
//           'March',
//           'April',
//           'May',
//           'June',
//           'July',
//           'August',
//           'September',
//           'October',
//           'November',
//           'December',
//         ];
//       case 'Yearly':
//         return ['2020', '2021', '2022', '2023', '2024'];
//       default:
//         return [
//           'January',
//           'February',
//           'March',
//           'April',
//           'May',
//           'June',
//           'July',
//           'August',
//           'September',
//           'October',
//           'November',
//           'December',
//         ];
//     }
//   }

//   getChartValues(): number[] {
//     if (!this.dashboardData) {
//       switch (this.selectedTime) {
//         case 'Weekly':
//           return [0, 0, 0, 0];
//         case 'Monthly':
//           return Array(12).fill(0);
//         case 'Yearly':
//           return [0, 0, 0, 0, 0];
//         default:
//           return Array(12).fill(0);
//       }
//     } else {
//       switch (this.selectedTime) {
//         case 'Weekly':
//           return this.dashboardData.WeeklySales || [0, 0, 0, 0];
//         case 'Monthly':
//           return this.dashboardData.MonthlySales || Array(12).fill(0);
//         case 'Yearly':
//           const monthlyData =
//             this.dashboardData.MonthlySales || Array(12).fill(0);
//           const yearlyTotal = monthlyData.reduce((sum, val) => sum + val, 0);
//           return yearlyTotal > 0
//             ? [
//                 yearlyTotal * 0.6,
//                 yearlyTotal * 0.7,
//                 yearlyTotal * 0.8,
//                 yearlyTotal * 0.9,
//                 yearlyTotal,
//               ]
//             : [0, 0, 0, 0, 0];
//         default:
//           return this.dashboardData.MonthlySales || Array(12).fill(0);
//       }
//     }
//   }

//   formatCurrency(value: number): string {
//     return value.toLocaleString(this.currencyFormat);
//   }

//   getStatusClass(status: string): string {
//     const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';
//     switch (status.toLowerCase()) {
//       case 'completed':
//         return `${baseClass} bg-green-100 text-green-800`;
//       case 'pending':
//         return `${baseClass} bg-yellow-100 text-yellow-800`;
//       case 'cancelled':
//         return `${baseClass} bg-red-100 text-red-800`;
//       default:
//         return baseClass;
//     }
//   }

//   navigateToReports() {
//     this.router.navigate(['/report']);
//   }

//   navigateToTransaction() {
//     this.router.navigate(['/inventoryhistory']);
//   }

//   navigateToProduct() {
//     this.router.navigate(['/product']);
//   }

//   changeSelect() {
//     this.initChartData();
//   }
// }
