import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject, Observable, interval,
  Subscription, of
} from 'rxjs';
import { catchError } from 'rxjs/operators';

// ── Re-use the same raw types from the shared MARLS service ──────────────────
// (import from wherever you placed marls-dashboard.service.ts)
import {
  MarlsDashboardService,
  MarlsVM, AgentVM, AgentDecision, TrainingStep,
} from '../services/Dashboard.service';

// ── Decision row shown in the table ──────────────────────────────────────────

export interface DecisionEntry {
  id:            string;          // unique key for PrimeNG selection
  agentKey:      string;          // e.g. "default/cpu-stress-app"
  deployment:    string;          // short service name
  namespace:     string;
  action:        'scale_up' | 'no_action' | 'scale_down';
  replicasBefore: number;
  replicasAfter:  number;
  reward:         number;
  confidence:     number;
  valueEstimate:  number;
  bufferSize:     number;
  trainingSteps:  number;
  timestamp:      Date;
  isNew:          boolean;

  // State vector snapshot (from AgentVM live data at decision time)
  stateVector: {
    cpu:       number;   // percentage
    memory:    number;   // percentage
    latency:   number;   // ms
    errorRate: number;   // percentage
    replicas:  number;
    requestRate: number;
    podReady:  number;
    podPending: number;
  };

  // PPO action probabilities  [scale_down, no_action, scale_up]
  actionProbs: number[];

  // Synthetic cost estimate: $0.05 per replica per hour
  estimatedCost: number;
}

// ── Agent decisions state ─────────────────────────────────────────────────────

