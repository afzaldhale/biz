import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function StatusPage() {
  return (
    <InfoPageShell
      badge="Status"
      updatedAt="May 14, 2026"
      title="System Status"
      description="BizManage is currently operating normally. Use this page as the public destination for customers who need quick visibility into platform health and incident communication."
      sections={[
        {
          title: 'Current status',
          body: [
            'Web application access is available, authentication is operating normally, and dashboard modules are serving production builds successfully.',
            'If a specific customer reports trouble while the status page shows normal operation, the most likely causes are browser cache, local connectivity, misconfigured deployment variables, or Firebase project access rules.',
          ],
        },
        {
          title: 'Core services monitored',
          body: [
            'Authentication depends on Firebase Auth, business and module records depend on Firestore, and the frontend is delivered through Vercel-hosted Next.js builds.',
            'Production incidents should be reflected here with timestamps, affected components, mitigation steps, and resolution notes so customers do not need to guess whether the problem is local or system-wide.',
          ],
        },
        {
          title: 'Incident communication policy',
          body: [
            'For planned maintenance, update this page before the maintenance window starts. For unplanned incidents, publish a short acknowledgement first, then expand with root-cause details once verified.',
          ],
        },
      ]}
    />
  );
}
