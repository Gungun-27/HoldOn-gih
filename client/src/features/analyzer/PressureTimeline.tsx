import React from 'react';
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface TimelinePoint {
  chunkIndex: number;
  label: string;
  score: number;
  state: string;
  timestamp: number;
}

interface PressureTimelineProps {
  data: TimelinePoint[];
}

export const PressureTimeline: React.FC<PressureTimelineProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center border border-dashed border-border rounded-lg text-sm text-muted bg-surface">
        Run an analysis to plot the pressure timeline.
      </div>
    );
  }

  const latestScore = data[data.length - 1]?.score ?? 0;
  const strokeColor =
    latestScore >= 70 ? '#F87171' : latestScore >= 40 ? '#FBBF24' : '#34D399';
  const fillColor =
    latestScore >= 70
      ? 'rgba(248,113,113,.15)'
      : latestScore >= 40
      ? 'rgba(251,191,36,.15)'
      : 'rgba(52,211,153,.15)';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted">
          Pressure Progression
        </span>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-warn rounded-full" /> Warn
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-alert rounded-full" /> Alert
          </span>
        </div>
      </div>

      <div className="h-44 w-full bg-surface border border-border rounded-lg p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="scoreFillDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fillColor} stopOpacity={1} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9AA6AB', fontFamily: 'IBM Plex Mono' }}
              stroke="#1F2A2F"
              axisLine={{ stroke: '#1F2A2F' }}
              tickLine={{ stroke: '#1F2A2F' }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 40, 70, 100]}
              tick={{ fontSize: 11, fill: '#9AA6AB', fontFamily: 'IBM Plex Mono' }}
              stroke="#1F2A2F"
              axisLine={{ stroke: '#1F2A2F' }}
              tickLine={{ stroke: '#1F2A2F' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const point = payload[0].payload as TimelinePoint;
                  return (
                    <div className="bg-surface-2 border border-border-strong px-3 py-2 rounded-full shadow-overlay text-xs font-medium">
                      <span className="text-text font-semibold">{point.score}</span>
                      <span className="text-muted ml-1.5">{point.state}</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={40} stroke="#FBBF24" strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.5} />
            <ReferenceLine y={70} stroke="#F87171" strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.5} />
            <Area
              type="monotone"
              dataKey="score"
              stroke={strokeColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#scoreFillDark)"
              dot={{ r: 3, fill: strokeColor, stroke: '#0C1215', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: strokeColor, stroke: '#0C1215', strokeWidth: 2 }}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
