import Select from '../../../../components/common/ui/Select';
import { Flag } from 'lucide-react';

/**
 * StudentNationalityFilter - Filter berdasarkan Kewarganegaraan (WNI / WNA)
 */
export default function StudentNationalityFilter({
  value = '',
  onChange,
  options = [],
  placeholder = 'Semua Kewarganegaraan',
  disabled = false,
  className = '',
}) {
  return (
    <Select
      label="Kewarganegaraan"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={Flag}
      disabled={disabled}
      className={className}
      id="filter-kewarganegaraan"
    />
  );
}
