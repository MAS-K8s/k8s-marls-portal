import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription, of } from 'rxjs';
import { switchMap, catchError, startWith } from 'rxjs/operators';

// ─── Raw Flask /dashboard shapes ─────────────────────────────────────────────

export interface FlaskDecision {
  timestamp:      string;
  action:         string;
  action_id:      number;
  reward:         number;
  confidence:     number;
  value_estimate: number;
  replicas:       number;
  buffer_size:    number;
  training_steps: number;
}

export interface FlaskTrainingStep {
  timestamp:   string;
  step:        number;
  policy_loss: number;
  value_loss:  number;
  avg_reward:  number;
  entropy:     number;
}

export interface AgentDashboard {
  last_action:          string;
  last_action_id:       number;
  confidence:           number;
  action_probabilities: number[];   // [scale_down, no_action, scale_up]
  value_estimate:       number;
  last_decision_ts:     string | null;
  replicas:             number;
  pod_ready:            number;
  pod_pending:          number;
  cpu_usage:            number;
  memory_gib:           number;
  request_rate:         number;
  latency_p95:          number;
  error_rate:           number;
  training_steps:       number;
  avg_reward_100:       number;
  buffer_size:          number;
  device:               string;
  decision_history:     FlaskDecision[];
  training_history:     FlaskTrainingStep[];
}

export interface DashboardResponse {
  agents:          Record<string, AgentDashboard>;
  total_agents:    number;
  redis_available: boolean;
  timestamp:       string;
}

// ─── View-model emitted to the component ─────────────────────────────────────

export interface AutoscalingState {
  connected:      boolean;
  corsError:      boolean;
  lastPollTs:     string;
  totalAgents:    number;
  redisAvailable: boolean;
  agentKeys:      string[];
  agents:         Record<string, AgentDashboard>;
  raw:            DashboardResponse | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PodAutoscalingService implements OnDestroy {

  // ── ALL URLs live here — never in the component ──────────────────────────
  readonly rlAgentUrl = 'https://rl-agent.dev-sachin.co.uk';
  private readonly POLL_MS = 4_000;

  private readonly stateSub$ = new BehaviorSubject<AutoscalingState>({
    connected:      false,
    corsError:      false,
    lastPollTs:     '—',
    totalAgents:    0,
    redisAvailable: false,
    agentKeys:      [],
    agents:         {},
    raw:            null,
  });

  readonly state$: Observable<AutoscalingState> = this.stateSub$.asObservable();

  private subs = new Subscription();

  constructor(
    private http: HttpClient,
    private zone: NgZone,
  ) {
    this.startPolling();
  }

  private startPolling(): void {
    const poll$ = interval(this.POLL_MS).pipe(
      startWith(0),
      switchMap(() =>
        this.http.get<DashboardResponse>(`${this.rlAgentUrl}/dashboard`).pipe(
          catchError(err => {
            this.zone.run(() => {
              this.stateSub$.next({
                ...this.stateSub$.getValue(),
                connected:  false,
                corsError:  err.status === 0,
                lastPollTs: this.nowTs(),
              });
            });
            return of(null);
          })
        )
      )
    );

    this.subs.add(
      poll$.subscribe((res: DashboardResponse | null) => {
        if (!res) return;
        this.zone.run(() => {
          const keys = Object.keys(res.agents ?? {});
          this.stateSub$.next({
            connected:      true,
            corsError:      false,
            lastPollTs:     this.nowTs(),
            totalAgents:    res.total_agents ?? 0,
            redisAvailable: res.redis_available ?? false,
            agentKeys:      keys,
            agents:         res.agents ?? {},
            raw:            res,
          });
        });
      })
    );
  }

  /** Snapshot of a single agent — used by the component after selecting a tab */
  getAgent(key: string): AgentDashboard | null {
    return this.stateSub$.getValue().agents[key] ?? null;
  }

  private nowTs(): string {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(n => String(n).padStart(2, '0')).join(':');
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