export interface AgentDecisionsState {
  decisions:      DecisionEntry[];
  totalDecisions: number;
  connected:      boolean;
  loading:        boolean;
  errorMsg:       string | null;
  lastSyncAt:     Date | null;
  agentKeys:      string[];
  // Per-agent summary
  summary: Record<string, {
    scaleUpCount:   number;
    scaleDownCount: number;
    holdCount:      number;
    avgReward:      number;
    totalSteps:     number;
  }>;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AgentDecisionsService implements OnDestroy {

  // ── All URLs / config live here — never in the component ─────────────────
  readonly rlAgentUrl    = 'http://localhost:5000';   // ← change for production
  readonly pollIntervalMs = 3000;

  private readonly stateSub$ = new BehaviorSubject<AgentDecisionsState>({
    decisions:      [],
    totalDecisions: 0,
    connected:      false,
    loading:        true,
    errorMsg:       null,
    lastSyncAt:     null,
    agentKeys:      [],
    summary:        {},
  });

  readonly state$: Observable<AgentDecisionsState> = this.stateSub$.asObservable();

  // Counter so each entry gets a stable unique id
  private idCounter = 0;
  // Track which decision timestamps we've already added to avoid duplicates
  private seenIds   = new Set<string>();

  private subs = new Subscription();

  constructor(private marlsSvc: MarlsDashboardService) {
    // Piggy-back on the shared MarlsDashboardService which already polls /dashboard.
    // This way we have ONE HTTP polling loop for the whole app.
    this.subs.add(
      this.marlsSvc.dashboard$.subscribe((vm: MarlsVM | null) => {
        if (!vm) return;
        this.ingest(vm);
      })
    );

    this.subs.add(
      this.marlsSvc.isConnected$.subscribe((v: boolean) => {
        this.patch({ connected: v });
      })
    );
    this.subs.add(
      this.marlsSvc.isLoading$.subscribe((v: boolean) => {
        this.patch({ loading: v });
      })
    );
    this.subs.add(
      this.marlsSvc.errorMsg$.subscribe((v: string | null) => {
        this.patch({ errorMsg: v });
      })
    );
  }

  // ── Ingest new data from the shared dashboard stream ─────────────────────

  private ingest(vm: MarlsVM): void {
    const current = this.stateSub$.getValue();
    const newEntries: DecisionEntry[] = [];
    const summary: AgentDecisionsState['summary'] = { ...current.summary };

    vm.agents.forEach((agent: AgentVM) => {
      if (!summary[agent.key]) {
        summary[agent.key] = { scaleUpCount: 0, scaleDownCount: 0, holdCount: 0, avgReward: 0, totalSteps: 0 };
      }

      // Update per-agent summary from latest agent state
      summary[agent.key].totalSteps = agent.trainingSteps;

      // Walk decision history and add any we haven't seen yet
      (agent.decisionHistory ?? []).forEach((d: AgentDecision) => {
        // Build a stable dedup key from agentKey + timestamp + action
        const dedupKey = `${agent.key}::${d.timestamp}::${d.action}::${d.training_steps}`;
        if (this.seenIds.has(dedupKey)) return;
        this.seenIds.add(dedupKey);

        const action = d.action as DecisionEntry['action'];
        const repBefore = action === 'scale_up'   ? d.replicas - 1
                        : action === 'scale_down'  ? d.replicas + 1
                        : d.replicas;

        const entry: DecisionEntry = {
          id:             String(++this.idCounter),
          agentKey:       agent.key,
          deployment:     agent.serviceName,
          namespace:      agent.namespace,
          action,
          replicasBefore: repBefore,
          replicasAfter:  d.replicas,
          reward:         d.reward,
          confidence:     d.confidence,
          valueEstimate:  d.value_estimate,
          bufferSize:     d.buffer_size,
          trainingSteps:  d.training_steps,
          timestamp:      new Date(d.timestamp),
          isNew:          true,

          stateVector: {
            cpu:         agent.cpuPct,
            memory:      Math.round((agent.memGib / 4) * 100),
            latency:     agent.latencyMs,
            errorRate:   Math.round(agent.errorRate * 100 * 100) / 100,
            replicas:    d.replicas,
            requestRate: agent.requestRate,
            podReady:    agent.podReady,
            podPending:  agent.podPending,
          },

          actionProbs:   agent.actionProbs ?? [0.33, 0.34, 0.33],
          estimatedCost: d.replicas * 0.05,
        };

        newEntries.push(entry);

        // Update counts
        if (action === 'scale_up')   summary[agent.key].scaleUpCount++;
        else if (action === 'scale_down') summary[agent.key].scaleDownCount++;
        else                         summary[agent.key].holdCount++;
      });

      // Rolling avg reward from training history
      const rewardArr = (agent.trainingHistory ?? []).map((t: TrainingStep) => t.avg_reward);
      if (rewardArr.length) {
        summary[agent.key].avgReward = rewardArr.reduce((s: number, v: number) => s + v, 0) / rewardArr.length;
      }
    });

    if (newEntries.length === 0 && Object.keys(summary).length === Object.keys(current.summary).length) {
      // Nothing new — just update summary and sync timestamp
      this.patch({ summary, lastSyncAt: new Date() });
      return;
    }

    // Merge new entries at the front, cap at 500 total
    const merged = [...newEntries, ...current.decisions.map(d => ({ ...d, isNew: false }))]
      .slice(0, 500);

    this.stateSub$.next({
      ...current,
      decisions:      merged,
      totalDecisions: merged.length,
      connected:      true,
      loading:        false,
      errorMsg:       null,
      lastSyncAt:     new Date(),
      agentKeys:      vm.agents.map((a: AgentVM) => a.key),
      summary,
    });

    // Clear isNew flag after 2 s so flash animation only plays once
    setTimeout(() => {
      const s = this.stateSub$.getValue();
      this.stateSub$.next({
        ...s,
        decisions: s.decisions.map(d => ({ ...d, isNew: false })),
      });
    }, 2000);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private patch(partial: Partial<AgentDecisionsState>): void {
    this.stateSub$.next({ ...this.stateSub$.getValue(), ...partial });
  }

  /** Filter decisions by action type */
  filterByAction(decisions: DecisionEntry[], action: string): DecisionEntry[] {
    if (!action || action === 'all') return decisions;
    return decisions.filter(d => d.action === action);
  }

  /** Filter decisions by search text (deployment name) */
  filterBySearch(decisions: DecisionEntry[], text: string): DecisionEntry[] {
    if (!text.trim()) return decisions;
    const lower = text.toLowerCase();
    return decisions.filter(d =>
      d.deployment.toLowerCase().includes(lower) ||
      d.namespace.toLowerCase().includes(lower)
    );
  }

  /** Export decisions to CSV and trigger browser download */
  exportCSV(decisions: DecisionEntry[]): void {
    const headers = [
      'ID','Deployment','Namespace','Action',
      'Replicas Before','Replicas After','Reward',
      'Confidence','Value Estimate','Training Steps',
      'CPU %','Memory %','Latency ms','Error Rate %',
      'Request Rate','Estimated Cost $/hr','Timestamp',
    ];

    const rows = decisions.map(d => [
      d.id, d.deployment, d.namespace, d.action,
      d.replicasBefore, d.replicasAfter,
      d.reward.toFixed(4),
      (d.confidence * 100).toFixed(1) + '%',
      d.valueEstimate.toFixed(4),
      d.trainingSteps,
      d.stateVector.cpu, d.stateVector.memory,
      d.stateVector.latency, d.stateVector.errorRate,
      d.stateVector.requestRate.toFixed(2),
      d.estimatedCost.toFixed(4),
      d.timestamp.toISOString(),
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `marls-decisions-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
