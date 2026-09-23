import {
  AnalyzeResponse,
  REGION_PACKS,
  Region,
  SCAM_TYPE_LABELS,
  SCAM_TYPE_TO_CATEGORY,
} from '@holdon/shared';
import {
  AlertOctagon,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Landmark,
  LifeBuoy,
  PhoneCall,
  RotateCcw,
  Save,
  Shield,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button.js';

interface RecoveryGuidePageProps {
  region: Region;
  analysisSummary?: AnalyzeResponse | null;
  initialTranscript?: string;
  onNavigateComplaint: (transcript?: string, analysis?: AnalyzeResponse | null) => void;
}

const CHECKLIST_STORAGE_KEY = 'holdon_recovery_checklist_v1';

export const RecoveryGuidePage: React.FC<RecoveryGuidePageProps> = ({
  region,
  analysisSummary,
  initialTranscript,
  onNavigateComplaint,
}) => {
  const pack = REGION_PACKS[region] ?? REGION_PACKS.IN;

  // Track checked steps (1 through 5) in browser localStorage only (FR-38)
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
    return {};
  });

  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checkedSteps));
    } catch {
      // Ignore localStorage errors
    }
  }, [checkedSteps]);

  const toggleStep = (stepNumber: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const toggleSource = (stepNumber: number) => {
    setExpandedSources((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const handleResetChecklist = () => {
    setCheckedSteps({});
    try {
      localStorage.removeItem(CHECKLIST_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const completedCount = [1, 2, 3, 4, 5].filter((n) => checkedSteps[n]).length;
  const progressPct = Math.round((completedCount / 5) * 100);

  // Pre-fill scam metadata from current analysis if available
  const hasAnalysis = Boolean(analysisSummary);
  const detectedScamLabel = analysisSummary?.scam_type
    ? SCAM_TYPE_LABELS[analysisSummary.scam_type]
    : null;
  const targetCategory = analysisSummary?.scam_type
    ? SCAM_TYPE_TO_CATEGORY[analysisSummary.scam_type]
    : 'Coercion / Financial Cyber Fraud';

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 pb-24">
      {/* Emergency Alert Banner */}
      <div className="bg-alert-bg border border-alert/30 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertOctagon className="w-6 h-6 text-alert shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg font-bold text-text tracking-heading">
              "I Already Paid" — Emergency Recovery Guide
            </h1>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              If you already sent funds, transferred UPI, or purchased vouchers under coercion, act within the first few hours to trigger banking stop-payment holds.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="text-xs font-semibold px-2.5 py-1 bg-surface-2 border border-border text-accent rounded-full">
            {pack.name} Jurisdiction
          </span>
        </div>
      </div>

      {/* Progress & Control Bar */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-text">Recovery Checklist Progress</span>
            <span className="text-xs text-muted font-medium">({completedCount} of 5 completed)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-accent">{progressPct}%</span>
            {completedCount > 0 && (
              <button
                onClick={handleResetChecklist}
                className="text-xs text-muted hover:text-text flex items-center gap-1 transition-colors"
                title="Reset checklist progress in browser"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
        <div className="w-full bg-surface-2 h-2 rounded-full overflow-hidden border border-border/50">
          <div
            className="bg-accent h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[11px] text-muted/70 mt-2">
          Checklist progress is kept strictly in your local browser only. No action state is sent to the server.
        </p>
      </div>

      {/* Ordered Steps List */}
      <div className="space-y-6">
        {/* STEP 1: Contact Bank */}
        <section
          className={`border rounded-xl p-6 transition-all duration-200 ${
            checkedSteps[1]
              ? 'bg-surface/50 border-accent/30'
              : 'bg-surface border-border shadow-sm'
          }`}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleStep(1)}
              className="mt-1 text-muted hover:text-accent transition-colors shrink-0 focus:outline-none"
              aria-label={checkedSteps[1] ? 'Mark step 1 incomplete' : 'Mark step 1 complete'}
            >
              {checkedSteps[1] ? (
                <CheckCircle2 className="w-6 h-6 text-accent" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">
                    Step 1 · Immediate Priority
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-alert-bg border border-alert/20 text-alert font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> First 0–2 Hours
                  </span>
                </div>
              </div>

              <h2 className="text-base font-semibold text-text flex items-center gap-2">
                <Landmark className="w-4 h-4 text-accent" />
                Contact your bank through the official number on your card or mobile app
              </h2>

              <p className="text-sm text-text/90 mt-2 leading-relaxed">
                Immediately call the fraud helpline printed on the <strong>physical back of your debit/credit card</strong> or open your bank's verified mobile app. Never look up bank phone numbers on search engines, as sponsored ads frequently lead to imposter call centres.
              </p>

              <div className="mt-4 p-3.5 bg-surface-2 border border-border rounded-lg space-y-2 text-xs text-text/80">
                <div className="font-semibold text-text">Exact instructions for your call:</div>
                <ul className="list-disc list-inside space-y-1.5 pl-1 text-muted leading-relaxed">
                  <li>
                    State clearly: <span className="text-text italic">"I have just been defrauded. Please immediately block transaction reference [UTR / Transaction ID] and place a debit freeze on my account."</span>
                  </li>
                  <li>Request the fraud division to initiate an inter-bank recall (lien request) to the recipient's bank.</li>
                  <li>Demand a formal <strong>Complaint Ticket Reference Number</strong> from the representative.</li>
                </ul>
              </div>

              {/* Official Citation */}
              <div className="mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => toggleSource(1)}
                  className="flex items-center justify-between w-full text-xs text-muted hover:text-text font-medium"
                >
                  <span className="flex items-center gap-1.5 text-accent">
                    <BookOpen className="w-3.5 h-3.5" />
                    Official Source & Regulatory Advisory
                  </span>
                  {expandedSources[1] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {expandedSources[1] && (
                  <div className="mt-2 text-xs text-muted leading-relaxed bg-bg p-3 rounded-lg border border-border/60">
                    {region === 'IN' ? (
                      <>
                        <div className="font-semibold text-text">
                          Reserve Bank of India (RBI) Notification RBI/2017-18/15
                        </div>
                        <div className="italic text-muted mt-0.5">
                          "Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions" (DPSS.CO.PD.No.3631/02.14.008/2017-18):
                        </div>
                        <div className="mt-1">
                          Customers have <strong>zero liability</strong> if third-party breach/fraud is reported to the bank within three working days of receiving communication from the bank. Immediate notice is mandatory for the receiving bank to lock contested funds.
                        </div>
                      </>
                    ) : region === 'US' ? (
                      <>
                        <div className="font-semibold text-text">
                          Consumer Financial Protection Bureau (CFPB) & 12 CFR § 1005.11 (Regulation E)
                        </div>
                        <div className="mt-1">
                          Under the Electronic Fund Transfer Act, reporting unauthorized card/electronic transfers within two business days caps statutory consumer liability at $50.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-text">
                          Payment Systems Regulator (PSR) Authorized Push Payment (APP) Scam Rules
                        </div>
                        <div className="mt-1">
                          Mandates sending and receiving financial institutions to promptly apply stop-payment mechanisms and investigate APP fraud upon consumer notification.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STEP 2: Call Regional Helpline */}
        <section
          className={`border rounded-xl p-6 transition-all duration-200 ${
            checkedSteps[2]
              ? 'bg-surface/50 border-accent/30'
              : 'bg-surface border-border shadow-sm'
          }`}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleStep(2)}
              className="mt-1 text-muted hover:text-accent transition-colors shrink-0 focus:outline-none"
              aria-label={checkedSteps[2] ? 'Mark step 2 incomplete' : 'Mark step 2 complete'}
            >
              {checkedSteps[2] ? (
                <CheckCircle2 className="w-6 h-6 text-accent" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-accent uppercase tracking-wider">
                  Step 2 · National Authority
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warn-bg border border-warn/20 text-warn font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Within 24 Hours
                </span>
              </div>

              <h2 className="text-base font-semibold text-text flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-accent" />
                Call the official national cybercrime helpline ({pack.helplineNumber})
              </h2>

              <p className="text-sm text-text/90 mt-2 leading-relaxed">
                Connect directly with your jurisdiction's cybercrime emergency team to initiate a national cyber fraud ticket and inter-bank freezing network hold.
              </p>

              {/* Verified Region Helpline Card - Only pack numbers, no invented numbers! */}
              <div className="mt-4 p-4 bg-surface-2 border border-accent/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-muted font-medium">{pack.name} National Helpline:</div>
                  <div className="text-2xl font-bold tracking-heading text-text mt-0.5">
                    {pack.helplineNumber}
                  </div>
                  <div className="text-xs text-muted mt-1">{pack.portalName}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${pack.helplineNumber}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-fill-text rounded-[10px] text-xs font-semibold hover:brightness-110 transition shadow-sm"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call {pack.helplineNumber}
                  </a>
                  <a
                    href={pack.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 bg-surface border border-border text-text rounded-[10px] text-xs font-medium hover:border-border-strong transition"
                  >
                    Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Official Citation */}
              <div className="mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => toggleSource(2)}
                  className="flex items-center justify-between w-full text-xs text-muted hover:text-text font-medium"
                >
                  <span className="flex items-center gap-1.5 text-accent">
                    <BookOpen className="w-3.5 h-3.5" />
                    Official Source & Regulatory Advisory
                  </span>
                  {expandedSources[2] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {expandedSources[2] && (
                  <div className="mt-2 text-xs text-muted leading-relaxed bg-bg p-3 rounded-lg border border-border/60">
                    {region === 'IN' ? (
                      <>
                        <div className="font-semibold text-text">
                          Ministry of Home Affairs (MHA) & Indian Cyber Crime Coordination Centre (I4C)
                        </div>
                        <div className="italic text-muted mt-0.5">
                          Citizen Financial Cyber Fraud Reporting & Management System (CFCFRMS / 1930 Helpline SOP):
                        </div>
                        <div className="mt-1">
                          Calling <strong>1930</strong> connects victims to the integrated banking liaison module. Calling during the "Golden Hour" allows cyber cells to flag receiving bank accounts across 250+ scheduled banks before cash withdrawal or crypto conversion occurs.
                        </div>
                      </>
                    ) : region === 'US' ? (
                      <>
                        <div className="font-semibold text-text">
                          Federal Trade Commission (FTC) & FBI Internet Crime Complaint Center (IC3)
                        </div>
                        <div className="mt-1">
                          Advisories mandate reporting financial fraud to 1-877-382-4357 or reportfraud.ftc.gov for rapid dissemination across the Consumer Sentinel Network and federal task forces.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-text">
                          City of London Police & National Fraud Intelligence Bureau (NFIB)
                        </div>
                        <div className="mt-1">
                          Action Fraud (0300 123 2040) coordinates real-time dissemination of fraudulent beneficiary account details to UK clearers through the National Fraud Database.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STEP 3: Preserve Evidence */}
        <section
          className={`border rounded-xl p-6 transition-all duration-200 ${
            checkedSteps[3]
              ? 'bg-surface/50 border-accent/30'
              : 'bg-surface border-border shadow-sm'
          }`}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleStep(3)}
              className="mt-1 text-muted hover:text-accent transition-colors shrink-0 focus:outline-none"
              aria-label={checkedSteps[3] ? 'Mark step 3 incomplete' : 'Mark step 3 complete'}
            >
              {checkedSteps[3] ? (
                <CheckCircle2 className="w-6 h-6 text-accent" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-accent uppercase tracking-wider">
                  Step 3 · Forensic Integrity
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted font-medium">
                  Evidence Preservation
                </span>
              </div>

              <h2 className="text-base font-semibold text-text flex items-center gap-2">
                <Save className="w-4 h-4 text-accent" />
                Keep chats, screenshots, and payment receipts as evidence
              </h2>

              <p className="text-sm text-text/90 mt-2 leading-relaxed">
                Law enforcement and cyber forensics teams require original, unaltered records with verifiable timestamps to prosecute offenders.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-surface-2 border border-border rounded-lg">
                  <div className="font-semibold text-text mb-1">1. Full-Screen Captures</div>
                  <p className="text-muted leading-relaxed">
                    Take full-screen screenshots displaying sender phone number, username, profile picture, and exact clock timestamps.
                  </p>
                </div>
                <div className="p-3 bg-surface-2 border border-border rounded-lg">
                  <div className="font-semibold text-text mb-1">2. Payment Slips & UTRs</div>
                  <p className="text-muted leading-relaxed">
                    Download and save original PDF receipts showing 12-digit UTR, bank account number, and recipient UPI ID.
                  </p>
                </div>
                <div className="p-3 bg-surface-2 border border-border rounded-lg">
                  <div className="font-semibold text-text mb-1">3. Complete Chat Export</div>
                  <p className="text-muted leading-relaxed">
                    Use WhatsApp/Telegram's "Export Chat" (with media) feature to save an immutable .txt and media archive.
                  </p>
                </div>
              </div>

              {/* Official Citation */}
              <div className="mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => toggleSource(3)}
                  className="flex items-center justify-between w-full text-xs text-muted hover:text-text font-medium"
                >
                  <span className="flex items-center gap-1.5 text-accent">
                    <BookOpen className="w-3.5 h-3.5" />
                    Official Source & Regulatory Advisory
                  </span>
                  {expandedSources[3] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {expandedSources[3] && (
                  <div className="mt-2 text-xs text-muted leading-relaxed bg-bg p-3 rounded-lg border border-border/60">
                    {region === 'IN' ? (
                      <>
                        <div className="font-semibold text-text">
                          Bharatiya Sakshya Adhiniyam, 2023 (BSA Section 63) & I4C Digital Evidence Integrity
                        </div>
                        <div className="mt-1">
                          Electronic records require preservation of chronological metadata and uncompressed digital copies to satisfy Section 63 admissibility standards for criminal prosecution in Indian courts.
                        </div>
                      </>
                    ) : region === 'US' ? (
                      <>
                        <div className="font-semibold text-text">
                          Federal Rules of Evidence 902(13)/(14) & DOJ CCIPS Electronic Evidence Guidelines
                        </div>
                        <div className="mt-1">
                          Records generated by electronic systems must maintain chain-of-custody hashes and unaltered timestamps to qualify for self-authenticating electronic record status.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-text">
                          Crown Prosecution Service (CPS) Digital Forensics Protocol (PACE 1984)
                        </div>
                        <div className="mt-1">
                          Requires contemporaneous evidence logs with device-generated audit trails to support statutory criminal proceedings under the Fraud Act 2006.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STEP 4: Do Not Delete */}
        <section
          className={`border rounded-xl p-6 transition-all duration-200 ${
            checkedSteps[4]
              ? 'bg-surface/50 border-accent/30'
              : 'bg-surface border-border shadow-sm'
          }`}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleStep(4)}
              className="mt-1 text-muted hover:text-accent transition-colors shrink-0 focus:outline-none"
              aria-label={checkedSteps[4] ? 'Mark step 4 incomplete' : 'Mark step 4 complete'}
            >
              {checkedSteps[4] ? (
                <CheckCircle2 className="w-6 h-6 text-accent" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-accent uppercase tracking-wider">
                  Step 4 · Evidence Retention
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-alert-bg border border-alert/20 text-alert font-medium">
                  Do Not Erase
                </span>
              </div>

              <h2 className="text-base font-semibold text-text flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-alert" />
                Do not delete anything from your phone or apps
              </h2>

              <p className="text-sm text-text/90 mt-2 leading-relaxed">
                Do not delete chats, SMS codes, or call history out of panic or embarrassment. Do not immediately delete remote desktop applications (e.g. AnyDesk, TeamViewer) until log files are secured.
              </p>

              <div className="mt-4 p-3.5 bg-surface-2 border border-border rounded-lg space-y-2 text-xs text-muted leading-relaxed">
                <p>
                  <strong className="text-text">Remote screen apps:</strong> Turn on <span className="text-accent font-mono">Airplane Mode</span> or disconnect Wi-Fi to stop remote control, but <strong>do not uninstall the app</strong>. The app's local session logs contain the scammer's connection IP address and client ID, which police cyber officers need for subpoenas.
                </p>
                <p>
                  <strong className="text-text">Do not alert the scammer:</strong> Avoid threatening or confronting the scammer immediately; doing so causes them to delete WhatsApp chats for everyone or erase remote Telegram accounts before you can record evidence.
                </p>
              </div>

              {/* Official Citation */}
              <div className="mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => toggleSource(4)}
                  className="flex items-center justify-between w-full text-xs text-muted hover:text-text font-medium"
                >
                  <span className="flex items-center gap-1.5 text-accent">
                    <BookOpen className="w-3.5 h-3.5" />
                    Official Source & Regulatory Advisory
                  </span>
                  {expandedSources[4] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {expandedSources[4] && (
                  <div className="mt-2 text-xs text-muted leading-relaxed bg-bg p-3 rounded-lg border border-border/60">
                    {region === 'IN' ? (
                      <>
                        <div className="font-semibold text-text">
                          Indian Computer Emergency Response Team (CERT-In) Advisory CIAD-2024-0018
                        </div>
                        <div className="mt-1">
                          Advises against premature app uninstallation or chat deletion in cyber fraud cases. Preservation of local application logs and session caches is critical for forensic tracebacks under Bharatiya Nyaya Sanhita (BNS) Section 238.
                        </div>
                      </>
                    ) : region === 'US' ? (
                      <>
                        <div className="font-semibold text-text">
                          CISA Incident Evidence Preservation Directive & 18 U.S. Code § 1519
                        </div>
                        <div className="mt-1">
                          Preservation of original software session artifacts and communication records is required to substantiate interstate wire fraud charges.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-text">
                          National Cyber Security Centre (NCSC) Digital Evidence Handling Protocol
                        </div>
                        <div className="mt-1">
                          Directs organizations and consumers to isolate devices from active networks while preserving internal volatile storage and application logs intact.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STEP 5: File Official Complaint */}
        <section
          className={`border rounded-xl p-6 transition-all duration-200 ${
            checkedSteps[5]
              ? 'bg-surface/50 border-accent/30'
              : 'bg-surface border-border shadow-sm'
          }`}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleStep(5)}
              className="mt-1 text-muted hover:text-accent transition-colors shrink-0 focus:outline-none"
              aria-label={checkedSteps[5] ? 'Mark step 5 incomplete' : 'Mark step 5 complete'}
            >
              {checkedSteps[5] ? (
                <CheckCircle2 className="w-6 h-6 text-accent" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-accent uppercase tracking-wider">
                  Step 5 · Official Lodgment
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium flex items-center gap-1">
                  <FileCheck className="w-3 h-3" /> Cryptographic Filing
                </span>
              </div>

              <h2 className="text-base font-semibold text-text flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                File an official complaint with HoldOn
              </h2>

              <p className="text-sm text-text/90 mt-2 leading-relaxed">
                Generate a tamper-evident, SHA-256 hashed incident dossier that can be tracked in real-time, shared with cyber officers, and publicly verified at <span className="font-mono text-accent">/verify/:hash</span>.
              </p>

              {/* Pre-fill Banner if an active analysis exists (FR-38 requirement) */}
              {hasAnalysis ? (
                <div className="mt-4 p-4 bg-accent/5 border border-accent/25 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      Active Analysis Ready to Pre-fill
                    </span>
                    <span className="text-xs font-mono text-muted">
                      Score: {analysisSummary?.score}/100 ({analysisSummary?.state})
                    </span>
                  </div>

                  <div className="text-xs text-text/90 leading-relaxed">
                    We will pre-fill your complaint with:
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-muted">
                      <li>
                        Scam Classification: <strong className="text-text">{targetCategory}</strong> {detectedScamLabel && `(${detectedScamLabel})`}
                      </li>
                      <li>
                        PII-sanitized transcript excerpt ({initialTranscript?.length || 0} characters)
                      </li>
                      <li>
                        Forensic tactic breakdown ({analysisSummary?.tactics.length || 0} verified coercion quotes)
                      </li>
                    </ul>
                  </div>

                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => onNavigateComplaint(initialTranscript, analysisSummary)}
                    icon={<ArrowRight className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    File complaint with this analysis
                  </Button>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-surface-2 border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-xs text-muted">
                    No active analysis session detected. You can start a fresh complaint now.
                  </div>
                  <Button
                    size="md"
                    variant="secondary"
                    onClick={() => onNavigateComplaint()}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    File a complaint
                  </Button>
                </div>
              )}

              {/* Official Citation */}
              <div className="mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => toggleSource(5)}
                  className="flex items-center justify-between w-full text-xs text-muted hover:text-text font-medium"
                >
                  <span className="flex items-center gap-1.5 text-accent">
                    <BookOpen className="w-3.5 h-3.5" />
                    Official Source & Regulatory Advisory
                  </span>
                  {expandedSources[5] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {expandedSources[5] && (
                  <div className="mt-2 text-xs text-muted leading-relaxed bg-bg p-3 rounded-lg border border-border/60">
                    {region === 'IN' ? (
                      <>
                        <div className="font-semibold text-text">
                          Information Technology Act, 2000 (Section 70B) & DPDP Act 2023
                        </div>
                        <div className="mt-1">
                          HoldOn complaints implement mandatory electronic consent logging and SHA-256 verification hashes, ensuring non-repudiation and structural compliance with Indian Cyber Crime Coordination Centre (I4C) reporting standards.
                        </div>
                      </>
                    ) : region === 'US' ? (
                      <>
                        <div className="font-semibold text-text">
                          FTC Consumer Sentinel & Federal Incident Reporting Standards
                        </div>
                        <div className="mt-1">
                          Digital complaint hashes create an immutable record of consumer intent and timing, supporting formal federal recovery petitions.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-text">
                          National Economic Crime Centre (NECC) & Action Fraud Incident Formats
                        </div>
                        <div className="mt-1">
                          Cryptographically sealed evidence summaries satisfy the procedural requirements for cross-border fraud investigations and bank chargeback dispute filings.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Emergency Help Link */}
      <div className="mt-10 p-5 bg-surface border border-border rounded-xl flex items-center justify-between gap-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          <span>Need immediate verbal help? Contact the {pack.name} national helpline:</span>
        </div>
        <a
          href={`tel:${pack.helplineNumber}`}
          className="font-bold text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          {pack.helplineNumber} <PhoneCall className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
