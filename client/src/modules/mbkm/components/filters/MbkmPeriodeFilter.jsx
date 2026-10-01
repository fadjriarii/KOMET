import Select from '../../../../components/common/ui/Select';
import { CalendarDays } from 'lucide-react';

/**
 * MbkmPeriodeFilter - Filter berdasarkan Periode Semester MBKM
 */
export default function MbkmPeriodeFilter({
  value = '',
  onChange,
  options = [],
  placeholder = 'Semua Periode MBKM',
  disabled = false,
  className = '',
}) {
  return (
    <Select
      label="Periode MBKM"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={CalendarDays}
      disabled={disabled}
      className={className}
      id="mbkm-filter-periode"
    />
  );
}
