import { Region, RegionHelpInfo, TacticType } from './types.js';

export const TACTIC_WEIGHTS: Record<TacticType, number> = {
  payment_channel_switch: 0.4,
  remote_access_request: 0.35,
  authority_claim: 0.3,
  fear_legal_threat: 0.3,
  secrecy_isolation: 0.3,
  too_good_reward: 0.25,
  urgency: 0.2,
};

export const TACTIC_LABELS: Record<TacticType, { label: string; description: string }> = {
  authority_claim: {
    label: 'Authority Claim',
    description: 'Impersonating police, CBI, tax officers, customs, or bank officials.',
  },
  urgency: {
    label: 'Urgency Pressure',
    description: 'Demanding immediate action before you can verify.',
  },
  secrecy_isolation: {
    label: 'Secrecy / Isolation',
    description: 'Instructing not to tell family, disconnect, or leave a quiet room.',
  },
  fear_legal_threat: {
    label: 'Legal Threat / Fear',
    description: 'Threatening arrest, passport block, FIR, or severe penalties.',
  },
  payment_channel_switch: {
    label: 'Payment Switch',
    description: 'Demanding transfer via private UPI, crypto, or unusual channels.',
  },
  remote_access_request: {
    label: 'Remote Access Request',
    description: 'Asking to install screen share apps (AnyDesk, TeamViewer, RustDesk).',
  },
  too_good_reward: {
    label: 'Unsolicited Reward',
    description: 'Promising quick high-return jobs, fake refunds, or unexpected lottery.',
  },
};

export const RISK_THRESHOLDS = {
  WARN_TRIGGER: 40,
  WARN_CLEAR: 30,
  ALERT_TRIGGER: 70,
  ALERT_CLEAR: 55,
  ESCALATION_BONUS: 10,
  ESCALATION_DISTINCT_TACTICS: 3,
  ESCALATION_WINDOW_MS: 60 * 1000,
  LEGIT_SIGNAL_REDUCTION: 15,
} as const;

export const REGION_PACKS: Record<Region, RegionHelpInfo> = {
  IN: {
    code: 'IN',
    name: 'India',
    helplineNumber: '1930',
    portalUrl: 'https://cybercrime.gov.in',
    portalName: 'National Cyber Crime Reporting Portal (cybercrime.gov.in)',
    reportAdvice: 'Call 1930 immediately or file an incident at cybercrime.gov.in.',
  },
  US: {
    code: 'US',
    name: 'United States',
    helplineNumber: '1-877-382-4357',
    portalUrl: 'https://reportfraud.ftc.gov',
    portalName: 'FTC Report Fraud (reportfraud.ftc.gov)',
    reportAdvice: 'Report the impersonation at reportfraud.ftc.gov or call 1-877-FTC-HELP.',
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    helplineNumber: '0300 123 2040',
    portalUrl: 'https://reportfraud.police.uk',
    portalName: 'Action Fraud (reportfraud.police.uk)',
    reportAdvice: 'Call Action Fraud at 0300 123 2040 or report at reportfraud.police.uk.',
  },
};
