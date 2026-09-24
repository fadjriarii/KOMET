import Select from '../../../../components/common/ui/Select';
import { Layers } from 'lucide-react';

/**
 * StudentSemesterFilter - Filter berdasarkan Semester Mahasiswa (1 - 14)
 */
export default function StudentSemesterFilter({
  value = '',
  onChange,
  options = [],
  placeholder = 'Semua Semester',
  disabled = false,
  className = '',
}) {
  return (
    <Select
      label="Semester"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={Layers}
      disabled={disabled}
      className={className}
      id="filter-semester"
    />
  );
}
