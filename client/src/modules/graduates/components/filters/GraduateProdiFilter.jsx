import CheckboxSelect from '../../../../components/common/ui/CheckboxSelect';
import { BookOpen } from 'lucide-react';

/**
 * GraduateProdiFilter - Filter berdasarkan Program Studi Lulusan
 */
export default function GraduateProdiFilter({
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
      id="graduate-filter-prodi"
    />
  );
}
