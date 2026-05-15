import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function CareersPage() {
  return (
    <InfoPageShell
      badge="Company"
      updatedAt="May 14, 2026"
      title="Careers"
      description="BizManage is growing through focused product execution, thoughtful engineering, and practical operations design."
      sections={[
        {
          title: 'How we hire',
          body: [
            'We value people who can turn ambiguous business problems into reliable product workflows, communicate clearly, and care about shipping software that real teams can depend on every day.',
            'Product engineering, frontend systems, platform reliability, and customer success are all natural future hiring areas for a company building multi-industry SaaS infrastructure.',
          ],
        },
        {
          title: 'No public openings yet',
          body: [
            'There are no public roles listed at the moment. If you want to keep this footer item live and honest, this page works well until you are ready to publish active positions.',
            'When openings are available, this page can be expanded with role cards, hiring stages, and an application workflow.',
          ],
        },
      ]}
    />
  );
}
