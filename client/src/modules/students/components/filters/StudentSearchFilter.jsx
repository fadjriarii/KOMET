import Input from '../../../../components/common/ui/Input';
import { Search } from 'lucide-react';

/**
 * StudentSearchFilter - Filter Pencarian berdasarkan Identifier (NIM / Nama / ID)
 * Label teks di atas dan kolom search input di bawahnya.
 */
export default function StudentSearchFilter({
  value = '',
  onChange,
  onClear,
  placeholder = 'Cari berdasarkan NIM atau Nama...',
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
