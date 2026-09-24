import Select from '../../../../components/common/ui/Select';
import { BookOpen } from 'lucide-react';

/**
 * StudentProdiFilter - Filter berdasarkan Program Studi
 * Dropdown select dengan daftar program studi dari response backend.
 */
export default function StudentProdiFilter({
  value = '',
  onChange,
  options = [],
  placeholder = 'Semua Program Studi',
  disabled = false,
  className = '',
}) {
  return (
    <Select
      label="Program Studi"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={BookOpen}
      disabled={disabled}
      className={className}
    />
  );
}
