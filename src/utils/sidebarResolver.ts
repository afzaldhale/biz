export function sidebarResolver(businessType: string) {
  switch (businessType) {
    case 'academy':
      return [
        'Dashboard',
        'Students',
        'Courses',
        'Fees',
        'Receipts',
        'Reports',
        'Subscription',
        'Settings',
      ];
    case 'hotel':
      return ['Dashboard', 'Rooms', 'Guests', 'Subscription', 'Settings'];
    case 'restaurant':
      return [
        'Dashboard',
        'Orders',
        'Tables',
        'Menu',
        'Billing',
        'Reports',
        'Subscription',
        'Settings',
      ];
    case 'clinic':
      return [
        'Dashboard',
        'Patients',
        'Appointments',
        'Billing',
        'Reports',
        'Subscription',
        'Settings',
      ];
    case 'gym':
      return ['Dashboard', 'Members', 'Trainers', 'Billing', 'Reports', 'Subscription', 'Settings'];
    case 'serviceCenter':
      return [
        'Dashboard',
        'Tickets',
        'Customers',
        'Technicians',
        'Invoices',
        'Reports',
        'Subscription',
        'Settings',
      ];
    default:
      return ['Dashboard', 'Customers', 'Reports', 'Subscription', 'Settings'];
  }
}
