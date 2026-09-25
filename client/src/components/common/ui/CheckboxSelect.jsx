import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function CheckboxSelect({ label, value = [], onChange, options = [], placeholder = 'Semua', defaultValue = [], allOptionAtBottom = false, disabled = false, className = '', id }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = Array.isArray(value) ? value.map(String) : [];
  const defaults = Array.isArray(defaultValue) ? defaultValue.map(String) : [];
  const isDefault = selected.length === defaults.length && selected.every((item) => defaults.includes(item));
  useEffect(() => {
    const close = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const toggle = (option) => {
    const item = String(typeof option === 'object' ? option.value : option);
    onChange?.(selected.includes(item) ? selected.filter((v) => v !== item) : [...selected, item]);
  };
  return <div ref={ref} className={`flex flex-col gap-1.5 w-full relative ${className}`}>
    {label && <label htmlFor={id} className="text-[11.5px] font-bold text-gray-700 uppercase tracking-wider">{label}</label>}
    <button id={id} type="button" disabled={disabled} onClick={() => setOpen((v) => !v)} className="w-full h-11 flex items-center justify-between bg-gray-50/80 text-xs sm:text-sm rounded-xl border border-gray-200/90 px-3.5 text-left disabled:opacity-60">
      <span className={`${!isDefault && (selected.length || placeholder) ? 'text-gray-900 font-semibold' : 'text-gray-400'} truncate`}>{selected.length === 1 ? (typeof options.find((option) => String(typeof option === 'object' ? option.value : option) === selected[0]) === 'object' ? options.find((option) => String(option.value) === selected[0]).label : selected[0]) : selected.length ? `${selected.length} terpilih` : placeholder}</span><ChevronDown size={15} className={open ? 'rotate-180 text-digital-blue-600' : 'text-gray-400'} />
    </button>
    <div className={`absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 shadow-xl p-1.5 z-[70] rounded-2xl ${open ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'}`}>
      {!allOptionAtBottom && <button type="button" onClick={() => onChange?.([])} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl ${!selected.length ? 'bg-digital-blue-50 text-digital-blue-700 font-bold' : 'text-gray-700 hover:bg-digital-blue-50/70'}`}><span className={`w-4 h-4 rounded-md border flex items-center justify-center ${!selected.length ? 'bg-digital-blue-600 border-digital-blue-600 text-white' : 'border-gray-300'}`}>{!selected.length && <Check size={12} strokeWidth={3} />}</span><span>{placeholder}</span></button>}
      <div className="max-h-60 overflow-y-auto space-y-0.5">
        {options.map((option, index) => { const item = String(typeof option === 'object' ? option.value : option); const text = typeof option === 'object' ? option.label : option; const checked = selected.includes(item); return <button key={item || index} type="button" onClick={() => toggle(option)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-left ${checked ? 'bg-digital-blue-50 text-digital-blue-700 font-bold' : 'text-gray-700 hover:bg-digital-blue-50/70'}`}><span className={`w-4 h-4 rounded-md border flex items-center justify-center ${checked ? 'bg-digital-blue-600 border-digital-blue-600 text-white' : 'border-gray-300'}`}>{checked && <Check size={12} strokeWidth={3} />}</span><span className="truncate">{text}</span></button>; })}
      </div>
      {allOptionAtBottom && <button type="button" onClick={() => onChange?.([])} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl ${!selected.length ? 'bg-digital-blue-50 text-digital-blue-700 font-bold' : 'text-gray-700 hover:bg-digital-blue-50/70'}`}><span className={`w-4 h-4 rounded-md border flex items-center justify-center ${!selected.length ? 'bg-digital-blue-600 border-digital-blue-600 text-white' : 'border-gray-300'}`}>{!selected.length && <Check size={12} strokeWidth={3} />}</span><span>{placeholder}</span></button>}
    </div>
  </div>;
}
