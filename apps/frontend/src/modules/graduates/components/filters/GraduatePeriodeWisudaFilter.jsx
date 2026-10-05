import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { CalendarDays } from 'lucide-react';

/**
 * GraduatePeriodeWisudaFilter - Filter Periode Wisuda
 */
export default function GraduatePeriodeWisudaFilter({
  value = [],
  onChange,
  options = [],
  placeholder = 'Semua Periode Wisuda',
  disabled = false,
  className = '',
}) {
  return (
    <CheckboxSelect
      label="Periode Wisuda"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={CalendarDays}
      disabled={disabled}
      className={className}
      id="graduate-filter-periode-wisuda"
    />
  );
}
