import { memo } from 'react';
import { Search } from 'lucide-react';
import CheckboxSelect from '../ui/CheckboxSelect';
import Select from '../ui/Select';
import Input from '../ui/Input';

/**
 * Configurable presentation-only field used by dashboard filter forms.
 * Keeping this at the common layer prevents feature modules from duplicating
 * thin Input/CheckboxSelect wrappers for the same field types.
 */
const FilterField = memo(function FilterField({
  type = 'multi',
  label,
  value,
  onChange,
  onClear,
  options = [],
  placeholder,
  defaultValue,
  icon,
  disabled = false,
  className = '',
  id,
}) {
  if (type === 'search') {
    return (
      <Input
        label={label}
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

  if (type === 'single') {
    return (
      <Select
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
  }

  return (
    <CheckboxSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      defaultValue={defaultValue}
      icon={icon}
      disabled={disabled}
      className={className}
      id={id}
    />
  );
});

export default FilterField;
