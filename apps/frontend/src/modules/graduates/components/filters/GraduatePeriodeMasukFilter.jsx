import Select from '../../../../components/common/ui/Select';
import { Calendar } from 'lucide-react';

/**
 * GraduatePeriodeMasukFilter - Filter Periode Masuk / Angkatan Asal
 */
export default function GraduatePeriodeMasukFilter({
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
      icon={Calendar}
      disabled={disabled}
      className={className}
      id="graduate-filter-periode-masuk"
    />
  );
}
