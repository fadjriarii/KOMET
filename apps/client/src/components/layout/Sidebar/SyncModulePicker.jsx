import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Minus } from 'lucide-react';
import { MODULE_GROUPS } from './syncModules';

/**
 * Kotak centang seragam se-web ini: kotak `rounded-md` yang menyalakan biru saat terisi,
 * persis gaya CheckboxSelect/YearMultiFilter di filter dashboard. Input aslinya tetap ada
 * (transparan di atas kotaknya) supaya keyboard, `disabled`, dan state "sebagian terpilih"
 * berupa garis mendatar tetap bekerja seperti checkbox biasa.
 */
function TriCheckbox({ checked, indeterminate, disabled, onChange, label, tabIndex }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <span
      className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-digital-blue-500/15 ${
        checked || indeterminate
          ? 'border-digital-blue-600 bg-digital-blue-600 text-white shadow-2xs'
          : 'border-gray-300 bg-white'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {indeterminate ? (
        <Minus size={12} strokeWidth={3} />
      ) : checked ? (
        <Check size={12} strokeWidth={3} />
      ) : null}
      <input
        ref={ref}
        type="checkbox"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        tabIndex={tabIndex}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </span>
  );
}

/**
 * Kolom kiri popup sinkronisasi: pilihan disusun per kelompok yang punya baris sendiri dengan
 * tanda `>` di kanan untuk membuka/menutup isinya, jadi menambah banyak pilihan berikutnya
 * berarti menambah satu entri di `MODULE_GROUPS`, bukan mengubah kartu. Baris modul di dalam
 * kelompok sengaja polos tanpa status: angka progres hanya ada di kolom kanan, tidak dua kali.
 */
export default function SyncModulePicker({ job }) {
  // Kelompok tertutup sejak awal (`open` kosong): kartu pilihan tidak mengambil
  // tinggi popup sebelum diminta, sama seperti baris riwayat yang baru membuka saat diklik.
  const [open, setOpen] = useState({});

  const toggleOpen = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col gap-2.5 min-w-0 min-h-0">
      <div className="flex items-center justify-between gap-2 px-0.5 shrink-0">
        <span className="text-[13px] font-semibold text-gray-900 tracking-tight select-none">
          Select Data
        </span>
        <label className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 select-none cursor-pointer">
          <TriCheckbox
            checked={job.allSelected}
            indeterminate={job.someSelected && !job.allSelected}
            disabled={job.isRunning}
            onChange={job.toggleAll}
            label="Select All"
          />
          <span className="text-[11px] font-medium">Select All</span>
        </label>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar rounded-xl bg-white border border-gray-200/70 shadow-2xs">
        {MODULE_GROUPS.map((group) => {
          const rows = job.moduleRows.filter((row) => group.moduleKeys.includes(row.key));
          const isOpen = !!open[group.key];
          const allChecked = rows.length > 0 && rows.every((row) => job.selected[row.key]);
          const someChecked = rows.some((row) => job.selected[row.key]);
          const panelId = `sync-group-${group.key}`;

          return (
            <div key={group.key} className="border-b border-gray-100 last:border-b-0">
              {/* Kotak centang kelompok di luar tombol: klik baris membuka daftarnya,
                  klik kotak memilih semua yang di dalamnya. */}
              {/* Baris kelompok = baris riwayat di kartu kanan: latar yang sama, teks yang sama,
                  hanya lebih tinggi supaya induk terbaca sebagai induk. */}
              <div className="flex items-center gap-2.5 px-3 py-3 bg-gray-50/70">
                <TriCheckbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  disabled={job.isRunning}
                  onChange={() => job.toggleGroup(group.moduleKeys)}
                  label={`Select every module in ${group.label}`}
                />
                <button
                  type="button"
                  onClick={() => toggleOpen(group.key)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${group.label} group`}
                  className="group flex min-w-0 flex-1 cursor-pointer select-none items-center gap-2 text-left"
                >
                  <span className="text-[13px] font-semibold text-gray-900 truncate">
                    {group.label}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`ml-auto shrink-0 text-gray-500 transition-transform duration-200 group-hover:text-gray-900 ${
                      isOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
              </div>

              {/* Buka/tutup memakai animasi accordion yang sama dengan MenuGroup: barisnya
                  tetap terpasang supaya transisi tingginya halus, tapi saat tertutup ia
                  disembunyikan dari screen reader dan dikeluarkan dari urutan Tab — popup
                  ini menahan Tab di dalam panelnya. */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-1000 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div id={panelId} role="group" aria-label={group.label} aria-hidden={!isOpen}>
                    {rows.map((row) => (
                      <label
                        key={row.key}
                        className={`group flex items-center gap-2.5 pl-9.5 pr-3 py-1.5 border-b border-gray-100 last:border-b-0 transition-colors ${
                          job.isRunning
                            ? 'opacity-60 cursor-not-allowed'
                            : 'hover:bg-digital-blue-50/60 cursor-pointer'
                        }`}
                      >
                        <TriCheckbox
                          checked={!!job.selected[row.key]}
                          disabled={job.isRunning}
                          onChange={() => job.toggleModule(row.key)}
                          label={`Select ${row.label}`}
                          tabIndex={isOpen ? 0 : -1}
                        />
                        <span className="text-[13px] font-semibold text-gray-900 truncate group-hover:text-digital-blue-700">
                          {row.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
