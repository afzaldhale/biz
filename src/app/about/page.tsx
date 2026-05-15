import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function AboutPage() {
  return (
    <InfoPageShell
      badge="Company"
      updatedAt="May 14, 2026"
      title="About BizManage"
      description="BizManage is designed to help Indian businesses run daily operations through focused, industry-specific workflows inside one modern SaaS dashboard."
      sections={[
        {
          title: 'What we build',
          body: [
            'BizManage brings together a shared SaaS foundation with business-type-specific modules, so academies, gyms, hotels, clinics, restaurants, and other operations can use one product without losing workflow relevance.',
            'The product emphasizes speed, clear UI patterns, and practical business actions such as record management, fee tracking, receipt generation, and operational visibility.',
          ],
        },
        {
          title: 'Who it is for',
          body: [
            'BizManage is built for founders, managers, and teams who need software that feels purpose-built for their daily work instead of a generic back-office spreadsheet replacement.',
          ],
        },
        {
          title: 'Our approach',
          body: [
            'We prefer shipping usable operational modules over decorative marketing promises. Each footer page, workflow, and dashboard area should reflect what the product actually supports today, while leaving room for disciplined expansion.',
          ],
        },
      ]}
    />
  );
}
