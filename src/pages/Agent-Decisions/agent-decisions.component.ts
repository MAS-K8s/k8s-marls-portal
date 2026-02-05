import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';

interface Decision {
  id: string;
  deployment: string;
  action: 'scale-up' | 'scale-down' | 'maintain';
  replicasBefore: number;
  replicasAfter: number;
  reward: number;
  epsilon: number;
  timestamp: string;
  stateVector: {
    cpu: number;
    memory: number;
    latency: number;
    errorRate: number;
  };
  qValues: {
    scaleUp: number;
    maintain: number;
    scaleDown: number;
  };
  estimatedCost: number;
}

interface ActionFilter {
  label: string;
  value: string;
}

@Component({
  selector: 'app-agent-decisions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    CardModule,
  ],
  templateUrl: './agent-decisions.component.html',
  styleUrl: './agent-decisions.component.scss',
})
export class AgentDecisionsComponent implements OnInit {
  searchText: string = '';
  selectedActionFilter: string = 'all';
  
  actionFilters: ActionFilter[] = [
    { label: 'All Actions', value: 'all' },
    { label: 'Scale Up', value: 'scale-up' },
    { label: 'Scale Down', value: 'scale-down' },
    { label: 'Maintain', value: 'maintain' }
  ];

  decisions: Decision[] = [
    {
      id: '1',
      deployment: 'notification-worker',
      action: 'scale-up',
      replicasBefore: 1,
      replicasAfter: 2,
      reward: 0.4800,
      epsilon: 0.6800,
      timestamp: '17:15:36',
      stateVector: {
        cpu: 88.0,
        memory: 75.0,
        latency: 85.0,
        errorRate: 0.02
      },
      qValues: {
        scaleUp: 0.620,
        maintain: 0.280,
        scaleDown: -0.180
      },
      estimatedCost: 1.80
    },
    {
      id: '2',
      deployment: 'payment-service',
      action: 'scale-up',
      replicasBefore: 2,
      replicasAfter: 3,
      reward: 0.7200,
      epsilon: 0.6200,
      timestamp: '17:15:36',
      stateVector: {
        cpu: 92.5,
        memory: 82.0,
        latency: 95.0,
        errorRate: 0.05
      },
      qValues: {
        scaleUp: 0.720,
        maintain: 0.350,
        scaleDown: -0.220
      },
      estimatedCost: 2.40
    },
    {
      id: '3',
      deployment: 'api-gateway',
      action: 'scale-down',
      replicasBefore: 6,
      replicasAfter: 5,
      reward: 0.3200,
      epsilon: 0.6500,
      timestamp: '17:15:36',
      stateVector: {
        cpu: 35.0,
        memory: 42.0,
        latency: 45.0,
        errorRate: 0.01
      },
      qValues: {
        scaleUp: 0.150,
        maintain: 0.280,
        scaleDown: 0.320
      },
      estimatedCost: 2.10
    },
    {
      id: '4',
      deployment: 'notification-worker',
      action: 'maintain',
      replicasBefore: 2,
      replicasAfter: 2,
      reward: 0.2800,
      epsilon: 0.6200,
      timestamp: '17:15:36',
      stateVector: {
        cpu: 55.0,
        memory: 60.0,
        latency: 70.0,
        errorRate: 0.02
      },
      qValues: {
        scaleUp: 0.250,
        maintain: 0.380,
        scaleDown: 0.120
      },
      estimatedCost: 1.60
    },
    {
      id: '5',
      deployment: 'api-gateway',
      action: 'maintain',
      replicasBefore: 5,
      replicasAfter: 5,
      reward: 0.4500,
      epsilon: 0.6200,
      timestamp: '17:15:36',
      stateVector: {
        cpu: 60.0,
        memory: 58.0,
        latency: 65.0,
        errorRate: 0.01
      },
      qValues: {
        scaleUp: 0.380,
        maintain: 0.450,
        scaleDown: 0.200
      },
      estimatedCost: 2.00
    },
    {
      id: '6',
      deployment: 'user-service',
      action: 'scale-up',
      replicasBefore: 3,
      replicasAfter: 4,
      reward: 0.5200,
      epsilon: 0.6800,
      timestamp: '17:15:36',
      stateVector: {
        cpu: 78.0,
        memory: 72.0,
        latency: 80.0,
        errorRate: 0.03
      },
      qValues: {
        scaleUp: 0.520,
        maintain: 0.310,
        scaleDown: -0.150
      },
      estimatedCost: 1.90
    },
    {
      id: '7',
      deployment: 'api-gateway',
      action: 'scale-up',
      replicasBefore: 3,
      replicasAfter: 5,
      reward: 0.6500,
      epsilon: 0.6200,
      timestamp: '17:15:36',
      stateVector: {
        cpu: 85.0,
        memory: 80.0,
        latency: 90.0,
        errorRate: 0.04
      },
      qValues: {
        scaleUp: 0.650,
        maintain: 0.400,
        scaleDown: -0.100
      },
      estimatedCost: 2.30
    },
    {
      id: '8',
      deployment: 'payment-service',
      action: 'maintain',
      replicasBefore: 3,
      replicasAfter: 3,
      reward: 0.4200,
      epsilon: 0.6500,
      timestamp: '17:15:36',
      stateVector: {
        cpu: 62.0,
        memory: 65.0,
        latency: 68.0,
        errorRate: 0.02
      },
      qValues: {
        scaleUp: 0.350,
        maintain: 0.420,
        scaleDown: 0.180
      },
      estimatedCost: 1.70
    },
    {
      id: '9',
      deployment: 'user-service',
      action: 'scale-down',
      replicasBefore: 5,
      replicasAfter: 4,
      reward: 0.3800,
      epsilon: 0.6200,
      timestamp: '17:15:36',
      stateVector: {
        cpu: 42.0,
        memory: 48.0,
        latency: 52.0,
        errorRate: 0.01
      },
      qValues: {
        scaleUp: 0.200,
        maintain: 0.300,
        scaleDown: 0.380
      },
      estimatedCost: 1.85
    },
    {
      id: '10',
      deployment: 'api-gateway',
      action: 'scale-up',
      replicasBefore: 4,
      replicasAfter: 6,
      reward: 0.5800,
      epsilon: 0.6500,
      timestamp: '17:15:36',
      stateVector: {
        cpu: 82.0,
        memory: 78.0,
        latency: 88.0,
        errorRate: 0.03
      },
      qValues: {
        scaleUp: 0.580,
        maintain: 0.380,
        scaleDown: -0.120
      },
      estimatedCost: 2.50
    }
  ];

