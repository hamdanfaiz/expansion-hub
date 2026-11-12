import React from 'react';
import {
  Globe,
  Building2,
  CalendarCheck,
  FileText,
  GraduationCap,
  BarChart3,
  Settings,
  LayoutDashboard,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavigationModule } from '../../types';
import { getOverdueCount } from '../../utils/pipeline';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: NavigationModule;
  label: string;
  subLabel: string;
  icon: React.ElementType;
  count?: number;
  badge?: string;
  badgeColor?: string;
  isComingSoon?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    authUser,
    logout,
    activeTab,
    setActiveTab,
    markets,
    partners,
    activities,
    agreements,
    trainings,
    setViewingMarketId,
    setViewingPartnerId,
    setViewingAgreementId,
    language,
    t,
  } = useApp();

  const overdueCount = getOverdueCount(activities);

  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    try { return localStorage.getItem("ibd-sidebar-mini") === "true"; } catch { return false; }
  });

  React.useEffect(() => {
    try { localStorage.setItem("ibd-sidebar-mini", String(isCollapsed)); } catch { /* local storage is optional */ }
  }, [isCollapsed]);

  const handleNavClick = (tab: NavigationModule) => {
    setActiveTab(tab);
    setViewingMarketId(null);
    setViewingPartnerId(null);
    setViewingAgreementId(null);
    onClose();
  };

  const navGroups: NavGroup[] = [
    {
      title: t('nav.group.marketExpansion', 'Ekspansi Pasar'),
      items: [
        {
          id: 'overview' as NavigationModule,
          label: t('nav.overview', 'Overview'),
          subLabel: t('nav.overview.sub', 'Ringkasan Eksekutif'),
          icon: LayoutDashboard,
        },
        {
          id: 'markets' as NavigationModule,
          label: t('nav.markets', 'Markets'),
          subLabel: t('nav.markets.sub', 'Pasar Internasional'),
          icon: Globe,
          count: markets.length,
        },
        {
          id: 'partners' as NavigationModule,
          label: t('nav.partners', 'Partners'),
          subLabel: t('nav.partners.sub', 'Pipeline Distributor'),
          icon: Building2,
          count: partners.length,
        },
        {
          id: 'activities' as NavigationModule,
          label: t('nav.activities', 'Activities'),
          subLabel: t('nav.activities.sub', 'Jadwal & Follow-up'),
          icon: CalendarCheck,
          badge: overdueCount > 0 ? `${overdueCount} overdue` : undefined,
          badgeColor: 'bg-rose-100 text-rose-700 border border-rose-200',
        },
      ],
    },
    {
      title: t('nav.group.commercial', 'Komersial'),
      items: [
        {
          id: 'agreements' as NavigationModule,
          label: t('nav.agreements', 'Agreements'),
          subLabel: t('nav.agreements.sub', 'Perjanjian Distributor'),
          icon: FileText,
          count: agreements.length,
        },
      ],
    },
    {
      title: t('nav.group.enablement', 'Enablement'),
      items: [
        {
          id: 'training' as NavigationModule,
          label: t('nav.training', 'Training'),
          subLabel: t('nav.training.sub', 'Pelatihan & Sertifikasi'),
          icon: GraduationCap,
          count: trainings.length,
        },
      ],
    },
    {
      title: t('nav.group.insights', 'Insights'),
      items: [
        {
          id: 'reports' as NavigationModule,
          label: t('nav.reports', 'Reports'),
          subLabel: t('nav.reports.sub', 'Analitik & Pertumbuhan'),
          icon: BarChart3,
        },
      ],
    },
    {
      title: t('nav.group.settings', 'Settings'),
      items: [
        {
          id: 'settings' as NavigationModule,
          label: t('nav.settings', 'Settings'),
          subLabel: t('nav.settings.sub', 'Master Data & Akses'),
          icon: Settings,
        },
      ],
    },
  ];

  const userInitials = React.useMemo(() => {
    const name = authUser?.displayName || 'Budi Santoso';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }, [authUser]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside data-sidebar-mini={isCollapsed}
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 bg-gradient-to-b from-white to-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm ring-1 ring-black/5">
              <Globe className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workspace
              </span>
              <span className="text-sm font-extrabold tracking-tight text-slate-900">
                Partner Hub
              </span>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200/80 shadow-2xs">
            IBD Team
          </span>
        </div>

        <div className="hidden lg:flex items-center justify-end px-3 pb-1">
          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            aria-label={isCollapsed ? (language === 'en' ? "Expand sidebar" : "Perluas sidebar") : (language === 'en' ? "Collapse sidebar" : "Ciutkan sidebar")}
            title={isCollapsed ? (language === 'en' ? "Expand sidebar" : "Perluas sidebar") : (language === 'en' ? "Collapse sidebar" : "Ciutkan sidebar")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isCollapsed ? "" : "rotate-180"}`} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      aria-label={item.label}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => handleNavClick(item.id)}
                      className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-sm font-semibold ring-1 ring-black/10'
                          : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-indigo-400'
                              : 'text-slate-500 group-hover:text-slate-700'
                          }`}
                        />
                        <div className="truncate text-left">
                          <span className="block truncate font-semibold">{item.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.count !== undefined && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                              isActive
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                        {item.badge && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.isComingSoon && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              isActive
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            Soon
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Operational Context Footer */}
        <div className="border-t border-slate-200 p-3 bg-slate-50/70">
          <LanguageSwitcher variant="sidebar" className="mb-2.5" />
          <div className="flex items-center justify-between gap-2 rounded-md p-2 bg-white border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900 leading-tight">
                  {authUser?.displayName || 'Budi Santoso'}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {authUser?.role || 'Lead International BD'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              title={language === 'en' ? 'Sign Out' : 'Keluar'}
              aria-label={language === 'en' ? 'Sign Out' : 'Keluar'}
              className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700 transition shrink-0 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-500">
            <span>Global Partner Expansion Hub</span>
            <span className="text-slate-400 font-mono">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
