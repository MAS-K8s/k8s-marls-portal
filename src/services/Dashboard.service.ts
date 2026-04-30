import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Observable, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';


export interface AgentDecision {
  timestamp: string;
  action: string;
  action_id: number;
  reward: number;
  confidence: number;
  value_estimate: number;
  replicas: number;
  buffer_size: number;
  training_steps: number;
}

export interface TrainingStep {
  timestamp: string;
  step: number;
  policy_loss: number;
  value_loss: number;
  avg_reward: number;
  entropy: number;
}

export interface RawAgentData {
  last_action: string;
  last_action_id: number;
  confidence: number;
  action_probabilities: number[];
  value_estimate: number;
  last_decision_ts: string | null;
  replicas: number;
  pod_ready: number;
  pod_pending: number;
  cpu_usage: number;
  memory_gib: number;
  request_rate: number;
  latency_p95: number;
  error_rate: number;
  training_steps: number;
  avg_reward_100: number;
  buffer_size: number;
  device: string;
  decision_history: AgentDecision[];
  training_history: TrainingStep[];
}

export interface DashboardApiResponse {
  agents: Record<string, RawAgentData>;
  total_agents: number;
  redis_available: boolean;
  timestamp: string;
}

// ── UI view model ─────────────────────────────────────────────────────────────

export interface AgentVM {
  key: string;
  namespace: string;
  serviceName: string;
  lastAction: 'scale_up' | 'no_action' | 'scale_down';
  confidence: number;
  actionProbs: number[];
  valueEstimate: number;
  replicas: number;
  podReady: number;
  podPending: number;
  cpuPct: number;
  memGib: number;
  requestRate: number;
  latencyMs: number;
  errorRate: number;
  trainingSteps: number;
  avgReward100: number;
  bufferSize: number;
  device: string;
  decisionHistory: AgentDecision[];
  trainingHistory: TrainingStep[];
  status: 'healthy' | 'scaling' | 'warning' | 'critical';
  maxReplicas: number;
  cpuSparkline: number[];
  lastDecisionTs: string | null;
}

