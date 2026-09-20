import {
  LegitSignal,
  TACTIC_LABELS,
  TACTIC_WEIGHTS,
  TacticEvidence,
} from '@holdon/shared';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import React from 'react';

interface TacticListProps {
  tactics: TacticEvidence[];
  legitSignals?: LegitSignal[];
  advice?: string;
  activeTacticType?: string | null;
  onSelectTactic?: (type: string) => void;
}

export const TacticList: React.FC<TacticListProps> = ({
  tactics,
  legitSignals = [],
  advice,
  activeTacticType,
  onSelectTactic,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Advice Banner */}
      {advice && (
        <div className="bg-surface border border-accent/20 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-medium text-accent mb-0.5">
              Recommended action
            </div>
            <p className="text-sm text-text/90 leading-relaxed">
              {advice}
            </p>
          </div>
        </div>
      )}

      {/* Detected Tactics */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
          <span className="text-sm font-medium text-muted">
            Detected tactics ({tactics.length})
          </span>
        </div>

        {tactics.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted">
            No coercive tactics detected.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {tactics.map((tactic, idx) => {
              const info = TACTIC_LABELS[tactic.type] ?? {
                label: tactic.type,
                description: '',
              };
              const weight = TACTIC_WEIGHTS[tactic.type] ?? 0.2;
              const isSelected = activeTacticType === tactic.type;

              return (
                <div
                  key={idx}
                  onClick={() => onSelectTactic?.(tactic.type)}
                  className={`p-3 rounded-[10px] border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-warn/10 border-warn/30'
                      : 'bg-surface-2 border-border hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-text">
                      {info.label}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted">
                      <span>{weight}</span>
                      <span>·</span>
                      <span>{Math.round(tactic.confidence * 100)}%</span>
                    </div>
                  </div>

                  <div className="mt-1.5 pt-1.5 border-t border-border/50">
                    <p className="font-mono text-xs text-accent bg-bg rounded-[8px] border border-border p-2 break-words">
                      "{tactic.evidence}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legitimate Signals */}
      {legitSignals.length > 0 && (
        <div className="bg-surface border border-accent/20 rounded-lg p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border text-sm text-accent font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Legitimate signals ({legitSignals.length})
            </span>
            <span className="text-xs font-medium text-muted">-15 pts each</span>
          </div>

          <div className="flex flex-col gap-2">
            {legitSignals.map((sig, idx) => (
              <div key={idx} className="p-2.5 bg-ok-bg rounded-[8px] border border-accent/10 text-sm">
                <div className="font-medium text-accent capitalize mb-0.5 text-xs">
                  {sig.type.replace(/_/g, ' ')}
                </div>
                <div className="font-mono text-xs text-text/90">"{sig.evidence}"</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
