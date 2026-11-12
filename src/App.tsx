import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { DashboardView } from './components/dashboard/DashboardView';
import { MarketsView } from './components/markets/MarketsView';
import { PartnersView } from './components/partners/PartnersView';
import { ActivitiesView } from './components/activities/ActivitiesView';
import { AgreementsView } from './components/agreements/AgreementsView';
import { ComingSoonView } from './components/common/ComingSoonView';
import { MarketModal } from './components/modals/MarketModal';
import { PartnerModal } from './components/modals/PartnerModal';
import { ActivityModal } from './components/modals/ActivityModal';
import { AgreementModal } from './components/modals/AgreementModal';
import { TrainingView } from './training/TrainingView.tsx';
import { ReportsView } from './reports/ReportsView.tsx';
import { SettingsView } from './settings/SettingsView.tsx';
import { ResetConfirmModal } from './components/modals/ResetConfirmModal';
import { LoginView } from './components/auth/LoginView';

const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeTab, authUser, isAuthChecking, language } = useApp();

  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-600 font-sans">
        <div className="text-xs font-medium">
          {language === 'en' ? 'Verifying workspace session...' : 'Memverifikasi sesi workspace...'}
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardView />;
      case 'markets':
        return <MarketsView />;
      case 'partners':
        return <PartnersView />;
      case 'activities':
        return <ActivitiesView />;
      case 'agreements':
        return <AgreementsView />;
      case 'training':
        return <TrainingView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Persistent left sidebar (collapsible on mobile) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{renderActiveView()}</div>
        </main>
      </div>

      {/* Global Modals */}
      <MarketModal />
      <PartnerModal />
      <ActivityModal />
      <AgreementModal />
      <ResetConfirmModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
