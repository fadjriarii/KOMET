import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { Award } from 'lucide-react';

/**
 * MbkmJenjangFilter - Filter berdasarkan Jenjang (S1, S2)
 */
export default function MbkmJenjangFilter({
  value = [],
  onChange,
  options = ['S1', 'S2'],
  placeholder = 'Semua Jenjang',
  disabled = false,
  className = '',
}) {
  return (
    <CheckboxSelect
      label="Jenjang"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={Award}
      disabled={disabled}
      className={className}
      id="mbkm-filter-jenjang"
    />
  );
}
