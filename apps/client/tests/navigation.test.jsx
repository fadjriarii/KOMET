import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Breadcrumbs from '../src/components/layout/Navbar/Breadcrumbs';
import SidebarNav from '../src/components/layout/Sidebar/SidebarNav';

describe('navigasi yang diturunkan dari rute', () => {
  it('menandai menu sesuai URL lewat aria-current dan merender tautan nyata', () => {
    render(
      <MemoryRouter initialEntries={['/graduates']}>
        <SidebarNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Graduates/ }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getByRole('link', { name: /MBKM/ }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: /Student Data/ }).getAttribute('href')).toBe(
      '/students',
    );
  });

  it('breadcrumb mengikuti rute aktif dan mengakui rute yang tidak dikenal', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/mbkm']}>
        <Breadcrumbs />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Breadcrumb').textContent).toBe('Student NavigationMBKM');
    unmount();

    render(
      <MemoryRouter initialEntries={['/bukan-halaman']}>
        <Breadcrumbs />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Breadcrumb').textContent).toContain('Halaman Tidak Dikenal');
  });
});
