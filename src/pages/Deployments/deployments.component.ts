import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { TabViewModule } from 'primeng/tabview';
import { ProgressBarModule } from 'primeng/progressbar';

interface Deployment {
  id: string;
  name: string;
  namespace: string;
  status: 'healthy' | 'scaling' | 'warning';
  replicas: number;
  avgReward: number;
  scaleUpCount: number;
  scaleDownCount: number;
  cpu: number;
  memory: number;
  latency: number;
  errorRate: number;
  targetReplicas: number;
  minReplicas: number;
  maxReplicas: number;
  uptime: string;
  lastScaled: string;
  requestsPerSecond: number;
}

interface DeploymentDetails extends Deployment {
  replicaHistory: number[];
  rewardHistory: number[];
  cpuHistory: number[];
  memoryHistory: number[];
  latencyHistory: number[];
}

@Component({
  selector: 'app-deployments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    ChartModule,
    TabViewModule,
    ProgressBarModule,
  ],
  templateUrl: './deployments.component.html',
  styleUrl: './deployments.component.scss',
})
export class DeploymentsComponent implements OnInit {
  deployments: Deployment[] = [
    {
      id: '1',
      name: 'notification-worker',
      namespace: 'workers',
      status: 'healthy',
      replicas: 2,
      avgReward: 0.380,
      scaleUpCount: 1,
      scaleDownCount: 0,
      cpu: 55.0,
      memory: 60.0,
      latency: 70.0,
      errorRate: 0.02,
      targetReplicas: 2,
      minReplicas: 1,
      maxReplicas: 8,
      uptime: '15d 4h',
      lastScaled: '2h ago',
      requestsPerSecond: 145
    },
    {
      id: '2',
      name: 'payment-service',
      namespace: 'production',
      status: 'scaling',
      replicas: 3,
      avgReward: 0.570,
      scaleUpCount: 1,
      scaleDownCount: 0,
      cpu: 82.0,
      memory: 75.0,
      latency: 85.0,
      errorRate: 0.03,
      targetReplicas: 4,
      minReplicas: 2,
      maxReplicas: 10,
      uptime: '22d 8h',
      lastScaled: '15m ago',
      requestsPerSecond: 892
    },
    {
      id: '3',
      name: 'api-gateway',
      namespace: 'production',
      status: 'healthy',
      replicas: 5,
      avgReward: 0.500,
      scaleUpCount: 2,
      scaleDownCount: 1,
      cpu: 68.0,
      memory: 72.0,
      latency: 75.0,
      errorRate: 0.01,
      targetReplicas: 5,
      minReplicas: 3,
      maxReplicas: 20,
      uptime: '30d 12h',
      lastScaled: '1h ago',
      requestsPerSecond: 1543
    },
    {
      id: '4',
      name: 'user-service',
      namespace: 'production',
      status: 'healthy',
      replicas: 4,
      avgReward: 0.450,
      scaleUpCount: 1,
      scaleDownCount: 1,
      cpu: 62.0,
      memory: 65.0,
      latency: 68.0,
      errorRate: 0.02,
      targetReplicas: 4,
      minReplicas: 2,
      maxReplicas: 15,
      uptime: '18d 6h',
      lastScaled: '45m ago',
      requestsPerSecond: 678
    }
  ];

  selectedDeployment: DeploymentDetails | null = null;

  // Chart data
  replicaChartData: any;
  replicaChartOptions: any;
  
  rewardChartData: any;
  rewardChartOptions: any;
  
  metricsChartData: any;
  metricsChartOptions: any;

  constructor() {}

  ngOnInit() {
    // Initialize without selection to show the empty state
  }

  selectDeployment(deployment: Deployment) {
    // Generate detailed data for selected deployment
    this.selectedDeployment = {
      ...deployment,
      replicaHistory: this.generateReplicaHistory(deployment.replicas),
      rewardHistory: this.generateRewardHistory(deployment.avgReward),
      cpuHistory: this.generateMetricHistory(deployment.cpu),
      memoryHistory: this.generateMetricHistory(deployment.memory),
      latencyHistory: this.generateMetricHistory(deployment.latency)
    };

    this.initCharts();
  }

  generateReplicaHistory(current: number): number[] {
    const history = [];
    let value = current;
    for (let i = 0; i < 24; i++) {
      value += Math.floor(Math.random() * 3) - 1;
      value = Math.max(1, Math.min(value, current + 2));
      history.push(value);
    }
    return history;
  }

  generateRewardHistory(avg: number): number[] {
    const history = [];
    for (let i = 0; i < 24; i++) {
      const variation = (Math.random() - 0.5) * 0.2;
      history.push(Math.max(0, Math.min(1, avg + variation)));
    }
    return history;
  }

  generateMetricHistory(current: number): number[] {
    const history = [];
    for (let i = 0; i < 24; i++) {
      const variation = (Math.random() - 0.5) * 20;
      history.push(Math.max(0, Math.min(100, current + variation)));
    }
    return history;
  }

  initCharts() {
    if (!this.selectedDeployment) return;

    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    // Replica History Chart
    this.replicaChartData = {
      labels: hours,
      datasets: [
        {
          label: 'Replicas',
          data: this.selectedDeployment.replicaHistory,
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

    this.replicaChartOptions = this.getChartOptions('Replicas over time');

    // Reward History Chart
    this.rewardChartData = {
      labels: hours,
      datasets: [
        {
          label: 'Reward',
          data: this.selectedDeployment.rewardHistory,
          fill: true,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    };

    this.rewardChartOptions = this.getChartOptions('Average reward over time');

    // Metrics Chart (CPU, Memory, Latency)
    this.metricsChartData = {
      labels: hours,
      datasets: [
        {
          label: 'CPU %',
          data: this.selectedDeployment.cpuHistory,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Memory %',
          data: this.selectedDeployment.memoryHistory,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Latency',
          data: this.selectedDeployment.latencyHistory,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    };

    this.metricsChartOptions = this.getChartOptions('Resource metrics over time');
  }

  getChartOptions(title: string): any {
    return {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: { size: 11 },
            usePointStyle: true,
            padding: 15
          }
        },
        title: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#94a3b8',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: true
        }
      },
      scales: {
        x: {
          display: true,
          grid: { color: '#1e293b', drawBorder: false },
          ticks: { 
            color: '#64748b', 
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12
          }
        },
        y: {
          display: true,
          grid: { color: '#1e293b', drawBorder: false },
          ticks: { 
            color: '#64748b',
            font: { size: 10 }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
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

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatReward(reward: number): string {
    return reward.toFixed(3);
  }

  getRewardClass(reward: number): string {
    if (reward >= 0.5) return 'reward-high';
    if (reward >= 0.3) return 'reward-medium';
    return 'reward-low';
  }

  getCpuClass(cpu: number): string {
    if (cpu >= 80) return 'metric-high';
    if (cpu >= 60) return 'metric-medium';
    return 'metric-low';
  }

  getMemoryClass(memory: number): string {
    if (memory >= 80) return 'metric-high';
    if (memory >= 60) return 'metric-medium';
    return 'metric-low';
  }
}
