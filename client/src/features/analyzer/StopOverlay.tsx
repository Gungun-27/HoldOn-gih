import { REGION_PACKS, Region } from '@holdon/shared';
import { AlertOctagon, ExternalLink, PhoneCall, ShieldAlert, X } from 'lucide-react';
import React from 'react';
import { Button } from '../../components/ui/Button.js';

interface StopOverlayProps {
  isOpen: boolean;
  onDismiss: () => void;
  region: Region;
  onOpenGuardianAlert: () => void;
  onOpenFileComplaint?: () => void;
}

export const StopOverlay: React.FC<StopOverlayProps> = ({
  isOpen,
  onDismiss,
  region,
  onOpenGuardianAlert,
  onOpenFileComplaint,
}) => {
  if (!isOpen) return null;

  const pack = REGION_PACKS[region] ?? REGION_PACKS.IN;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-bg/90 flex items-center justify-center p-4"
    >
      <div className="bg-surface border border-alert/30 max-w-xl w-full rounded-lg shadow-overlay overflow-hidden">
        {/* Red tinted header */}
        <div className="bg-alert-fill/90 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-7 h-7 shrink-0" />
            <div>
              <h2 className="text-lg font-semibold tracking-heading">
                Hold on. High pressure detected.
              </h2>
              <p className="text-xs text-red-200 font-medium">
                Coercive tactics identified in this conversation
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-red-200 hover:text-white p-1 rounded-[10px] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-5">
          <div className="space-y-3">
            {[
              {
                num: 1,
                title: 'Hang up the call immediately.',
                desc: 'Do not argue. Legitimate officers never demand money or conduct "digital arrests" over video calls.',
              },
              {
                num: 2,
                title: 'Verify via the official number yourself.',
                desc: 'Never use numbers or links the caller provided. Look it up independently or call the regional helpline.',
              },
              {
                num: 3,
                title: 'Tell someone you trust right now.',
                desc: 'Scammers demand isolation. Inform a family member or alert your trusted contact immediately.',
              },
            ].map(({ num, title, desc }) => (
              <div key={num} className="flex items-start gap-3 p-3.5 bg-surface-2 border border-border rounded-[10px]">
                <div className="w-7 h-7 rounded-full bg-alert-fill text-white text-sm font-semibold flex items-center justify-center shrink-0">
                  {num}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text">{title}</h3>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Helpline */}
          <div className="bg-alert-bg border border-alert/20 p-4 rounded-[10px] flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-alert">
                Official {pack.name} helpline
              </div>
              <div className="text-2xl font-semibold text-text mt-0.5 tracking-heading">
                {pack.helplineNumber}
              </div>
              <a
                href={pack.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-1"
              >
                {pack.portalName} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <a
              href={`tel:${pack.helplineNumber}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-alert-fill text-white text-sm font-medium rounded-[10px] hover:brightness-110 transition shrink-0"
            >
              <PhoneCall className="w-4 h-4" /> Call Now
            </a>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="destructive"
              size="md"
              onClick={() => { onDismiss(); onOpenGuardianAlert(); }}
              icon={<ShieldAlert className="w-4 h-4" />}
            >
              Alert trusted contact
            </Button>
            <div className="flex items-center gap-2">
              {onOpenFileComplaint && (
                <Button variant="secondary" size="md" onClick={() => { onDismiss(); onOpenFileComplaint(); }}>
                  File complaint
                </Button>
              )}
              <Button variant="ghost" size="md" onClick={onDismiss}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
