import React from 'react';
import {
  FileText,
  GraduationCap,
  BarChart3,
  Settings,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavigationModule } from '../../types';

interface ComingSoonViewProps {
  module: NavigationModule;
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({ module }) => {
  const { setActiveTab, language } = useApp();

  const isEn = language === 'en';

  const moduleConfigs: Record<
    string,
    {
      title: string;
      subTitle: string;
      icon: React.ElementType;
      badge: string;
      description: string;
      plannedFeatures: { title: string; desc: string }[];
    }
  > = {
    agreements: {
      title: isEn ? 'Distribution Agreements' : 'Perjanjian Distribusi (Agreements)',
      subTitle: isEn ? 'Commercial Contracts & Legal Tracking' : 'Modul Kontrak Komersial & Legalitas',
      icon: FileText,
      badge: isEn ? 'Roadmap Phase 2' : 'Fase 2 Roadmap',
      description: isEn
        ? 'Export contract repository, clause cycle management (MoQ, payment terms, exclusive territories), and distributor agreement expiry tracking.'
        : 'Sistem repositori kontrak ekspor, manajemen siklus klausul (MoQ, terms of payment, wilayah teritorial eksklusif), dan pelacakan masa berlaku perjanjian distributor.',
      plannedFeatures: [
        {
          title: isEn ? 'ICC & Incoterms Standard Distribution Templates' : 'Template Kontrak Distribusi Standar ICC & Incoterms',
          desc: isEn
            ? 'Bilingual contract draft generator integrated with international trade law parameters.'
            : 'Generator draf perjanjian bilingual (EN/ID) terintegrasi parameter hukum dagang internasional.',
        },
        {
          title: isEn ? 'Automated Renewal Alerts' : 'Notifikasi Otomatis Perpanjangan Kontrak',
          desc: isEn
            ? 'Periodic alerts at 90, 60, and 30 days before partner contracts expire.'
            : 'Pengingat berkala 90, 60, dan 30 hari sebelum kontrak distributor jatuh tempo.',
        },
        {
          title: isEn ? 'Minimum Order Quantity (MoQ) Clause Tracking' : 'Monitoring Klausul Minimum Order Quantity (MoQ)',
          desc: isEn
            ? 'Tracking fulfillment of commercial partner purchase commitments.'
            : 'Pelacakan realisasi pemenuhan target pembelian berkala mitra komersial.',
        },
      ],
    },
    training: {
      title: isEn ? 'Training & Certification' : 'Pelatihan & Sertifikasi (Training)',
      subTitle: isEn ? 'Partner Enablement & Onboarding' : 'Modul Partner Enablement & Onboarding',
      icon: GraduationCap,
      badge: isEn ? 'Roadmap Phase 2' : 'Fase 2 Roadmap',
      description: isEn
        ? 'Training curriculum hub for international distributor teams: brand guidelines, technical product knowledge, warranty claim procedures, and periodic certification exams.'
        : 'Pusat kurikulum pelatihan untuk tim distributor asing: brand guidelines, product knowledge teknis, tata cara klaim garansi, dan ujian sertifikasi berkala.',
      plannedFeatures: [
        {
          title: isEn ? 'Country-Specific Onboarding Curriculum' : 'Kurikulum Onboarding Terstruktur per Negara',
          desc: isEn
            ? 'Interactive video modules and localized sales handbooks.'
            : 'Modul video interaktif dan handbook penjualan terlokalisasi dalam berbagai bahasa.',
        },
        {
          title: isEn ? 'Distributor Competency Badges & Certificates' : 'Badge & Sertifikat Kompetensi Distributor',
          desc: isEn
            ? 'Validation of technical and sales readiness for partner teams.'
            : 'Validasi kemampuan teknis perwakilan penjualan mitra di pasar tujuan.',
        },
        {
          title: isEn ? 'Marketing Assets & Regulatory Documents' : 'Katalog Aset Pemasaran & Dokumen Regulasi',
          desc: isEn
            ? 'Direct downloads of brochures, high-res assets, and current compliance certificates.'
            : 'Download langsung flyer, high-res assets, dan sertifikat halal/ISO terkini.',
        },
      ],
    },
    reports: {
      title: isEn ? 'Reports & Analytics' : 'Laporan & Analitik (Reports)',
      subTitle: isEn ? 'Market Performance & Export Growth Analytics' : 'Modul Analisis Kinerja Pasar & Pertumbuhan Ekspor',
      icon: BarChart3,
      badge: isEn ? 'Roadmap Phase 2' : 'Fase 2 Roadmap',
      description: isEn
        ? 'Comprehensive analytics of sales performance by geographic region, pipeline conversion rates, and annual target deviations.'
        : 'Analisis komprehensif performa penjualan per wilayah geografis, konversi pipeline dari prospek ke distributor resmi, serta deviasi target tahunan.',
      plannedFeatures: [
        {
          title: isEn ? 'Pipeline Stage Conversion Matrix' : 'Matriks Konversi Pipeline Stage',
          desc: isEn
            ? 'Visual representation of negotiation win rates and due diligence bottlenecks.'
            : 'Visualisasi rasio keberhasilan negosiasi dan titik hambatan due diligence.',
        },
        {
          title: isEn ? 'Regional Market Penetration Reports' : 'Laporan Penetrasi Pasar per Region',
          desc: isEn
            ? 'Growth comparisons across ASEAN, Middle East, and European corridors.'
            : 'Perbandingan pertumbuhan volume ekspor ASEAN vs Timur Tengah vs Eropa.',
        },
        {
          title: isEn ? 'Data Export to Excel / PDF' : 'Export Data ke Excel / PDF',
          desc: isEn
            ? 'Instant executive reporting for monthly management reviews.'
            : 'Pembuatan executive report instan untuk rapat dewan direksi bulanan.',
        },
      ],
    },
    settings: {
      title: isEn ? 'System Settings & Master Data' : 'Pengaturan Sistem & Master Data (Settings)',
      subTitle: isEn ? 'Workspace & Access Configuration' : 'Konfigurasi Parameter Workspace & Akses',
      icon: Settings,
      badge: isEn ? 'Roadmap Phase 2' : 'Fase 2 Roadmap',
      description: isEn
        ? 'Configure distributor scorecard weighting, custom regional zones, and user permission models.'
        : 'Pengaturan parameter bobot evaluasi scorecard distributor, penambahan wilayah regional kustom, serta pengaturan hak akses pengguna.',
      plannedFeatures: [
        {
          title: isEn ? 'Scorecard Weighting Configuration' : 'Konfigurasi Bobot Scorecard Mitra',
          desc: isEn
            ? 'Adjust weighting for financial health, logistics reach, and market reputation.'
            : 'Penyesuaian persentase penilaian finansial, logistik, dan reputasi pasar.',
        },
        {
          title: isEn ? 'Regional Master Data & Product Segments' : 'Master Data Wilayah & Segmen Produk',
          desc: isEn
            ? 'Flexibility to define custom economic zones and product verticals.'
            : 'Fleksibilitas menambah target zona ekonomi khusus dan lini komoditas baru.',
        },
        {
          title: isEn ? 'Audit Logs & Change History' : 'Audit Log & Riwayat Perubahan Data',
          desc: isEn
            ? 'Complete logging of status transitions and ownership changes.'
            : 'Pencatatan lengkap aktivitas perubahan status dan owner data oleh tim.',
        },
      ],
    },
  };

  const current = moduleConfigs[module] || moduleConfigs.agreements;
  const Icon = current.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              {current.badge}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {isEn ? 'Module in Development' : 'Modul Dalam Pengembangan'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {current.title}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">{current.subTitle}</p>
        </div>

        <button
          onClick={() => setActiveTab('overview')}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition self-start sm:self-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{isEn ? 'Back to Overview' : 'Kembali ke Overview'}</span>
        </button>
      </div>

      {/* Hero preview card */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center max-w-2xl mx-auto shadow-2xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 text-indigo-600 shadow-sm mb-4">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          {isEn ? `${current.title} Feature Coming Soon` : `Fitur ${current.title} Segera Hadir`}
        </h2>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
          {current.description}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200 shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-amber-500" /> {isEn ? 'Architecture in design' : 'Sedang dalam perancangan arsitektur'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> {isEn ? 'Next release cycle' : 'Rilis iterasi berikutnya'}
          </span>
        </div>
      </div>

      {/* Planned Feature Cards */}
      <div className="mt-8 max-w-4xl mx-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {isEn ? 'Planned Module Capabilities' : 'Rencana Kemampuan Fitur Pada Modul Ini'}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {current.plannedFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <h4 className="text-xs font-bold text-slate-800 leading-snug">{feat.title}</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pl-6">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
