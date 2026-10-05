import { useCallback, useMemo, useState } from 'react';

function makeInitialValues(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, config]) => [
      key,
      Array.isArray(config.initial) ? [...config.initial] : config.initial,
    ]),
  );
}

/**
 * Shared state and API-parameter mapping for dashboard filter forms.
 * Feature modules supply their field schema, while this hook owns immutable
 * updates, reset behaviour, sanitisation, and memoised API parameters.
 */
export function useDashboardFilters({ fields, getActiveFilterCount }) {
  const [values, setValues] = useState(() => makeInitialValues(fields));

  const setters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(fields).map(([key, config]) => [
          config.setter,
          (nextValue) =>
            setValues((current) => ({
              ...current,
              [key]: config.sanitize
                ? config.sanitize(
                    typeof nextValue === 'function' ? nextValue(current[key]) : nextValue,
                  )
                : typeof nextValue === 'function'
                  ? nextValue(current[key])
                  : nextValue,
            })),
        ]),
      ),
    [fields],
  );

  const filterParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(fields).map(([key, config]) => [config.param || key, values[key]]),
      ),
    [fields, values],
  );

  const activeFilterCount = useMemo(
    () => getActiveFilterCount(filterParams),
    [filterParams, getActiveFilterCount],
  );

  const resetFilters = useCallback(() => setValues(makeInitialValues(fields)), [fields]);

  return { values, setters, filterParams, activeFilterCount, resetFilters };
}
