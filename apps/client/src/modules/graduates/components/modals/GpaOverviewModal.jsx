import { useMemo } from 'react';
import { BookOpen, Building2, PieChart } from 'lucide-react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import { formatDecimal } from '@komet/shared/formatters';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { useDetail } from '../../graduateQueries';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { GPA_OVERVIEW_TABS } from './graduateTrendConfig';

const EMPTY_ITEMS = [];

export default function GpaOverviewModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(GPA_OVERVIEW_TABS, 'tren');

  const {
    data: ipkData,
    isLoading,
    error,
  } = useDetail({
    isOpen,
    resourceKey: 'ipk-trend',
    filters,
    method: 'getIpkTrendDetail',
    errorMessage: 'Gagal memuat rincian tren IPK lulusan',
  });

  const kpis = data?.kpis || {};
  const gpaS1 = formatDecimal(kpis.averageGpaS1, 2, '0.00');
  const gpaS2 = formatDecimal(kpis.averageGpaS2, 2, '0.00');
  const ipkDetail = ipkData || {};

  // Server sudah mengirim satu deret per tahun untuk kedua jenjang, terurut naik.
  const combinedTrend = ipkDetail.byYear || EMPTY_ITEMS;

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
                  dataKey: 's1AvgIpk',
                  name: 'IPK S1',
                  color: DIGITAL_BLUE[600],
                  labelKey: 's1AvgIpk',
                  labelFormatter: (value) => formatDecimal(value, 2),
                },
                {
                  dataKey: 's2AvgIpk',
                  name: 'IPK S2',
                  color: DIGITAL_BLUE[400],
                  labelKey: 's2AvgIpk',
                  labelFormatter: (value) => formatDecimal(value, 2),
                },
              ]}
              tooltipContent={
                <TrendChartTooltip
                  titleKey="tahun"
                  rows={[
                    {
                      key: 's1AvgIpk',
                      label: 'Rata-rata IPK S1',
                      colorClass: 'bg-digital-blue-600',
                      format: (val) => formatDecimal(val, 2),
                    },
                    {
                      key: 's2AvgIpk',
                      label: 'Rata-rata IPK S2',
                      colorClass: 'bg-digital-blue-400',
                      format: (val) => formatDecimal(val, 2),
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
          <DistributionChart
            items={gpaBandsList}
            countUnit="lulusan"
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
          <DistributionChart
            items={prodiList}
            countUnit="lulusan"
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
          <DistributionChart
            items={facultyList}
            countUnit="lulusan"
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
