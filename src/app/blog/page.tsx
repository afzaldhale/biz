import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function BlogPage() {
  return (
    <InfoPageShell
      badge="Company"
      updatedAt="May 14, 2026"
      title="BizManage Blog"
      description="A place for product updates, implementation notes, and practical guides for running operations on BizManage."
      sections={[
        {
          title: 'What you can publish here',
          body: [
            'Use this section for release notes, workflow tutorials, customer stories, onboarding guides, and industry-specific best practices.',
            'Because the rest of the marketing site is now linked to real pages, this page gives you a proper destination until you are ready to connect a CMS or publish a full article archive.',
          ],
        },
        {
          title: 'Suggested first posts',
          body: [
            'Good starting topics include how to set up Firebase and Vercel for BizManage, how gym fee history works, and how academy teams can organize receipts and student records.',
          ],
        },
      ]}
    />
  );
}
