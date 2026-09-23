import { getMaskingFromText } from '@holdon/shared';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface WhatWeSentPanelProps {
  maskedInput?: string | null;
  className?: string;
}

export const WhatWeSentPanel: React.FC<WhatWeSentPanelProps> = ({
  maskedInput,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const maskingInfo = useMemo(() => {
    if (!maskedInput) return null;
    return getMaskingFromText(maskedInput);
  }, [maskedInput]);

  if (!maskedInput || !maskedInput.trim()) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(maskedInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render text with highlighted [MASKED_...] tokens
  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\[MASKED_[A-Z]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[MASKED_') && part.endsWith(']')) {
        const type = part.slice(8, -1).toLowerCase();
        return (
          <span
            key={index}
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-semibold bg-accent/15 text-accent border border-accent/30 tracking-tight"
            title={`Sanitized ${type}`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const totalCount = maskingInfo?.totalCount ?? 0;
  const summary = maskingInfo?.summary ?? '0 items masked';
  const breakdown = maskingInfo?.breakdown;

  return (
    <div
      className={`bg-surface border border-border rounded-xl overflow-hidden transition-all shadow-overlay ${className}`}
    >
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-surface-2/60 transition-colors cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text tracking-heading">
                What we sent to the AI
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-2 border border-border text-accent">
                {totalCount > 0 ? summary : '0 items masked'}
              </span>
            </div>
            <p className="text-[11px] text-muted truncate mt-0.5">
              Exact sanitized payload passed to the LLM (FR-37)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-muted">
          <span className="text-[11px] hidden sm:inline text-muted/80">
            {isOpen ? 'Collapse' : 'Inspect payload'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-accent" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-border/70 space-y-3.5 bg-bg/40 animate-in fade-in duration-200">
          {/* Privacy Guarantee Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-2/80 border border-border text-xs text-muted leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <strong className="text-text font-medium">Deterministic Client-Side Sanitization:</strong>{' '}
              All digit sequences, account IDs, phone numbers, and credentials were stripped before transmission.{' '}
              <span className="text-text/90 font-medium">Never stored or logged</span> on any server or database.
            </div>
          </div>

          {/* Breakdown Chips */}
          {breakdown && totalCount > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                Masked Items Breakdown
              </span>
              <div className="flex flex-wrap gap-1.5">
                {breakdown.digits > 0 && (
                  <span className="text-xs px-2 py-1 rounded-md bg-surface border border-border text-text font-mono">
                    <strong className="text-accent mr-1">{breakdown.digits}</strong>
                    Number sequence{breakdown.digits > 1 ? 's' : ''}
                  </span>
                )}
                {breakdown.upi > 0 && (
                  <span className="text-xs px-2 py-1 rounded-md bg-surface border border-border text-text font-mono">
                    <strong className="text-accent mr-1">{breakdown.upi}</strong>
                    UPI ID{breakdown.upi > 1 ? 's' : ''}
                  </span>
                )}
                {breakdown.phone > 0 && (
                  <span className="text-xs px-2 py-1 rounded-md bg-surface border border-border text-text font-mono">
                    <strong className="text-accent mr-1">{breakdown.phone}</strong>
                    Phone number{breakdown.phone > 1 ? 's' : ''}
                  </span>
                )}
                {breakdown.cards > 0 && (
                  <span className="text-xs px-2 py-1 rounded-md bg-surface border border-border text-text font-mono">
                    <strong className="text-accent mr-1">{breakdown.cards}</strong>
                    Card number{breakdown.cards > 1 ? 's' : ''}
                  </span>
                )}
                {breakdown.aadhaar > 0 && (
                  <span className="text-xs px-2 py-1 rounded-md bg-surface border border-border text-text font-mono">
                    <strong className="text-accent mr-1">{breakdown.aadhaar}</strong>
                    Aadhaar ID{breakdown.aadhaar > 1 ? 's' : ''}
                  </span>
                )}
                {breakdown.otp > 0 && (
                  <span className="text-xs px-2 py-1 rounded-md bg-surface border border-border text-text font-mono">
                    <strong className="text-accent mr-1">{breakdown.otp}</strong>
                    OTP / code{breakdown.otp > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Exact Payload Viewer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-muted" /> Exact LLM Input String
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-muted hover:text-accent flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-surface"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-accent" />
                    <span className="text-accent font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy payload</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-bg border border-border rounded-lg font-mono text-xs text-text/90 whitespace-pre-wrap break-words max-h-56 overflow-y-auto leading-relaxed selection:bg-accent/20">
              {renderHighlightedText(maskedInput)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
