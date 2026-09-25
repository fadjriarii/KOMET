import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { UserCheck } from 'lucide-react';

/**
 * StudentStatusFilter - Filter berdasarkan Status Keaktifan (Aktif, Lulus, Drop Out, dll)
 */
export default function StudentStatusFilter({
  value = '',
  onChange,
  options = [],
  placeholder = 'Semua Status',
  defaultValue = 'Aktif',
  disabled = false,
  className = '',
}) {
  return (
    <CheckboxSelect
      label="Status Keaktifan"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      defaultValue={defaultValue}
      icon={UserCheck}
      disabled={disabled}
      className={className}
      id="filter-status-keaktifan"
      defaultValue={['Aktif']}
    />
  );
}
