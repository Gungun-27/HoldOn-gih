import { REGION_PACKS, Region } from '@holdon/shared';
import { ExternalLink, Lock, ShieldCheck } from 'lucide-react';
import React from 'react';

interface FooterProps {
  region: Region;
}

export const Footer: React.FC<FooterProps> = ({ region }) => {
  const pack = REGION_PACKS[region] ?? REGION_PACKS.IN;

  return (
    <footer className="bg-surface border-t border-border mt-12 py-8 text-sm text-muted">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-text mb-2">
              <Lock className="w-4 h-4 text-accent" />
              Privacy
            </div>
            <p className="text-muted leading-relaxed text-sm">
              HoldOn never stores or logs your analyzed text. Phone numbers, card digits, Aadhaar, and OTPs are stripped before analysis.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 font-semibold text-text mb-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              Official Helpline
            </div>
            <p className="text-text text-sm">
              {pack.name}: <span className="font-semibold text-accent">{pack.helplineNumber}</span>
            </p>
            <a
              href={pack.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline mt-1 text-xs"
            >
              {pack.portalName} <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <div className="font-semibold text-text mb-2">
              Limitations
            </div>
            <p className="leading-relaxed text-sm">
              HoldOn scores pressure tactics and advises verification via official numbers. It does not access phone calls or file police complaints in guest mode.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted/60">
          <span>© 2026 HoldOn — Civic infrastructure against coercion fraud</span>
          <span>Deterministic risk engine · PII masking · No storage</span>
        </div>
      </div>
    </footer>
  );
};
