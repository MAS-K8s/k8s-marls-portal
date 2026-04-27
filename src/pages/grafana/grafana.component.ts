import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { interval, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';

interface GrafanaPanel {
  title: string;
  sub: string;
  icon: string;
  metric: string;
  accent: string;
  panelId: number;
  wide: boolean;
  safeUrl: SafeResourceUrl;
  directUrl: string;
}

interface PromQuery {
  name: string;
  query: string;
  desc: string;
  category: string;
  accent: string;
}

@Component({
  selector: 'app-grafana',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, ButtonModule],
  templateUrl: './grafana.component.html',
  styleUrl: './grafana.component.scss',
})
export class GrafanaComponent implements OnInit, OnDestroy {

  // ── Config ─────────────────────────────────────────────────────────────
  readonly grafanaBase = 'https://grafana.dev-sachin.co.uk';

  // Set to true once you've enabled allow_embedding=true in grafana.ini
  embeddingEnabled = false;

  showFullDash   = false;
  showSetupGuide = true;
  refreshing     = false;
  selectedRange  = '1h';
  now            = new Date();

  kioskUrl!: string;
  fullDashSafeUrl!: SafeResourceUrl;

  // ── Time ranges ────────────────────────────────────────────────────────
  timeRanges = [
    { label: '15m', value: 'now-15m' },
    { label: '1h',  value: 'now-1h'  },
    { label: '3h',  value: 'now-3h'  },
    { label: '6h',  value: 'now-6h'  },
    { label: '12h', value: 'now-12h' },
    { label: '24h', value: 'now-24h' },
  ];

  // ── Status cards ───────────────────────────────────────────────────────
  statusCards = [
    { icon: '📡', label: 'Grafana URL',       value: 'grafana.dev-sachin.co.uk', color: '#22d3ee' },
    { icon: '🗄', label: 'Datasource',         value: 'Prometheus',          color: '#f59e0b' },
    { icon: '🔄', label: 'Scrape Interval',    value: '15s',                 color: '#10b981' },
    { icon: '⏱', label: 'Retention',           value: '15d (default)',       color: '#8b5cf6' },
    { icon: '🔐', label: 'Embedding',          value: this.embeddingEnabled ? 'Enabled' : 'Disabled', color: this.embeddingEnabled ? '#10b981' : '#f59e0b' },
  ];

  // ── Setup steps ────────────────────────────────────────────────────────
  setupSteps = [
    {
      title: 'Edit grafana.ini (or Kubernetes ConfigMap)',
      code: '[security]\nallow_embedding = true\n\n[auth.anonymous]\nenabled = true\norg_role = Viewer',
      desc: '',
    },
    {
      title: 'If running in Kubernetes, patch the ConfigMap',
      code: 'kubectl edit configmap grafana -n monitoring',
      desc: 'Add the security and auth.anonymous sections, then restart the Grafana pod.',
    },
    {
      title: 'Restart Grafana pod to apply changes',
      code: 'kubectl rollout restart deployment/grafana -n monitoring',
      desc: '',
    },
    {
      title: 'Enable embedding in this component',
      code: "embeddingEnabled = true;  // grafana.component.ts line 29",
      desc: 'Set this flag to true and the iframes will render automatically.',
    },
  ];

  // ── Grafana panels config ──────────────────────────────────────────────
  panels: GrafanaPanel[] = [];

