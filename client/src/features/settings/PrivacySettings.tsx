import { Region } from '@holdon/shared';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Globe,
  Lock,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { AuthModal } from '../../components/auth/AuthModal.js';
import { Button } from '../../components/ui/Button.js';
import { useAuth } from '../../contexts/AuthContext.js';

interface PrivacySettingsProps {
  region: Region;
  onRegionChange?: (region: Region) => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  region,
  onRegionChange,
}) => {
  const { user, profile, session, refreshProfile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Deletion states
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<{
    message: string;
    count: number;
    timestamp: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDownloadData = async () => {
    if (!user || !session?.access_token) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/user/export`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download data export');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `holdon-data-export-${today}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess('Your data export was generated and downloaded successfully.');
    } catch (err: any) {
      setExportError(err.message || 'An error occurred during export generation.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    if (deleteConfirmationInput.trim() !== 'DELETE') return;
    if (!user || !session?.access_token) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/user/delete-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details?.[0]?.message || 'Failed to anonymise data');
      }

      setDeleteSuccess({
        message: data.message,
        count: data.anonymised_complaints_count,
        timestamp: data.anonymised_at,
      });

      setIsDeleteModalOpen(false);
      setDeleteConfirmationInput('');
      await refreshProfile();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to anonymise data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 pb-20 space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <Shield className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-semibold tracking-heading text-text">
            Privacy & Data Rights (DPDP)
          </h1>
        </div>
        <p className="text-sm text-muted">
          Manage your personal data, download your complete complaint history, or exercise your statutory right to erasure.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text uppercase tracking-wider text-muted mb-4">
          Account Status
        </h2>

        {user ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
                {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="text-sm font-semibold text-text flex items-center gap-2">
                  <span>{profile?.name || 'Citizen'}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface-2 border border-border text-accent">
                    {profile?.role || 'user'}
                  </span>
                </div>
                <div className="text-xs text-muted mt-0.5">{user.email}</div>
              </div>
            </div>

            <span className="text-xs text-accent bg-ok-bg border border-accent/20 px-3 py-1 rounded-full font-medium inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Authenticated Session
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-surface-2 border border-border rounded-lg">
            <div>
              <div className="text-sm font-medium text-text">Guest Mode</div>
              <div className="text-xs text-muted mt-0.5">
                Sign in to link complaints, export historical records, and manage personal data.
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Sign In / Register
            </Button>
          </div>
        )}
      </div>

      {/* Success Notices */}
      {exportSuccess && (
        <div className="p-4 bg-ok-bg border border-accent/30 rounded-xl flex items-start gap-3 text-xs text-accent">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">{exportSuccess}</div>
          <button onClick={() => setExportSuccess(null)} className="text-muted hover:text-text">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {deleteSuccess && (
        <div className="p-4 bg-ok-bg border border-accent/30 rounded-xl flex items-start gap-3 text-xs text-accent">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">{deleteSuccess.message}</div>
            <div className="text-muted mt-1">
              Personal narratives, transcripts, and contact details cleared across {deleteSuccess.count} complaint record(s). A confirmation email has been dispatched.
            </div>
          </div>
          <button onClick={() => setDeleteSuccess(null)} className="text-muted hover:text-text">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Notices */}
      {exportError && (
        <div className="p-4 bg-alert-bg border border-alert/30 rounded-xl flex items-start gap-3 text-xs text-alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">{exportError}</div>
          <button onClick={() => setExportError(null)} className="text-muted hover:text-alert">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {deleteError && (
        <div className="p-4 bg-alert-bg border border-alert/30 rounded-xl flex items-start gap-3 text-xs text-alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">{deleteError}</div>
          <button onClick={() => setDeleteError(null)} className="text-muted hover:text-alert">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Data Management Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Export Data */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2 text-text font-semibold">
              <Download className="w-4 h-4 text-accent" />
              <span>Download My Data</span>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Export all your submitted complaints, verbatim tactic quotes, status timelines, and cryptographic SHA-256 hashes as a structured JSON file.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              disabled={isExporting}
              onClick={handleDownloadData}
              icon={<Download className="w-4 h-4" />}
            >
              {isExporting ? 'Generating JSON...' : 'Download My Data (JSON)'}
            </Button>
          </div>
        </div>

        {/* 2. Delete Data */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2 text-text font-semibold">
              <Trash2 className="w-4 h-4 text-alert" />
              <span>Delete & Anonymise My Data</span>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Permanently wipe personal descriptions, transcripts, names, and contact details from your records. Audit references and hashes are preserved for public verification.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              variant="destructive"
              size="md"
              className="w-full"
              disabled={isDeleting}
              onClick={() => {
                if (!user) {
                  setIsAuthModalOpen(true);
                } else {
                  setIsDeleteModalOpen(true);
                }
              }}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete My Data
            </Button>
          </div>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-text uppercase tracking-wider text-muted">
          System Preferences & Safeguards
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3.5 bg-surface-2 rounded-lg border border-border">
            <div>
              <div className="font-medium text-text flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-accent" />
                Active Jurisdiction
              </div>
              <div className="text-xs text-muted mt-0.5">Configures emergency regional packs and helplines</div>
            </div>
            {onRegionChange ? (
              <select
                value={region}
                onChange={(e) => onRegionChange(e.target.value as Region)}
                aria-label="Active Jurisdiction"
                className="bg-surface text-accent font-semibold text-xs px-2.5 py-1 rounded border border-border focus:outline-none cursor-pointer"
              >
                <option value="IN">India (IN)</option>
                <option value="US">United States (US)</option>
                <option value="UK">United Kingdom (UK)</option>
              </select>
            ) : (
              <span className="font-semibold text-accent bg-surface px-2.5 py-1 rounded border border-border">
                {region}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-3.5 bg-surface-2 rounded-lg border border-border">
            <div>
              <div className="font-medium text-text flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-accent" />
                PII Digit Masking
              </div>
              <div className="text-xs text-muted mt-0.5">Mandatory client & server sanitization of all numbers</div>
            </div>
            <span className="text-xs font-semibold text-accent bg-ok-bg px-2.5 py-1 rounded-full border border-accent/20">
              Active (100% Redacted)
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-surface-2 rounded-lg border border-border">
            <div>
              <div className="font-medium text-text flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-accent" />
                Audit Trail Integrity
              </div>
              <div className="text-xs text-muted mt-0.5">SHA-256 tamper-evident verification hashing</div>
            </div>
            <span className="text-xs font-semibold text-accent bg-ok-bg px-2.5 py-1 rounded-full border border-accent/20">
              Enforced
            </span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-surface border border-alert/30 max-w-md w-full rounded-xl shadow-overlay p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-alert font-semibold">
                <AlertTriangle className="w-5 h-5 text-alert" />
                <span>Permanently Anonymise Data?</span>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-muted hover:text-text p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-alert-bg border border-alert/20 rounded-lg text-xs text-alert leading-relaxed">
              <strong>Warning:</strong> This operation cannot be undone. In accordance with DPDP regulations, all personal descriptions, transcript excerpts, names, and contact details will be wiped clean.
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Your complaint reference IDs, status histories, and SHA-256 cryptographic hashes will be retained in the database so that law enforcement can verify the report has not been forged, and the public verify page will display <span className="font-mono text-accent">"Record anonymised on [date]"</span>.
            </p>

            <div>
              <label className="block text-xs font-medium text-text mb-1.5">
                To confirm, type <span className="font-mono font-bold text-alert">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text font-mono focus:outline-none focus:ring-1 focus:ring-alert"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationInput('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="md"
                disabled={deleteConfirmationInput.trim() !== 'DELETE' || isDeleting}
                onClick={handleDeleteData}
                icon={<Trash2 className="w-4 h-4" />}
              >
                {isDeleting ? 'Anonymising...' : 'Permanently Delete Data'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal if guest attempts action */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
