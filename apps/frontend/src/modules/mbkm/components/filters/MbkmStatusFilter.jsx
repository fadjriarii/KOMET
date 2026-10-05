import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { UserCheck } from 'lucide-react';

/**
 * MbkmStatusFilter - Filter Status Aktivitas MBKM (Disetujui, Selesai, Diajukan, dll)
 */
export default function MbkmStatusFilter({
  value = [],
  onChange,
  options = ['Disetujui', 'Selesai', 'Diajukan'],
  placeholder = 'Semua Status Aktivitas',
  disabled = false,
  className = '',
}) {
  return (
    <CheckboxSelect
      label="Status Aktivitas"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={UserCheck}
      disabled={disabled}
      className={className}
      id="mbkm-filter-status"
    />
  );
}
