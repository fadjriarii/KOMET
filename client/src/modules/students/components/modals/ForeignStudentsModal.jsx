import { useCallback, useMemo } from 'react';
import { Calendar, Globe, Percent, Users } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber, getCurrentAcademicYear, reverseTrendData } from '../../../../utils/uiHelpers';
import { studentsService } from '../../services/studentsService';
import { useStudentDetailResource } from '../../hooks/useStudentDetailResource';
import ForeignTrendComposedChart from './ForeignTrendComposedChart';
import { TREND_TABS } from './studentTrendConfig';

const FOREIGN_TABLE_COLUMNS = [
  { key: 'academicYear', label: 'Tahun Akademik', icon: Calendar, render: (row) => <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500" /><span className="font-semibold text-gray-900">{row.academicYear}</span></div> },
  { key: 'foreignCount', label: 'Mahasiswa Asing (Non-WNI)', icon: Globe, headerClassName: 'text-right', cellClassName: 'text-right', render: (row) => <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2 py-0.5 rounded-md border border-digital-blue-100 font-medium">{formatNumber(row.foreignCount)} mhs</span> },
  { key: 'totalCount', label: 'Total Mahasiswa Aktif', icon: Users, headerClassName: 'text-right', cellClassName: 'text-right font-medium text-gray-800', render: (row) => `${formatNumber(row.rawTotal)} mhs` },
  { key: 'percentage', label: 'Persentase Mahasiswa Asing', icon: Percent, headerClassName: 'text-right', cellClassName: 'text-right', render: (row) => <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-digital-blue-100/70 text-digital-blue-800 border border-digital-blue-200 shadow-2xs">{row.percentage}</span> },
];

export default function ForeignStudentsModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(TREND_TABS, 'chart');
  const fetchInternationalDetail = useCallback((signal) => studentsService.getInternationalDetail(filters, { signal }), [filters]);
  const { data: detailData, isLoading, error } = useStudentDetailResource({ isOpen, resourceKey: 'foreign', filters, fetcher: fetchInternationalDetail, errorMessage: 'Gagal memuat data mahasiswa asing' });
  const kpis = data?.kpis || {};
  const trendData = useMemo(
    () => detailData?.trendData || data?.summary?.internationalStudentsTrend?.trend || [],
    [data, detailData]
  );
  const content = useMemo(() => ({
    chart: <div className="h-full flex flex-col pt-0.5 px-1"><ForeignTrendComposedChart data={trendData} isLoading={isLoading} error={error} /></div>,
    table: <div className="h-full flex flex-col pt-0.5 pb-1"><ModalTable columns={FOREIGN_TABLE_COLUMNS} data={reverseTrendData(trendData)} isLoading={isLoading} error={error} emptyTitle="Tidak Ada Data Riwayat" emptyDescription="Belum ada data riwayat mahasiswa asing dari backend." /></div>,
  }), [error, isLoading, trendData]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rincian Mahasiswa Asing (Non-WNI)" subtitle="Distribusi dan tren rasio mahasiswa berkewarganegaraan asing" maxWidth="max-w-4xl" originRect={originRect} showCloseButton>
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner description={<div className="space-y-1.5 text-justify"><p>Persentase mahasiswa asing ({kpis.foreignRate}) dihitung berdasarkan rasio total mahasiswa berkewarganegaraan Non-WNI yang berstatus aktif ({kpis.formattedForeignCount} mahasiswa) terhadap keseluruhan total student body aktif ({kpis.formattedActiveCount} mahasiswa) pada tahun ajaran {filters?.tahunAjaran || getCurrentAcademicYear()}.</p><div className="flex flex-wrap items-center gap-1.5 pt-0.5"><span className="font-bold text-digital-blue-900 text-[11px] uppercase tracking-wider">Rumus:</span><code className="px-2.5 py-0.5 rounded-md bg-white/95 border border-digital-blue-200/90 text-digital-blue-900 font-mono font-bold text-[11px] shadow-2xs">(Jumlah Mahasiswa Non-WNI Aktif / Total Student Body Aktif) × 100%</code></div></div>} label="Mahasiswa Asing" value={kpis.foreignRate} sublabel={`${kpis.formattedActiveCount} Total Mahasiswa`} />
        <div className="flex-1 flex flex-col min-h-0"><ModalTabNav tabs={TREND_TABS} activeTab={activeTab} onTabChange={handleTabChange} /><div className="flex-1 min-h-0 overflow-x-hidden w-full"><div key={activeTab} className={`h-full ${slideClass}`}><ModalTabContent activeTab={activeTab} content={content} /></div></div></div>
      </div>
    </Modal>
  );
}
