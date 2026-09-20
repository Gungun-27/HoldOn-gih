import { UserRole } from '@holdon/shared';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertCircle, CheckCircle2, Lock, Mail, Shield, User, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Button } from '../ui/Button.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  onSuccess,
}) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setError(null);
    setSuccessMsg(null);
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const res = await signIn(email, password);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      onSuccess?.();
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('Please provide your name');
      return;
    }

    setIsSubmitting(true);
    const res = await signUp(email, password, name.trim(), role);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg('Account created successfully! You are now logged in.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(email.trim());
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg('Password reset link sent to your email.');
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-overlay z-50 text-text">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <Dialog.Title className="text-base font-semibold text-text">
                {tab === 'login'
                  ? 'Sign in to HoldOn'
                  : tab === 'register'
                  ? 'Create an account'
                  : 'Reset password'}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 text-muted hover:text-text rounded-md hover:bg-surface-2 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Tab selector */}
          {tab !== 'forgot' && (
            <div className="flex border-b border-border mt-4 mb-5">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  resetState();
                }}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'login'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-text'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  resetState();
                }}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'register'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-text'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-alert-bg border border-alert/30 rounded-lg flex items-start gap-2 text-xs text-alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-ok-bg border border-accent/30 rounded-lg flex items-start gap-2 text-xs text-accent">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      resetState();
                    }}
                    className="text-xs text-accent hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in…' : 'Sign In'}
                </Button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Full name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Gungun Raut"
                    className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Account role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`p-2.5 rounded-[10px] border text-left transition-colors ${
                      role === 'user'
                        ? 'border-accent bg-accent/10 text-accent font-medium'
                        : 'border-border bg-surface-2 text-muted hover:border-border-strong'
                    }`}
                  >
                    <div className="text-xs font-semibold">Citizen</div>
                    <div className="text-[11px] text-muted">File & track cases</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('officer')}
                    className={`p-2.5 rounded-[10px] border text-left transition-colors ${
                      role === 'officer'
                        ? 'border-accent bg-accent/10 text-accent font-medium'
                        : 'border-border bg-surface-2 text-muted hover:border-border-strong'
                    }`}
                  >
                    <div className="text-xs font-semibold">Officer (Demo)</div>
                    <div className="text-[11px] text-muted">Review & verify queue</div>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating account…' : 'Register'}
                </Button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setTab('login');
                    resetState();
                  }}
                >
                  Back to Sign In
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending…' : 'Send Link'}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
