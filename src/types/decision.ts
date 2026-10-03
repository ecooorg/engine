export type DoorType = 'ONE_WAY' | 'TWO_WAY';

export type Criticality = 'HIGH' | 'MEDIUM' | 'LOW';

export type QuestionStatus = 'UNRESOLVED' | 'ANSWERED' | 'ASSUMED_RISK';

export type DecisionPhase = 'INTAKE' | 'RADAR' | 'ANALYSIS' | 'DECIDED' | 'ARCHIVED';

export interface ClarificationQuestion {
  id: string;
  category: 'FINANCIAL' | 'IRREVERSIBILITY' | 'LEGAL' | 'PSYCHOLOGICAL' | 'EXTERNAL';
  question: string;
  whyItMatters: string;
  criticality: Criticality;
  status: QuestionStatus;
  userAnswer?: string;
}

export interface ScenarioPoint {
  title: string;
  narrative: string;
  /** Qualitative confidence only until real data exists. Never treat as calibrated probability. */
  confidenceNote?: string;
  keyMetric: string;
  failureCascadeOrPayoff: string;
  /** Optional numeric estimate — only after answers/tools. Always labeled as model estimate. */
  probabilityEstimate?: number;
  /** Legacy/compat field some models still emit */
  probability?: number;
}

export interface OptionScenarios {
  bull: ScenarioPoint;
  base: ScenarioPoint;
  bear: ScenarioPoint;
}

export interface DecisionAlternative {
  id: string;
  letter: 'A' | 'B' | 'C';
  title: string;
  tagline: string;
  isSyntheticHybrid?: boolean;
  description: string;
  doorType: DoorType;
  scenarios?: {
    sixMonths: OptionScenarios;
    eighteenMonths: OptionScenarios;
    threeYears: OptionScenarios;
  };
}

export interface BifurcationPoint {
  id: string;
  timing: string;
  triggerEvent: string;
  consequence: string;
  isIrreversible: boolean;
  preemptiveAction: string;
}

export interface PreMortemAudit {
  catastropheFutureDate: string;
  worstCaseNarrative: string;
  primaryFailurePoints: string[];
  sunkCostTrapAlert?: string;
  costOfInactionAnnual: string;
  confirmationBiasBlindspots: string[];
}

export interface KillCriterion {
  id: string;
  deadlineOrMetric: string;
  thresholdCondition: string;
  actionProtocol: string;
}

export interface SensitivitySliders {
  runwayMonths: number;
  riskTolerance: number; // 1 to 10 — must affect logic or be removed in UI
  pessimismWeight: number; // 0 to 100%
}

export interface CalibrationEntry {
  id: string;
  createdAt: number;
  horizonDays: 30 | 90 | 180;
  reviewDate: string; // YYYY-MM-DD
  hypothesis: string;
  estimate: string; // e.g. "60%" or "likely" — always labeled
  estimateSource: 'USER' | 'MODEL';
  rationale: string;
  fact?: string;
  errorType?: 'DATA' | 'ASSUMPTION' | 'REASONING' | 'LUCK' | 'OTHER';
  reviewedAt?: number;
}

export interface Decision {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: 'DRAFT' | 'ANALYZED' | 'ACTIVE' | 'ARCHIVED';
  phase: DecisionPhase;
  revisitDate: string;
  rawInput: string;
  modelUsed: string;
  identifiedAssets: string[];
  coreFears: string[];
  clarificationQuestions: ClarificationQuestion[];
  alternatives: DecisionAlternative[];
  bifurcationPoints: BifurcationPoint[];
  preMortem: PreMortemAudit | null;
  killCriteria: KillCriterion[];
  sensitivitySliders: SensitivitySliders;
  userReflectionNotes: Array<{
    id: string;
    timestamp: number;
    text: string;
  }>;
  calibrationEntries: CalibrationEntry[];
  executiveComment?: string;
  privacyNoticeAccepted?: boolean;
}

export const INITIAL_DECISION: Decision = {
  id: 'initial',
  title: 'Новое решение',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  status: 'DRAFT',
  phase: 'INTAKE',
  revisitDate: '',
  rawInput: '',
  modelUsed: '',
  identifiedAssets: [],
  coreFears: [],
  clarificationQuestions: [],
  alternatives: [],
  bifurcationPoints: [],
  preMortem: null,
  killCriteria: [],
  sensitivitySliders: {
    runwayMonths: 6,
    riskTolerance: 5,
    pessimismWeight: 30,
  },
  userReflectionNotes: [],
  calibrationEntries: [],
};
