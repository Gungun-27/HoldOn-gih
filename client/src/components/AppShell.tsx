import { Region } from '@holdon/shared';
import {
  Compass,
  FileText,
  Globe,
  HelpCircle,
  LifeBuoy,
  LogIn,
  LogOut,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { AuthModal } from './auth/AuthModal.js';
import { OnboardingModal } from './onboarding/OnboardingModal.js';
import { Button } from './ui/Button.js';

export type ActiveNavTab = 'analyzer' | 'paid' | 'complaints' | 'track' | 'officer' | 'verify' | 'help' | 'settings';

interface AppShellProps {
  region: Region;
  onRegionChange: (region: Region) => void;
  activeNav?: ActiveNavTab;
  onNavChange?: (tab: ActiveNavTab) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: ActiveNavTab;
  icon: React.ReactNode;
  label: string;
  officerOnly?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  region,
  onRegionChange,
  activeNav = 'analyzer',
  onNavChange,
  children,
}) => {
  const { user, profile, isOfficer, signOut } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const NAV_ITEMS: NavItem[] = [
    { id: 'analyzer', icon: <Search className="w-5 h-5" />, label: 'Analyzer' },
    { id: 'paid', icon: <LifeBuoy className="w-5 h-5" />, label: 'Recovery' },
    { id: 'complaints', icon: <FileText className="w-5 h-5" />, label: 'Complaints' },
    { id: 'track', icon: <Shield className="w-5 h-5" />, label: 'Track' },
    { id: 'officer', icon: <ShieldAlert className="w-5 h-5" />, label: 'Officer', officerOnly: true },
    { id: 'verify', icon: <ShieldCheck className="w-5 h-5" />, label: 'Verify' },
    { id: 'help', icon: <HelpCircle className="w-5 h-5" />, label: 'Help' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
  ];

  const handleNavClick = (tabId: ActiveNavTab) => {
    if (tabId === 'officer' && !user) {
      setIsAuthOpen(true);
      return;
    }
    onNavChange?.(tabId);
  };

  const getInitials = (name?: string | null) => {
    if (!name?.trim()) return user?.email?.slice(0, 2).toUpperCase() || 'U';
    return name
      .trim()
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* Top bar */}
      <header className="bg-surface border-b border-border sticky top-0 z-30">
        <div className="h-14 px-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 pl-1 md:pl-16">
            <button
              onClick={() => onNavChange?.('analyzer')}
              className="flex items-center gap-3 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-[10px] bg-accent-fill flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-accent-fill-text" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-heading text-text">
                  HoldOn
                </span>
                <span className="hidden sm:inline text-xs font-semibold text-accent bg-surface-2 border border-border px-2 py-0.5 rounded-full">
                  P1
                </span>
              </div>
            </button>
          </div>

          {/* Right: region + account / login */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick onboarding button */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              title="Quick setup guide"
              className="hidden lg:flex items-center gap-1.5 text-xs text-muted hover:text-text bg-surface-2 border border-border px-2.5 py-1.5 rounded-full transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-accent" />
              <span>Setup Guide</span>
            </button>

            {/* Jurisdiction selector */}
            <div className="flex items-center gap-1.5 text-xs bg-surface-2 border border-border rounded-full px-2.5 py-1.5">
              <Globe className="w-3.5 h-3.5 text-muted" />
              <select
                value={region}
                onChange={(e) => onRegionChange(e.target.value as Region)}
                aria-label="Select Region"
                className="bg-transparent text-text text-xs focus:outline-none cursor-pointer font-medium"
              >
                <option value="IN">India</option>
                <option value="US">US</option>
                <option value="UK">UK</option>
              </select>
            </div>

            {/* Auth status */}
            {!user ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsAuthOpen(true)}
                icon={<LogIn className="w-3.5 h-3.5" />}
              >
                Sign In
              </Button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 bg-surface-2 border border-border rounded-full pl-1.5 pr-2.5 py-1 hover:border-border-strong transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 text-[11px] font-semibold text-accent flex items-center justify-center">
                    {getInitials(profile?.name)}
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-text max-w-[100px] truncate">
                    {profile?.name || user.email?.split('@')[0]}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${
                      isOfficer
                        ? 'border-warn/40 bg-warn/10 text-warn'
                        : 'border-accent/40 bg-accent/10 text-accent'
                    }`}
                  >
                    {isOfficer ? 'Officer' : 'Citizen'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl p-2 shadow-overlay z-50 text-xs">
                      <div className="p-2 border-b border-border mb-1">
                        <div className="font-semibold text-text truncate">
                          {profile?.name || 'Citizen'}
                        </div>
                        <div className="text-muted text-[11px] truncate mt-0.5">
                          {user.email}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsOnboardingOpen(true);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-surface-2 flex items-center gap-2 text-text transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-accent" />
                        <span>Run Setup Guide</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavChange?.('settings');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-surface-2 flex items-center gap-2 text-text transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-accent" />
                        <span>Privacy & Data Rights</span>
                      </button>

                      {isOfficer && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavChange?.('officer');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-surface-2 flex items-center gap-2 text-warn transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Officer Console</span>
                        </button>
                      )}

                      <div className="border-t border-border my-1" />

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-surface-2 flex items-center gap-2 text-alert transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Icon rail (desktop) */}
        <nav
          className="hidden md:flex flex-col items-center gap-1.5 w-14 bg-surface border-r border-border py-4 fixed top-14 bottom-0 z-20"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            // Officer tab: visible to all authenticated users (console itself gates access)
            if (item.officerOnly && !user) return null;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                aria-label={item.label}
                className={`relative group w-10 h-10 flex items-center justify-center rounded-[10px] transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : item.id === 'officer'
                    ? 'text-warn/80 hover:text-warn hover:bg-warn/10'
                    : 'text-muted hover:text-text hover:bg-surface-2'
                }`}
              >
                {item.icon}
                {/* Tooltip */}
                <span className="absolute left-full ml-2 px-2.5 py-1 text-xs text-text bg-surface-2 border border-border rounded-[8px] shadow-overlay whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 md:ml-14">{children}</main>

        {/* Bottom tab bar (mobile) */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-20 flex items-center justify-around h-14"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.filter((item) => !item.officerOnly || user).slice(0, 5).map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                aria-label={item.label}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-[10px] transition-colors ${
                  isActive ? 'text-accent' : 'text-muted'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};
