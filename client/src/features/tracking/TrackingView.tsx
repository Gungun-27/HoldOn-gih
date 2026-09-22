import { COMPLAINT_STATUS_ORDER, Complaint } from '@holdon/shared';
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  FileDown,
  Hash,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { supabase } from '../../lib/supabase.js';
import { generateReportPDF } from '../complaints/ReportPDF.js';

interface TrackingViewProps {
  initialRef?: string | null;
}

export const TrackingView: React.FC<TrackingViewProps> = ({ initialRef }) => {
  const { user } = useAuth();
  const [refQuery, setRefQuery] = useState<string>(initialRef || '');
  const [emailQuery, setEmailQuery] = useState<string>(user?.email || '');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  // If user is logged in, fetch their submitted complaints list
  const fetchUserComplaints = async () => {
    if (!user) return;
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/complaints`, {
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUserComplaints(data.complaints || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUserComplaints();
  }, [user]);

  const fetchComplaintDetails = async (ref: string, email?: string) => {
    if (!ref.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const session = (await supabase.auth.getSession()).data.session;

      const url = new URL(`${apiUrl}/api/complaints/${encodeURIComponent(ref.trim())}`);
      if (email?.trim()) {
        url.searchParams.set('email', email.trim().toLowerCase());
      }

      const res = await fetch(url.toString(), {
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Could not find case with this reference ID');
      }

      setComplaint(data.complaint);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve complaint');
      setComplaint(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search if initialRef provided
  useEffect(() => {
    if (initialRef) {
      setRefQuery(initialRef);
      fetchComplaintDetails(initialRef, user?.email || undefined);
    }
  }, [initialRef]);

  // Realtime subscription when viewing a complaint
  useEffect(() => {
    if (!complaint?.id) return;

    const channel = supabase
      .channel(`complaint_tracking_${complaint.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaint_events',
          filter: `complaint_id=eq.${complaint.id}`,
        },
        () => {
          fetchComplaintDetails(complaint.ref, complaint.complainant_email);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [complaint?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaintDetails(refQuery, emailQuery);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const currentStageIndex = complaint
    ? COMPLAINT_STATUS_ORDER.indexOf(complaint.status)
    : -1;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-heading text-text">
          Case Tracking
        </h1>
        <p className="text-sm text-muted mt-1">
          Monitor your complaint lifecycle across verification and forwarding stages with real-time audit logs.
        </p>
      </div>

      {/* Search card */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-8 shadow-overlay">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted mb-1">
              Reference ID
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={refQuery}
                onChange={(e) => setRefQuery(e.target.value.toUpperCase())}
                placeholder="HLD-2026-XXXXXX"
                className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] font-mono text-sm text-text placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent uppercase"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-muted mb-1">
              Complainant Email
            </label>
            <input
              type="email"
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              placeholder="citizen@example.com"
              className="w-full px-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="sm:self-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !refQuery.trim()}
              icon={<Search className="w-4 h-4" />}
            >
              {isLoading ? 'Searching…' : 'Track Case'}
            </Button>
          </div>
        </form>

        {/* User's recent complaints list if authenticated */}
        {userComplaints.length > 0 && !complaint && (
          <div className="mt-5 pt-4 border-t border-border">
            <span className="text-xs font-medium text-muted block mb-2">
              Your registered cases ({userComplaints.length}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {userComplaints.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setRefQuery(item.ref);
                    setEmailQuery(item.complainant_email);
                    fetchComplaintDetails(item.ref, item.complainant_email);
                  }}
                  className="p-3 bg-surface-2 border border-border hover:border-border-strong rounded-lg text-left flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-accent">{item.ref}</div>
                    <div className="text-[11px] text-muted truncate max-w-[180px]">{item.category}</div>
                  </div>
                  <span className="text-[10px] font-medium text-text bg-surface px-2 py-0.5 rounded-full border border-border">
                    {item.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-alert-bg border border-alert/30 rounded-xl flex items-start gap-3 text-sm text-alert">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Case Not Found</div>
            <div className="text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* COMPLAINT DETAILS & TIMELINE */}
      {complaint && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-overlay">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
              <div>
                <span className="text-[11px] font-medium text-muted uppercase tracking-wider">
                  Case Record
                </span>
                <div className="text-2xl font-mono font-bold text-accent mt-0.5">
                  {complaint.ref}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fetchComplaintDetails(complaint.ref, complaint.complainant_email)}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
                >
                  Refresh
                </Button>
                <span className="px-3 py-1 bg-accent/15 border border-accent text-accent font-medium text-xs rounded-full">
                  {complaint.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <span className="text-muted block">Classification</span>
                <span className="font-medium text-text mt-0.5 block">{complaint.category}</span>
              </div>
              <div>
                <span className="text-muted block">Jurisdiction</span>
                <span className="font-medium text-text mt-0.5 block">
                  {complaint.district ? `${complaint.district}, ` : ''}{complaint.state}
                </span>
              </div>
              <div>
                <span className="text-muted block">Amount Claimed</span>
                <span className="font-mono font-medium text-text mt-0.5 block">
                  ₹{Number(complaint.amount_lost).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-muted block">Complainant</span>
                <span className="font-medium text-text mt-0.5 block truncate">
                  {complaint.complainant_name || 'Citizen'}
                </span>
              </div>
            </div>

            {/* SHA-256 Hash Verification Badge */}
            {complaint.report_hash && (
              <div className="mt-5 p-3 bg-surface-2 border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-muted shrink-0">SHA-256 Hash:</span>
                  <span className="font-mono text-text/80 truncate text-[11px]">
                    {complaint.report_hash}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyHash(complaint.report_hash!)}
                  className="text-xs text-accent hover:underline flex items-center gap-1 shrink-0"
                >
                  {copiedHash ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Hash</>}
                </button>
              </div>
            )}

            {/* Report Download & Verify Actions */}
            {complaint.report_hash && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {COMPLAINT_STATUS_ORDER.indexOf(complaint.status) >= 2 && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isGeneratingPDF}
                    icon={<FileDown className="w-3.5 h-3.5" />}
                    onClick={async () => {
                      setIsGeneratingPDF(true);
                      try {
                        await generateReportPDF(complaint);
                      } catch (err) {
                        console.error('PDF generation failed:', err);
                      } finally {
                        setIsGeneratingPDF(false);
                      }
                    }}
                  >
                    {isGeneratingPDF ? 'Generating…' : 'Download Report'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  onClick={() => {
                    // Navigate to verify view — handled by parent via nav change
                    window.dispatchEvent(new CustomEvent('holdon:navigate-verify', { detail: complaint.report_hash }));
                  }}
                >
                  Verify Integrity
                </Button>
              </div>
            )}
          </div>

          {/* VERTICAL TIMELINE matching DESIGN.md Section 5 */}
          <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-overlay">
            <h2 className="text-lg font-semibold tracking-heading text-text mb-6">
              Audit & Transition Timeline
            </h2>

            <div className="relative pl-6 sm:pl-8 space-y-8">
              {COMPLAINT_STATUS_ORDER.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                // Find audit event for this status
                const event = complaint.events?.find((e) => e.status === stage);

                return (
                  <div key={stage} className="relative flex items-start gap-4">
                    {/* Connecting line */}
                    {idx < COMPLAINT_STATUS_ORDER.length - 1 && (
                      <div
                        className={`absolute -left-6 sm:-left-8 top-7 bottom-[-2rem] w-0.5 transition-colors ${
                          idx < currentStageIndex ? 'bg-accent' : 'bg-border'
                        }`}
                      />
                    )}

                    {/* Step Icon / Circle */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-1 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-accent text-accent-fill-text'
                          : isCurrent
                          ? 'border-2 border-accent bg-surface-2 text-accent glow-accent'
                          : 'border border-border bg-surface text-muted/50'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      ) : (
                        <span className="text-[10px] font-semibold">{idx + 1}</span>
                      )}
                    </div>

                    {/* Stage details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-sm font-semibold transition-colors ${
                            isCurrent
                              ? 'text-accent'
                              : isCompleted
                              ? 'text-text'
                              : 'text-muted'
                          }`}
                        >
                          {stage}
                        </span>

                        {event && (
                          <span className="text-[11px] text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.created_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Stage description & officer note */}
                      <p className="text-xs text-muted mt-1 leading-relaxed">
                        {stage === 'Submitted' && 'Citizen recorded narrative, applied PII masking, and consented under DPDP.'}
                        {stage === 'Under Verification' && 'Officer review initiated. Corroborating verbatim quotes against regional threat patterns.'}
                        {stage === 'Verified' && 'Coercion pattern validated by reviewer. Tamper-proof report generated.'}
                        {stage === 'Forwarded to Cyber Cell' && 'Dispatched to simulation dispatch unit (1930 / State nodal office).'}
                        {stage === 'Closed' && 'Case resolution reached. File finalized in repository.'}
                      </p>

                      {event?.note && (
                        <div className="mt-2 p-2.5 bg-surface-2 border border-border rounded-lg text-xs text-text/90">
                          <span className="font-semibold text-muted text-[11px] block">
                            Note from {event.actor_role}:
                          </span>
                          {event.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulation notice under timeline (PRD FR-23 & DESIGN.md) */}
            <div className="mt-8 pt-4 border-t border-border flex items-start gap-2.5 text-xs text-muted">
              <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>
                <strong>Demo Simulation:</strong> Forwarding to Cyber Cell is simulated. Not transmitted to any real police or government database.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
