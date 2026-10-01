import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { BookOpen } from 'lucide-react';

/**
 * MbkmProdiFilter - Filter berdasarkan Program Studi
 */
export default function MbkmProdiFilter({
  value = [],
  onChange,
  options = [],
  placeholder = 'Semua Program Studi',
  disabled = false,
  className = '',
}) {
  return (
    <CheckboxSelect
      label="Program Studi"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={BookOpen}
      disabled={disabled}
      className={className}
      id="mbkm-filter-prodi"
    />
  );
}
