import { LegitSignal, TacticEvidence, TacticType } from '@holdon/shared';

interface FallbackRule {
  type: TacticType;
  patterns: RegExp[];
  confidence: number;
}

const FALLBACK_RULES: FallbackRule[] = [
  {
    type: 'authority_claim',
    confidence: 0.92,
    patterns: [
      /(?:cbi|crime branch|cyber crime|cyber cell|police headquarters|delhi police|mumbai police|customs officer|narcotics control|ed officer|enforcement directorate|supreme court|trai official|telecom authority)/i,
      /(?:digital arrest|police officer|inspector|sub-inspector|deputy commissioner|officer verification)/i,
      /(?:cbi cyber|police station|pulis vibhag|adhikari)/i,
    ],
  },
  {
    type: 'urgency',
    confidence: 0.88,
    patterns: [
      /(?:immediately|right now|within (?:\d+|[a-z]+) minutes|urgent action required|last warning|before midnight|account will be blocked today)/i,
      /(?:turant|abhi ke abhi|ekdum jaldi|fauran|aaj hi|velechyat|lagach)/i,
    ],
  },
  {
    type: 'secrecy_isolation',
    confidence: 0.9,
    patterns: [
      /(?:do not hang up|stay on the call|keep this confidential|do not tell (?:anyone|your family|friends)|lock the door|stay in a quiet room|secret investigation|maintain complete secrecy)/i,
      /(?:kisi ko (?:bhi )?mat batana|call mat katna|kamre me akele raho|line par raho|koni sangat naye)/i,
    ],
  },
  {
    type: 'fear_legal_threat',
    confidence: 0.95,
    patterns: [
      /(?:arrest warrant|non-bailable warrant|fir registered|face legal action|send to jail|money laundering case|drug trafficking|parcel seized|illegal consignment|passport canceled|penalty will be imposed)/i,
      /(?:jail bhejenge|giraftar|kanooni karwai|case darj|police aayegi|kaydeshir karwai)/i,
    ],
  },
  {
    type: 'payment_channel_switch',
    confidence: 0.94,
    patterns: [
      /(?:transfer (?:the )?(?:funds|money|amount)|security deposit|clearance fee|verification charge|pay via upi|send money to this account|refundable security|rbi verification account)/i,
      /(?:paisa (?:bhejo|transfer karo)|paise jama kara|upi karo|suraksha deposit)/i,
    ],
  },
  {
    type: 'remote_access_request',
    confidence: 0.98,
    patterns: [
      /(?:install|download) (?:anydesk|teamviewer|rustdesk|quicksupport|screen share app|apk)/i,
      /(?:share your screen|give (?:\d+|[a-z]+) digit code on your screen|allow remote access)/i,
      /(?:screen share karo|app download karo|anydesk chaloo karo)/i,
    ],
  },
  {
    type: 'too_good_reward',
    confidence: 0.85,
    patterns: [
      /(?:work from home job|like youtube videos (?:and|to) earn|daily income guaranteed|instant lottery winner|overseas job guaranteed|high return investment)/i,
      /(?:ghar baithe kamai|lottery lagi|paise milenge)/i,
    ],
  },
];

const LEGIT_PATTERNS: { type: string; pattern: RegExp }[] = [
  {
    type: 'official_verification_advice',
    pattern: /(?:visit your nearest (?:bank )?branch|call the official number on the back of your card|we never ask for your otp or password|check your official netbanking)/i,
  },
  {
    type: 'no_immediate_payment',
    pattern: /(?:no payment is required|take your time to review|contact official customer support)/i,
  },
];

export function runFallbackScorer(inputText: string): {
  tactics: TacticEvidence[];
  legitSignals: LegitSignal[];
  advice: string;
} {
  const tactics: TacticEvidence[] = [];
  const seenTypes = new Set<TacticType>();

  for (const rule of FALLBACK_RULES) {
    if (seenTypes.has(rule.type)) continue;

    for (const pattern of rule.patterns) {
      const match = inputText.match(pattern);
      if (match) {
        tactics.push({
          type: rule.type,
          evidence: match[0],
          confidence: rule.confidence,
          score: 0, // Will be computed by risk engine
        });
        seenTypes.add(rule.type);
        break;
      }
    }
  }

  const legitSignals: LegitSignal[] = [];
  for (const item of LEGIT_PATTERNS) {
    const match = inputText.match(item.pattern);
    if (match) {
      legitSignals.push({
        type: item.type,
        evidence: match[0],
        confidence: 0.85,
      });
    }
  }

  let advice = 'Verify via the official helpline number before making any decision or payment.';
  if (tactics.some((t) => t.type === 'remote_access_request')) {
    advice = 'Never install screen sharing apps or share codes. Verify via the official number.';
  } else if (tactics.some((t) => t.type === 'fear_legal_threat' || t.type === 'authority_claim')) {
    advice = 'Law enforcement agencies never conduct "digital arrests" or ask for online transfers. Verify via the official number.';
  }

  return { tactics, legitSignals, advice };
}
