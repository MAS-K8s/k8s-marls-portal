import {
  Component, OnInit, OnDestroy, NgZone,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';

import { ReplacePipe } from '../../shared/replace.pipe';
// ↑ adjust path to wherever your shared ReplacePipe lives, e.g.
//   '../../pipes/replace.pipe'   or   '../shared/replace.pipe'

import {
  PodAutoscalingService,
  AutoscalingState,
  AgentDashboard,
  FlaskDecision,
  FlaskTrainingStep,
} from '../../services/pod-autoscaling.service';

// ─── Local UI types (no HTTP shapes here) ────────────────────────────────────

interface PodInfo {
  transform:  string;
  height:     number;
  gradient:   string;
  status:     'ready' | 'pending';
  isNew:      boolean;
  isRemoving: boolean;
}

interface MetricBar {
  label:   string;
  pct:     number;
  color:   string;
  display: string;
}

interface ScalingEvent {
  action:  string;
  icon:    string;
  from:    number;
  to:      number;
  time:    string;
  tooltip: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-agent-autoscaling',
  standalone: true,
  imports: [CommonModule, TooltipModule, ReplacePipe, UpperCasePipe],
  templateUrl: './agent-autoscaling.component.html',
  styleUrls: ['./agent-autoscaling.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentAutoscalingComponent implements OnInit, OnDestroy {

  readonly Math = Math;

  // ── Connection / multi-agent (driven by service) ──────────────────────────
  isConnected    = false;
  lastPollTs     = '—';
  corsError      = false;
  agentKeys:     string[] = [];
  selectedKey    = '';
  totalAgents    = 0;
  redisAvailable = false;

  // ── Current agent live data ────────────────────────────────────────────────
  lastAction     = 'no_action';
  actionIcon     = '○';
  confidence     = 0;
  valueEstimate  = 0;
  bufferSize     = 0;
  trainingSteps  = 0;
  avgReward100   = 0;
  agentDevice    = '—';
  lastDecisionTs = '—';

  // k8s live metrics
  replicas    = 0;
  podReady    = 0;
  podPending  = 0;
  cpuUsage    = 0;
  memoryGib   = 0;
  requestRate = 0;
  latencyP95  = 0;
  errorRate   = 0;

  // action probabilities (%)
  probScaleDown = 33.3;
  probNoAction  = 33.3;
  probScaleUp   = 33.3;

  latestReward = 0;

  // ── Live decision feed ────────────────────────────────────────────────────
  decisions:     FlaskDecision[]    = [];
  scalingEvents: ScalingEvent[]     = [];
  trainingSteps_history: FlaskTrainingStep[] = [];

  // ── Charts ────────────────────────────────────────────────────────────────
  readonly CW = 240; readonly CH = 52;
  rewardPoints = ''; rewardArea  = '';
  lossPoints   = ''; lossArea    = '';
  chartMin = -60; chartMax = 0; zeroY = 26;

  // ── Metric bars ───────────────────────────────────────────────────────────
  metricBars: MetricBar[] = [
    { label: 'CPU',         pct: 0, color: '#38bdf8', display: '0%'    },
    { label: 'Memory',      pct: 0, color: '#a78bfa', display: '0 GiB' },
    { label: 'Latency p95', pct: 0, color: '#f59e0b', display: '0 ms'  },
    { label: 'Error Rate',  pct: 0, color: '#f87171', display: '0%'    },
  ];

  // ── Gauge ─────────────────────────────────────────────────────────────────
  readonly ARC = 141.3;
  confidenceDash = `0 ${this.ARC}`;
  needleX2 = 60; needleY2 = 28;

  // ── 3D pods ───────────────────────────────────────────────────────────────
  podArray:      PodInfo[] = [];
  showScaleUp    = false;
  showScaleDown  = false;
  showAnnounce   = false;
  announceText   = '';
  announceCls    = '';

  // ── Private ───────────────────────────────────────────────────────────────
  private subs         = new Subscription();
  private prevReplicas = -1;
  private seenDecisions = new Set<string>();

  constructor(
    public svc: PodAutoscalingService,   // public so template can use svc.rlAgentUrl in CORS banner
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.buildPods(0, 0);

    this.subs.add(
      this.svc.state$.subscribe((state: AutoscalingState) => {
        this.isConnected    = state.connected;
        this.corsError      = state.corsError;
        this.lastPollTs     = state.lastPollTs;
        this.totalAgents    = state.totalAgents;
        this.redisAvailable = state.redisAvailable;

        // First connection — auto-select the first agent
        if (state.agentKeys.length > 0 && !this.selectedKey) {
          this.selectedKey = state.agentKeys[0];
        }

        // Always keep agentKeys in sync for the tab bar
        this.agentKeys = state.agentKeys;

        // Ingest data for the currently selected agent
        if (this.selectedKey && state.agents[this.selectedKey]) {
          this.ingestAgent(state.agents[this.selectedKey]);
        }

        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  // ── Agent ingestion (same logic as before, no HTTP) ───────────────────────

  private ingestAgent(agent: AgentDashboard): void {
    this.lastAction     = agent.last_action     ?? 'no_action';
    this.actionIcon     = this.iconFor(this.lastAction);
    this.confidence     = agent.confidence      ?? 0;
    this.valueEstimate  = agent.value_estimate  ?? 0;
    this.bufferSize     = agent.buffer_size      ?? 0;
    this.trainingSteps  = agent.training_steps  ?? 0;
    this.avgReward100   = agent.avg_reward_100   ?? 0;
    this.agentDevice    = agent.device           ?? '—';
    this.lastDecisionTs = agent.last_decision_ts ?? '—';

    // action probabilities
    if (agent.action_probabilities?.length === 3) {
      this.probScaleDown = agent.action_probabilities[0] * 100;
      this.probNoAction  = agent.action_probabilities[1] * 100;
      this.probScaleUp   = agent.action_probabilities[2] * 100;
    }

    // gauge
    this.updateGauge(this.confidence);

    // k8s live metrics
    this.cpuUsage    = agent.cpu_usage    ?? 0;
    this.memoryGib   = agent.memory_gib   ?? 0;
    this.requestRate = agent.request_rate ?? 0;
    this.latencyP95  = agent.latency_p95  ?? 0;
    this.errorRate   = agent.error_rate   ?? 0;
    this.podReady    = agent.pod_ready    ?? 0;
    this.podPending  = agent.pod_pending  ?? 0;

    this.metricBars[0].pct     = Math.min(100, this.cpuUsage  * 100);
    this.metricBars[0].display = `${(this.cpuUsage * 100).toFixed(1)}%`;
    this.metricBars[1].pct     = Math.min(100, this.memoryGib * 100);
    this.metricBars[1].display = `${this.memoryGib.toFixed(3)} GiB`;
    this.metricBars[2].pct     = Math.min(100, (this.latencyP95 / 2) * 100);
    this.metricBars[2].display = `${(this.latencyP95 * 1000).toFixed(0)} ms`;
    this.metricBars[3].pct     = Math.min(100, this.errorRate * 100);
    this.metricBars[3].display = `${(this.errorRate * 100).toFixed(1)}%`;

    // replica → 3D pods
    const rep = agent.replicas ?? 0;
    if (rep > 0) this.handleReplicas(rep, agent.pod_ready ?? rep);

    // decision history (dedup by timestamp)
    const hist = agent.decision_history ?? [];
    hist.forEach((d: FlaskDecision) => {
      if (!this.seenDecisions.has(d.timestamp)) {
        this.seenDecisions.add(d.timestamp);
        this.decisions.unshift(d);
        this.latestReward = d.reward;
        if (d.action === 'scale_up' || d.action === 'scale_down') {
          this.maybeAddScalingEvent(d);
        }
      }
    });
    if (this.decisions.length > 50) this.decisions.length = 50;

    // training history → charts
    const trainHist = agent.training_history ?? [];
    if (trainHist.length > 0) {
      this.trainingSteps_history = trainHist;
      this.rebuildCharts();
    }
  }

  // ── Agent tab selection ───────────────────────────────────────────────────

  selectAgent(key: string): void {
    if (key === this.selectedKey) return;
    this.selectedKey           = key;
    this.prevReplicas          = -1;
    this.decisions             = [];
    this.scalingEvents         = [];
    this.seenDecisions         = new Set();
    this.trainingSteps_history = [];
    this.rewardPoints          = '';
    this.lossPoints            = '';
    this.buildPods(0, 0);
    this.cdr.markForCheck();
  }

  // ── Replica tracking ──────────────────────────────────────────────────────

  private handleReplicas(total: number, ready: number): void {
    this.replicas = total;
    const prev    = this.prevReplicas;

    if (prev === -1)      { this.prevReplicas = total; this.buildPods(total, ready); return; }
    if (total === prev)   { this.buildPods(total, ready); return; }

    this.prevReplicas = total;
    if (total > prev) this.doScaleUp(prev, total, ready);
    else              this.doScaleDown(prev, total, ready);
  }

  buildPods(total: number, ready: number): void {
    this.podArray = this.makePods(total, ready, -1, false);
  }

  private makePods(total: number, ready: number, newIdx: number, removing: boolean): PodInfo[] {
    return Array.from({ length: total }, (_, i) => {
      const angle  = (i / Math.max(total, 1)) * 360;
      const radius = Math.min(90, 36 + total * 4.5);
      const x = Math.cos((angle * Math.PI) / 180) * radius;
      const z = Math.sin((angle * Math.PI) / 180) * radius;
      const isPend = i >= ready;
      const isNew  = i === newIdx;
      const isRem  = i === total - 1 && removing;
      const h = isPend ? 28 : 40 + (i % 4) * 7;
      const g = isNew  ? 'linear-gradient(180deg,#34d399,#059669)'
              : isRem  ? 'linear-gradient(180deg,#f87171,#dc2626)'
              : isPend ? 'linear-gradient(180deg,#334155,#1e293b)'
                       : `linear-gradient(180deg,hsl(${190+i*15},68%,56%),hsl(${200+i*15},58%,36%))`;
      return {
        transform: `translateX(${x}px) translateZ(${z}px)`,
        height: h, gradient: g,
        status: isPend ? 'pending' : 'ready',
        isNew, isRemoving: isRem,
      };
    });
  }

  private doScaleUp(from: number, to: number, ready: number): void {
    this.lastAction = 'scale_up'; this.actionIcon = '▲';
    this.podArray   = this.makePods(to, ready, to - 1, false);
    this.showScaleUp = true;
    setTimeout(() => { this.showScaleUp = false; this.cdr.markForCheck(); }, 1600);
    this.flash(`Scaling UP  ${from} → ${to} pods`, 'announce-up');
  }

  private doScaleDown(from: number, to: number, ready: number): void {
    this.lastAction = 'scale_down'; this.actionIcon = '▼';
    this.podArray   = this.makePods(from, ready, -1, true);
    this.showScaleDown = true;
    setTimeout(() => {
      this.showScaleDown = false;
      this.podArray = this.makePods(to, ready, -1, false);
      this.cdr.markForCheck();
    }, 900);
    this.flash(`Scaling DOWN  ${from} → ${to} pods`, 'announce-down');
  }

  private flash(text: string, cls: string): void {
    this.announceText = text; this.announceCls = cls; this.showAnnounce = true;
    setTimeout(() => { this.showAnnounce = false; this.cdr.markForCheck(); }, 2200);
  }

  private maybeAddScalingEvent(d: FlaskDecision): void {
    const last = this.scalingEvents[0];
    if (last && last.time === this.fmtTs(d.timestamp)) return;
    const from = d.action === 'scale_up' ? d.replicas - 1 : d.replicas + 1;
    this.scalingEvents.unshift({
      action:  d.action,
      icon:    this.iconFor(d.action),
      from, to: d.replicas,
      time:    this.fmtTs(d.timestamp),
      tooltip: `${d.action.replace('_',' ')}  ${from}→${d.replicas}  conf ${(d.confidence*100).toFixed(1)}%`,
    });
    if (this.scalingEvents.length > 20) this.scalingEvents.length = 20;
  }

  // ── Charts ────────────────────────────────────────────────────────────────

  private rebuildCharts(): void {
    const data = this.trainingSteps_history;
    if (data.length < 2) return;

    const rewards = data.map((d: FlaskTrainingStep) => d.avg_reward);
    const mn = Math.min(...rewards), mx = Math.max(...rewards);
    this.chartMin = mn; this.chartMax = mx;
    const range = mx - mn || 1;
    const rPts = rewards.map((v: number, i: number) => {
      const x = (i / (rewards.length - 1)) * this.CW;
      const y = this.CH - ((v - mn) / range) * (this.CH - 5) - 2.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    this.rewardPoints = rPts.join(' ');
    const lx = rPts[rPts.length - 1].split(',')[0];
    this.rewardArea = `M 0,${this.CH} L ${rPts.join(' L ')} L ${lx},${this.CH} Z`;
    const zn = (0 - mn) / range;
    this.zeroY = this.CH - zn * (this.CH - 5) - 2.5;

    const losses = data.map((d: FlaskTrainingStep) => d.value_loss);
    const lmn = Math.min(...losses), lmx = Math.max(...losses);
    const lRange = lmx - lmn || 1;
    const lPts = losses.map((v: number, i: number) => {
      const x = (i / (losses.length - 1)) * this.CW;
      const y = this.CH - ((v - lmn) / lRange) * (this.CH - 5) - 2.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    this.lossPoints = lPts.join(' ');
    const llx = lPts[lPts.length - 1].split(',')[0];
    this.lossArea = `M 0,${this.CH} L ${lPts.join(' L ')} L ${llx},${this.CH} Z`;
  }

  // ── Gauge ─────────────────────────────────────────────────────────────────

  private updateGauge(conf: number): void {
    this.confidenceDash = `${conf * this.ARC} ${this.ARC}`;
    const angle = conf * 180 - 180;
    const rad   = (angle * Math.PI) / 180;
    this.needleX2 = 60 + 32 * Math.cos(rad);
    this.needleY2 = 62 + 32 * Math.sin(rad);
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  iconFor(a: string): string {
    return a === 'scale_up' ? '▲' : a === 'scale_down' ? '▼' : '=';
  }

  actionColor(a: string): string {
    return a === 'scale_up' ? '#34d399' : a === 'scale_down' ? '#f87171' : '#94a3b8';
  }

  labelFor(key: string): string {
    return key.includes('/') ? key.split('/').slice(1).join('/') : key;
  }

  private fmtTs(ts: string): string {
    try { return new Date(ts).toLocaleTimeString(); } catch { return ts; }
  }

  trackByIdx(i: number): number { return i; }
  trackByKey(_: number, item: string): string { return item; }
}
