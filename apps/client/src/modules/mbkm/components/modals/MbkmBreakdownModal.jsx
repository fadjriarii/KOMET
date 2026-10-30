import { useMemo } from 'react';
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Layers,
  Users,
} from 'lucide-react';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { tabsWithData } from '../../../../components/common/modals/tabsWithData';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { useDetail } from '../../mbkmQueries';
import {
  activityName,
  jenisSubtitle,
  mitraSubtitle,
  participationSubtitle,
  scopeSentence,
  tableOnlyClause,
  totalSubtitle,
} from '../../hooks/useMbkmKpiDisplay';

const EMPTY = [];

/** Ikon tab per kunci breakdown; kunci baru dari server memakai ikon umum. */
const TAB_ICONS = {
  fakultas: Building2,
  prodi: BookOpen,
  angkatan: GraduationCap,
  tahunAjaran: CalendarDays,
  jenis: Briefcase,
  status: CheckCircle2,
  mitra: Building2,
  semester: Layers,
  belum: Users,
};

/** Isi tetap per kartu: endpoint, judul, dan cara membaca nilai banner. */
const CARD_DETAILS = {
  participation: {
    method: 'getParticipationDetail',
    title: 'Rincian Partisipasi MBKM Semester 7',
    subtitle: 'Tingkat partisipasi mahasiswa aktif semester 7 per kelompok dan per tahun ajaran',
    label: 'Partisipasi Semester 7',
    sublabel: 'Mengikuti MBKM',
    value: (card) => formatPercentage(card.value, 1),
    describe: (card, filters) => participationSubtitle(card, activityName(filters?.jenisAktivitas)),
  },
  total: {
    method: 'getTotalDetail',
    title: 'Rincian Total Mahasiswa MBKM',
    subtitle:
      'Mahasiswa semua semester yang mengikuti MBKM per semester, program studi, dan angkatan',
    label: 'Total Mahasiswa MBKM',
    sublabel: 'Semua semester',
    value: (card) => formatNumber(card.value),
    describe: totalSubtitle,
  },
  mitra: {
    method: 'getMitraDetail',
    title: 'Rincian Mitra MBKM',
    subtitle: 'Mitra dari aktivitas Disetujui dan Selesai pada periode terpilih',
    label: 'Mitra MBKM',
    sublabel: 'Mitra unik',
    value: (card) => formatNumber(card.value),
    describe: mitraSubtitle,
  },
  jenis: {
    method: 'getJenisDetail',
    title: 'Rincian Bentuk Kegiatan MBKM',
    subtitle: 'Mahasiswa per jenis kegiatan; satu mahasiswa bisa mengikuti lebih dari satu jenis',
    label: 'Bentuk Kegiatan',
    sublabel: 'Jenis kegiatan',
    value: (card) => formatNumber(card.value),
    describe: jenisSubtitle,
  },
};

/** Tabel tingkat per grup: 0% tetap terlihat, karena itu sinyal yang dicari. */
const RATE_COLUMNS = [
  { key: 'name', label: 'Kelompok', icon: Layers },
  {
    key: 'count',
    label: 'Partisipan',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row) => formatNumber(row.count),
  },
  {
    key: 'total',
    label: 'Dari',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row) => formatNumber(row.total),
  },
  {
    key: 'percentage',
    label: 'Tingkat',
    icon: Award,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-bold text-gray-900',
    render: (row) => formatPercentage(row.percentage, 1),
  },
];

function BreakdownContent({ breakdown, isLoading, error }) {
  const items = breakdown?.items || EMPTY;
  if (breakdown?.kind === 'rate') {
    return (
      <div className="h-full flex flex-col pt-0.5 pb-1">
        <ModalTable
          columns={RATE_COLUMNS}
          data={items}
          isLoading={isLoading}
          error={error}
          emptyTitle="Tidak Ada Data"
          emptyDescription="Tidak ada mahasiswa pada kombinasi filter ini."
        />
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col pt-0.5 px-1">
      <DistributionChart
        items={items}
        countUnit="mahasiswa"
        dataKey="count"
        nameKey="name"
        labelKey="percentage"
        isLoading={isLoading}
        error={error}
        emptyIcon={TAB_ICONS[breakdown?.key] || BarChart3}
        emptyTitle="Tidak Ada Data"
        emptyDescription="Tidak ada mahasiswa pada kombinasi filter ini."
        yAxisWidth={220}
      />
    </div>
  );
}

/**
 * Popup satu kartu MBKM. Tab, urutan, dan isinya datang dari server
 * (`breakdowns`); tab berisi ≤ 1 kategori disembunyikan (`tabsWithData`).
 */
export default function MbkmBreakdownModal({ cardKey, isOpen, onClose, originRect, filters }) {
  const config = CARD_DETAILS[cardKey];
  const { data, isLoading, error } = useDetail({
    isOpen,
    resourceKey: `card-${cardKey}`,
    filters,
    method: config.method,
    errorMessage: 'Gagal memuat rincian MBKM',
  });

  const breakdowns = data?.breakdowns || EMPTY;
  const tabs = useMemo(() => {
    const all = breakdowns.map((b) => ({
      key: b.key,
      label: b.label,
      icon: TAB_ICONS[b.key] || BarChart3,
    }));
    // Grup tingkat dengan 0 partisipan tetap kategori berdata (eligible-nya ada).
    const itemsByTab = Object.fromEntries(
      breakdowns.map((b) => [
        b.key,
        b.kind === 'rate' ? b.items.map((item) => ({ count: item.total })) : b.items,
      ]),
    );
    return tabsWithData(all, itemsByTab, { isLoading });
  }, [breakdowns, isLoading]);
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, tabs[0]?.key);

  const content = useMemo(
    () =>
      Object.fromEntries(
        breakdowns.map((breakdown) => [
          breakdown.key,
          <BreakdownContent
            key={breakdown.key}
            breakdown={breakdown}
            isLoading={isLoading}
            error={error}
          />,
        ]),
      ),
    [breakdowns, isLoading, error],
  );

  const card = data?.card || {};
  // Banner = kalimat kartunya + cakupan + filter yang hanya untuk tabel (ADR 0007).
  // `filters` memakai nama param URL (`faculty`, `prodi`, `search`, ...).
  const bannerText = isLoading
    ? 'Memuat rincian...'
    : `${scopeSentence(filters, data?.periodLabel)}${config.describe(card, filters)}${tableOnlyClause(filters)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      subtitle={config.subtitle}
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={<p className="text-left sm:text-justify">{bannerText}</p>}
          label={config.label}
          value={isLoading ? '-' : config.value(card)}
          sublabel={config.sublabel}
        />

        <div className="flex-1 flex flex-col min-h-0">
          {tabs.length > 0 && (
            <ModalTabNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
          )}
          <div className="flex-1 min-h-0 overflow-x-hidden w-full">
            <div key={activeTab} className={`h-full ${slideClass}`}>
              {tabs.length > 0 ? (
                <ModalTabContent activeTab={activeTab} content={content} />
              ) : (
                <BreakdownContent isLoading={isLoading} error={error} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
