import { AlertCircle, Globe, TrendingDown, TrendingUp, UserPlus, Users } from 'lucide-react';
import { formatKpiDisplay } from '../../../utils/uiHelpers';

/** Susunan 4 kartu KPI tab Student Data (urutan = urutan tampil). */
export function buildStudentCards({
  kpis,
  activeStudentPresentation,
  displaySubtitles,
  displayTitles,
  displayBadges,
  declineTrendStyle,
  kpiScope,
  isReady,
  openModal,
}) {
  return [
    {
      key: 'active',
      title: activeStudentPresentation.cardTitle,
      value: formatKpiDisplay(kpis.formattedActiveCount),
      subtitle: displaySubtitles.activeSubtitle,
      icon: Users,
      badge: activeStudentPresentation.cardBadge,
      onViewDetails: (event) => openModal('active', event),
      isFiltered: kpiScope.active && isReady,
    },
    {
      key: 'foreign',
      title: 'Persentase Mahasiswa Internasional',
      value: formatKpiDisplay(kpis.foreignRate),
      subtitle: displaySubtitles.foreignSubtitle,
      icon: Globe,
      badge: `Non-WNI ${activeStudentPresentation.statusLabel}`,
      onViewDetails: (event) => openModal('foreign', event),
      isFiltered: kpiScope.foreign && isReady,
    },
    {
      key: 'intake',
      title: 'Intake Mahasiswa Baru',
      value: formatKpiDisplay(kpis.intakeCohortCount),
      subtitle: displaySubtitles.intakeSubtitle,
      icon: UserPlus,
      badge: 'Mhs Semester 1',
      onViewDetails: (event) => openModal('intake', event),
      isFiltered: kpiScope.intake && isReady,
    },
    {
      key: 'decline',
      title: displayTitles.declineTitle,
      value: kpis.declineAvg,
      subtitle: displaySubtitles.declineSubtitle,
      icon:
        kpis.hasEnoughDeclineData === false
          ? AlertCircle
          : kpis.isFluctuationPositive
            ? TrendingUp
            : TrendingDown,
      valueClassName: declineTrendStyle.textClass,
      badge: displayBadges.declineBadge,
      onViewDetails: (event) => openModal('decline', event),
      isFiltered: kpiScope.decline && isReady,
    },
  ];
}
