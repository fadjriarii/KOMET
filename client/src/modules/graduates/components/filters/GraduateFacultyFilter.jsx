import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { Building2 } from 'lucide-react';

/**
 * GraduateFacultyFilter - Filter berdasarkan Fakultas Lulusan
 */
export default function GraduateFacultyFilter({
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
      id="graduate-filter-faculty"
    />
  );
}
