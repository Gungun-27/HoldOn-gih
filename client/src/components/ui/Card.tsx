import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  ...props
}) => {
  return (
    <div
      className={`bg-surface border border-border rounded-lg p-5 ${className}`}
      {...props}
    >
      {header && <div className="mb-4 pb-3 border-b border-border">{header}</div>}
      {children}
    </div>
  );
};