export interface MarlsVM {
  agents: AgentVM[];
  totalAgents: number;
  redisAvailable: boolean;
  totalReplicas: number;
  availableCapacity: number;
  avgReward: number;
  avgCpu: number;
  avgLatencyMs: number;
  avgConfidence: number;
  totalTrainingSteps: number;
  totalDecisions: number;
  timestamp: string;
  rewardHistory: number[];
  epsilon: number;
  epsilonHistory: number[];
  connected: boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MarlsDashboardService implements OnDestroy {

  // ⬇ Change this to your Flask host if not localhost
  private readonly RL_URL = 'https://rl-agent.dev-sachin.co.uk';
   private readonly API_Gateway_URL = 'https://marls.api-gateway.dev-sachin.co.uk';
  private readonly POLL_MS = 3000;
  private readonly RING = 30;

  private readonly vmSub$        = new BehaviorSubject<MarlsVM | null>(null);
  private readonly connectedSub$ = new BehaviorSubject<boolean>(false);
  private readonly loadingSub$   = new BehaviorSubject<boolean>(true);
  private readonly errorSub$     = new BehaviorSubject<string | null>(null);

  readonly dashboard$:   Observable<MarlsVM | null> = this.vmSub$.asObservable();
  readonly isConnected$: Observable<boolean>        = this.connectedSub$.asObservable();
  readonly isLoading$:   Observable<boolean>        = this.loadingSub$.asObservable();
  readonly errorMsg$:    Observable<string | null>  = this.errorSub$.asObservable();

  private rewardBuf: number[] = [];
  private epsBuf:    number[] = [];
  private cpuBufs:   Record<string, number[]> = {};
  private decisions  = 0;

  private pollSub = new Subscription();

  constructor(private http: HttpClient) {
    this.fetch();
    this.pollSub = interval(this.POLL_MS).subscribe(() => this.fetch());
  }

  private fetch(): void {
    this.http.get<DashboardApiResponse>(`${this.API_Gateway_URL}/gateway/marls-rl-agent/dashboard`).pipe(
      catchError((e: { message: string }) => {
        this.connectedSub$.next(false);
        this.loadingSub$.next(false);
        this.errorSub$.next(`Agent unreachable — ${e.message}`);
        return of(null);
      })
    ).subscribe((raw: DashboardApiResponse | null) => {
      if (!raw) return;
      this.loadingSub$.next(false);
      this.connectedSub$.next(true);
      this.errorSub$.next(null);
      this.vmSub$.next(this.transform(raw));
    });
  }

  private transform(raw: DashboardApiResponse): MarlsVM {
    const agents = Object.entries(raw.agents ?? {}).map(
      ([k, v]: [string, RawAgentData]) => this.buildAgent(k, v)
    );
    const mean = (arr: number[]) =>
      arr.length ? arr.reduce((s: number, v: number) => s + v, 0) / arr.length : 0;

    const avgReward = mean(agents.map((a: AgentVM) => a.avgReward100));
    const avgCpu    = mean(agents.map((a: AgentVM) => a.cpuPct));
    const avgLat    = mean(agents.map((a: AgentVM) => a.latencyMs));
    const avgConf   = mean(agents.map((a: AgentVM) => a.confidence));
    const totalRep  = agents.reduce((s: number, a: AgentVM) => s + a.replicas, 0);
    const totalStep = agents.reduce((s: number, a: AgentVM) => s + a.trainingSteps, 0);

    this.ring(this.rewardBuf, avgReward);
    const eps = Math.max(0.05, 0.95 * Math.exp(-totalStep / 5000));
    this.ring(this.epsBuf, eps);

    const dec = agents.reduce((s: number, a: AgentVM) => s + (a.decisionHistory?.length ?? 0), 0);
    if (dec > this.decisions) this.decisions = dec;

    return {
      agents,
      totalAgents: raw.total_agents,
      redisAvailable: raw.redis_available,
      totalReplicas: totalRep,
      availableCapacity: Math.max(0, 50 - totalRep),
      avgReward, avgCpu, avgLatencyMs: avgLat,
      avgConfidence: avgConf,
      totalTrainingSteps: totalStep,
      totalDecisions: this.decisions,
      timestamp: raw.timestamp,
      rewardHistory: [...this.rewardBuf],
      epsilon: eps,
      epsilonHistory: [...this.epsBuf],
      connected: true,
    };
  }

  private buildAgent(key: string, d: RawAgentData): AgentVM {
    const idx = key.indexOf('/');
    const namespace   = idx >= 0 ? key.slice(0, idx) : 'default';
    const serviceName = idx >= 0 ? key.slice(idx + 1) : key;

    if (!this.cpuBufs[key]) this.cpuBufs[key] = [];
    this.ring(this.cpuBufs[key], (d.cpu_usage ?? 0) * 100, 20);

    const cpuPct    = Math.round((d.cpu_usage   ?? 0) * 100);
    const latencyMs = Math.round((d.latency_p95 ?? 0) * 1000);

    let status: AgentVM['status'] = 'healthy';
    if ((d.error_rate ?? 0) > 0.05)         status = 'critical';
    else if (latencyMs > 500 || cpuPct > 85) status = 'warning';
    else if (d.last_action !== 'no_action')  status = 'scaling';

    return {
      key, namespace, serviceName,
      lastAction:      (d.last_action ?? 'no_action') as AgentVM['lastAction'],
      confidence:      d.confidence          ?? 0,
      actionProbs:     d.action_probabilities ?? [0.33, 0.34, 0.33],
      valueEstimate:   d.value_estimate      ?? 0,
      replicas:        d.replicas            ?? 0,
      podReady:        d.pod_ready           ?? 0,
      podPending:      d.pod_pending         ?? 0,
      cpuPct, memGib: d.memory_gib ?? 0,
      requestRate:     d.request_rate        ?? 0,
      latencyMs,
      errorRate:       d.error_rate          ?? 0,
      trainingSteps:   d.training_steps      ?? 0,
      avgReward100:    d.avg_reward_100       ?? 0,
      bufferSize:      d.buffer_size         ?? 0,
      device:          d.device              ?? 'cpu',
      decisionHistory: d.decision_history    ?? [],
      trainingHistory: d.training_history    ?? [],
      status, maxReplicas: 20,
      cpuSparkline:    [...this.cpuBufs[key]],
      lastDecisionTs:  d.last_decision_ts ?? null,
    };
  }

  private ring(buf: number[], val: number, max: number = this.RING): void {
    buf.push(val);
    if (buf.length > max) buf.shift();
  }

  static actionLabel(a: string): string {
    return a === 'scale_up' ? '↑ Scale Up' : a === 'scale_down' ? '↓ Scale Down' : '● Hold';
  }
  static actionClass(a: string): string {
    return a === 'scale_up' ? 'act-up' : a === 'scale_down' ? 'act-down' : 'act-hold';
  }
  static statusColor(s: string): string {
    const m: Record<string, string> = {
      healthy: '#10b981', scaling: '#22d3ee', warning: '#f59e0b', critical: '#ef4444',
    };
    return m[s] ?? '#64748b';
  }

  ngOnDestroy(): void { this.pollSub.unsubscribe(); }
}
