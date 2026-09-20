import { TacticEvidence } from '@holdon/shared';
import { Check, Copy, MessageCircle, Send, ShieldCheck, UserCheck, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button.js';

interface GuardianAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  tactics: TacticEvidence[];
  score: number;
}

const GUARDIAN_STORAGE_KEY = 'holdon_trusted_contact';

export const GuardianAlertModal: React.FC<GuardianAlertModalProps> = ({
  isOpen,
  onClose,
  tactics,
  score,
}) => {
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [alertSent, setAlertSent] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GUARDIAN_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setContactName(data.name || '');
        setContactPhone(data.phone || '');
        setContactEmail(data.email || '');
      }
    } catch { /* ignore */ }
  }, []);

  if (!isOpen) return null;

  const saveContact = () => {
    localStorage.setItem(
      GUARDIAN_STORAGE_KEY,
      JSON.stringify({ name: contactName, phone: contactPhone, email: contactEmail })
    );
  };

  const evidenceQuotes = tactics
    .slice(0, 3)
    .map((t) => `• "${t.evidence}" (${t.type.replace(/_/g, ' ')})`)
    .join('\n');

  const alertMessage = `⚠️ URGENT SECURITY ALERT from HoldOn:
I may be targeted by a high-pressure scam call or message.
HoldOn pressure score: ${score}/100.

Identified coercive evidence:
${evidenceQuotes || '• High-risk pressure tactics detected'}

Please call me or verify before I transfer any funds or share details.
Helpline: Call 1930 immediately.`;

  const waLink = `https://wa.me/${contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(alertMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(alertMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendAlert = async () => {
    saveContact();
    try {
      await fetch('/api/guardian-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: { name: contactName, phone: contactPhone, email: contactEmail },
          summary: alertMessage,
          waLink,
        }),
      });
      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 3000);
    } catch (e) {
      console.error('Failed to trigger alert', e);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-bg/85 flex items-center justify-center p-4"
    >
      <div className="bg-surface border border-border max-w-lg w-full rounded-lg shadow-overlay overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-semibold text-text">
              Alert trusted contact
            </h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text p-1 rounded-[10px] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted">
            Send a masked evidence summary to your family member or trusted contact so they can intervene.
          </p>

          {/* Contact form */}
          <div className="p-3.5 bg-surface-2 border border-border rounded-[10px] space-y-2.5">
            <div className="text-sm text-text flex items-center gap-1.5 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-accent" />
              Guardian details (saved locally)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-muted mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Daughter, brother…"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full text-sm p-2 bg-bg border border-border rounded-[10px] text-text placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Phone (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full text-sm p-2 bg-bg border border-border rounded-[10px] text-text placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted font-medium">Alert preview</span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
            <pre className="p-3 bg-bg border border-border rounded-[10px] font-mono text-xs text-text/80 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto select-all">
              {alertMessage}
            </pre>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={saveContact}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] text-white text-sm font-medium rounded-[10px] hover:brightness-110 transition"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleSendAlert} icon={<Send className="w-3.5 h-3.5" />}>
                {alertSent ? 'Sent' : 'Notify'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
