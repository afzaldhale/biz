import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function ApiReferencePage() {
  return (
    <InfoPageShell
      badge="Developers"
      updatedAt="May 14, 2026"
      title="API Reference"
      description="BizManage is currently optimized as an application-first dashboard backed by Firebase. This page explains the present integration surface and the recommended direction for future API work."
      sections={[
        {
          title: 'Current architecture',
          body: [
            'BizManage does not yet expose a public REST or GraphQL API for third-party customers. Today, the application operates through authenticated UI flows backed by Firebase Authentication and Firestore.',
            'That means records such as business profiles, students, gym members, and gym payments are created and updated through the product interface, not through an external developer token flow.',
          ],
        },
        {
          title: 'Recommended next step',
          body: [
            'If you plan to offer public integrations, the next reliable step is defining a server-side API boundary for businesses, records, permissions, rate limits, and audit logging. That keeps future API consumers separate from direct browser access to Firestore.',
            'We can help design versioned endpoints, service-role permissions, webhook events, and customer-facing API keys when you are ready to productize integrations.',
          ],
        },
        {
          title: 'Internal integration note',
          body: [
            'For internal extensions, prefer adding service functions in the existing application structure rather than linking the footer to an empty developer portal. This keeps the product honest while leaving a clear path for later API expansion.',
          ],
        },
      ]}
    />
  );
}
