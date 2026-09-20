import { AnalyzeResponse, Region } from '@holdon/shared';
import React, { useState } from 'react';
import { ActiveNavTab, AppShell } from './components/AppShell.js';
import { Footer } from './components/Footer.js';
import { AuthProvider } from './contexts/AuthContext.js';
import { AnalyzerWorkspace } from './features/analyzer/AnalyzerWorkspace.js';
import { ComplaintForm } from './features/complaints/ComplaintForm.js';
import { LandingPage } from './features/landing/LandingPage.js';
import { OfficerConsole } from './features/officer/OfficerConsole.js';
import { TrackingView } from './features/tracking/TrackingView.js';

const MainApp: React.FC = () => {
  const [region, setRegion] = useState<Region>('IN');
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeNav, setActiveNav] = useState<ActiveNavTab>('analyzer');
  const [complaintContext, setComplaintContext] = useState<{
    transcript?: string;
    analysis?: AnalyzeResponse | null;
  }>({});
  const [trackRef, setTrackRef] = useState<string | null>(null);

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
