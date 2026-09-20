import { Region } from '@holdon/shared';
import * as Tabs from '@radix-ui/react-tabs';
import {
  AlertCircle,
  FileText,
  Mic,
  MicOff,
  Pause,
  Play,
  PlaySquare,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button.js';
import { SAMPLE_SCRIPTS, SampleScript } from '../../data/samples.js';

interface CaptureTabsProps {
  onAnalyzeChunk: (chunkText: string, isNewSession?: boolean) => Promise<void>;
  isAnalyzing: boolean;
  region: Region;
  onClearSession: () => void;
}

export const CaptureTabs: React.FC<CaptureTabsProps> = ({
  onAnalyzeChunk,
  isAnalyzing,
  onClearSession,
}) => {
  const [activeTab, setActiveTab] = useState<string>('sample');
  const [pasteText, setPasteText] = useState<string>('');
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_SCRIPTS[0].id);
  const [isPlayingSample, setIsPlayingSample] = useState<boolean>(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const sampleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSample: SampleScript =
    SAMPLE_SCRIPTS.find((s) => s.id === selectedSampleId) ?? SAMPLE_SCRIPTS[0];

  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN' | 'mr-IN'>('en-IN');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) setSpeechSupported(false);
  }, []);

  useEffect(() => {
    if (!isPlayingSample) {
      if (sampleTimerRef.current) clearInterval(sampleTimerRef.current);
      return;
    }
    const chunk = activeSample.chunks[currentChunkIndex];
    if (!chunk) {
      setIsPlayingSample(false);
      return;
    }
    onAnalyzeChunk(chunk.text, currentChunkIndex === 0);
    const durationMs = (chunk.durationSec || 5) * 1000;
    sampleTimerRef.current = setTimeout(() => {
      if (currentChunkIndex + 1 < activeSample.chunks.length) {
        setCurrentChunkIndex((prev) => prev + 1);
      } else {
        setIsPlayingSample(false);
      }
    }, durationMs);
    return () => {
      if (sampleTimerRef.current) clearTimeout(sampleTimerRef.current);
    };
  }, [isPlayingSample, currentChunkIndex, selectedSampleId]);

  const handleStartSample = (sample: SampleScript) => {
    setSelectedSampleId(sample.id);
    setCurrentChunkIndex(0);
    setIsPlayingSample(true);
  };

  const handleStopSample = () => {
    setIsPlayingSample(false);
    if (sampleTimerRef.current) clearTimeout(sampleTimerRef.current);
  };

  const handleResetSample = () => {
    handleStopSample();
    setCurrentChunkIndex(0);
    onClearSession();
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;
      recognition.onstart = () => setIsListening(true);
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      let chunkBuffer = '';
      recognition.onresult = (event: any) => {
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTrans.trim()) {
          chunkBuffer += finalTrans;
          setLiveTranscript((prev) => prev + ' ' + finalTrans);
          if (chunkBuffer.length >= 60 || finalTrans.includes('.')) {
            onAnalyzeChunk(chunkBuffer.trim(), false);
            chunkBuffer = '';
          }
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex border-b border-border mb-4">
          <Tabs.Trigger
            value="sample"
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sample'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            Samples
          </Tabs.Trigger>
          <Tabs.Trigger
            value="paste"
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste
          </Tabs.Trigger>
          <Tabs.Trigger
            value="mic"
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'mic'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <Mic className="w-4 h-4" />
            Live Mic
          </Tabs.Trigger>
        </Tabs.List>

        {/* SAMPLE TAB */}
        <Tabs.Content value="sample" className="focus:outline-none">
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Select a script to test real-time coercion detection:
            </p>

            <div className="space-y-2">
              {SAMPLE_SCRIPTS.map((sample) => {
                const isSelected = selectedSampleId === sample.id;
                return (
                  <div
                    key={sample.id}
                    onClick={() => {
                      setSelectedSampleId(sample.id);
                      setCurrentChunkIndex(0);
                      setIsPlayingSample(false);
                      onClearSession();
                    }}
                    className={`p-3 rounded-[10px] border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-accent/40 bg-accent/5'
                        : 'border-border bg-surface-2 hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text">
                        {sample.title}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          sample.targetState === 'ALERT'
                            ? 'bg-alert-bg text-alert'
                            : 'bg-ok-bg text-accent'
                        }`}
                      >
                        {sample.targetState}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{sample.subtitle}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {!isPlayingSample ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStartSample(activeSample)}
                    disabled={isAnalyzing}
                    icon={<Play className="w-3.5 h-3.5" />}
                  >
                    Play
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleStopSample}
                    icon={<Pause className="w-3.5 h-3.5" />}
                  >
                    Pause
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetSample}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Reset
                </Button>
              </div>
              <span className="text-xs font-medium text-muted">
                {currentChunkIndex + 1} / {activeSample.chunks.length}
              </span>
            </div>
          </div>
        </Tabs.Content>

        {/* PASTE TAB */}
        <Tabs.Content value="paste" className="focus:outline-none">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Paste suspicious message or transcript</span>
              <span className={pasteText.length > 4000 ? 'text-alert' : 'text-xs font-medium'}>
                {pasteText.length} / 4,000
              </span>
            </div>
            <textarea
              className="w-full h-44 p-3 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/40 resize-none"
              placeholder="Paste WhatsApp message, SMS alert, or conversation here…"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              maxLength={4000}
            />
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setPasteText(''); onClearSession(); }}
                disabled={!pasteText}
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (pasteText.trim()) onAnalyzeChunk(pasteText.trim(), true);
                }}
                disabled={!pasteText.trim() || isAnalyzing}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                {isAnalyzing ? 'Analyzing…' : 'Analyze'}
              </Button>
            </div>
          </div>
        </Tabs.Content>

        {/* LIVE MIC TAB */}
        <Tabs.Content value="mic" className="focus:outline-none">
          <div className="space-y-3">
            {!speechSupported ? (
              <div className="p-3 bg-warn-bg border border-warn/20 rounded-[10px] text-sm text-warn flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium mb-0.5">Chromium browser required</div>
                  <div className="text-xs text-muted">
                    Live microphone recognition needs Chrome, Edge, or Brave. Use the Samples or Paste tabs instead.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Spoken audio analyzed per chunk.</span>
                  <select
                    className="text-sm bg-surface-2 border border-border rounded-[10px] px-2.5 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-accent"
                    value={speechLang}
                    onChange={(e) => setSpeechLang(e.target.value as any)}
                    disabled={isListening}
                  >
                    <option value="en-IN">English</option>
                    <option value="hi-IN">Hindi</option>
                    <option value="mr-IN">Marathi</option>
                  </select>
                </div>

                <div className="p-6 bg-surface-2 border border-border rounded-[10px] flex flex-col items-center justify-center gap-3 min-h-[160px]">
                  {isListening ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-alert/10 flex items-center justify-center shadow-glow-alert">
                        <Mic className="w-6 h-6 text-alert" />
                      </div>
                      <span className="text-sm text-alert font-medium">
                        Listening ({speechLang})…
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center">
                        <MicOff className="w-6 h-6 text-muted" />
                      </div>
                      <span className="text-sm text-muted">Idle</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={isListening ? 'destructive' : 'primary'}
                    onClick={toggleSpeechRecognition}
                  >
                    {isListening ? 'Stop' : 'Start Listening'}
                  </Button>
                </div>

                {liveTranscript && (
                  <div className="p-2.5 bg-surface border border-border rounded-[10px] max-h-24 overflow-y-auto font-mono text-xs text-text/80">
                    <span className="text-muted font-medium block mb-1">Captured:</span>
                    {liveTranscript}
                  </div>
                )}
              </>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};
