import { useCallback, useMemo } from 'react';
import { Calendar, BookOpenCheck, Users, CheckCircle2 } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTable from '../../../../components/common/modals/ModalTable';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatNumber } from '../../../../utils/uiHelpers';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { graduatesService } from '../../services/graduatesService';
import { useGraduateDetailResource } from '../../hooks/useGraduateDetailResource';
import GraduateTrendBarChart from './GraduateTrendBarChart';
import GraduateTrendChartTooltip from './GraduateTrendChartTooltip';
import { STUDY_SUCCESS_TABS } from './graduateTrendConfig';

const SUCCESS_TABLE_COLUMNS = [
  {
    key: 'cohortLabel',
    label: 'Cohort Evaluasi',
    icon: Calendar,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500" />
        <span className="font-semibold text-gray-900">{row.cohortLabel || `Angkatan ${row.angkatan || row.cohort}`}</span>
      </div>
    ),
  },
  {
    key: 'intake',
    label: 'Total Mahasiswa Masuk (Intake)',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-gray-800',
    render: (row) => `${formatNumber(row.intake || row.total)} mhs`,
  },
  {
    key: 'successCount',
    label: 'Mahasiswa Lulus',
    icon: CheckCircle2,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-digital-blue-900',
    render: (row) => (
      <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2.5 py-0.5 rounded-md border border-digital-blue-100 font-semibold">
        {formatNumber(row.successCount || row.lulus)} mhs
      </span>
    ),
  },
  {
    key: 'rateFormatted',
    label: 'Tingkat Keberhasilan',
    icon: BookOpenCheck,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-bold text-digital-blue-700',
    render: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-digital-blue-50 text-digital-blue-800 border border-digital-blue-200">
        {row.rateFormatted || (row.percentage ? `${row.percentage}%` : '0.0%')}
      </span>
    ),
  },
];

export default function StudySuccessModal({
  isOpen,
  onClose,
  originRect,
  data,
  filters,
}) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(STUDY_SUCCESS_TABS, 's1');

  const fetchSuccessDetail = useCallback(
    (signal) => graduatesService.getKeberhasilanStudiDetail(filters, { signal }),
    [filters]
  );

  const {
    data: detailData,
    isLoading,
    error,
  } = useGraduateDetailResource({
    isOpen,
    resourceKey: 'keberhasilan-studi',
    filters,
    fetcher: fetchSuccessDetail,
    errorMessage: 'Gagal memuat data keberhasilan studi',
    summaryData: data,
    summaryKey: 'keberhasilanStudi',
  });

  const kpis = data?.kpis || {};
  const summary = data?.summary || {};

  const s1Cohorts = useMemo(() => {
    return detailData?.successCohortData || detailData?.data?.s1 || [];
  }, [detailData]);

  const s2Cohorts = useMemo(() => {
    return detailData?.successCohortDataS2 || detailData?.data?.s2 || [];
  }, [detailData]);

  const content = useMemo(() => ({
    s1: (
      <div className="h-full flex flex-col pt-0.5 px-1">
        <div className="h-56 sm:h-64 md:h-72 w-full">
          <GraduateTrendBarChart
            data={s1Cohorts}
            xDataKey="cohortLabel"
            bars={[
              { dataKey: 'successCount', name: 'Mahasiswa Lulus', color: DIGITAL_BLUE[600], labelKey: 'rateFormatted' },
              { dataKey: 'intake', name: 'Total Intake Awal', color: DIGITAL_BLUE[200], labelKey: 'intake' },
            ]}
            tooltipContent={
              <GraduateTrendChartTooltip
                titleKey="cohortLabel"
                rows={[
                  { key: 'intake', label: 'Total Intake', colorClass: 'bg-digital-blue-200' },
                  { key: 'successCount', label: 'Berhasil Lulus', colorClass: 'bg-digital-blue-600' },
                ]}
                footer={{ key: 'rateFormatted', label: 'Tingkat Keberhasilan' }}
              />
            }
          />
        </div>
      </div>
    ),
    s2: (
      <div className="h-full flex flex-col pt-0.5 px-1">
        <div className="h-56 sm:h-64 md:h-72 w-full">
          <GraduateTrendBarChart
            data={s2Cohorts}
            xDataKey="cohortLabel"
            bars={[
              { dataKey: 'successCount', name: 'Mahasiswa Lulus', color: DIGITAL_BLUE[600], labelKey: 'rateFormatted' },
              { dataKey: 'intake', name: 'Total Intake Awal', color: DIGITAL_BLUE[200], labelKey: 'intake' },
            ]}
            tooltipContent={
              <GraduateTrendChartTooltip
                titleKey="cohortLabel"
                rows={[
                  { key: 'intake', label: 'Total Intake', colorClass: 'bg-digital-blue-200' },
                  { key: 'successCount', label: 'Berhasil Lulus', colorClass: 'bg-digital-blue-600' },
                ]}
                footer={{ key: 'rateFormatted', label: 'Tingkat Keberhasilan' }}
              />
            }
          />
        </div>
      </div>
    ),
    tabel: (
      <div className="h-full flex flex-col pt-0.5 pb-1">
        <ModalTable
          columns={SUCCESS_TABLE_COLUMNS}
          data={s1Cohorts}
          isLoading={isLoading}
          error={error}
          emptyTitle="Tidak Ada Data Cohort"
          emptyDescription="Belum ada data riwayat keberhasilan studi dari backend."
        />
      </div>
    ),
  }), [error, isLoading, s1Cohorts, s2Cohorts]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Keberhasilan Studi"
      subtitle="Tingkat keberhasilan penyelesaian studi dihitung pada batas masa studi maksimal (S1: 7 tahun, S2: 4 tahun)"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Tingkat keberhasilan studi jenjang S1 tercatat sebesar <strong className="text-digital-blue-900 font-bold">{kpis.studySuccessRateS1 || '0.0%'}</strong> untuk angkatan evaluasi {summary?.keberhasilanStudi?.angkatanS1 || '-'}.
              </p>
            </div>
          }
          label="Keberhasilan Studi"
          value={kpis.studySuccessRateS1 || '0.0%'}
          sublabel="Evaluasi Akhir Studi"
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav tabs={STUDY_SUCCESS_TABS} activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="flex-1 min-h-0 overflow-x-hidden w-full">
            <div key={activeTab} className={`h-full ${slideClass}`}>
              <ModalTabContent activeTab={activeTab} content={content} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
