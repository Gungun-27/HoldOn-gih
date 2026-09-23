import {
  AlertCircle,
  CheckCircle2,
  Hash,
  Search,
  Shield,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button.js';

interface VerifyResult {
  valid: boolean;
  ref?: string;
  status?: string;
  category?: string;
  jurisdiction?: string;
  created_at?: string;
  is_seed?: boolean;
  anonymised_at?: string | null;
}

interface VerifyPageProps {
  initialHash?: string | null;
}

export const VerifyPage: React.FC<VerifyPageProps> = ({ initialHash }) => {
  const [hashInput, setHashInput] = useState<string>(initialHash || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyHash = async (hash: string) => {
    if (!hash.trim() || hash.trim().length < 16) {
      setError('Please enter a valid SHA-256 hash (at least 16 characters).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/verify/${encodeURIComponent(hash.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification service unavailable');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to verification service');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-verify if initialHash provided
  useEffect(() => {
    if (initialHash && initialHash.length >= 16) {
      setHashInput(initialHash);
      verifyHash(initialHash);
    }
  }, [initialHash]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyHash(hashInput);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-semibold tracking-heading text-text">
            Report Integrity Verification
          </h1>
        </div>
        <p className="text-sm text-muted">
          Verify that a HoldOn complaint report has not been tampered with by checking its SHA-256 hash against the database.
        </p>
      </div>

      {/* Hash input */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6 shadow-overlay">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              SHA-256 Report Hash
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value.trim())}
                placeholder="e.g. a3f2b8c1d4e5f6789012345678abcdef..."
                className="w-full pl-9 pr-3 py-2.5 bg-surface-2 border border-border rounded-[10px] font-mono text-sm text-text placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || !hashInput.trim()}
            icon={<Search className="w-4 h-4" />}
          >
            {isLoading ? 'Verifying…' : 'Verify Integrity'}
          </Button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-alert-bg border border-alert/30 rounded-xl flex items-start gap-3 text-sm text-alert">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Verification Error</div>
            <div className="text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Result: Valid */}
      {result && result.valid && (
        <div className="bg-surface border border-accent/30 rounded-xl p-6 shadow-overlay">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent text-accent flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-semibold text-accent">Report Verified</div>
              <p className="text-xs text-muted">This hash matches an untampered record in the HoldOn database.</p>
            </div>
          </div>

          {result.anonymised_at && (
            <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2.5 text-xs text-amber-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
              <span>
                Record anonymised on{' '}
                {new Date(result.anonymised_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 bg-surface-2 rounded-lg border border-border">
              <span className="text-muted">Reference ID</span>
              <span className="font-mono font-bold text-accent">{result.ref}</span>
            </div>
            <div className="flex justify-between p-3 bg-surface-2 rounded-lg border border-border">
              <span className="text-muted">Status</span>
              <span className="font-semibold text-text">{result.status}</span>
            </div>
            {result.category && (
              <div className="flex justify-between p-3 bg-surface-2 rounded-lg border border-border">
                <span className="text-muted">Category</span>
                <span className="font-medium text-text">{result.category}</span>
              </div>
            )}
            {result.jurisdiction && (
              <div className="flex justify-between p-3 bg-surface-2 rounded-lg border border-border">
                <span className="text-muted">Jurisdiction</span>
                <span className="font-medium text-text">{result.jurisdiction}</span>
              </div>
            )}
            {result.created_at && (
              <div className="flex justify-between p-3 bg-surface-2 rounded-lg border border-border">
                <span className="text-muted">Filed On</span>
                <span className="font-medium text-text">
                  {new Date(result.created_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                </span>
              </div>
            )}
            {result.is_seed && (
              <div className="p-2 text-center text-[10px] text-muted bg-muted/10 rounded-lg">
                This is sample data for demonstration purposes.
              </div>
            )}
          </div>

          {/* Simulation notice */}
          <div className="mt-5 pt-4 border-t border-border flex items-start gap-2.5 text-xs text-muted">
            <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <span>
              <strong>Demo Simulation:</strong> This verification confirms the record exists in the HoldOn sandbox. Not a government system.
            </span>
          </div>
        </div>
      )}

      {/* Result: Invalid */}
      {result && !result.valid && (
        <div className="bg-surface border border-alert/30 rounded-xl p-6 shadow-overlay">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-alert-bg border border-alert text-alert flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-semibold text-alert">Verification Failed</div>
              <p className="text-xs text-muted">No matching record found. The report may have been tampered with or does not exist.</p>
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            If you believe this is an error, double-check the hash value. The SHA-256 hash must match the original report exactly.
          </p>
        </div>
      )}
    </div>
  );
};
