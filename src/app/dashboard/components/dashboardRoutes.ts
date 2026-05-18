export const DASHBOARD_OVERVIEW_NAV_ID = 'nav-dashboard';

export function getDashboardNavIdFromSegment(segment?: string | null) {
  if (!segment) {
    return DASHBOARD_OVERVIEW_NAV_ID;
  }

  return `nav-${segment}`;
}

export function getDashboardHrefFromNavId(navId: string) {
  if (navId === DASHBOARD_OVERVIEW_NAV_ID) {
    return '/dashboard';
  }

  return `/dashboard/${navId.replace(/^nav-/, '')}`;
}
