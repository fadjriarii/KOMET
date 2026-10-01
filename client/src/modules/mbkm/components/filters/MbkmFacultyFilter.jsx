import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { Building2 } from 'lucide-react';

/**
 * MbkmFacultyFilter - Filter berdasarkan Fakultas
 */
export default function MbkmFacultyFilter({
  value = [],
  onChange,
  options = [],
  placeholder = 'Semua Fakultas',
  disabled = false,
  className = '',
}) {
  return (
    <CheckboxSelect
      label="Fakultas"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={Building2}
      disabled={disabled}
      className={className}
      id="mbkm-filter-faculty"
    />
  );
}
