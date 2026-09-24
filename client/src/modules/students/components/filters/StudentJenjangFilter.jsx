import Select from '../../../../components/common/ui/Select';
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
    <Select
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
