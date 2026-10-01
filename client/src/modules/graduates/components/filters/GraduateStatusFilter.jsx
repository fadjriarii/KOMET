import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { UserCheck } from 'lucide-react';

/**
 * GraduateStatusFilter - Filter Status Kelulusan (Lulus, dll)
 */
export default function GraduateStatusFilter({
  value = [],
  onChange,
  options = [],
  placeholder = 'Semua Status',
  disabled = false,
  className = '',
}) {
  return (
    <CheckboxSelect
      label="Status Kelulusan"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={UserCheck}
      disabled={disabled}
      className={className}
      id="graduate-filter-status-kelulusan"
    />
  );
}
