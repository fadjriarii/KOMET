import { memo } from 'react';
import { Search } from 'lucide-react';
import CheckboxSelect from '../ui/CheckboxSelect';
import Input from '../ui/Input';

/**
 * Configurable presentation-only field used by dashboard filter containers.
 * Keeping this at the common layer prevents feature modules from duplicating
 * thin Input/CheckboxSelect wrappers for the same field types.
 */
const FilterField = memo(function FilterField({
  type = 'select',
  label,
  value,
  onChange,
  onClear,
  options = [],
  placeholder,
  icon,
  disabled = false,
  className = '',
  id,
}) {
  if (type === 'search') {
    return (
      <Input
        label={label || 'Search by Identifier'}
        value={value || ''}
        onChange={onChange}
        onClear={onClear || (() => onChange?.(''))}
        placeholder={placeholder}
        icon={icon || Search}
        isSearch
        disabled={disabled}
        className={className}
        id={id}
      />
    );
  }

  return (
    <CheckboxSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      icon={icon}
      disabled={disabled}
      className={className}
      id={id}
    />
  );
});

export default FilterField;
