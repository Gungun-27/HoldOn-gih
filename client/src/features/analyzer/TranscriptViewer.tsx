import { TacticEvidence } from '@holdon/shared';
import React, { useMemo } from 'react';

interface TranscriptViewerProps {
  transcript: string;
  tactics: TacticEvidence[];
  activeTacticType?: string | null;
  onSelectTactic?: (type: string) => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  tactics,
  activeTacticType,
  onSelectTactic,
}) => {
  const segments = useMemo(() => {
    if (!transcript.trim()) return [];
    if (!tactics || tactics.length === 0) {
      return [{ text: transcript, tactic: null }];
    }

    interface MatchSpan {
      start: number;
      end: number;
      text: string;
      tactic: TacticEvidence;
    }

    const matches: MatchSpan[] = [];
    const lowerTranscript = transcript.toLowerCase();

    for (const tactic of tactics) {
      const evidence = tactic.evidence?.trim();
      if (!evidence) continue;
      const lowerEvidence = evidence.toLowerCase();
      let startIndex = 0;
      while ((startIndex = lowerTranscript.indexOf(lowerEvidence, startIndex)) !== -1) {
        const endIndex = startIndex + evidence.length;
        matches.push({
          start: startIndex,
          end: endIndex,
          text: transcript.slice(startIndex, endIndex),
          tactic,
        });
        startIndex = endIndex;
      }
    }

    if (matches.length === 0) {
      return [{ text: transcript, tactic: null }];
    }

    matches.sort((a, b) => a.start - b.start);

    const result: { text: string; tactic: TacticEvidence | null }[] = [];
    let currentIndex = 0;

    for (const match of matches) {
      if (match.start < currentIndex) continue;
      if (match.start > currentIndex) {
        result.push({ text: transcript.slice(currentIndex, match.start), tactic: null });
      }
      result.push({ text: match.text, tactic: match.tactic });
      currentIndex = match.end;
    }

    if (currentIndex < transcript.length) {
      result.push({ text: transcript.slice(currentIndex), tactic: null });
    }

    return result;
  }, [transcript, tactics]);

  if (!transcript.trim()) {
    return (
      <div className="h-64 flex flex-col items-center justify-center p-8 border border-border rounded-lg bg-surface text-center">
        <p className="text-sm text-muted">
          No transcript loaded yet. Select a sample call, paste text, or start the live microphone.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-4 text-sm leading-relaxed min-h-[260px] max-h-[420px] overflow-y-auto">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-border text-xs text-muted">
        <span>Verified transcript</span>
        <span className="text-accent">{tactics.length} quotes flagged</span>
      </div>

      <div className="whitespace-pre-wrap select-text text-text/90">
        {segments.map((segment, index) => {
          if (!segment.tactic) {
            return <span key={index}>{segment.text}</span>;
          }
          const isSelected = activeTacticType === segment.tactic.type;
          return (
            <mark
              key={index}
              onClick={() => onSelectTactic?.(segment.tactic!.type)}
              title={`${segment.tactic.type.replace(/_/g, ' ')}`}
              className={`cursor-pointer px-1 py-0.5 rounded font-mono text-xs transition-colors ${
                isSelected
                  ? 'bg-warn/30 text-warn ring-1 ring-warn/50'
                  : 'bg-accent/10 text-accent hover:bg-accent/20'
              }`}
            >
              {segment.text}
            </mark>
          );
        })}
      </div>
    </div>
  );
};
