import Input from '../../../../components/common/ui/Input';
import { Search } from 'lucide-react';

/**
 * GraduateSearchFilter - Filter Pencarian berdasarkan Identifier (NIM / Nama)
 */
export default function GraduateSearchFilter({
  value = '',
  onChange,
  onClear,
  placeholder = 'Cari berdasarkan NIM atau Nama wisudawan...',
  disabled = false,
  className = '',
}) {
  return (
    <Input
      label="Search by Identifier"
      value={value}
      onChange={onChange}
      onClear={onClear || (() => onChange?.(''))}
      placeholder={placeholder}
      icon={Search}
      isSearch={true}
      disabled={disabled}
      className={className}
    />
  );
}
