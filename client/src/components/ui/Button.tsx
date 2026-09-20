import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all select-none rounded-[10px] border text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 disabled:pointer-events-none';

  const sizeStyles = {
    sm: 'min-h-[36px] px-3.5 py-1.5 text-sm gap-1.5',
    md: 'min-h-[44px] px-5 py-2 text-sm gap-2',
    lg: 'min-h-[48px] px-6 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-accent-fill text-accent-fill-text border-transparent hover:brightness-110 active:brightness-90',
    secondary:
      'bg-surface-2 text-text border-border hover:border-border-strong hover:bg-surface-2/80',
    ghost:
      'bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-text',
    destructive:
      'bg-alert-fill text-white border-transparent hover:brightness-110 active:brightness-90',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
