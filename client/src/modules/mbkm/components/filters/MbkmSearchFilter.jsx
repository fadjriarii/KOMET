import Input from '../../../../components/common/ui/Input';
import { Search } from 'lucide-react';

/**
 * MbkmSearchFilter - Filter Pencarian berdasarkan Identifier (NIM / Nama Mahasiswa)
 */
export default function MbkmSearchFilter({
  value = '',
  onChange,
  onClear,
  placeholder = 'Cari berdasarkan NIM atau Nama mahasiswa...',
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
