import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, PercentPipe } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { interval, Subscription } from 'rxjs';

import { TableModule }  from 'primeng/table';
import { TagModule }    from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { MarlsDashboardService, MarlsVM, AgentVM, AgentDecision, TrainingStep,
} from '../../../services/Dashboard.service';

interface DecisionRow {
  action: string;
  service: string;
  namespace: string;
  replicas: number;
  reward: number;
  confidence: number;
  latencyMs: number;
  trainingSteps: number;
  ts: Date;
  isNew: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, DatePipe, PercentPipe,
    TableModule, TagModule, ButtonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.scss',
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(14px)' }),
        animate('380ms ease', style({ opacity: 1, transform: 'none' })),
      ]),
    ]),
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Canvas + wrapper refs ─────────────────────────────────────────────────
  @ViewChild('nnCanvas')  nnRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('nnWrap')    nnWrap!:  ElementRef<HTMLDivElement>;   // ✅ wrapper for real width
  @ViewChild('cpuDonut')  cpuRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('memDonut')  memRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('rewardCvs') rewRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('rewWrap')   rewWrap!: ElementRef<HTMLDivElement>;
  @ViewChild('epsCvs')    epsRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('epsWrap')   epsWrap!: ElementRef<HTMLDivElement>;

  // ── Live state ────────────────────────────────────────────────────────────
  vm: MarlsVM | null = null;
  connected   = false;
  loading     = true;
  errorMsg    = '';
  now         = new Date();

  // ── Derived display data ──────────────────────────────────────────────────
  kpiCards:    any[] = [];
  headerStats: any[] = [];
  ppoStats:    any[] = [];
  coordItems:  any[] = [];
  allDecisions: DecisionRow[] = [];
  avgMem       = 0;
  rewardTrend  = '—';

  // ── Static config ─────────────────────────────────────────────────────────
  readonly nnLegend = [
    { label: 'Input (18D)',  color: '#22d3ee' },
    { label: 'Hidden (128)', color: '#3b82f6' },
    { label: 'Actions (3)',  color: '#8b5cf6' },
  ];

  readonly hyperparams = [
    { key: 'Algorithm',     val: 'PPO',          c: '#22d3ee' },
    { key: 'State Size',    val: '18 features',  c: '#8b5cf6' },
    { key: 'Action Space',  val: '3 discrete',   c: '#10b981' },
    { key: 'Learning Rate', val: '1e-4 (Adam)',  c: '#f59e0b' },
    { key: 'Clip ε',        val: '0.20',         c: '#3b82f6' },
    { key: 'GAE λ',         val: '0.95',         c: '#ec4899' },
    { key: 'Discount γ',    val: '0.99',         c: '#22d3ee' },
    { key: 'Buffer',        val: '32 steps',     c: '#8b5cf6' },
    { key: 'Epochs',        val: '2 per update', c: '#10b981' },
    { key: 'Mini-batch',    val: '8',            c: '#f59e0b' },
    { key: 'Entropy Coeff', val: '0.05',         c: '#3b82f6' },
    { key: 'Value Coeff',   val: '0.10',         c: '#ec4899' },
  ];

  readonly archNodes = [
    { icon: '☸',  name: 'Kubernetes',    sub: 'Cluster',      color: '#22d3ee' },
    { icon: '📈', name: 'Prometheus',    sub: 'Metrics',      color: '#f59e0b' },
    { icon: '⚙',  name: 'Go Controller', sub: 'Reconciler',  color: '#8b5cf6' },
    { icon: '🧠', name: 'PPO Agent',     sub: 'Flask :5000', color: '#10b981' },
    { icon: '⚡', name: 'Redis',          sub: 'Coordination', color: '#ec4899' },
    { icon: '📊', name: 'Dashboard',     sub: 'Angular UI',  color: '#3b82f6' },
  ];

  // ── NN animation state ────────────────────────────────────────────────────
  private nnAnimId  = 0;
  private nnNodes:  { x: number; y: number; active: boolean; col: string }[][] = [];
  private nnTick    = 0;
  private nnStarted = false;
  private resizeObs?: ResizeObserver;

  private subs = new Subscription();

  constructor(
    private svc: MarlsDashboardService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.subs.add(interval(1000).subscribe(() => { this.now = new Date(); }));

    this.subs.add(this.svc.dashboard$.subscribe((vm: MarlsVM | null) => {
      this.vm = vm;
      if (vm) { this.derive(vm); }
      this.cdr.detectChanges();
      // ✅ Try to start the NN after data arrives and view has updated
      if (vm && !this.nnStarted) {
        setTimeout(() => this.startNN(), 200);
      }
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

  ngAfterViewInit(): void {
    // ✅ Also try from AfterViewInit — whichever fires last wins via nnStarted flag
    setTimeout(() => this.startNN(), 200);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.nnAnimId);
    this.resizeObs?.disconnect();
    this.subs.unsubscribe();
  }

  // ── Template helpers ──────────────────────────────────────────────────────
  al(a: string): string { return MarlsDashboardService.actionLabel(a); }
  ac(a: string): string { return MarlsDashboardService.actionClass(a); }
  sc(s: string): string { return MarlsDashboardService.statusColor(s); }

  // ── Data derivation ───────────────────────────────────────────────────────

  private derive(vm: MarlsVM): void {
    this.headerStats = [
      { label: 'Agents',      val: String(vm.totalAgents),                color: '#22d3ee' },
      { label: 'Decisions',   val: vm.totalDecisions.toLocaleString(),     color: '#10b981' },
      { label: 'Train Steps', val: vm.totalTrainingSteps.toLocaleString(), color: '#8b5cf6' },
      { label: 'Algorithm',   val: 'PPO',                                  color: '#f59e0b' },
    ];

    this.kpiCards = [
      {
        label: 'AVG REWARD (100)', val: vm.avgReward.toFixed(3), unit: '',
        accent: '#22d3ee', delta: '↑ Learning Progress', dClass: 'delta-up',
      },
      {
        label: 'EPSILON (ε)', val: vm.epsilon.toFixed(4), unit: '',
        accent: '#f59e0b', delta: '↓ Exploration Decay', dClass: 'delta-down',
      },
      {
        label: 'AVG LATENCY P95', val: vm.avgLatencyMs.toFixed(0), unit: 'ms',
        accent: '#8b5cf6',
        delta:  vm.avgLatencyMs < 500 ? '↓ Within SLA (500ms)' : '↑ SLA Breach!',
        dClass: vm.avgLatencyMs < 500 ? 'delta-up' : 'delta-warn',
      },
      {
        label: 'TOTAL REPLICAS', val: String(vm.totalReplicas), unit: '',
        accent: '#10b981', delta: `across ${vm.totalAgents} services`, dClass: 'delta-dim',
      },
      {
        label: 'CLUSTER CPU', val: vm.avgCpu.toFixed(0), unit: '%',
        accent: '#3b82f6',
        delta:  vm.avgCpu < 70 ? '↓ Optimal utilisation' : '↑ High pressure',
        dClass: vm.avgCpu < 70 ? 'delta-up' : 'delta-warn',
      },
    ];

    const latest: TrainingStep | undefined = vm.agents[0]?.trainingHistory?.slice(-1)[0];
    this.ppoStats = [
      { label: 'Policy Loss', val: latest?.policy_loss?.toFixed(4) ?? '—', color: '#22d3ee' },
      { label: 'Value Loss',  val: latest?.value_loss?.toFixed(4)  ?? '—', color: '#8b5cf6' },
      { label: 'Entropy',     val: latest?.entropy?.toFixed(3)     ?? '—', color: '#10b981' },
    ];

    this.avgMem = vm.agents.length
      ? vm.agents.reduce((s: number, a: AgentVM) => s + (a.memGib / 4) * 100, 0) / vm.agents.length
      : 0;

    const h = vm.rewardHistory;
    if (h.length >= 2) {
      const d = ((h[h.length - 1] - h[0]) / (Math.abs(h[0]) || 1)) * 100;
      this.rewardTrend = `${d >= 0 ? '↑' : '↓'} ${Math.abs(d).toFixed(1)}%`;
    }

    this.coordItems = [
      { key: 'Redis',          val: vm.redisAvailable ? 'Connected' : 'Offline', color: vm.redisAvailable ? '#10b981' : '#ef4444' },
      { key: 'Multi-Agent',    val: vm.redisAvailable ? 'Enabled' : 'Disabled',  color: vm.redisAvailable ? '#10b981' : '#64748b' },
      { key: 'Total Agents',   val: String(vm.totalAgents),                       color: '#22d3ee' },
      { key: 'Total Replicas', val: String(vm.totalReplicas),                     color: '#8b5cf6' },
      { key: 'Avail Capacity', val: String(vm.availableCapacity),                 color: '#10b981' },
      { key: 'Avg Confidence', val: (vm.avgConfidence * 100).toFixed(1) + '%',    color: '#f59e0b' },
      { key: 'Avg Latency',    val: vm.avgLatencyMs.toFixed(0) + 'ms',            color: vm.avgLatencyMs < 500 ? '#10b981' : '#ef4444' },
    ];

    const rows: DecisionRow[] = [];
    vm.agents.forEach((a: AgentVM) => {
      (a.decisionHistory ?? []).slice(0, 5).forEach((d: AgentDecision, idx: number) => {
        rows.push({
          action: d.action, service: a.serviceName, namespace: a.namespace,
          replicas: d.replicas, reward: d.reward, confidence: d.confidence,
          latencyMs: a.latencyMs, trainingSteps: d.training_steps,
          ts: new Date(d.timestamp), isNew: idx === 0,
        });
      });
    });
    rows.sort((a: DecisionRow, b: DecisionRow) => b.ts.getTime() - a.ts.getTime());
    this.allDecisions = rows.slice(0, 30);

    // Redraw donuts + charts after layout settles
    setTimeout(() => {
      this.drawDonut(this.cpuRef, Math.round(vm.avgCpu),   '#22d3ee');
      this.drawDonut(this.memRef, Math.round(this.avgMem), '#10b981');
      this.drawLineChart(this.rewRef, this.rewWrap, vm.rewardHistory,  '#22d3ee');
      this.drawLineChart(this.epsRef, this.epsWrap, vm.epsilonHistory, '#f59e0b', 0, 1);
    }, 50);
  }

  // ── Neural network canvas ─────────────────────────────────────────────────

  private startNN(): void {
    if (this.nnStarted) return;

    const wrap = this.nnWrap?.nativeElement;
    const c    = this.nnRef?.nativeElement;
    if (!wrap || !c) return;

    // ✅ Read width from the wrapper div — it always has a real layout width
    const W = wrap.offsetWidth || 400;
    if (W < 10) {
      // Still not laid out — retry once more
      setTimeout(() => { this.nnStarted = false; this.startNN(); }, 200);
      return;
    }

    this.nnStarted = true;
    const H   = 200;
    const dpr = window.devicePixelRatio || 1;

    c.width  = W * dpr;
    c.height = H * dpr;
    c.style.width  = W + 'px';
    c.style.height = H + 'px';

    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // ✅ ResizeObserver — redraws when the panel resizes (e.g. sidebar collapse)
    this.resizeObs = new ResizeObserver(() => {
      const newW = wrap.offsetWidth || 400;
      if (Math.abs(newW - W) > 10) {
        this.nnStarted = false;
        cancelAnimationFrame(this.nnAnimId);
        setTimeout(() => this.startNN(), 50);
      }
    });
    this.resizeObs.observe(wrap);

    const layerDefs: [number, string][] = [
      [4, '34,211,238'],
      [6, '34,211,238'],
      [8, '59,130,246'],
      [6, '139,92,246'],
      [3, '139,92,246'],
    ];

    this.nnNodes = layerDefs.map(([n, col]: [number, string], li: number) =>
      Array.from({ length: n }, (_: unknown, i: number) => ({
        x: (li / (layerDefs.length - 1)) * (W - 60) + 30,
        y: ((i + 0.5) / n) * H,
        active: Math.random() > 0.4,
        col,
      }))
    );

    const draw = (): void => {
      ctx.clearRect(0, 0, W, H);
      this.nnTick++;
      const t = this.nnTick;

      // Randomly flip node activations
      if (t % 12 === 0) {
        this.nnNodes.forEach(layer =>
          layer.forEach(n => { if (Math.random() < 0.2) n.active = !n.active; })
        );
      }

      // ── Connections ────────────────────────────────────────────────────
      for (let li = 0; li < this.nnNodes.length - 1; li++) {
        this.nnNodes[li].forEach(a => {
          this.nnNodes[li + 1].forEach(b => {
            const on    = a.active && b.active;
            const pulse = Math.sin(t * 0.05 + a.x * 0.01 + b.y * 0.008) * 0.5 + 0.5;
            const alpha = on ? 0.08 + pulse * 0.14 : 0.025;
            const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            g.addColorStop(0, `rgba(34,211,238,${alpha})`);
            g.addColorStop(1, `rgba(139,92,246,${alpha})`);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = g;
            ctx.lineWidth   = on ? 0.8 : 0.3;
            ctx.stroke();
          });
        });
      }

      // ── Nodes ──────────────────────────────────────────────────────────
      this.nnNodes.forEach(layer => {
        layer.forEach(n => {
          const pulse = Math.sin(t * 0.05 + n.x * 0.02) * 0.5 + 0.5;
          const r     = n.active ? 4 + pulse * 1.5 : 3;

          // Outer glow
          if (n.active) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, r + 7, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${n.col},0.07)`;
            ctx.fill();
          }

          // Node fill
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle    = n.active ? `rgba(${n.col},0.9)` : `rgba(${n.col},0.2)`;
          ctx.shadowColor  = n.active ? `rgba(${n.col},.8)` : 'transparent';
          ctx.shadowBlur   = n.active ? 8 : 0;
          ctx.fill();
          ctx.shadowBlur   = 0;
        });
      });

      // ── Layer labels ───────────────────────────────────────────────────
      const labels = ['Input', 'Hidden', 'Hidden', 'Policy', 'Actions'];
      labels.forEach((lbl: string, li: number) => {
        ctx.fillStyle = 'rgba(100,116,139,0.7)';
        ctx.font      = `9px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(lbl, this.nnNodes[li][0].x, H - 4);
      });

      this.nnAnimId = requestAnimationFrame(draw);
    };

    draw();
  }

  // ── Donut chart ────────────────────────────────────────────────────────────

  private drawDonut(
    ref: ElementRef<HTMLCanvasElement> | undefined,
    pct: number,
    color: string,
  ): void {
    const c = ref?.nativeElement;
    if (!c) return;

    const dpr  = window.devicePixelRatio || 1;
    const SIZE = 110;
    c.width  = SIZE * dpr;
    c.height = SIZE * dpr;
    c.style.width  = SIZE + 'px';
    c.style.height = SIZE + 'px';

    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, SIZE, SIZE);

    const cx = SIZE / 2, cy = SIZE / 2, r = 42;

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth   = 8;
    ctx.stroke();

    // Value arc
    if (pct > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (pct / 100) * Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 8;
      ctx.lineCap     = 'round';
      ctx.shadowColor = color + '80';
      ctx.shadowBlur  = 12;
      ctx.stroke();
      ctx.shadowBlur  = 0;
    }
  }

  // ── Line chart ─────────────────────────────────────────────────────────────

  private drawLineChart(
    ref:  ElementRef<HTMLCanvasElement> | undefined,
    wrap: ElementRef<HTMLDivElement>    | undefined,
    data: number[],
    color: string,
    yMin?: number,
    yMax?: number,
  ): void {
    const c = ref?.nativeElement;
    if (!c || !data || data.length < 2) return;

    // ✅ Read width from wrapper, not canvas
    const W   = wrap?.nativeElement?.offsetWidth || c.offsetWidth || 300;
    const H   = 130;
    const dpr = window.devicePixelRatio || 1;

    c.width  = W * dpr;
    c.height = H * dpr;
    c.style.width  = W + 'px';
    c.style.height = H + 'px';

    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { t: 10, b: 28, l: 40, r: 12 };
    const cW  = W - pad.l - pad.r;
    const cH  = H - pad.t - pad.b;
    const min = yMin !== undefined ? yMin : Math.min(...data) - 0.05;
    const max = yMax !== undefined ? yMax : Math.max(...data) + 0.05;
    const rng = (max - min) || 1;

    // Grid lines + Y axis labels
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * cH;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth   = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(100,116,139,0.7)';
      ctx.font      = `9px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'right';
      ctx.fillText((max - (i / 4) * (max - min)).toFixed(2), pad.l - 4, y + 3);
    }

    const pts = data.map((v: number, i: number) => ({
      x: pad.l + (i / (data.length - 1)) * cW,
      y: pad.t + (1 - (v - min) / rng) * cH,
    }));

    // Gradient fill under the line
    const gr = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
    gr.addColorStop(0, color + '38');
    gr.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H - pad.b);
    pts.forEach((p: { x: number; y: number }) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H - pad.b);
    ctx.closePath();
    ctx.fillStyle = gr;
    ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach((p: { x: number; y: number }, i: number) =>
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
    );
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // Last point dot
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle   = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 10;
    ctx.fill();
    ctx.shadowBlur  = 0;

    // X labels
    ctx.fillStyle = 'rgba(100,116,139,0.6)';
    ctx.font      = `9px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    [0, Math.floor(data.length / 2), data.length - 1].forEach((i: number) =>
      ctx.fillText(`T-${data.length - 1 - i}`, pts[i].x, H - 5)
    );
  }
}
