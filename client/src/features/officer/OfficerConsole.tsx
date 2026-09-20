import {
  COMPLAINT_STATUS_ORDER,
  Complaint,
  ComplaintStatus,
  getNextAllowedStatus,
} from '@holdon/shared';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { supabase } from '../../lib/supabase.js';

export const OfficerConsole: React.FC = () => {
  const { user, isOfficer, updateProfile, refreshProfile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('ALL');

  // Transition form
  const [transitionNote, setTransitionNote] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
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
        setComplaints(data.complaints || []);
        // Update selected complaint if still open
        if (selectedComplaint) {
          const updated = (data.complaints as Complaint[]).find((c) => c.id === selectedComplaint.id);
          if (updated) setSelectedComplaint(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching officer queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOfficer) {
      fetchQueue();
    }
  }, [isOfficer]);

  // Demo helper: Enable officer role if user is signed in but citizen
  const handleEnableOfficerRole = async () => {
    await updateProfile({ role: 'officer' });
    await refreshProfile();
    fetchQueue();
  };

  const handleAdvanceStatus = async (complaintId: string, nextStatus: ComplaintStatus) => {
    setIsTransitioning(true);
    setTransitionError(null);
    setActionSuccess(null);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/api/complaints/${complaintId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          nextStatus,
          note: transitionNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to advance status');
      }

      setActionSuccess(`Case successfully transitioned to ${nextStatus}.`);
      setTransitionNote('');
      await fetchQueue();

      // Refetch detail with events
      const detailRes = await fetch(`${apiUrl}/api/complaints/${data.complaint.ref}`, {
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setSelectedComplaint(detailData.complaint);
      }
    } catch (err: any) {
      setTransitionError(err.message || 'Error executing transition');
    } finally {
      setIsTransitioning(false);
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (selectedState !== 'ALL' && c.state !== selectedState) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.ref.toLowerCase().includes(q) ||
        (c.complainant_name && c.complainant_name.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations from real complaints
  const countSubmitted = complaints.filter((c) => c.status === 'Submitted').length;
  const countVerifying = complaints.filter((c) => c.status === 'Under Verification').length;
  const countVerified = complaints.filter((c) => c.status === 'Verified').length;
  const countForwardedOrClosed = complaints.filter(
    (c) => c.status === 'Forwarded to Cyber Cell' || c.status === 'Closed'
  ).length;

  // Extract unique states in the queue
  const uniqueStates = Array.from(new Set(complaints.map((c) => c.state))).filter(Boolean);

  // If not logged in or not an officer, show gate with demo switch
  if (!user || !isOfficer) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-surface border border-border rounded-xl p-8 shadow-overlay">
          <div className="w-14 h-14 rounded-full bg-warn/15 border border-warn text-warn flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold text-text">Officer Console Restricted</h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            This workspace is reserved for authorized reviewers to verify coercive evidence and advance complaint stages.
          </p>

          {user ? (
            <div className="mt-6 p-4 bg-surface-2 border border-border rounded-lg text-xs text-text space-y-3">
              <div className="text-muted">
                You are currently signed in as <strong className="text-text">{user.email}</strong> with role <strong className="text-accent">Citizen</strong>.
              </div>
              <Button
                variant="primary"
                onClick={handleEnableOfficerRole}
                icon={<UserCheck className="w-4 h-4" />}
              >
                Switch to Officer Role (Demo)
              </Button>
            </div>
          ) : (
            <div className="mt-6 text-xs text-muted">
              Please sign in with an officer account using the top bar to access the queue.
            </div>
          )}
        </div>
      </div>
    );
  }

  const nextStatus = selectedComplaint
    ? getNextAllowedStatus(selectedComplaint.status)
    : null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-heading text-text">
              Officer Review Console
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-warn/40 bg-warn/10 text-warn">
              Officer Role Active
            </span>
          </div>
          <p className="text-sm text-muted mt-1">
            Validate citizen coercion claims, review masked evidence quotes, and advance resolution stages.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={fetchQueue}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Queue
        </Button>
      </div>

      {/* KPI CARDS (Real counts, no placeholders per DESIGN.md Section 11) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending Review', count: countSubmitted, sub: 'Submitted cases', color: 'text-text' },
          { label: 'Under Verification', count: countVerifying, sub: 'In review', color: 'text-warn' },
          { label: 'Verified Evidence', count: countVerified, sub: 'Ready for dispatch', color: 'text-accent' },
          { label: 'Forwarded / Closed', count: countForwardedOrClosed, sub: 'Processed', color: 'text-muted' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-surface border border-border rounded-xl p-5 shadow-overlay">
            <span className="text-xs font-medium text-muted block">{kpi.label}</span>
            <div className={`text-3xl font-bold tracking-tight mt-1 ${kpi.color}`}>
              {kpi.count}
            </div>
            <span className="text-[11px] text-muted/70 mt-1 block">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-3 shadow-overlay">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ref, category, name…"
            className="w-full pl-9 pr-3 py-1.5 bg-surface-2 border border-border rounded-[10px] text-xs text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs bg-surface-2 border border-border rounded-[10px] px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-text text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              {COMPLAINT_STATUS_ORDER.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* State filter */}
          {uniqueStates.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs bg-surface-2 border border-border rounded-[10px] px-2.5 py-1.5">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-transparent text-text text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Jurisdictions</option>
                {uniqueStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* QUEUE TABLE AND DETAIL DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table column */}
        <div className={selectedComplaint ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-overlay">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-muted font-medium">
                    <th className="px-4 py-3">Reference ID</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 hidden sm:table-cell">State</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        No complaints match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((item) => {
                      const isSelected = selectedComplaint?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedComplaint(item)}
                          className={`hover:bg-surface-2/80 cursor-pointer transition-colors ${
                            isSelected ? 'bg-surface-2 border-l-2 border-accent' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-semibold text-accent">
                            {item.ref}
                            {item.is_seed && (
                              <span className="ml-1.5 text-[9px] font-sans px-1.5 py-0.2 bg-muted/20 text-muted rounded">
                                sample data
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-text max-w-[140px] truncate">
                            {item.category}
                          </td>
                          <td className="px-4 py-3 text-muted hidden sm:table-cell">
                            {item.state}
                          </td>
                          <td className="px-4 py-3 font-mono text-text">
                            ₹{Number(item.amount_lost).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                item.status === 'Verified'
                                  ? 'border-accent/40 bg-accent/10 text-accent'
                                  : item.status === 'Under Verification'
                                  ? 'border-warn/40 bg-warn/10 text-warn'
                                  : 'border-border bg-surface text-muted'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ChevronRight className="w-4 h-4 text-muted inline" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DETAIL PANEL (Right side) */}
        {selectedComplaint && (
          <div className="lg:col-span-5 bg-surface border border-border-strong rounded-xl p-6 shadow-overlay space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase">Selected Case</span>
                <div className="text-lg font-mono font-bold text-accent">
                  {selectedComplaint.ref}
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-surface-2"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 bg-ok-bg border border-accent/40 rounded-lg flex items-start gap-2 text-xs text-accent">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {transitionError && (
              <div className="p-3 bg-alert-bg border border-alert/40 rounded-lg flex items-start gap-2 text-xs text-alert">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{transitionError}</span>
              </div>
            )}

            {/* Case particulars */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-surface-2 rounded-lg border border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Complainant:</span>
                  <span className="font-semibold text-text">{selectedComplaint.complainant_name || 'Citizen'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Contact Email:</span>
                  <span className="font-mono text-text">{selectedComplaint.complainant_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">State / City:</span>
                  <span className="text-text">{selectedComplaint.district ? `${selectedComplaint.district}, ` : ''}{selectedComplaint.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Financial Loss:</span>
                  <span className="font-mono font-bold text-accent">₹{Number(selectedComplaint.amount_lost).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <span className="text-muted font-medium block mb-1">Citizen Narrative:</span>
                <p className="p-3 bg-surface-2 rounded-lg border border-border text-text leading-relaxed">
                  "{selectedComplaint.description}"
                </p>
              </div>

              {selectedComplaint.masked_excerpt && (
                <div>
                  <span className="text-muted font-medium block mb-1">Masked Transcript Excerpt:</span>
                  <p className="p-3 bg-surface-2 rounded-lg border border-border font-mono text-text/80 text-[11px] leading-relaxed break-words">
                    {selectedComplaint.masked_excerpt}
                  </p>
                </div>
              )}
            </div>

            {/* STATUS TRANSITION CONTROLLER (Server-enforced FR-20) */}
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text">Workflow Status</span>
                <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
                  {selectedComplaint.status}
                </span>
              </div>

              {nextStatus ? (
                <div className="p-4 bg-surface-2 border border-border rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-text">
                    <ArrowRight className="w-4 h-4 text-accent" />
                    <span>Next Allowed Stage: <strong>{nextStatus}</strong></span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-muted mb-1">
                      Reviewer verification note (will appear in citizen timeline)
                    </label>
                    <textarea
                      rows={2}
                      value={transitionNote}
                      onChange={(e) => setTransitionNote(e.target.value)}
                      placeholder={`e.g. Verified coercive pattern. Advancing to ${nextStatus}.`}
                      className="w-full p-2 bg-surface border border-border rounded-lg text-xs text-text placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                    />
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full"
                    disabled={isTransitioning}
                    onClick={() => handleAdvanceStatus(selectedComplaint.id, nextStatus)}
                  >
                    {isTransitioning ? 'Updating status…' : `Advance to "${nextStatus}"`}
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-surface-2 border border-border rounded-lg text-xs text-muted flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>Terminal state reached ({selectedComplaint.status}). No further transitions allowed.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
