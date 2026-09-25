import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { Building2 } from 'lucide-react';

/**
 * StudentFacultyFilter - Filter berdasarkan Fakultas
 * Dropdown select dengan daftar fakultas dari response backend.
 */
export default function StudentFacultyFilter({
  value = '',
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
    />
  );
}
