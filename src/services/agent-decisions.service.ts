import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { environment } from '../environments/environment';
import {
  MarlsDashboardService,
  MarlsVM, AgentVM, AgentDecision, TrainingStep,
} from './Dashboard.service';

import {
  IDecisionEntry,
  IAgentSummary,
  IAgentDecisionsState,
  DecisionAction,
} from '../dto/AgentMetrics.dto';

@Injectable({ providedIn: 'root' })
export class AgentDecisionsService implements OnDestroy {

  readonly rlAgentUrl     = environment.rlAgentUrl;
  readonly pollIntervalMs = environment.pollIntervalMs;

  private readonly stateSub$ = new BehaviorSubject<IAgentDecisionsState>({
    decisions:      [],
    totalDecisions: 0,
    connected:      false,
    loading:        true,
    errorMsg:       null,
    lastSyncAt:     null,
    agentKeys:      [],
    summary:        {},
  });

  readonly state$: Observable<IAgentDecisionsState> = this.stateSub$.asObservable();

  private idCounter = 0;
  private seenIds   = new Set<string>();
  private subs      = new Subscription();

  constructor(private marlsSvc: MarlsDashboardService) {
    this.subs.add(
      this.marlsSvc.dashboard$.subscribe((vm: MarlsVM | null) => {
        if (!vm) return;
        this.ingest(vm);
      })
    );
    this.subs.add(this.marlsSvc.isConnected$.subscribe((v: boolean) => this.patch({ connected: v })));
    this.subs.add(this.marlsSvc.isLoading$.subscribe((v: boolean)   => this.patch({ loading: v })));
    this.subs.add(this.marlsSvc.errorMsg$.subscribe((v: string | null) => this.patch({ errorMsg: v })));
  }

  // ── Ingest new data from the shared dashboard stream ─────────────────────

  private ingest(vm: MarlsVM): void {
    const current = this.stateSub$.getValue();
    const newEntries: IDecisionEntry[] = [];
    const summary: Record<string, IAgentSummary> = { ...current.summary };

    vm.agents.forEach((agent: AgentVM) => {
      if (!summary[agent.key]) {
        summary[agent.key] = { scaleUpCount: 0, scaleDownCount: 0, holdCount: 0, avgReward: 0, totalSteps: 0 };
      }
      summary[agent.key].totalSteps = agent.trainingSteps;

      (agent.decisionHistory ?? []).forEach((d: AgentDecision) => {
        const dedupKey = `${agent.key}::${d.timestamp}::${d.action}::${d.training_steps}`;
        if (this.seenIds.has(dedupKey)) return;
        this.seenIds.add(dedupKey);

        const action: DecisionAction = d.action as DecisionAction;
        const repBefore =
          action === 'scale_up'   ? d.replicas - 1 :
          action === 'scale_down' ? d.replicas + 1 :
          d.replicas;

        const entry: IDecisionEntry = {
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

        if (action === 'scale_up')        summary[agent.key].scaleUpCount++;
        else if (action === 'scale_down') summary[agent.key].scaleDownCount++;
        else                              summary[agent.key].holdCount++;
      });

      const rewardArr = (agent.trainingHistory ?? []).map((t: TrainingStep) => t.avg_reward);
      if (rewardArr.length) {
        summary[agent.key].avgReward = rewardArr.reduce((s: number, v: number) => s + v, 0) / rewardArr.length;
      }
    });

    if (newEntries.length === 0 && Object.keys(summary).length === Object.keys(current.summary).length) {
      this.patch({ summary, lastSyncAt: new Date() });
      return;
    }

    const merged: IDecisionEntry[] = [
      ...newEntries,
      ...current.decisions.map((d: IDecisionEntry) => ({ ...d, isNew: false })),
    ].slice(0, 500);

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

    setTimeout(() => {
      const s = this.stateSub$.getValue();
      this.stateSub$.next({
        ...s,
        decisions: s.decisions.map((d: IDecisionEntry) => ({ ...d, isNew: false })),
      });
    }, 2000);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private patch(partial: Partial<IAgentDecisionsState>): void {
    this.stateSub$.next({ ...this.stateSub$.getValue(), ...partial });
  }

  filterByAction(decisions: IDecisionEntry[], action: string): IDecisionEntry[] {
    if (!action || action === 'all') return decisions;
    return decisions.filter((d: IDecisionEntry) => d.action === action);
  }

  filterBySearch(decisions: IDecisionEntry[], text: string): IDecisionEntry[] {
    if (!text.trim()) return decisions;
    const lower = text.toLowerCase();
    return decisions.filter((d: IDecisionEntry) =>
      d.deployment.toLowerCase().includes(lower) ||
      d.namespace.toLowerCase().includes(lower)
    );
  }

  exportCSV(decisions: IDecisionEntry[]): void {
    const headers = [
      'ID','Deployment','Namespace','Action',
      'Replicas Before','Replicas After','Reward',
      'Confidence','Value Estimate','Training Steps',
      'CPU %','Memory %','Latency ms','Error Rate %',
      'Request Rate','Estimated Cost $/hr','Timestamp',
    ];

    const rows = decisions.map((d: IDecisionEntry) => [
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

    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `marls-decisions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}