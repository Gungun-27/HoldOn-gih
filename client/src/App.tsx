import { AnalyzeResponse, Region } from '@holdon/shared';
import React, { useEffect, useState } from 'react';
import { ActiveNavTab, AppShell } from './components/AppShell.js';
import { Footer } from './components/Footer.js';
import { AuthProvider } from './contexts/AuthContext.js';
import { AnalyzerWorkspace } from './features/analyzer/AnalyzerWorkspace.js';
import { ComplaintForm } from './features/complaints/ComplaintForm.js';
import { LandingPage } from './features/landing/LandingPage.js';
import { OfficerConsole } from './features/officer/OfficerConsole.js';
import { RecoveryGuidePage } from './features/recovery/RecoveryGuidePage.js';
import { TrackingView } from './features/tracking/TrackingView.js';
import { VerifyPage } from './features/verify/VerifyPage.js';

const MainApp: React.FC = () => {
  const [region, setRegion] = useState<Region>('IN');
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeNav, setActiveNav] = useState<ActiveNavTab>('analyzer');
  const [complaintContext, setComplaintContext] = useState<{
    transcript?: string;
    analysis?: AnalyzeResponse | null;
  }>({});
  const [trackRef, setTrackRef] = useState<string | null>(null);
  const [verifyHash, setVerifyHash] = useState<string | null>(null);

  // Check URL on load for /verify/:hash, /verify, or /paid (FR-38)
  useEffect(() => {
    const pathname = window.location.pathname;
    const matchVerify = pathname.match(/^\/verify(?:\/([a-zA-Z0-9_-]+))?/);
    if (matchVerify) {
      if (matchVerify[1]) setVerifyHash(matchVerify[1]);
      setActiveNav('verify');
      setView('app');
    } else if (pathname === '/paid' || pathname.startsWith('/paid')) {
      setActiveNav('paid');
      setView('app');
    }

    const handleNavVerify = (e: any) => {
      const hash = e.detail;
      if (hash) setVerifyHash(hash);
      setActiveNav('verify');
      setView('app');
      window.history.pushState(null, '', hash ? `/verify/${hash}` : '/verify');
    };

    const handleNavPaid = () => {
      setActiveNav('paid');
      setView('app');
      window.history.pushState(null, '', '/paid');
    };

    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/paid' || currentPath.startsWith('/paid')) {
        setActiveNav('paid');
        setView('app');
      } else if (currentPath.startsWith('/verify')) {
        const m = currentPath.match(/^\/verify(?:\/([a-zA-Z0-9_-]+))?/);
        if (m && m[1]) setVerifyHash(m[1]);
        setActiveNav('verify');
        setView('app');
      } else if (currentPath === '/' && view === 'app') {
        // stay in app
      }
    };

    window.addEventListener('holdon:navigate-verify', handleNavVerify);
    window.addEventListener('holdon:navigate-paid', handleNavPaid);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('holdon:navigate-verify', handleNavVerify);
      window.removeEventListener('holdon:navigate-paid', handleNavPaid);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [view]);

  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-bg text-text">
        <LandingPage
          onNavigateAnalyzer={() => {
            setActiveNav('analyzer');
            setView('app');
          }}
          onNavigateComplaint={() => {
            setActiveNav('complaints');
            setView('app');
          }}
          onNavigatePaid={() => {
            setActiveNav('paid');
            setView('app');
            window.history.pushState(null, '', '/paid');
          }}
        />
        <Footer region={region} />
      </div>
    );
  }

  return (
    <AppShell
      region={region}
      onRegionChange={setRegion}
      activeNav={activeNav}
      onNavChange={(tab) => {
        setActiveNav(tab);
        if (tab === 'paid') {
          window.history.pushState(null, '', '/paid');
        } else if (tab === 'verify') {
          window.history.pushState(null, '', verifyHash ? `/verify/${verifyHash}` : '/verify');
        } else if (window.location.pathname.startsWith('/verify') || window.location.pathname === '/paid') {
          window.history.pushState(null, '', '/');
        }
      }}
    >
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-between">
        <div>
          {activeNav === 'analyzer' && (
            <AnalyzerWorkspace
              region={region}
              onNavigateComplaint={(transcript, analysis) => {
                setComplaintContext({ transcript, analysis });
                setActiveNav('complaints');
              }}
            />
          )}

          {activeNav === 'paid' && (
            <RecoveryGuidePage
              region={region}
              analysisSummary={complaintContext.analysis}
              initialTranscript={complaintContext.transcript}
              onNavigateComplaint={(transcript, analysis) => {
                setComplaintContext({
                  transcript: transcript ?? complaintContext.transcript,
                  analysis: analysis ?? complaintContext.analysis,
                });
                setActiveNav('complaints');
                if (window.location.pathname === '/paid') {
                  window.history.pushState(null, '', '/');
                }
              }}
            />
          )}

          {activeNav === 'complaints' && (
            <ComplaintForm
              initialTranscript={complaintContext.transcript}
              analysisSummary={complaintContext.analysis}
              onSubmitted={(ref) => {
                setTrackRef(ref);
                setActiveNav('track');
              }}
            />
          )}

          {activeNav === 'track' && (
            <TrackingView initialRef={trackRef} />
          )}

          {activeNav === 'officer' && (
            <OfficerConsole />
          )}

          {activeNav === 'verify' && (
            <VerifyPage initialHash={verifyHash} />
          )}

          {activeNav === 'help' && (
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
              <div className="bg-surface border border-border rounded-xl p-6 max-w-2xl mx-auto space-y-4">
                <h2 className="text-xl font-semibold text-text">Emergency Guidance & Protocol</h2>
                <p className="text-sm text-muted leading-relaxed">
                  If an caller demands immediate fund transfers, non-bailable arrest settlements, or remote screen control, hang up immediately. Real law enforcement agencies never conduct "digital arrests" via video calls.
                </p>
                <div className="p-4 bg-surface-2 border border-border rounded-lg text-sm">
                  <div className="font-semibold text-accent mb-1">National Helpline for {region}:</div>
                  <div className="text-lg font-bold text-text">
                    {region === 'IN' ? '1930 (Cyber Crime Helpline)' : region === 'US' ? '1-877-382-4357 (FTC)' : '0300 123 2040 (Action Fraud)'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'settings' && (
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
              <div className="bg-surface border border-border rounded-xl p-6 max-w-xl mx-auto space-y-4">
                <h2 className="text-xl font-semibold text-text">System Preferences</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border">
                    <div>
                      <div className="font-medium text-text">Selected Jurisdiction</div>
                      <div className="text-xs text-muted">Configures regional authority packs</div>
                    </div>
                    <span className="font-semibold text-accent">{region}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border">
                    <div>
                      <div className="font-medium text-text">Digit Masking</div>
                      <div className="text-xs text-muted">Mandatory client & server sanitization</div>
                    </div>
                    <span className="text-xs font-semibold text-accent bg-ok-bg px-2 py-0.5 rounded-full">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer region={region} />
      </div>
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
