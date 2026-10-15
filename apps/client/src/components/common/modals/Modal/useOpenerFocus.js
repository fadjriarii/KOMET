import { useEffect, useRef } from 'react';

/**
 * Dialog yang tidak pernah menerima fokus tidak bisa dipakai keyboard: fokus
 * dipindah ke panel saat ia muncul dan dikembalikan ke pemicunya saat menutup.
 */
export function useOpenerFocus(isOpen) {
  const openerRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return undefined;
    openerRef.current = document.activeElement;
    return () => {
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && opener !== document.activeElement) opener.focus();
      openerRef.current = null;
    };
  }, [isOpen]);
}
