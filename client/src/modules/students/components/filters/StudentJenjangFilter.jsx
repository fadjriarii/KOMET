import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { Award } from 'lucide-react';

/**
 * StudentJenjangFilter - Filter berdasarkan Jenjang Pendidikan (S1, Profesi, S2)
 */
export default function StudentJenjangFilter({
  value = '',
  onChange,
  options = [],
  placeholder = 'Semua Jenjang',
  disabled = false,
  className = '',
}) {
  return (
    <CheckboxSelect
      label="Jenjang"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={Award}
      disabled={disabled}
      className={className}
      id="filter-jenjang"
    />
  );
}
