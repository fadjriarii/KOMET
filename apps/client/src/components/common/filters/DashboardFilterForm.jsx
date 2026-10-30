import { memo } from 'react';
import FilterContainerShell from './FilterContainerShell';
import FilterField from './FilterField';
import YearMultiFilter from './YearMultiFilter';

/** Kelas baris pertama; jumlah kolom per modul, tapi harus literal supaya Tailwind mengenalinya. */
const FIRST_ROW_CLASS = {
  4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5 w-full items-end',
  5: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-4.5 w-full items-end',
};

/** Kelas baris kedua; jumlahnya berbeda per modul, tapi harus literal supaya Tailwind mengenalinya. */
const SECOND_ROW_CLASS = {
  3: 'grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-4.5 w-full items-end pt-1',
  4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5 w-full items-end pt-1',
  5: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-4.5 w-full items-end pt-1',
  6: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-4.5 w-full items-end pt-1',
};

function Control({ field, value, onChange, choices, customMeta, disabled }) {
  const common = {
    label: field.label,
    value,
    onChange,
    options: choices,
    placeholder: field.placeholder,
    icon: field.icon,
    disabled,
  };

  if (field.control === 'search') {
    return (
      <FilterField
        type="search"
        label={field.label}
        value={value}
        onChange={onChange}
        placeholder={field.placeholder}
        disabled={disabled}
        className="sm:col-span-full lg:col-span-2"
      />
    );
  }
  if (field.control === 'years') {
    return (
      <YearMultiFilter
        selectedYears={value}
        onChange={onChange}
        years={choices}
        label={field.label}
        placeholder={field.placeholder}
        allTimeLabel={field.allTimeLabel}
        yearLabel={field.yearLabel}
        allowCustom={field.allowCustom}
        customLabel={field.customLabel}
        customMeta={customMeta}
        defaultValue={field.defaultValue}
        disabled={disabled}
      />
    );
  }
  return <FilterField type={field.control} {...common} defaultValue={field.defaultValue} />;
}

/**
 * Satu form filter untuk ketiga dashboard. Sebuah modul hanya mendaftar
 * field-nya (kontrol, label, sumber opsi) — kerangka, grid, dan kontrolnya tidak
 * boleh ditulis ulang per modul.
 */
const DashboardFilterForm = memo(function DashboardFilterForm({
  title,
  fields,
  values,
  setters,
  options = {},
  firstRowColumns = 5,
  secondRowColumns = 4,
  activeCount = 0,
  onResetAll,
  isLoading = false,
  className = '',
}) {
  const rows = { 1: [], 2: [] };
  for (const [key, field] of Object.entries(fields)) {
    if (!field.control) continue;
    rows[field.row === 1 ? 1 : 2].push({
      key,
      field,
      value: values[key],
      onChange: setters[field.setter],
      choices: options[field.optionsKey ?? key] || [],
      customMeta: field.customMetaKey ? (options[field.customMetaKey] ?? null) : null,
    });
  }

  return (
    <FilterContainerShell
      title={title}
      activeCount={activeCount}
      onResetAll={onResetAll}
      isLoading={isLoading}
      className={className}
    >
      <div className={FIRST_ROW_CLASS[firstRowColumns] || FIRST_ROW_CLASS[5]}>
        {rows[1].map(({ key, ...item }) => (
          <Control key={key} {...item} disabled={isLoading} />
        ))}
      </div>
      <div className={SECOND_ROW_CLASS[secondRowColumns] || SECOND_ROW_CLASS[4]}>
        {rows[2].map(({ key, ...item }) => (
          <Control key={key} {...item} disabled={isLoading} />
        ))}
      </div>
    </FilterContainerShell>
  );
});

export default DashboardFilterForm;
