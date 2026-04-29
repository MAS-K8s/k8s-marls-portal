// ─────────────────────────────────────────────────────────────────────
// Raw API contract (matches what the RL backend returns from /dashboard)
// ─────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Action type
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionAction = 'scale_up' | 'no_action' | 'scale_down';

// ─────────────────────────────────────────────────────────────────────────────
// State vector snapshot at the moment a decision was made
// ─────────────────────────────────────────────────────────────────────────────

export interface IDecisionStateVector {
  cpu:         number;   // percentage
  memory:      number;   // percentage
  latency:     number;   // ms
  errorRate:   number;   // percentage
  replicas:    number;
  requestRate: number;
  podReady:    number;
  podPending:  number;
}

export class DecisionStateVectorDto implements IDecisionStateVector {
  constructor(
    public cpu:         number = 0,
    public memory:      number = 0,
    public latency:     number = 0,
    public errorRate:   number = 0,
    public replicas:    number = 0,
    public requestRate: number = 0,
    public podReady:    number = 0,
    public podPending:  number = 0,
  ) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Decision row shown in the table
// ─────────────────────────────────────────────────────────────────────────────

export interface IDecisionEntry {
  id:             string;
  agentKey:       string;
  deployment:     string;
  namespace:      string;
  action:         DecisionAction;
  replicasBefore: number;
  replicasAfter:  number;
  reward:         number;
  confidence:     number;
  valueEstimate:  number;
  bufferSize:     number;
  trainingSteps:  number;
  timestamp:      Date;
  isNew:          boolean;
  stateVector:    IDecisionStateVector;
  actionProbs:    number[];
  estimatedCost:  number;
}

export class DecisionEntryDto implements IDecisionEntry {
  constructor(
    public id:             string                = '',
    public agentKey:       string                = '',
    public deployment:     string                = '',
    public namespace:      string                = '',
    public action:         DecisionAction        = 'no_action',
    public replicasBefore: number                = 0,
    public replicasAfter:  number                = 0,
    public reward:         number                = 0,
    public confidence:     number                = 0,
    public valueEstimate:  number                = 0,
    public bufferSize:     number                = 0,
    public trainingSteps:  number                = 0,
    public timestamp:      Date                  = new Date(),
    public isNew:          boolean               = false,
    public stateVector:    IDecisionStateVector  = new DecisionStateVectorDto(),
    public actionProbs:    number[]              = [0.33, 0.34, 0.33],
    public estimatedCost:  number                = 0,
  ) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-agent summary
// ─────────────────────────────────────────────────────────────────────────────

export interface IAgentSummary {
  scaleUpCount:   number;
  scaleDownCount: number;
  holdCount:      number;
  avgReward:      number;
  totalSteps:     number;
}

export class AgentSummaryDto implements IAgentSummary {
  constructor(
    public scaleUpCount:   number = 0,
    public scaleDownCount: number = 0,
    public holdCount:      number = 0,
    public avgReward:      number = 0,
    public totalSteps:     number = 0,
  ) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level state held in the BehaviorSubject
// ─────────────────────────────────────────────────────────────────────────────

export interface IAgentDecisionsState {
  decisions:      IDecisionEntry[];
  totalDecisions: number;
  connected:      boolean;
  loading:        boolean;
  errorMsg:       string | null;
  lastSyncAt:     Date | null;
  agentKeys:      string[];
  summary:        Record<string, IAgentSummary>;
}

export class AgentDecisionsStateDto implements IAgentDecisionsState {
  constructor(
    public decisions:      IDecisionEntry[]              = [],
    public totalDecisions: number                        = 0,
    public connected:      boolean                       = false,
    public loading:        boolean                       = true,
    public errorMsg:       string | null                 = null,
    public lastSyncAt:     Date | null                   = null,
    public agentKeys:      string[]                      = [],
    public summary:        Record<string, IAgentSummary> = {},
  ) {}
}
export interface IAgentDecision {
  action:          'scale_up' | 'no_action' | 'scale_down';
  replicas:        number;
  reward:          number;
  confidence:      number;
  value_estimate:  number;
  buffer_size:     number;
  training_steps:  number;
  timestamp:       string;
}

export interface ITrainingStep {
  step:        number;
  policy_loss: number;
  value_loss:  number;
  avg_reward:  number;
  entropy:     number;
  timestamp:   string;
}

export interface IAgent {
  key:             string;
  serviceName:     string;
  namespace:       string;
  cpuPct:          number;
  memGib:          number;
  latencyMs:       number;
  errorRate:       number;
  requestRate:     number;
  replicas:        number;
  podReady:        number;
  podPending:      number;
  trainingSteps:   number;
  lastAction:      'scale_up' | 'no_action' | 'scale_down';
  actionProbs?:    number[];
  decisionHistory?: IAgentDecision[];
  trainingHistory?: ITrainingStep[];
}

export interface IDashboard {
  agents: IAgent[];
}

// ─────────────────────────────────────────────────────────────────────
// DTO classes (use these for typed instances when needed)
// ─────────────────────────────────────────────────────────────────────

export class AgentDecisionDto implements IAgentDecision {
  constructor(
    public action:         'scale_up' | 'no_action' | 'scale_down' = 'no_action',
    public replicas:       number = 0,
    public reward:         number = 0,
    public confidence:     number = 0,
    public value_estimate: number = 0,
    public buffer_size:    number = 0,
    public training_steps: number = 0,
    public timestamp:      string = '',
  ) {}
}

export class TrainingStepDto implements ITrainingStep {
  constructor(
    public step:        number = 0,
    public policy_loss: number = 0,
    public value_loss:  number = 0,
    public avg_reward:  number = 0,
    public entropy:     number = 0,
    public timestamp:   string = '',
  ) {}
}

export class AgentDto implements IAgent {
  constructor(
    public key:              string  = '',
    public serviceName:      string  = '',
    public namespace:        string  = '',
    public cpuPct:           number  = 0,
    public memGib:           number  = 0,
    public latencyMs:        number  = 0,
    public errorRate:        number  = 0,
    public requestRate:      number  = 0,
    public replicas:         number  = 0,
    public podReady:         number  = 0,
    public podPending:       number  = 0,
    public trainingSteps:    number  = 0,
    public lastAction:       'scale_up' | 'no_action' | 'scale_down' = 'no_action',
    public actionProbs?:     number[],
    public decisionHistory?: IAgentDecision[],
    public trainingHistory?: ITrainingStep[],
  ) {}
}

export class DashboardDto implements IDashboard {
  constructor(public agents: IAgent[] = []) {}
}

// ─────────────────────────────────────────────────────────────────────
// View-model interfaces used by the component (display layer only)
// ─────────────────────────────────────────────────────────────────────

export interface ITrainingRow {
  step:        number;
  policy_loss: number;
  value_loss:  number;
  avg_reward:  number;
  entropy:     number;
  timestamp:   Date;
  isLatest:    boolean;
}

export interface IDecisionRow {
  action:         string;
  replicas:       number;
  reward:         number;
  confidence:     number;
  value_estimate: number;
  buffer_size:    number;
  training_steps: number;
  timestamp:      Date;
  isLatest:       boolean;
}

export interface IStateItem {
  idx:     number;
  label:   string;
  raw:     number;
  display: string;
  barPct:  number;
  color:   string;
}

export interface IActionProb {
  label: string;
  prob:  number;
  color: string;
  desc:  string;
}

export interface IRewardComponent {
  name:  string;
  value: number;
  desc:  string;
}

export interface IConfigItem {
  key:   string;
  val:   string;
  color: string;
}

export interface IPromQuery {
  metric: string;
  color:  string;
  query:  string;
}