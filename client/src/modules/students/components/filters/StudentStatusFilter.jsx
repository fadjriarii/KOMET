import Select from '../../../../components/common/ui/Select';
import { UserCheck } from 'lucide-react';

/**
 * StudentStatusFilter - Filter berdasarkan Status Keaktifan (Aktif, Lulus, Drop Out, dll)
 */
export default function StudentStatusFilter({
  value = '',
  onChange,
  options = [],
  placeholder = 'Semua Status',
  disabled = false,
  className = '',
}) {
  return (
    <Select
      label="Status Keaktifan"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={UserCheck}
      disabled={disabled}
      className={className}
      id="filter-status-keaktifan"
    />
  );
}
