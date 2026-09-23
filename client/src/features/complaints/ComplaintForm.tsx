import { AnalyzeResponse, maskPII } from '@holdon/shared';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  RotateCcw,
  Send,
  Shield,
  User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AuthModal } from '../../components/auth/AuthModal.js';
import { Button } from '../../components/ui/Button.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { supabase } from '../../lib/supabase.js';

interface ComplaintFormProps {
  initialTranscript?: string;
  analysisSummary?: AnalyzeResponse | null;
  onSubmitted?: (ref: string) => void;
}

const CATEGORIES = [
  'Digital Arrest / Police Impersonation',
  'Bank KYC & Account Freeze Threat',
  'Task / Part-time Investment Fraud',
  'Customs / Drug Parcel Extortion',
  'Remote Access / AnyDesk Takeover',
  'Electricity / Utility Disconnection Threat',
  'Other Coercion Scam',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other'
];

const DRAFT_KEY = 'holdon_complaint_draft_v1';

export const ComplaintForm: React.FC<ComplaintFormProps> = ({
  initialTranscript,
  analysisSummary,
  onSubmitted,
}) => {
  const { user, profile, session } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Form states
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [state, setState] = useState<string>('Maharashtra');
  const [district, setDistrict] = useState<string>('');
  const [amountLost, setAmountLost] = useState<string>('0');
  const [description, setDescription] = useState<string>('');
  const [maskedExcerpt, setMaskedExcerpt] = useState<string>(
    initialTranscript ? maskPII(initialTranscript).maskedText : ''
  );
  const [name, setName] = useState<string>(profile?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [hasConsent, setHasConsent] = useState<boolean>(false);

  // Sync profile details once loaded
  useEffect(() => {
    if (profile?.name && !name) setName(profile.name);
    if (user?.email && !email) setEmail(user.email);
  }, [profile, user]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.category) setCategory(data.category);
        if (data.state) setState(data.state);
        if (data.district) setDistrict(data.district);
        if (data.amountLost) setAmountLost(data.amountLost);
        if (data.description) setDescription(data.description);
        if (!initialTranscript && data.maskedExcerpt) setMaskedExcerpt(data.maskedExcerpt);
        if (!profile?.name && data.name) setName(data.name);
        if (!user?.email && data.email) setEmail(data.email);
        setLastSaved('Draft restored from local cache');
      }
    } catch {
      // Ignore corrupted draft
    }
  }, []);

  // Autosave draft on change
  useEffect(() => {
    if (submittedRef) return;
    const timeout = setTimeout(() => {
      try {
        const draft = {
          category,
          state,
          district,
          amountLost,
          description,
          maskedExcerpt,
          name,
          email,
          updatedAt: new Date().toLocaleTimeString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setLastSaved(`Autosaved at ${draft.updatedAt}`);
      } catch {
        // Storage full or unavailable
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [category, state, district, amountLost, description, maskedExcerpt, name, email, submittedRef]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setDescription('');
    setDistrict('');
    setAmountLost('0');
    setMaskedExcerpt('');
    setLastSaved(null);
  };

  const handleCopyRef = () => {
    if (!submittedRef) return;
    navigator.clipboard.writeText(submittedRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsent) {
      setError('Explicit DPDP consent is required to file a complaint.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a detailed incident description (min 10 characters).');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    // Require authentication
    if (!user) {
      setError('You must be signed in to submit an official complaint. Please sign in or register.');
      setIsAuthModalOpen(true);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Retrieve valid access token (attempt refresh if needed)
      let token = session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token;
      }
      if (!token) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        token = refreshData.session?.access_token;
      }

      if (!token) {
        setIsAuthModalOpen(true);
        throw new Error('Your login session has expired. Please sign in again to submit your complaint.');
      }

      const payload = {
        category,
        incident_at: new Date(incidentDate).toISOString(),
        state,
        district: district.trim() || undefined,
        amount_lost: Number(amountLost) || 0,
        description: description.trim(),
        masked_excerpt: maskedExcerpt.trim() || undefined,
        analysis_summary: analysisSummary || undefined,
        complainant_name: name.trim() || profile?.name || 'Citizen',
        complainant_email: email.trim(),
        consent: true,
      };

      const response = await fetch(`${apiUrl}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthModalOpen(true);
          throw new Error('Authentication expired or unauthorized. Please sign in again.');
        }
        throw new Error(data.message || data.error || 'Failed to submit complaint');
      }

      const ref = data.complaint?.ref;
      setSubmittedRef(ref);
      localStorage.removeItem(DRAFT_KEY);
      onSubmitted?.(ref);
    } catch (err: any) {
      setError(err.message || 'Network error filing complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedRef) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-surface border border-accent/30 rounded-xl p-8 shadow-overlay text-center">
          <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent text-accent flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-semibold text-accent uppercase tracking-wider bg-accent/10 px-3 py-1 rounded-full">
            Complaint Registered
          </span>

          <h2 className="text-2xl font-semibold tracking-heading text-text mt-3">
            Case Successfully Filed
          </h2>
          <p className="text-sm text-muted mt-2 max-w-md mx-auto">
            Your complaint has been accepted under the stage <strong className="text-text">Submitted</strong>.
            A confirmation has been sent to <span className="text-text">{email}</span>.
          </p>

          {/* Reference ID card */}
          <div className="mt-6 p-4 bg-surface-2 border border-border rounded-xl max-w-md mx-auto flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-muted uppercase">Reference Identifier</div>
              <div className="text-xl font-mono font-bold text-accent tracking-wide mt-0.5">
                {submittedRef}
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyRef}
              icon={copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied' : 'Copy ID'}
            </Button>
          </div>

          {/* Simulation disclaimer */}
          <div className="mt-6 p-3 bg-surface-2 border border-border rounded-lg text-xs text-muted max-w-md mx-auto leading-relaxed">
            <span className="font-semibold text-accent">Demo Simulation Notice:</span> This case is recorded in the HoldOn sandbox environment for audit and verification testing. It is not sent to any live government system.
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                window.location.href = '#track';
                onSubmitted?.(submittedRef);
              }}
            >
              Track Status Now
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSubmittedRef(null);
                setStep(1);
              }}
            >
              File Another Case
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Simulation banner */}
      <div className="mb-6 p-3 bg-surface border border-border rounded-lg flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          <span>Demo portal: not connected to live law enforcement systems</span>
        </div>
        {lastSaved && (
          <span className="text-[11px] font-medium text-muted">
            {lastSaved}
          </span>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-overlay">
        {/* Stepper Header */}
        <div className="flex items-center justify-between pb-5 border-b border-border mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-accent bg-surface-2 border border-border px-2.5 py-1 rounded-full">
              0{step} / 05
            </span>
            <span className="text-sm font-semibold text-text">
              {step === 1 && 'Incident Details'}
              {step === 2 && 'Jurisdiction'}
              {step === 3 && 'Financials & Evidence'}
              {step === 4 && 'Complainant'}
              {step === 5 && 'DPDP Review'}
            </span>
          </div>

          <button
            onClick={clearDraft}
            className="text-xs text-muted hover:text-alert flex items-center gap-1 transition-colors"
            title="Reset form"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset draft</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-alert-bg border border-alert/30 rounded-lg flex items-start gap-2 text-xs text-alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Incident Category & Time */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted mb-2">
                  Scam Classification
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-3 rounded-[10px] border text-left text-xs font-medium transition-colors ${
                        category === cat
                          ? 'border-accent bg-accent/10 text-accent font-semibold'
                          : 'border-border bg-surface-2 text-muted hover:border-border-strong'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Approximate Date & Time of Incident
                </label>
                <div className="relative max-w-sm">
                  <Calendar className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Jurisdiction & Location */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  State / Union Territory
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st} className="bg-surface text-text">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  District / City (Optional)
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Pune, Mumbai Suburban, Bengaluru Urban"
                  className="w-full px-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Financials & Evidence */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Amount Defrauded or Demanded (INR)
                </label>
                <div className="relative max-w-sm">
                  <span className="text-muted absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={amountLost}
                    onChange={(e) => setAmountLost(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1">Enter 0 if the coercion call was aborted before payment.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Detailed Narrative of the Coercion
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what the caller said, which department they claimed to represent (CBI, Customs, Police), and what threats were made…"
                  className="w-full p-3 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted">
                    Masked Call Transcript / Text Excerpt (Digits Masked)
                  </label>
                  <span className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full font-medium">
                    PII Protected
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={maskedExcerpt}
                  onChange={(e) => setMaskedExcerpt(maskPII(e.target.value).maskedText)}
                  placeholder="Optional verbatim excerpts from WhatsApp, SMS or call transcript. Digit strings are automatically masked."
                  className="w-full p-3 bg-surface-2 border border-border rounded-[10px] font-mono text-xs text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Complainant Details */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Complainant Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gungun Raut"
                    className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Email Address (for status updates & verification)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@example.com"
                  className="w-full px-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="text-[11px] text-muted mt-1">
                  Timeline status updates and verification receipts will be sent to this email address.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: DPDP Consent & Review */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="p-4 bg-surface-2 border border-border rounded-xl space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted">Category:</span>
                  <span className="font-semibold text-text">{category}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted">Jurisdiction:</span>
                  <span className="font-semibold text-text">{district ? `${district}, ` : ''}{state}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted">Amount Demanded/Lost:</span>
                  <span className="font-mono font-semibold text-accent">₹{Number(amountLost).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted">Complainant:</span>
                  <span className="font-semibold text-text">{name} ({email})</span>
                </div>
                <div>
                  <span className="text-muted block mb-1">Description preview:</span>
                  <p className="text-text/90 italic line-clamp-2">"{description}"</p>
                </div>
              </div>

              {/* Explicit DPDP Consent */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-3.5 bg-surface-2 border border-border rounded-[10px] cursor-pointer hover:border-border-strong transition-colors">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => setHasConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border bg-bg text-accent focus:ring-accent accent-accent"
                  />
                  <span className="text-xs text-text/90 leading-relaxed select-none">
                    <strong>DPDP Act & Verification Consent:</strong> I verify that this narrative accurately reflects the coercion incident. I authorize HoldOn to generate a canonical SHA-256 integrity hash and process this record for demonstration and verification purposes.
                  </span>
                </label>
              </div>

              {/* Sign In Required Notice if guest */}
              {!user && (
                <div className="p-3.5 bg-accent/10 border border-accent/25 rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-text/90">
                    <strong className="text-accent">Sign in required:</strong> You must be signed in to submit an official complaint and receive updates.
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    Sign In / Register
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < 5 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep((s) => s + 1)}
                >
                  Next Step
                </Button>
              ) : !user ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsAuthModalOpen(true)}
                  icon={<Send className="w-4 h-4" />}
                >
                  Sign In to Submit
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !hasConsent}
                  icon={<Send className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Registering case…' : 'Submit Complaint'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
