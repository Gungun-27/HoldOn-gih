import React from 'react';

export interface BadgeProps {
  variant?: 'safe' | 'warn' | 'alert' | 'degraded' | 'neutral';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  icon,
}) => {
  const variantStyles = {
    safe: 'bg-ok-bg text-accent border-accent/20',
    warn: 'bg-warn-bg text-warn border-warn/20 font-semibold',
    alert: 'bg-alert-bg text-alert border-alert/20 font-semibold',
    degraded: 'bg-warn-bg text-warn border-warn/20 font-medium',
    neutral: 'bg-surface-2 text-muted border-border',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
