import sidebarLogo from '@/assets/sidebarLogo.png';

/**
 * Komponen Footer untuk aplikasi KOMET Dashboard.
 * Menampilkan logo sidebarLogo.png berukuran besar di bagian bawah
 * disertai informasi identitas institusi dan hak cipta.
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-auto border-t border-slate-200 bg-white/90 backdrop-blur-sm transition-all duration-300 z-10">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Logo Besar */}
          <div className="mb-6 flex items-center justify-center">
            <img
              src={sidebarLogo}
              alt="KOMET - i3L Logo"
              className="h-auto w-64 sm:w-80 md:w-96 max-w-full object-contain drop-shadow-sm transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>

          {/* Deskripsi & Identitas Institusi */}
          <p className="max-w-2xl text-sm text-on-surface-variant">
            <strong>KOMET</strong> — Academic & Quality Assurance Evaluation Dashboard.
            <br className="hidden sm:inline" />
            {' '}Indonesia International Institute for Life Sciences (i3L).
          </p>

          {/* Divider kecil */}
          <div className="my-5 h-px w-24 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

          {/* Hak Cipta & Info Sistem */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-on-surface-variant/70">
            <span>&copy; {currentYear} i3L KOMET. All rights reserved.</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-success"></span>
              System Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
