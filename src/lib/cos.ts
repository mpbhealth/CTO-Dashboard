export const ARYX_ORG_ID = 'a0000000-0000-0000-0000-000000000001';
export const COS_ROLE = 'cos' as const;
export type CosRole = typeof COS_ROLE;

export const ARYX_CRM_HREF = 'https://crm.aryx.com';

export function remapLegacyPath(pathname: string): string | null {
  const exact: Record<string, string> = {
    '/ceod/home': '/home',
    '/ctod/home': '/home',
    '/ceod/email': '/inbox',
    '/ctod/email': '/inbox',
    '/admin/email': '/inbox',
    '/ceod/organizer': '/organizer',
    '/ctod/organizer': '/organizer',
    '/ceod/settings': '/settings',
    '/ctod/settings': '/settings',
    '/ceod/files': '/files',
    '/ctod/files': '/files',
    '/ceod/command-center': '/home',
    '/ctod/command-center': '/home',
  };

  if (exact[pathname]) return exact[pathname];
  if (pathname.startsWith('/ceod/analytics') || pathname.startsWith('/ctod/analytics')) {
    return pathname.replace(/^\/(ceod|ctod)/, '');
  }
  if (pathname.startsWith('/ceod/development') || pathname.startsWith('/ctod/development')) {
    return pathname.replace(/^\/(ceod|ctod)/, '');
  }
  if (pathname.startsWith('/ceod/operations') || pathname.startsWith('/ctod/operations')) {
    return pathname.replace(/^\/(ceod|ctod)/, '');
  }
  if (pathname.startsWith('/ctod/compliance')) {
    return pathname.replace('/ctod/compliance', '/operations/compliance');
  }
  if (pathname.startsWith('/ctod/infrastructure')) {
    return pathname.replace('/ctod/infrastructure', '/operations/infrastructure');
  }
  if (pathname.startsWith('/admin') || pathname.startsWith('/advisor') || pathname.startsWith('/ceod') || pathname.startsWith('/ctod')) {
    return '/home';
  }
  return null;
}
