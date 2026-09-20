import { TACTIC_LABELS, TacticType } from '@holdon/shared';
import { ArrowRight, Lock, Shield, Users } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button.js';
import { SAMPLE_SCRIPTS } from '../../data/samples.js';

interface LandingPageProps {
  onNavigateAnalyzer: () => void;
  onNavigateComplaint?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateAnalyzer,
  onNavigateComplaint,
}) => {
  // Orb glow state driven by sample conversation demo
  const [orbState, setOrbState] = useState<'safe' | 'warn' | 'alert'>('safe');
  const [currentDemoChunk, setCurrentDemoChunk] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sample = SAMPLE_SCRIPTS[0]; // Digital arrest sample

  const runDemoLoop = useCallback(() => {
    if (currentDemoChunk >= sample.chunks.length) {
      // Reset after a pause
      timerRef.current = setTimeout(() => {
        setCurrentDemoChunk(0);
        setOrbState('safe');
      }, 4000);
      return;
    }

    // Simulate state progression
    if (currentDemoChunk === 0) setOrbState('safe');
    else if (currentDemoChunk === 1) setOrbState('warn');
    else setOrbState('alert');

    timerRef.current = setTimeout(() => {
      setCurrentDemoChunk((prev) => prev + 1);
    }, (sample.chunks[currentDemoChunk]?.durationSec ?? 5) * 1000);
  }, [currentDemoChunk, sample]);

  useEffect(() => {
    // Pause when tab is hidden
    const handleVisibility = () => {
      if (document.hidden && timerRef.current) {
        clearTimeout(timerRef.current);
      } else if (!document.hidden) {
        runDemoLoop();
      }
    };

    runDemoLoop();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [runDemoLoop]);

  const currentChunk = sample.chunks[Math.min(currentDemoChunk, sample.chunks.length - 1)];

  const TACTICS_TABLE: { type: TacticType; example: string }[] = [
    { type: 'authority_claim', example: '"This is the CBI cyber crime branch headquarters"' },
    { type: 'urgency', example: '"Transfer within 15 minutes or face arrest"' },
    { type: 'secrecy_isolation', example: '"Do not tell your family about this call"' },
    { type: 'fear_legal_threat', example: '"A non-bailable warrant has been issued"' },
    { type: 'payment_channel_switch', example: '"Send money to the RBI verification account"' },
    { type: 'remote_access_request', example: '"Download AnyDesk and share your screen"' },
    { type: 'too_good_reward', example: '"Earn 5,000 rupees daily by liking videos"' },
  ];

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-20 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: headline */}
          <div>
            <h1 className="text-display font-semibold tracking-heading text-text leading-tight">
              Hold on.
              <br />
              <span className="text-accent">Before you pay.</span>
            </h1>
            <p className="mt-6 text-lg text-muted max-w-md leading-relaxed">
              Real-time pressure scoring catches coercion tactics in scam calls and messages before you act. Explains every score with quoted evidence.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                variant="primary"
                onClick={onNavigateAnalyzer}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Try the analyzer
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={onNavigateComplaint || onNavigateAnalyzer}
              >
                File a complaint
              </Button>
            </div>
          </div>

          {/* Right: CSS orb + sample card */}
          <div className="flex items-center justify-center relative" aria-hidden="true">
            <div className={`css-orb css-orb-pulse`} data-state={orbState} />

            {/* Sample conversation card floating next to orb */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-8 max-w-[220px] bg-surface/90 backdrop-blur-sm border border-border rounded-lg p-3.5 shadow-overlay">
              <div className="text-[10px] font-medium text-muted mb-1.5">Live sample preview</div>
              <p className="text-xs text-text/80 leading-relaxed line-clamp-3">
                "{currentChunk?.text.slice(0, 120)}…"
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  orbState === 'alert' ? 'bg-alert' : orbState === 'warn' ? 'bg-warn' : 'bg-accent'
                }`} />
                <span className="text-[10px] font-medium text-muted uppercase">
                  {orbState}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Persona cards */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20">
        <h2 className="text-2xl font-semibold tracking-heading text-text mb-8">
          Why it works for everyone
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Users className="w-5 h-5" />,
              title: 'Families',
              desc: 'Parents and partners paste suspicious WhatsApp messages and get an instant coercion assessment with specific evidence, not a vague spam score.',
            },
            {
              icon: <Shield className="w-5 h-5" />,
              title: 'Seniors',
              desc: 'Live microphone capture analyses the call as it happens. When pressure crosses the threshold, a full-screen alert interrupts with the exact official helpline to verify.',
            },
            {
              icon: <Lock className="w-5 h-5" />,
              title: 'Guardians',
              desc: 'One tap sends a masked evidence summary to a trusted contact via WhatsApp. No personal data is stored. The guardian sees what the scammer said, not what the victim owns.',
            },
          ].map((card, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-6 hover:border-border-strong transition-colors">
              <div className="text-accent mb-3">{card.icon}</div>
              <h3 className="text-base font-semibold text-accent mb-1.5">{card.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20">
        <h2 className="text-2xl font-semibold tracking-heading text-text mb-8">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Capture', desc: 'Paste text, play a sample recording, or use the live microphone. All digits are masked before analysis.' },
            { step: '02', title: 'Detect', desc: 'The engine extracts coercion tactics with verbatim quotes. Every claim is verified against the original text.' },
            { step: '03', title: 'Act', desc: 'A pressure score and state (Safe, Warn, Alert) drive clear action steps: hang up, verify, and tell someone.' },
          ].map((item, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-5">
              <span className="text-xs text-accent font-semibold">{item.step}</span>
              <h3 className="text-base font-semibold text-text mt-2 mb-1">{item.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tactics table */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20">
        <h2 className="text-2xl font-semibold tracking-heading text-text mb-8">
          Seven tactics the engine detects
        </h2>
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-muted font-medium">Tactic</th>
                <th className="px-4 py-3 text-muted font-medium hidden md:table-cell">Example quote</th>
              </tr>
            </thead>
            <tbody>
              {TACTICS_TABLE.map(({ type, example }) => (
                <tr key={type} className="border-b border-border/50 last:border-0 hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 text-text font-medium">
                    {TACTIC_LABELS[type].label}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-accent hidden md:table-cell">
                    {example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Privacy strip */}
      <section className="border-t border-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted">
          <Lock className="w-4 h-4 text-accent shrink-0" />
          <span>Analysis is never stored. Digits are masked before processing. The AI provider (Groq) is disclosed.</span>
        </div>
      </section>
    </div>
  );
};
