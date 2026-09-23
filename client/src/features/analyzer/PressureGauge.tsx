import { RiskState, ScamType, SCAM_TYPE_LABELS } from '@holdon/shared';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Cpu, Tag } from 'lucide-react';
import React from 'react';
import { Badge } from '../../components/ui/Badge.js';

interface PressureGaugeProps {
  score: number;
  state: RiskState;
  degraded: boolean;
  scamType?: ScamType;
}

export const PressureGauge: React.FC<PressureGaugeProps> = ({
  score,
  state,
  degraded,
  scamType,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Colour mapping based on state
  let strokeColor = '#34D399'; // Accent green (SAFE)
  let glowColor = 'rgba(52,211,153,.25)';
  let glowClass = 'shadow-glow';
  let stateClass = 'bg-ok-bg text-accent border-accent/20';
  let StateIcon = CheckCircle;
  let stateLabel = 'SAFE';

  if (state === 'ALERT') {
    strokeColor = '#F87171';
    glowColor = 'rgba(248,113,113,.25)';
    glowClass = 'shadow-glow-alert';
    stateClass = 'bg-alert-bg text-alert border-alert/20';
    StateIcon = AlertCircle;
    stateLabel = 'ALERT';
  } else if (state === 'WARN') {
    strokeColor = '#FBBF24';
    glowColor = 'rgba(251,191,36,.25)';
    glowClass = 'shadow-glow-warn';
    stateClass = 'bg-warn-bg text-warn border-warn/20';
    StateIcon = AlertTriangle;
    stateLabel = 'WARN';
  }

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, score))) / 100;

  return (
    <div className={`flex flex-col items-center justify-center p-5 bg-surface border border-border rounded-lg transition-shadow duration-400 ${glowClass}`}>
      {/* Header row */}
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-sm font-medium text-muted">
          Pressure Score
        </span>
        <div className="flex items-center gap-1.5">
          {degraded && (
            <Badge variant="degraded" icon={<Cpu className="w-3 h-3" />}>
              Degraded
            </Badge>
          )}
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${stateClass}`}
          >
            <StateIcon className="w-3.5 h-3.5" />
            {stateLabel}
          </span>
        </div>
      </div>

      {/* SVG Gauge Ring with glow */}
      <div className="relative w-48 h-32 flex items-center justify-center overflow-hidden">
        <svg
          className="w-48 h-48 -rotate-[210deg] transform"
          viewBox="0 0 180 180"
          aria-hidden="true"
        >
          {/* Glow filter */}
          <defs>
            <filter id="gauge-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feFlood floodColor={glowColor} result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="transparent"
            stroke="#1F2A2F"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
          />

          {/* Animated Value Arc with glow */}
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            filter="url(#gauge-glow)"
            initial={false}
            animate={{ strokeDashoffset }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.4, ease: 'easeOut' }
            }
          />
        </svg>

        {/* Score readout */}
        <div className="absolute inset-0 top-8 flex flex-col items-center justify-center pointer-events-none">
          <motion.span
            className="text-4xl font-semibold tracking-heading text-text"
            initial={false}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted mt-0.5">
            out of 100
          </span>
        </div>
      </div>

      {/* Scale labels */}
      <div className="w-full mt-2 pt-2 border-t border-border flex items-center justify-between text-xs text-muted font-medium">
        <span>0</span>
        <span className="text-warn">40 Warn</span>
        <span className="text-alert">70 Alert</span>
      </div>

      {/* Scam-type label (FR-39) */}
      {scamType && (
        <div className="w-full mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted font-medium flex items-center gap-1">
            <Tag className="w-3 h-3 text-muted" />
            Scam type
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-2 border border-border text-text shadow-sm">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                scamType === 'other'
                  ? 'bg-muted'
                  : state === 'ALERT'
                  ? 'bg-alert'
                  : state === 'WARN'
                  ? 'bg-warn'
                  : 'bg-accent'
              }`}
            />
            {SCAM_TYPE_LABELS[scamType] ?? 'Other'}
          </span>
        </div>
      )}
    </div>
  );
};
