import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function ChangelogPage() {
  return (
    <InfoPageShell
      badge="Product"
      updatedAt="May 14, 2026"
      title="Changelog"
      description="Recent product improvements across the BizManage platform."
      sections={[
        {
          title: 'May 2026',
          body: [
            'Firebase-only authentication and business data handling replaced the earlier demo credential path so deployed environments now rely on real auth and Firestore records.',
            'The Academy dashboard was upgraded with faster section loading, memoized rendering, improved filtering, and pagination support in the student workspace.',
            'The Gym module is now live with member CRUD, fee collection, payment history, and printable receipts that customers can save as PDF.',
          ],
        },
        {
          title: 'Platform direction',
          body: [
            'Future updates will continue expanding industry-specific modules while preserving a shared dashboard shell, common service layer, and consistent UI patterns across the product.',
          ],
        },
      ]}
    />
  );
}
