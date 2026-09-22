/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate';

/**
 * Konfigurasi Tailwind CSS untuk KOMET Dashboard.
 * Token warna, tipografi, dan elevasi diambil langsung dari DESIGN.md
 * agar implementasi frontend konsisten dengan design system institusi.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Token Material dari DESIGN.md (frontmatter)
        surface: '#faf8ff',
        'surface-dim': '#d2d9f4',
        'surface-bright': '#faf8ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f3ff',
        'surface-container': '#eaedff',
        'surface-container-high': '#e2e7ff',
        'surface-container-highest': '#dae2fd',
        'on-surface': '#131b2e',
        'on-surface-variant': '#3f4850',
        'inverse-surface': '#283044',
        'inverse-on-surface': '#eef0ff',
        outline: '#6f7882',
        'outline-variant': '#bec7d2',
        'surface-tint': '#006496',
        primary: '#006192',
        'on-primary': '#ffffff',
        'primary-container': '#007bb8',
        'on-primary-container': '#fcfcff',
        'inverse-primary': '#91cdff',
        secondary: '#2d5bb3',
        'on-secondary': '#ffffff',
        'secondary-container': '#79a1fe',
        'on-secondary-container': '#003581',
        tertiary: '#805200',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#a16900',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'primary-fixed': '#cce5ff',
        'primary-fixed-dim': '#91cdff',
        'on-primary-fixed': '#001e31',
        'on-primary-fixed-variant': '#004b72',
        background: '#faf8ff',
        'on-background': '#131b2e',
        // Warna semantik status (DESIGN.md bagian Semantic Status Palette)
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        // Warna kanvas netral Level 0
        canvas: '#F8FAFC',
      },
      fontFamily: {
        // Tipografi global: Plus Jakarta Sans (DESIGN.md)
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Skala tipografi dari DESIGN.md
        'metric-display': ['36px', { lineHeight: '44px', fontWeight: '800', letterSpacing: '-0.03em' }],
        'headline-xl': ['28px', { lineHeight: '36px', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-lg': ['22px', { lineHeight: '28px', fontWeight: '700', letterSpacing: '-0.015em' }],
        'headline-md': ['18px', { lineHeight: '24px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'headline-sm': ['15px', { lineHeight: '20px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label-md': ['13px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.01em' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '700', letterSpacing: '0.04em' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      borderRadius: {
        // Shape grammar "Rounded (Tier 2)" dari DESIGN.md
        card: '12px',
        control: '8px',
        modal: '16px',
      },
      boxShadow: {
        // Model elevasi rendah (low-elevation ambient depth) dari DESIGN.md
        'level-1': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'level-2': '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'level-3': '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
        'level-4': '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
      },
      spacing: {
        // Ritme modular 8px dari DESIGN.md (Layout & Spacing)
        'space-2xs': '0.25rem',
        'space-xs': '0.5rem',
        'space-sm': '0.75rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        'space-2xl': '3rem',
        gutter: '1.5rem',
        'margin-desktop': '2rem',
        'margin-tablet': '1.25rem',
        'margin-mobile': '1rem',
      },
      maxWidth: {
        // Batas lebar viewport konten yang mudah dibaca (DESIGN.md)
        readable: '1600px',
      },
    },
  },
  plugins: [animate],
};