  // ── Prometheus queries for the API section ─────────────────────────────
  promQueries: PromQuery[] = [
    {
      name: 'Container CPU Usage',
      query: 'sum(rate(container_cpu_usage_seconds_total{namespace="production"}[5m])) by (pod)',
      desc: 'CPU usage rate per pod in the production namespace — matches what the Go controller collects.',
      category: 'CPU', accent: 'cyan',
    },
    {
      name: 'Container Memory Usage',
      query: 'sum(container_memory_working_set_bytes{namespace="production"}) by (pod)',
      desc: 'Working set memory per pod. Used by the PPO agent as one of 18 state features.',
      category: 'Memory', accent: 'green',
    },
    {
      name: 'HTTP Request Rate',
      query: 'sum(rate(http_requests_total{namespace="production"}[1m])) by (service)',
      desc: 'Incoming request rate per service. A key driver of scale_up decisions.',
      category: 'Traffic', accent: 'violet',
    },
    {
      name: 'HTTP Latency P95',
      query: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{namespace="production"}[5m])) by (le, service))',
      desc: 'P95 latency. The PPO agent penalises SLA breaches above 500ms heavily.',
      category: 'Latency', accent: 'amber',
    },
    {
      name: 'Pod Ready Count',
      query: 'kube_deployment_status_replicas_ready{namespace="production"}',
      desc: 'Number of ready replicas per deployment. The controller reads Status.ReadyReplicas to avoid scale-churn during pod startup.',
      category: 'K8s', accent: 'blue',
    },
    {
      name: 'Pod Error Rate',
      query: 'sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)',
      desc: 'Error ratio per service. PPO penalises error rates above 5% with a -100 reward multiplier.',
      category: 'Errors', accent: 'red',
    },
  ];

  private subs = new Subscription();

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.buildPanels();
    this.buildFullDash();

    // Clock
    this.subs.add(interval(1000).subscribe(() => { this.now = new Date(); this.cdr.markForCheck(); }));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  // ── Build panel iframe URLs ─────────────────────────────────────────────
  private buildPanels(): void {
    const panelDefs = [
      { title: 'CPU Usage by Pod',        sub: 'container_cpu_usage_seconds_total',           icon: '⚡', metric: 'CPU',      accent: 'cyan',   panelId: 1,  wide: false },
      { title: 'Memory Usage by Pod',     sub: 'container_memory_working_set_bytes',           icon: '💾', metric: 'Memory',   accent: 'green',  panelId: 2,  wide: false },
      { title: 'HTTP Request Rate',       sub: 'Requests per second per service',             icon: '🌐', metric: 'RPS',      accent: 'violet', panelId: 3,  wide: false },
      { title: 'Latency P95',             sub: 'http_request_duration_seconds histogram',      icon: '⏱', metric: 'P95',      accent: 'amber',  panelId: 4,  wide: false },
      { title: 'Pod Replica Count',       sub: 'kube_deployment_status_replicas_ready',        icon: '☸', metric: 'Replicas', accent: 'blue',   panelId: 5,  wide: false },
      { title: 'Error Rate',              sub: '5xx responses / total requests',               icon: '🔴', metric: 'Errors',   accent: 'red',    panelId: 6,  wide: false },
      { title: 'Cluster Node CPU',        sub: 'node_cpu_seconds_total across all nodes',      icon: '🖥', metric: 'Nodes',    accent: 'cyan',   panelId: 7,  wide: true  },
      { title: 'Network I/O',             sub: 'container_network_transmit/receive_bytes',     icon: '📡', metric: 'Network',  accent: 'violet', panelId: 8,  wide: true  },
    ];

    this.panels = panelDefs.map(p => {
      const from = this.rangeToFrom(this.selectedRange);
      const params = `orgId=1&from=${from}&to=now&panelId=${p.panelId}&refresh=10s&theme=dark`;
      // Using d-solo for individual panels — replace YOUR_DASH_UID with actual uid from Grafana URL
      const url = `${this.grafanaBase}/d-solo/YOUR_DASH_UID/kubernetes?${params}`;
      return {
        ...p,
        safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(url),
        directUrl: `${this.grafanaBase}/d/YOUR_DASH_UID/kubernetes?${params}&fullscreen`,
      };
    });
  }

  private buildFullDash(): void {
    this.kioskUrl = `${this.grafanaBase}/d/YOUR_DASH_UID/kubernetes?orgId=1&kiosk=tv&refresh=10s&theme=dark`;
    this.fullDashSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.kioskUrl);
  }

  // ── Interactions ────────────────────────────────────────────────────────
  setRange(range: string): void {
    this.selectedRange = range;
    this.buildPanels();
    this.buildFullDash();
  }

  refreshAll(): void {
    this.refreshing = true;
    this.buildPanels();
    setTimeout(() => { this.refreshing = false; this.cdr.markForCheck(); }, 800);
  }

  toggleFullDash(): void {
    this.showFullDash = !this.showFullDash;
  }

  buildExploreUrl(query: string): string {
    const encoded = encodeURIComponent(JSON.stringify({
      datasource: 'prometheus',
      queries: [{ expr: query, refId: 'A' }],
      range: { from: 'now-1h', to: 'now' },
    }));
    return `${this.grafanaBase}/explore?left=${encoded}`;
  }

  private rangeToFrom(range: string): string {
    const map: Record<string, string> = {
      'now-15m': 'now-15m', 'now-1h': 'now-1h',
      'now-3h':  'now-3h',  'now-6h': 'now-6h',
      'now-12h': 'now-12h', 'now-24h': 'now-24h',
    };
    return map[range] ?? 'now-1h';
  }
}
