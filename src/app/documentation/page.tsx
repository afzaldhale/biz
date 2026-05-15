import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function DocumentationPage() {
  return (
    <InfoPageShell
      badge="Docs"
      updatedAt="May 14, 2026"
      title="Documentation"
      description="A practical product guide for teams using BizManage to run multi-industry operations, onboard staff, and maintain reliable workflows."
      sections={[
        {
          title: 'Platform overview',
          body: [
            'BizManage is a Next.js-based SaaS dashboard designed to support multiple business types from a single product foundation. Each business type receives a tailored sidebar, overview cards, and operational modules.',
            'Authentication and core record storage are powered by Firebase, which keeps login, profile data, and business records consistent across deployments.',
          ],
        },
        {
          title: 'Current live modules',
          body: [
            'The Academy module supports student management and receipt printing. The Gym module supports member creation, fee collection, payment history, and printable payment receipts.',
            'Additional modules such as Hotel, Restaurant, Clinic, Salon, and Service Center can be expanded using the same shared dashboard and service architecture.',
          ],
        },
        {
          title: 'Operational guidance',
          body: [
            'Use the dashboard as the single source of truth for member and student records. Record payments through the module workflow instead of editing balances manually, so receipts and payment history remain accurate.',
            'Before going live, configure Vercel environment variables, Firebase Auth authorized domains, Firestore rules, and backup/export practices that fit your business operations.',
          ],
        },
      ]}
    />
  );
}
