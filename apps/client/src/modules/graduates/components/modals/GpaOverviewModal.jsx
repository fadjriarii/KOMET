import { useCallback, useMemo } from 'react';
import { BookOpen, Building2, PieChart } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatDecimal } from '../../../../utils/uiHelpers';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { graduatesService } from '../../services/graduatesService';
import { useGraduateDetailResource } from '../../hooks/useGraduateDetailResource';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import GraduateDistributionChart from './GraduateDistributionChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { GPA_OVERVIEW_TABS } from './graduateTrendConfig';

const EMPTY_ITEMS = [];

export default function GpaOverviewModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(GPA_OVERVIEW_TABS, 'tren');

  const fetchIpkDetail = useCallback(
    (signal) => graduatesService.getIpkTrendDetail(filters, { signal }),
    [filters],
  );

  const {
    data: ipkData,
    isLoading,
    error,
  } = useGraduateDetailResource({
    isOpen,
    resourceKey: 'ipk-trend',
    filters,
    fetcher: fetchIpkDetail,
    errorMessage: 'Gagal memuat rincian tren IPK lulusan',
  });

  const kpis = data?.kpis || {};
  const gpaS1 = formatDecimal(kpis.averageGpaS1, 2, '0.00');
  const gpaS2 = formatDecimal(kpis.averageGpaS2, 2, '0.00');
  const ipkDetail = ipkData?.data || ipkData || {};

  const byYearS1 = ipkDetail.byYearS1 || EMPTY_ITEMS;
  const byYearS2 = ipkDetail.byYearS2 || EMPTY_ITEMS;

  const combinedTrend = useMemo(() => {
    const yearMap = {};
    byYearS1.forEach((item) => {
      yearMap[item.tahun] = {
        tahun: String(item.tahun),
        s1Gpa: item.avgIpk !== null ? Number(item.avgIpk) : null,
        s1Formatted: item.avgIpk !== null ? item.avgIpk.toFixed(2) : '-',
        s2Gpa: null,
        s2Formatted: '-',
      };
    });
    byYearS2.forEach((item) => {
      if (!yearMap[item.tahun]) {
        yearMap[item.tahun] = {
          tahun: String(item.tahun),
          s1Gpa: null,
          s1Formatted: '-',
          s2Gpa: item.avgIpk !== null ? Number(item.avgIpk) : null,
          s2Formatted: item.avgIpk !== null ? item.avgIpk.toFixed(2) : '-',
        };
      } else {
        yearMap[item.tahun].s2Gpa = item.avgIpk !== null ? Number(item.avgIpk) : null;
        yearMap[item.tahun].s2Formatted = item.avgIpk !== null ? item.avgIpk.toFixed(2) : '-';
      }
    });

    return Object.values(yearMap).sort((a, b) => a.tahun.localeCompare(b.tahun));
  }, [byYearS1, byYearS2]);

  const prodiList = ipkDetail.prodiGpaData || EMPTY_ITEMS;
  const facultyList = ipkDetail.facultyGpaData || EMPTY_ITEMS;
  const gpaBandsList = ipkDetail.gpaBandsData || EMPTY_ITEMS;

  const content = useMemo(
    () => ({
      tren: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <div className="h-56 sm:h-64 md:h-72 w-full">
            <TrendBarChart
              data={combinedTrend}
              xDataKey="tahun"
              bars={[
                {
                  dataKey: 's1Gpa',
                  name: 'IPK S1',
                  color: DIGITAL_BLUE[600],
                  labelKey: 's1Formatted',
                },
                {
                  dataKey: 's2Gpa',
                  name: 'IPK S2',
                  color: DIGITAL_BLUE[400],
                  labelKey: 's2Formatted',
                },
              ]}
              tooltipContent={
                <TrendChartTooltip
                  titleKey="tahun"
                  rows={[
                    {
                      key: 's1Gpa',
                      label: 'Rata-rata IPK S1',
                      colorClass: 'bg-digital-blue-600',
                      format: (val) => (val ? val.toFixed(2) : '-'),
                    },
                    {
                      key: 's2Gpa',
                      label: 'Rata-rata IPK S2',
                      colorClass: 'bg-digital-blue-400',
                      format: (val) => (val ? val.toFixed(2) : '-'),
                    },
                  ]}
                />
              }
            />
          </div>
        </div>
      ),
      rentang: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <GraduateDistributionChart
            items={gpaBandsList}
            dataKey="count"
            nameKey="range"
            labelKey="percentage"
            isLoading={isLoading}
            error={error}
            emptyIcon={PieChart}
            emptyTitle="Tidak Ada Data Rentang IPK"
            emptyDescription="Belum ada data distribusi rentang IPK dari backend."
            yAxisWidth={140}
            useMultiColor={true}
          />
        </div>
      ),
      prodi: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <GraduateDistributionChart
            items={prodiList}
            dataKey="gpaValue"
            nameKey="name"
            labelKey="gpaValue"
            isLoading={isLoading}
            error={error}
            emptyIcon={BookOpen}
            emptyTitle="Tidak Ada Data Program Studi"
            emptyDescription="Belum ada data capaian IPK per program studi dari backend."
            yAxisWidth={210}
          />
        </div>
      ),
      fakultas: (
        <div className="h-full flex flex-col pt-0.5 px-1">
          <GraduateDistributionChart
            items={facultyList}
            dataKey="gpaValue"
            nameKey="name"
            labelKey="gpaValue"
            isLoading={isLoading}
            error={error}
            emptyIcon={Building2}
            emptyTitle="Tidak Ada Data Fakultas"
            emptyDescription="Belum ada data capaian IPK per fakultas dari backend."
            yAxisWidth={190}
          />
        </div>
      ),
    }),
    [combinedTrend, error, facultyList, gpaBandsList, isLoading, prodiList],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Rata-rata IPK Lulusan"
      subtitle="Distribusi capaian Indeks Prestasi Kumulatif per jenjang, rentang, dan fakultas"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <div className="space-y-1.5 text-justify">
              <p>
                Rata-rata Indeks Prestasi Kumulatif (IPK) lulusan adalah{' '}
                <strong className="text-digital-blue-900 font-bold">{gpaS1} (Jenjang S1)</strong>{' '}
                dan{' '}
                <strong className="text-digital-blue-900 font-bold">{gpaS2} (Jenjang S2)</strong>{' '}
                dari skala maksimal 4.00.
              </p>
            </div>
          }
          label="Rata-rata IPK"
          value={gpaS1}
          sublabel={`S2: ${gpaS2}`}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={GPA_OVERVIEW_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
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
