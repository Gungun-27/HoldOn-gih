export const TACTIC_TYPES = [
  'authority_claim',
  'urgency',
  'secrecy_isolation',
  'fear_legal_threat',
  'payment_channel_switch',
  'remote_access_request',
  'too_good_reward',
] as const;

export type TacticType = (typeof TACTIC_TYPES)[number];

export type Region = 'IN' | 'US' | 'UK';

export type RiskState = 'SAFE' | 'WARN' | 'ALERT';

export interface TacticEvidence {
  type: TacticType;
  evidence: string;
  confidence: number;
  score: number;
}

export interface LegitSignal {
  type: string;
  evidence: string;
  confidence: number;
}

export interface AnalyzeRequest {
  text: string;
  region?: Region;
  timestamp?: number;
  previousTactics?: { type: TacticType; timestamp: number }[];
  previousState?: RiskState;
}

export interface AnalyzeResponse {
  score: number;
  state: RiskState;
  degraded: boolean;
  region: Region;
  tactics: TacticEvidence[];
  legit_signals: LegitSignal[];
  advice: string;
}

export interface RegionHelpInfo {
  code: Region;
  name: string;
  helplineNumber: string;
  portalUrl: string;
  portalName: string;
  reportAdvice: string;
}

export type UserRole = 'user' | 'officer';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  trusted_contact_email?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Verification'
  | 'Verified'
  | 'Forwarded to Cyber Cell'
  | 'Closed';

export const COMPLAINT_STATUS_ORDER: ComplaintStatus[] = [
  'Submitted',
  'Under Verification',
  'Verified',
  'Forwarded to Cyber Cell',
  'Closed',
];

export interface ComplaintEvent {
  id: string;
  complaint_id: string;
  status: ComplaintStatus;
  actor_id?: string | null;
  actor_role: string;
  note?: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  ref: string;
  user_id?: string | null;
  complainant_name?: string | null;
  complainant_email: string;
  category: string;
  incident_at?: string | null;
  state: string;
  district?: string | null;
  amount_lost: number;
  description: string;
  masked_excerpt?: string | null;
  analysis_summary?: AnalyzeResponse | null;
  status: ComplaintStatus;
  report_hash?: string | null;
  canonical_json?: string | null;
  consent_at: string;
  is_seed: boolean;
  created_at: string;
  updated_at: string;
  events?: ComplaintEvent[];
}
