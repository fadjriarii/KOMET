import Select from '../../../../components/common/ui/Select';
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
    <Select
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