  selectedDecision: Decision | null = null;
  filteredDecisions: Decision[] = [];
  totalDecisions: number = 10;

  // Expose Math to template
  Math = Math;

  constructor() {}

  ngOnInit() {
    this.filteredDecisions = [...this.decisions];
    this.totalDecisions = this.decisions.length;
    
    // Select first decision by default
    if (this.decisions.length > 0) {
      this.selectedDecision = this.decisions[0];
    }
  }

  onSearchChange() {
    this.applyFilters();
  }

  onActionFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.decisions];

    // Apply search filter
    if (this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(d => 
        d.deployment.toLowerCase().includes(searchLower)
      );
    }

    // Apply action filter
    if (this.selectedActionFilter !== 'all') {
      filtered = filtered.filter(d => d.action === this.selectedActionFilter);
    }

    this.filteredDecisions = filtered;
  }

  selectDecision(decision: Decision) {
    this.selectedDecision = decision;
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'scale-up':
        return 'pi-arrow-up';
      case 'scale-down':
        return 'pi-arrow-down';
      case 'maintain':
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
      case 'maintain':
        return 'action-maintain';
      default:
        return '';
    }
  }

  getActionLabel(action: string): string {
    switch (action) {
      case 'scale-up':
        return 'scale up';
      case 'scale-down':
        return 'scale down';
      case 'maintain':
        return 'maintain';
      default:
        return action;
    }
  }

  getReplicaChange(decision: Decision): string {
    if (decision.action === 'scale-up') {
      return `${decision.replicasBefore} ↗ ${decision.replicasAfter}`;
    } else if (decision.action === 'scale-down') {
      return `${decision.replicasBefore} ↘ ${decision.replicasAfter}`;
    } else {
      return `${decision.replicasBefore} — ${decision.replicasAfter}`;
    }
  }

  formatReward(reward: number): string {
    return reward.toFixed(4);
  }

  formatEpsilon(epsilon: number): string {
    return epsilon.toFixed(4);
  }

  formatQValue(value: number): string {
    return value.toFixed(3);
  }

  getQValueClass(value: number): string {
    if (value > 0.4) return 'q-value-high';
    if (value > 0) return 'q-value-medium';
    return 'q-value-low';
  }

  exportCSV() {
    // Implementation for CSV export
    console.log('Exporting to CSV...');
  }

  getBarWidth(value: number, max: number = 1): number {
    return (Math.abs(value) / max) * 100;
  }
}