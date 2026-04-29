import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Observable, Subscription } from 'rxjs';

import { TableModule, TableRowSelectEvent } from 'primeng/table';
import { ButtonModule }    from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { AgentDecisionsService } from '../../services/agent-decisions.service';
import {
  IAgentDecisionsState,
  IDecisionEntry,
  IAgentSummary,
} from '../../dto/AgentMetrics.dto';

interface IActionFilter {
  label:  string;
  value:  string;
  accent: 'muted' | 'green' | 'red';
}

interface IActionProbDisplay {
  label: string;
  prob:  number;
  color: string;
}

interface IStateDisplay {
  label:   string;
  display: string;
  barPct:  number;
  color:   string;
}

@Component({
  selector: 'app-agent-decisions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    CommonModule, FormsModule, DecimalPipe, DatePipe, PercentPipe,
    TableModule, ButtonModule, InputTextModule,
  ],
  templateUrl: './agent-decisions.component.html',
  styleUrl:    './agent-decisions.component.scss',
})
export class AgentDecisionsComponent implements OnInit, OnDestroy {

  // ── Observables ──────────────────────────────────────────────────────────
  state$: Observable<IAgentDecisionsState>;

  // ── Cached latest state for synchronous filter rebuilds ──────────────────
  private latestState: IAgentDecisionsState | null = null;

  // ── Filter state ─────────────────────────────────────────────────────────
  searchText     = '';
  selectedFilter = 'all';
  selectedAgent  = '';

  // ── Table selection ──────────────────────────────────────────────────────
  selectedDecision: IDecisionEntry | null = null;

  // ── Clock ────────────────────────────────────────────────────────────────
  now = new Date();

  // ── Derived display ──────────────────────────────────────────────────────
  filteredDecisions: IDecisionEntry[] = [];
  latestStep = 0;

  readonly actionFilters: IActionFilter[] = [
    { label: 'All',                value: 'all',        accent: 'muted' },
    { label: '&#8593; Scale Up',   value: 'scale_up',   accent: 'green' },
    { label: '&#9679; Hold',       value: 'no_action',  accent: 'muted' },
    { label: '&#8595; Scale Down', value: 'scale_down', accent: 'red'   },
  ];

  private subs = new Subscription();

  constructor(
    public svc: AgentDecisionsService,
    private cdr: ChangeDetectorRef,
  ) {
    this.state$ = this.svc.state$;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.subs.add(interval(1000).subscribe(() => {
      this.now = new Date();
      this.cdr.detectChanges();
    }));

    this.subs.add(this.svc.state$.subscribe((s: IAgentDecisionsState) => {
      this.latestState = s;
      this.rebuildFiltered(s);

      if (s.decisions.length) {
        this.latestStep = Math.max(
          ...s.decisions.map((d: IDecisionEntry) => d.trainingSteps)
        );
      } else {
        this.latestStep = 0;
      }

      this.cdr.detectChanges();
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Filter logic ─────────────────────────────────────────────────────────

  private rebuildFiltered(s: IAgentDecisionsState): void {
    let list: IDecisionEntry[] = s.decisions;

    if (this.selectedAgent) {
      list = list.filter((d: IDecisionEntry) => d.agentKey === this.selectedAgent);
    }

    list = this.svc.filterByAction(list, this.selectedFilter);
    list = this.svc.filterBySearch(list, this.searchText);

    this.filteredDecisions = list;
  }

  onFilterChange(): void {
    if (this.latestState) {
      this.rebuildFiltered(this.latestState);
      this.cdr.detectChanges();
    }
  }

  setFilter(value: string): void {
    this.selectedFilter = value;
    this.onFilterChange();
  }

  setAgent(key: string): void {
    this.selectedAgent = key;
    this.onFilterChange();
  }

  clearSearch(): void {
    this.searchText = '';
    this.onFilterChange();
  }

  onRowSelect(event: TableRowSelectEvent): void {
    this.selectedDecision = event.data as IDecisionEntry;
    this.cdr.detectChanges();
  }

  // ── Summary aggregators ───────────────────────────────────────────────────

  totalScaleUp(s: IAgentDecisionsState): number {
    return Object.values(s.summary).reduce(
      (t: number, v: IAgentSummary) => t + v.scaleUpCount, 0
    );
  }

  totalScaleDown(s: IAgentDecisionsState): number {
    return Object.values(s.summary).reduce(
      (t: number, v: IAgentSummary) => t + v.scaleDownCount, 0
    );
  }

  totalHold(s: IAgentDecisionsState): number {
    return Object.values(s.summary).reduce(
      (t: number, v: IAgentSummary) => t + v.holdCount, 0
    );
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  shortName(key: string): string {
    return key.split('/').pop() ?? key;
  }

  onExport(): void {
    this.svc.exportCSV(this.filteredDecisions);
  }

  actionProbDisplay(d: IDecisionEntry): IActionProbDisplay[] {
    const p = d.actionProbs ?? [0.33, 0.34, 0.33];
    return [
      { label: '&#8595; Scale Down', prob: p[0], color: '#ef4444' },
      { label: '&#9679; Hold',       prob: p[1], color: '#64748b' },
      { label: '&#8593; Scale Up',   prob: p[2], color: '#10b981' },
    ];
  }

  stateDisplay(d: IDecisionEntry): IStateDisplay[] {
    const sv = d.stateVector;
    return [
      { label: 'CPU',          display: `${sv.cpu}%`,                 barPct: sv.cpu,                              color: '#22d3ee' },
      { label: 'Memory',       display: `${sv.memory}%`,              barPct: sv.memory,                           color: '#10b981' },
      { label: 'Latency P95',  display: `${sv.latency}ms`,            barPct: Math.min(100, sv.latency / 10),      color: sv.latency   > 500 ? '#ef4444' : '#f59e0b' },
      { label: 'Error Rate',   display: `${sv.errorRate}%`,           barPct: Math.min(100, sv.errorRate * 10),    color: sv.errorRate > 5   ? '#ef4444' : '#10b981' },
      { label: 'Replicas',     display: `${sv.replicas} pods`,        barPct: (sv.replicas / 20) * 100,            color: '#3b82f6' },
      { label: 'Request Rate', display: `${sv.requestRate.toFixed(1)} rps`, barPct: Math.min(100, sv.requestRate), color: '#8b5cf6' },
      { label: 'Pod Ready',    display: `${sv.podReady} ready`,       barPct: Math.min(100, sv.podReady   * 20),   color: '#10b981' },
      { label: 'Pod Pending',  display: `${sv.podPending} pending`,   barPct: Math.min(100, sv.podPending * 25),   color: sv.podPending > 0 ? '#f59e0b' : '#64748b' },
    ];
  }
}