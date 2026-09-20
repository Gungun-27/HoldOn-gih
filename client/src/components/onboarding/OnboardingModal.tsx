import { REGION_PACKS, Region } from '@holdon/shared';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Check, Globe, Lock, ShieldCheck, UserCheck } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Button } from '../ui/Button.js';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { profile, updateProfile, setHasCompletedOnboarding } = useAuth();
  const [step, setStep] = useState<number>(1);

  // Step 1: Region & Language
  const [selectedRegion, setSelectedRegion] = useState<Region>('IN');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  // Step 2: Trusted contact
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>(profile?.trusted_contact_email || '');

  // Step 3: DPDP Consent
  const [hasConsent, setHasConsent] = useState<boolean>(false);

  const handleFinish = async () => {
    if (contactEmail.trim()) {
      await updateProfile({
        trusted_contact_email: contactEmail.trim(),
      });
    }
    setHasCompletedOnboarding(true);
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    setHasCompletedOnboarding(true);
    onClose();
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return 'TC';
    return name
      .trim()
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const regionPack = REGION_PACKS[selectedRegion];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 transition-opacity" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-overlay z-50 text-text">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-accent bg-surface-2 border border-border px-2.5 py-1 rounded-full">
                0{step} / 03
              </span>
              <span className="text-xs text-muted font-medium">Quick setup</span>
            </div>
            <button
              onClick={handleSkip}
              className="text-xs text-muted hover:text-text font-medium px-2 py-1 rounded hover:bg-surface-2 transition-colors"
            >
              Skip setup
            </button>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-6 items-center min-h-[340px]">
            {/* Left column: Decision / Controls */}
            <div className="md:col-span-7 flex flex-col justify-between">
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-heading text-text">
                      Select your region & language
                    </h2>
                    <p className="text-xs text-accent mt-1 font-medium">
                      Tailors official helpline numbers and speech recognition
                    </p>
                    <p className="text-xs text-muted mt-2 leading-relaxed">
                      HoldOn aligns its verification routing and emergency advisories with your local jurisdiction.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">
                        Region
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['IN', 'US', 'UK'] as Region[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedRegion(r)}
                            className={`p-2.5 rounded-[10px] border text-center transition-colors ${
                              selectedRegion === r
                                ? 'border-accent bg-accent/10 text-accent font-medium'
                                : 'border-border bg-surface-2 text-muted hover:border-border-strong'
                            }`}
                          >
                            <div className="text-xs font-semibold">{REGION_PACKS[r].name}</div>
                            <div className="text-[10px] text-muted">{REGION_PACKS[r].helplineNumber}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">
                        Preferred language
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { code: 'en', label: 'English' },
                          { code: 'hi', label: 'Hindi (हिंदी)' },
                          { code: 'mr', label: 'Marathi (मराठी)' },
                        ].map((l) => (
                          <button
                            key={l.code}
                            type="button"
                            onClick={() => setSelectedLanguage(l.code as any)}
                            className={`p-2 rounded-[10px] border text-xs text-center transition-colors ${
                              selectedLanguage === l.code
                                ? 'border-accent bg-accent/10 text-accent font-medium'
                                : 'border-border bg-surface-2 text-muted hover:border-border-strong'
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-heading text-text">
                      Configure a trusted contact
                    </h2>
                    <p className="text-xs text-accent mt-1 font-medium">
                      One-tap WhatsApp and email alert if high coercion is detected
                    </p>
                    <p className="text-xs text-muted mt-2 leading-relaxed">
                      Scammers enforce isolation. Setting a trusted guardian allows you to alert them immediately with verified evidence quotes.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">
                        Contact name (e.g. Partner, Parent, Son)
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Maya Sharma"
                        className="w-full px-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="guardian@example.com"
                        className="w-full px-3 py-2 bg-surface-2 border border-border rounded-[10px] text-sm text-text placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-heading text-text">
                      Privacy & DPDP compliance
                    </h2>
                    <p className="text-xs text-accent mt-1 font-medium">
                      Zero-retention real-time analysis
                    </p>
                    <p className="text-xs text-muted mt-2 leading-relaxed">
                      All digits and card numbers are masked prior to scoring. Conversations are analyzed ephemerally and discarded immediately.
                    </p>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-3 p-3.5 bg-surface-2 border border-border rounded-[10px] cursor-pointer hover:border-border-strong transition-colors">
                      <input
                        type="checkbox"
                        checked={hasConsent}
                        onChange={(e) => setHasConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-border bg-bg text-accent focus:ring-accent accent-accent"
                      />
                      <span className="text-xs text-text/90 leading-relaxed select-none">
                        I acknowledge and consent to ephemeral coercion analysis under DPDP guidelines. I understand no recordings or unmasked PII are stored on HoldOn servers.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: 3D-depth Preview Card */}
            <div className="md:col-span-5 flex items-center justify-center">
              {step === 1 && (
                <div className="w-full max-w-xs bg-surface-2/90 border border-border-strong rounded-xl p-5 shadow-overlay relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2 text-xs font-medium text-text">
                      <Globe className="w-4 h-4 text-accent" />
                      Jurisdiction
                    </div>
                    <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      {selectedRegion}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <div className="text-xs text-muted">Primary helpline</div>
                    <div className="text-base font-semibold text-text">
                      {regionPack.helplineNumber}
                    </div>
                    <div className="text-[11px] text-muted truncate">
                      {regionPack.portalUrl}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
                    <span>Language mode</span>
                    <span className="text-text font-medium uppercase">
                      {selectedLanguage}
                    </span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="w-full max-w-xs bg-surface-2/90 border border-border-strong rounded-xl p-5 shadow-overlay relative">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2 text-xs font-medium text-text">
                      <UserCheck className="w-4 h-4 text-accent" />
                      Trusted Guardian
                    </div>
                    <span className="text-[10px] font-medium text-accent bg-ok-bg px-2 py-0.5 rounded-full">
                      {contactEmail ? 'Ready' : 'Pending'}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-sm font-semibold text-accent shrink-0">
                      {getInitials(contactName)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium text-text truncate">
                        {contactName || 'Guardian Contact'}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {contactEmail || 'No email entered yet'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border text-[11px] text-muted flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-accent" />
                    <span>Masked quotes sent on ALERT trigger</span>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div
                  className={`w-full max-w-xs bg-surface-2/90 border rounded-xl p-5 shadow-overlay transition-all ${
                    hasConsent ? 'border-accent glow-accent' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2 text-xs font-medium text-text">
                      <ShieldCheck className="w-4 h-4 text-accent" />
                      Security Envelope
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        hasConsent
                          ? 'bg-ok-bg text-accent'
                          : 'bg-surface text-muted border border-border'
                      }`}
                    >
                      {hasConsent ? 'Encrypted & Consented' : 'Awaiting Consent'}
                    </span>
                  </div>

                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <motion.div
                      animate={{ scale: hasConsent ? 1.08 : 1 }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center border transition-colors ${
                        hasConsent
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-surface border-border text-muted'
                      }`}
                    >
                      <Lock className="w-6 h-6" />
                    </motion.div>
                    <p className="mt-3 text-xs font-medium text-text">
                      {hasConsent ? 'Data Shield Active' : 'Consent Required'}
                    </p>
                    <p className="text-[11px] text-muted mt-1">
                      {hasConsent
                        ? 'Zero-log analysis active'
                        : 'Tick the checkbox to enable secure operations'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer controls */}
          <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
            <div>
              {step > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleSkip}>
                Skip
              </Button>

              {step < 3 ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setStep((s) => s + 1)}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!hasConsent}
                  onClick={handleFinish}
                >
                  Get started
                </Button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
