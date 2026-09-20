import {
  AnalyzeRequest,
  AnalyzeResponse,
  Region,
  RiskState,
  TacticEvidence,
  TacticType,
} from '@holdon/shared';
import { Bell, RefreshCw } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { Button } from '../../components/ui/Button.js';
import { CaptureTabs } from './CaptureTabs.js';
import { GuardianAlertModal } from './GuardianAlertModal.js';
import { PressureGauge } from './PressureGauge.js';
import { PressureTimeline, TimelinePoint } from './PressureTimeline.js';
import { StopOverlay } from './StopOverlay.js';
import { TacticList } from './TacticList.js';
import { TranscriptViewer } from './TranscriptViewer.js';

interface AnalyzerWorkspaceProps {
  region: Region;
  onNavigateComplaint?: (transcript?: string, analysis?: AnalyzeResponse | null) => void;
}

export const AnalyzerWorkspace: React.FC<AnalyzerWorkspaceProps> = ({
  region,
  onNavigateComplaint,
}) => {
  const [accumulatedTranscript, setAccumulatedTranscript] = useState<string>('');
  const [timelineData, setTimelineData] = useState<TimelinePoint[]>([]);
  const [latestResponse, setLatestResponse] = useState<AnalyzeResponse | null>(null);
  const [activeTacticType, setActiveTacticType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [tacticsHistory, setTacticsHistory] = useState<{ type: TacticType; timestamp: number }[]>([]);
  const [currentState, setCurrentState] = useState<RiskState>('SAFE');
  const [isStopOverlayOpen, setIsStopOverlayOpen] = useState<boolean>(false);
  const [stopOverlayDismissedForCurrentAlert, setStopOverlayDismissedForCurrentAlert] = useState<boolean>(false);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState<boolean>(false);

  const handleClearSession = useCallback(() => {
    setAccumulatedTranscript('');
    setTimelineData([]);
    setLatestResponse(null);
    setActiveTacticType(null);
    setTacticsHistory([]);
    setCurrentState('SAFE');
    setIsStopOverlayOpen(false);
    setStopOverlayDismissedForCurrentAlert(false);
  }, []);

  const handleAnalyzeChunk = useCallback(
    async (chunkText: string, isNewSession = false) => {
      if (!chunkText.trim()) return;
      setIsAnalyzing(true);
      const timestamp = Date.now();
      const updatedTranscript = isNewSession
        ? chunkText
        : accumulatedTranscript
        ? `${accumulatedTranscript}\n\n${chunkText}`
        : chunkText;
      setAccumulatedTranscript(updatedTranscript);

      const requestPayload: AnalyzeRequest = {
        text: updatedTranscript,
        region,
        timestamp,
        previousTactics: isNewSession ? [] : tacticsHistory,
        previousState: isNewSession ? 'SAFE' : currentState,
      };

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
        if (!res.ok) throw new Error(`API error: ${res.statusText}`);
        const data: AnalyzeResponse = await res.json();
        setLatestResponse(data);

        const newTactics = data.tactics.map((t) => ({ type: t.type, timestamp }));
        setTacticsHistory((prev) => (isNewSession ? newTactics : [...prev, ...newTactics]));

        const prevState = currentState;
        setCurrentState(data.state);

        if (data.state === 'ALERT') {
          if (prevState !== 'ALERT' && !stopOverlayDismissedForCurrentAlert) {
            setIsStopOverlayOpen(true);
          }
        } else {
          setStopOverlayDismissedForCurrentAlert(false);
          setIsStopOverlayOpen(false);
        }

        const chunkNum = isNewSession ? 1 : timelineData.length + 1;
        setTimelineData((prev) => {
          const base = isNewSession ? [] : prev;
          return [...base, { chunkIndex: chunkNum, label: `Chunk ${chunkNum}`, score: data.score, state: data.state, timestamp }];
        });
      } catch (err) {
        console.error('Analysis failed:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [accumulatedTranscript, region, tacticsHistory, currentState, timelineData.length, stopOverlayDismissedForCurrentAlert]
  );

  const handleDismissStopOverlay = () => {
    setIsStopOverlayOpen(false);
    setStopOverlayDismissedForCurrentAlert(true);
  };

  const currentScore = latestResponse?.score ?? 0;
  const currentTactics: TacticEvidence[] = latestResponse?.tactics ?? [];
  const currentLegitSignals = latestResponse?.legit_signals ?? [];
  const currentAdvice = latestResponse?.advice;
  const isDegraded = latestResponse?.degraded ?? false;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6">
      {/* Session bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading text-text">
            Real-time pressure analyzer
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Detects coercive tactics, legal threats, and artificial urgency as they happen
          </p>
        </div>
        <div className="flex items-center gap-2">
          {accumulatedTranscript && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSession}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsGuardianModalOpen(true)}
            icon={<Bell className="w-3.5 h-3.5 text-accent" />}
          >
            Guardian
          </Button>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Capture */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <span className="text-sm font-medium text-muted">
            1. Capture stream
          </span>
          <CaptureTabs
            onAnalyzeChunk={handleAnalyzeChunk}
            isAnalyzing={isAnalyzing}
            region={region}
            onClearSession={handleClearSession}
          />
        </section>

        {/* Centre: Transcript & Timeline */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <span className="text-sm font-medium text-muted">
            2. Verified evidence
          </span>
          <TranscriptViewer
            transcript={accumulatedTranscript}
            tactics={currentTactics}
            activeTacticType={activeTacticType}
            onSelectTactic={(type) => setActiveTacticType((prev) => (prev === type ? null : type))}
          />
          <PressureTimeline data={timelineData} />
        </section>

        {/* Right: Gauge & Tactics */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <span className="text-sm font-medium text-muted">
            3. Risk assessment
          </span>
          <PressureGauge score={currentScore} state={currentState} degraded={isDegraded} />

          {/* Alert My Contact: accent in SAFE/WARN, red in ALERT */}
          <Button
            variant={currentState === 'ALERT' ? 'destructive' : 'primary'}
            size="md"
            className="w-full"
            onClick={() => setIsGuardianModalOpen(true)}
            icon={<Bell className="w-4 h-4" />}
          >
            Alert my contact
          </Button>

          <TacticList
            tactics={currentTactics}
            legitSignals={currentLegitSignals}
            advice={currentAdvice}
            activeTacticType={activeTacticType}
            onSelectTactic={(type) => setActiveTacticType((prev) => (prev === type ? null : type))}
          />
        </section>
      </div>

      <StopOverlay
        isOpen={isStopOverlayOpen}
        onDismiss={handleDismissStopOverlay}
        region={region}
        onOpenGuardianAlert={() => setIsGuardianModalOpen(true)}
        onOpenFileComplaint={() => {
          if (onNavigateComplaint) {
            onNavigateComplaint(accumulatedTranscript, latestResponse);
          }
        }}
      />

      <GuardianAlertModal
        isOpen={isGuardianModalOpen}
        onClose={() => setIsGuardianModalOpen(false)}
        tactics={currentTactics}
        score={currentScore}
      />
    </div>
  );
};
