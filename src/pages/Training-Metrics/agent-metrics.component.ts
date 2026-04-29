import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, PercentPipe, UpperCasePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';

import { TableModule } from 'primeng/table';
import { TagModule }   from 'primeng/tag';

import { environment } from '../../environments/environment';

// ── Service (still using your shared dashboard observable) ──────────────────
import {
  MarlsDashboardService,
  MarlsVM, AgentVM, AgentDecision, TrainingStep,
} from '../../services/Dashboard.service';

// ── DTO / view-model types ──────────────────────────────────────────────────
import {
  ITrainingRow,
  IDecisionRow,
  IStateItem,
  IActionProb,
  IRewardComponent,
  IConfigItem,
  IPromQuery,
} from '../../dto/AgentMetrics.dto';

@Component({
  selector: 'app-agent-metrics',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, DatePipe, PercentPipe, UpperCasePipe,
    TableModule, TagModule,
  ],
  templateUrl: './agent-metrics.component.html',
  styleUrl:    './agent-metrics.component.scss',
})
export class AgentMetricsComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Canvas refs ──────────────────────────────────────────────────────────
  @ViewChild('plCanvas')  plRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('plWrap')    plWrap!: ElementRef<HTMLDivElement>;
  @ViewChild('vlCanvas')  vlRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('vlWrap')    vlWrap!: ElementRef<HTMLDivElement>;
  @ViewChild('entCanvas') entRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('entWrap')   entWrap!:ElementRef<HTMLDivElement>;
  @ViewChild('rwCanvas')  rwRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('rwWrap')    rwWrap!: ElementRef<HTMLDivElement>;

  // ── State ─────────────────────────────────────────────────────────────────
  vm: MarlsVM | null = null;
  connected  = false;
  loading    = true;
  errorMsg   = '';
  now        = new Date();
  rlUrl      = environment.rlAgentUrl;

  // Agent selection
  agentKeys:     string[] = [];
  selectedAgent  = '';
  currentAgent:  AgentVM | null = null;

  // Derived display data
  trainingHistory:  ITrainingRow[]      = [];
  decisionHistory:  IDecisionRow[]      = [];
  stateVector:      IStateItem[]        = [];
  actionProbs:      IActionProb[]       = [];
  rewardComponents: IRewardComponent[]  = [];
  totalReward       = 0;
  latestTraining:   TrainingStep | undefined;
  rewardTrend       = '—';
  confMin           = 0.60;

  // ── Static config panels ──────────────────────────────────────────────────
  readonly ppoConfig: IConfigItem[] = [
    { key: 'Algorithm',        val: 'PPO',          color: '#22d3ee' },
    { key: 'State Size',       val: '18 features',  color: '#8b5cf6' },
    { key: 'Action Space',     val: '3 discrete',   color: '#10b981' },
    { key: 'Learning Rate',    val: '1e-4 (Adam)',  color: '#f59e0b' },
    { key: 'Clip Epsilon',     val: '0.20',         color: '#3b82f6' },
    { key: 'GAE Lambda',       val: '0.95',         color: '#ec4899' },
    { key: 'Discount Gamma',   val: '0.99',         color: '#22d3ee' },
    { key: 'Buffer Capacity',  val: '32 steps',     color: '#8b5cf6' },
    { key: 'Epochs / Update',  val: '2',            color: '#10b981' },
    { key: 'Mini-Batch',       val: '8',            color: '#f59e0b' },
    { key: 'Entropy Coeff',    val: '0.05',         color: '#3b82f6' },
    { key: 'Value Coeff',      val: '0.10',         color: '#ec4899' },
    { key: 'Grad Clip Norm',   val: '0.5',          color: '#22d3ee' },
    { key: 'SLA Target P95',   val: '500ms',        color: '#8b5cf6' },
    { key: 'Train Every',      val: '1 step',       color: '#10b981' },
  ];

  readonly controllerScaling: IConfigItem[] = [
    { key: 'Min Replicas',    val: '1',                 color: '#10b981' },
    { key: 'Max Replicas',    val: '10',                color: '#22d3ee' },
    { key: 'Max Scale Step',  val: '1 per cycle',       color: '#8b5cf6' },
    { key: 'Cooldown',        val: '60s',               color: '#f59e0b' },
    { key: 'Confidence Gate', val: '≥ 60%',             color: '#ec4899' },
    { key: 'Interval',        val: '30s',               color: '#3b82f6' },
    { key: 'Label Selector',  val: 'rl-autoscale=true', color: '#22d3ee' },
  ];

  readonly controllerResilience: IConfigItem[] = [
    { key: 'Circuit Breaker',    val: 'Threshold: 5',     color: '#10b981' },
    { key: 'CB Open Duration',   val: '30s',              color: '#f59e0b' },
    { key: 'Prometheus Timeout', val: '3s',               color: '#22d3ee' },
    { key: 'RL Agent Timeout',   val: '2s',               color: '#8b5cf6' },
    { key: 'Retry Attempts',     val: '3',                color: '#3b82f6' },
    { key: 'Retry Base Delay',   val: '250ms',            color: '#ec4899' },
    { key: 'Max Concurrent',     val: '4 deployments',    color: '#22d3ee' },
    { key: 'Min-Replica Guard',  val: 'Active',           color: '#10b981' },
    { key: 'Soft Replica Cap',   val: '5 (env override)', color: '#f59e0b' },
  ];

  readonly promQueries: IPromQuery[] = [
    {
      metric: 'CPU Usage',
      color: '#22d3ee',
      query: 'avg(rate(container_cpu_usage_seconds_total{...container!="POD"}[2m]))',
    },
    {
      metric: 'Memory (GiB)',
      color: '#10b981',
      query: 'avg(container_memory_working_set_bytes{...}) / (1024*1024*1024)',
    },
    {
      metric: 'Request Rate',
      color: '#8b5cf6',
      query: 'sum(rate(http_requests_total{namespace=...}[2m]))',
    },
    {
      metric: 'Latency P95',
      color: '#f59e0b',
      query: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[2m])) by (le))',
    },
    {
      metric: 'Error Rate',
      color: '#ef4444',
      query: 'sum(rate(http_requests_total{status_code=~"5.."}[2m])) / sum(rate(...))',
    },
    {
      metric: 'CPU Throttle',
      color: '#ec4899',
      query: 'avg(rate(container_cpu_cfs_throttled_periods_total[2m])) / avg(rate(container_cpu_cfs_periods_total[2m]))',
    },
  ];

  private subs = new Subscription();

  constructor(
    private svc: MarlsDashboardService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.subs.add(interval(1000).subscribe(() => { this.now = new Date(); }));

    this.subs.add(this.svc.dashboard$.subscribe((vm: MarlsVM | null) => {
      this.vm = vm;
      if (vm) {
        this.connected = true;
        this.loading   = false;
        if (this.agentKeys.length === 0) {
          this.agentKeys     = vm.agents.map((a: AgentVM) => a.key);
          this.selectedAgent = this.agentKeys[0] ?? '';
        }
        this.refreshAgent(vm);
      }
      this.cdr.detectChanges();
    }));

    this.subs.add(this.svc.isConnected$.subscribe((v: boolean) => {
      this.connected = v; this.cdr.detectChanges();
    }));
    this.subs.add(this.svc.isLoading$.subscribe((v: boolean) => {
      this.loading = v; this.cdr.detectChanges();
    }));
    this.subs.add(this.svc.errorMsg$.subscribe((v: string | null) => {
      this.errorMsg = v ?? ''; this.cdr.detectChanges();
    }));
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Agent selection ────────────────────────────────────────────────────────

  selectAgent(key: string): void {
    this.selectedAgent = key;
    if (this.vm) this.refreshAgent(this.vm);
  }

  shortName(key: string): string {
    const parts = key.split('/');
    return parts[parts.length - 1] || key;
  }

  // ── Data refresh ───────────────────────────────────────────────────────────

  private refreshAgent(vm: MarlsVM): void {
    const agent = vm.agents.find((a: AgentVM) => a.key === this.selectedAgent)
      ?? vm.agents[0];
    if (!agent) return;
    this.currentAgent = agent;

    this.latestTraining = agent.trainingHistory?.slice(-1)[0];

    // Training history rows
    this.trainingHistory = (agent.trainingHistory ?? [])
      .slice()
      .reverse()
      .slice(0, 50)
      .map((t: TrainingStep, idx: number): ITrainingRow => ({
        step:        t.step,
        policy_loss: t.policy_loss,
        value_loss:  t.value_loss,
        avg_reward:  t.avg_reward,
        entropy:     t.entropy,
        timestamp:   new Date(t.timestamp),
        isLatest:    idx === 0,
      }));

    // Decision history rows
    this.decisionHistory = (agent.decisionHistory ?? [])
      .slice(0, 50)
      .map((d: AgentDecision, idx: number): IDecisionRow => ({
        action:          d.action,
        replicas:        d.replicas,
        reward:          d.reward,
        confidence:      d.confidence,
        value_estimate:  d.value_estimate,
        buffer_size:     d.buffer_size,
        training_steps:  d.training_steps,
        timestamp:       new Date(d.timestamp),
        isLatest:        idx === 0,
      }));

    // Action probabilities
    const probs = agent.actionProbs ?? [0.33, 0.34, 0.33];
    this.actionProbs = [
      { label: 'Scale Down', prob: probs[0], color: '#ef4444', desc: 'Remove 1 replica — reduces cost, risks SLA' },
      { label: 'No Action',  prob: probs[1], color: '#64748b', desc: 'Maintain current replicas — stable state' },
      { label: 'Scale Up',   prob: probs[2], color: '#10b981', desc: 'Add 1 replica — improves latency, increases cost' },
    ];

    this.stateVector      = this.buildStateVector(agent);
    this.rewardComponents = this.buildRewardComponents(agent);
    this.totalReward      = this.rewardComponents.reduce((s: number, r: IRewardComponent) => s + r.value, 0);

    // Reward trend from training history
    const rewards = (agent.trainingHistory ?? []).map((t: TrainingStep) => t.avg_reward);
    if (rewards.length >= 2) {
      const d = ((rewards[rewards.length - 1] - rewards[0]) / (Math.abs(rewards[0]) || 1)) * 100;
      this.rewardTrend = `${d >= 0 ? '&#8593;' : '&#8595;'} ${Math.abs(d).toFixed(1)}%`;
    }

    // Draw charts after DOM updates
    setTimeout(() => {
      const plData  = (agent.trainingHistory ?? []).map((t: TrainingStep) => t.policy_loss);
      const vlData  = (agent.trainingHistory ?? []).map((t: TrainingStep) => t.value_loss);
      const entData = (agent.trainingHistory ?? []).map((t: TrainingStep) => t.entropy);
      const rwData  = (agent.trainingHistory ?? []).map((t: TrainingStep) => t.avg_reward);

      this.drawChart(this.plRef,  this.plWrap,  plData,  '#22d3ee', true);
      this.drawChart(this.vlRef,  this.vlWrap,  vlData,  '#8b5cf6');
      this.drawChart(this.entRef, this.entWrap, entData, '#f59e0b');
      this.drawChart(this.rwRef,  this.rwWrap,  rwData,  '#10b981', false, true);
    }, 50);
  }

  // ── State vector builder (maps to ppo_agent.get_state) ────────────────────
  private buildStateVector(a: AgentVM): IStateItem[] {
    const lat = a.latencyMs / 1000;
    const sla = 0.5;
    const items: { label: string; raw: number; unit: string; maxVal: number; color: string }[] = [
      { label: 'CPU Usage',         raw: a.cpuPct / 100,       unit: `${a.cpuPct}%`,                       maxVal: 1,    color: '#22d3ee' },
      { label: 'Memory Usage',      raw: a.memGib / 4,         unit: `${a.memGib.toFixed(2)} GiB`,         maxVal: 1,    color: '#10b981' },
      { label: 'Request Rate /100', raw: a.requestRate / 100,  unit: `${a.requestRate.toFixed(1)} rps`,    maxVal: 2,    color: '#8b5cf6' },
      { label: 'Latency P50 (s)',   raw: lat * 0.7,            unit: `${(lat*0.7*1000).toFixed(0)}ms`,     maxVal: 2,    color: '#f59e0b' },
      { label: 'Latency P95 (s)',   raw: lat,                  unit: `${a.latencyMs}ms`,                   maxVal: 2,    color: '#f59e0b' },
      { label: 'Latency P99 (s)',   raw: lat * 1.3,            unit: `${(lat*1.3*1000).toFixed(0)}ms`,     maxVal: 2,    color: '#f59e0b' },
      { label: 'Replicas /10',      raw: a.replicas / 10,      unit: `${a.replicas} pods`,                 maxVal: 1,    color: '#3b82f6' },
      { label: 'Error Rate',        raw: a.errorRate,          unit: `${(a.errorRate*100).toFixed(2)}%`,   maxVal: 0.2,  color: '#ef4444' },
      { label: 'Pending Pods /10',  raw: a.podPending / 10,    unit: `${a.podPending} pending`,            maxVal: 0.5,  color: '#ec4899' },
      { label: 'Ready Pods /10',    raw: a.podReady / 10,      unit: `${a.podReady} ready`,                maxVal: 1,    color: '#10b981' },
      { label: 'CPU Trend 1m',      raw: 0,                    unit: '—',                                  maxVal: 0.1,  color: '#64748b' },
      { label: 'CPU Trend 5m',      raw: 0,                    unit: '—',                                  maxVal: 0.1,  color: '#64748b' },
      { label: 'Req Trend /50',     raw: 0,                    unit: '—',                                  maxVal: 1,    color: '#64748b' },
      { label: 'Hour /24',          raw: new Date().getHours() / 24, unit: `${new Date().getHours()}:00`, maxVal: 1, color: '#8b5cf6' },
      { label: 'Day of Week /7',    raw: new Date().getDay() / 7, unit: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()], maxVal: 1, color: '#8b5cf6' },
      { label: 'Is Weekend',        raw: [0,6].includes(new Date().getDay()) ? 1 : 0, unit: [0,6].includes(new Date().getDay()) ? 'Yes' : 'No', maxVal: 1, color: '#f59e0b' },
      { label: 'Is Peak Hour',      raw: (new Date().getHours() >= 9 && new Date().getHours() <= 17) ? 1 : 0, unit: (new Date().getHours() >= 9 && new Date().getHours() <= 17) ? 'Yes' : 'No', maxVal: 1, color: '#f59e0b' },
      { label: 'SLA Violation',     raw: Math.max(0, lat - sla), unit: lat > sla ? `+${((lat-sla)*1000).toFixed(0)}ms` : 'None', maxVal: 0.5, color: lat > sla ? '#ef4444' : '#10b981' },
    ];

    return items.map((item, idx): IStateItem => ({
      idx,
      label:   item.label,
      raw:     item.raw,
      display: item.unit,
      barPct:  Math.min(100, (item.raw / (item.maxVal || 1)) * 100),
      color:   item.color,
    }));
  }

  // ── Reward components (mirrors ppo_agent._raw_reward) ─────────────────────
  private buildRewardComponents(a: AgentVM): IRewardComponent[] {
    const lat      = a.latencyMs / 1000;
    const sla      = 0.5;
    const replicas = a.replicas;
    const errRate  = a.errorRate;
    const reqRate  = a.requestRate;
    const action   = a.lastAction;

    const components: IRewardComponent[] = [];

    if (lat > sla) {
      const penalty = -50.0 * Math.pow(lat - sla, 2);
      components.push({ name: 'SLA Breach Penalty', value: Math.round(penalty * 100) / 100, desc: `P95 ${a.latencyMs}ms > 500ms SLA` });
    } else if (lat > 0) {
      const bonus = 5.0 * (sla - lat);
      components.push({ name: 'SLA Compliance Bonus', value: Math.round(bonus * 100) / 100, desc: `P95 ${a.latencyMs}ms within SLA` });
    }

    const cost = -0.5 * replicas;
    components.push({ name: 'Resource Cost', value: Math.round(cost * 100) / 100, desc: `${replicas} replicas × -0.5` });

    if (errRate > 0) {
      const errPenalty = -100.0 * errRate;
      components.push({ name: 'Error Rate Penalty', value: Math.round(errPenalty * 100) / 100, desc: `${(errRate*100).toFixed(2)}% errors × -100` });
    }

    if (replicas > 3 && lat > sla) {
      const osPenalty = -5.0 * (replicas - 3);
      components.push({ name: 'Over-scaling Penalty', value: Math.round(osPenalty * 100) / 100, desc: `${replicas} > 3 replicas under high latency` });
    }
    if (replicas > 1 && lat < sla * 0.8) {
      const idlePenalty = -3.0 * (replicas - 1);
      components.push({ name: 'Idle Replicas Penalty', value: Math.round(idlePenalty * 100) / 100, desc: `${replicas} replicas while latency is low` });
    }

    if (replicas === 1 && reqRate > 50) {
      components.push({ name: 'Scale-Up Incentive', value: 30, desc: `1 replica under ${reqRate.toFixed(0)} rps load` });
    }

    if (action === 'no_action') {
      if (lat < sla * 0.6 && replicas === 1) {
        components.push({ name: 'Efficient Idle Bonus', value: 8, desc: 'Perfect sizing — low latency, min replicas' });
      } else if (lat > sla && replicas <= 2) {
        components.push({ name: 'Inaction Under Load', value: -12, desc: 'Should scale up — latency high, few replicas' });
      }
    }

    return components;
  }

  // ── Template helpers ───────────────────────────────────────────────────────

  actionLabel(a: string): string {
    return a === 'scale_up' ? '&#8593; Scale Up' : a === 'scale_down' ? '&#8595; Scale Down' : '&#9679; Hold';
  }

  actionColor(a: string): string {
    return a === 'scale_up' ? '#10b981' : a === 'scale_down' ? '#ef4444' : '#64748b';
  }

  // ── Line chart ────────────────────────────────────────────────────────────

  private drawChart(
    ref:      ElementRef<HTMLCanvasElement> | undefined,
    wrap:     ElementRef<HTMLDivElement>    | undefined,
    data:     number[],
    color:    string,
    zeroLine: boolean = false,
    tall:     boolean = false,
  ): void {
    const c = ref?.nativeElement;
    if (!c || !data || data.length < 2) return;

    const W   = wrap?.nativeElement?.offsetWidth || c.offsetWidth || 300;
    const H   = tall ? 180 : 110;
    const dpr = window.devicePixelRatio || 1;

    c.width  = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';

    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { t: 8, b: 24, l: 44, r: 10 };
    const cW  = W - pad.l - pad.r;
    const cH  = H - pad.t - pad.b;
    const min = Math.min(...data) - Math.abs(Math.min(...data)) * 0.1;
    const max = Math.max(...data) + Math.abs(Math.max(...data)) * 0.1;
    const rng = (max - min) || 1;

    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * cH;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y);
      ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1; ctx.stroke();
      const val = max - (i / 4) * (max - min);
      ctx.fillStyle = 'rgba(100,116,139,.7)';
      ctx.font = `8px 'JetBrains Mono',monospace`; ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(3), pad.l - 3, y + 3);
    }

    if (zeroLine && min < 0 && max > 0) {
      const zy = pad.t + (1 - (0 - min) / rng) * cH;
      ctx.beginPath(); ctx.moveTo(pad.l, zy); ctx.lineTo(W - pad.r, zy);
      ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    }

    const pts = data.map((v: number, i: number) => ({
      x: pad.l + (i / (data.length - 1)) * cW,
      y: pad.t + (1 - (v - min) / rng) * cH,
    }));

    const gr = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
    gr.addColorStop(0, color + '30'); gr.addColorStop(1, color + '00');
    ctx.beginPath(); ctx.moveTo(pts[0].x, H - pad.b);
    pts.forEach((p: { x: number; y: number }) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H - pad.b); ctx.closePath();
    ctx.fillStyle = gr; ctx.fill();

    ctx.beginPath();
    pts.forEach((p: { x: number; y: number }, i: number) =>
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
    );
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke();

    const last = pts[pts.length - 1];
    ctx.beginPath(); ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.fill(); ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(100,116,139,.6)';
    ctx.font = `8px 'JetBrains Mono',monospace`; ctx.textAlign = 'center';
    [0, Math.floor(data.length / 2), data.length - 1].forEach((i: number) =>
      ctx.fillText(`T-${data.length - 1 - i}`, pts[i].x, H - 5)
    );
  }
}