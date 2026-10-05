import Select from '../../../../components/common/ui/Select';
import { CalendarDays } from 'lucide-react';

/**
 * StudentPeriodeFilter - Filter berdasarkan Periode Masuk (20261, 20252, dll)
 */
export default function StudentPeriodeFilter({
  value = '',
  onChange,
  options = [],
  placeholder = 'Semua Periode Masuk',
  disabled = false,
  className = '',
}) {
  return (
    <Select
      label="Periode Masuk"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={CalendarDays}
      disabled={disabled}
      className={className}
      id="filter-periode-masuk"
    />
  );
}
