import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Nama parameter URL untuk halaman tabel; ikut dibersihkan saat filter berubah. */
export const PAGE_PARAM = 'page';

function isListInitial(config) {
  return Array.isArray(config.initial);
}

function sameAsInitial(config, value) {
  if (isListInitial(config)) {
    return (
      Array.isArray(value) &&
      value.length === config.initial.length &&
      value.every((item, index) => item === config.initial[index])
    );
  }
  return value === config.initial;
}

/**
 * Nilai filter dibaca dari URL, dan input URL dianggap tidak tepercaya: sanitizer
 * milik field berlaku juga di sini, bukan hanya saat user mengetik.
 */
function readValues(fields, searchParams) {
  const values = {};
  for (const [key, config] of Object.entries(fields)) {
    const param = config.param || key;
    const sanitize = config.sanitize || ((value) => value);
    if (isListInitial(config)) {
      // Ada tapi kosong (`?status=`) = sengaja kosong; tidak ada = nilai awal.
      values[key] = searchParams.has(param)
        ? sanitize(searchParams.getAll(param).filter((item) => item !== ''))
        : [...config.initial];
    } else {
      const single = searchParams.get(param);
      values[key] = single === null ? config.initial : sanitize(single);
    }
  }
  return values;
}

function writeValue(fields, previous, key, config, nextValue) {
  const current = readValues(fields, previous);
  const resolved = typeof nextValue === 'function' ? nextValue(current[key]) : nextValue;
  const value = config.sanitize ? config.sanitize(resolved) : resolved;

  const params = new URLSearchParams(previous);
  const param = config.param || key;
  params.delete(param);
  if (sameAsInitial(config, value)) return params;

  if (isListInitial(config)) {
    if (value.length === 0) params.append(param, '');
    else for (const item of value) params.append(param, item);
  } else {
    params.set(param, value);
  }
  // Filter baru membuat halaman aktif tidak relevan lagi.
  params.delete(PAGE_PARAM);
  return params;
}

/**
 * Shared state and API-parameter mapping for dashboard filter forms.
 * Feature modules supply their field schema; this hook owns encoding, reset
 * behaviour, sanitisation, and memoised API parameters. Values live in the URL
 * so a view is deep-linkable, survives a reload, and follows Back/Forward.
 */
export function useDashboardFilters({ fields, getActiveFilterCount }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => readValues(fields, searchParams), [fields, searchParams]);

  const setters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(fields).map(([key, config]) => [
          config.setter,
          (nextValue) =>
            setSearchParams((previous) => writeValue(fields, previous, key, config, nextValue), {
              replace: true,
            }),
        ]),
      ),
    [fields, setSearchParams],
  );

  const filterParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(fields).map(([key, config]) => [config.param || key, values[key]]),
      ),
    [fields, values],
  );

  // Nama parameter API yang isinya menyimpang dari nilai awal. Server mendaftar
  // param mana yang dibaca tiap kartu (`kpiFilterScope`); halaman hanya
  // menyilangkan kedua daftar itu, jadi tidak ada lagi tebakan lokal tentang
  // "filter ini surely mempengaruhi kartu itu".
  const activeFilterParams = useMemo(() => {
    const active = [];
    for (const [key, config] of Object.entries(fields)) {
      if (!sameAsInitial(config, values[key])) active.push(config.api || config.param || key);
    }
    return active;
  }, [fields, values]);

  const activeFilterCount = useMemo(
    () => getActiveFilterCount(filterParams),
    [filterParams, getActiveFilterCount],
  );

  const resetFilters = useCallback(
    () =>
      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous);
          for (const [key, config] of Object.entries(fields)) params.delete(config.param || key);
          params.delete(PAGE_PARAM);
          return params;
        },
        { replace: true },
      ),
    [fields, setSearchParams],
  );

  return { values, setters, filterParams, activeFilterParams, activeFilterCount, resetFilters };
}
