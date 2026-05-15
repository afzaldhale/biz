import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function HelpCenterPage() {
  return (
    <InfoPageShell
      badge="Support"
      updatedAt="May 14, 2026"
      title="Help Center"
      description="Everything your team needs to get set up quickly in BizManage, from account access to day-to-day billing and dashboard workflows."
      sections={[
        {
          title: 'Getting started',
          body: [
            'Create your account, choose your business type, and BizManage prepares a dashboard matched to your workflow. Academy and Gym modules are already structured for operational use, while additional industry modules can be expanded as you grow.',
            'If you are signing in for the first time after deployment, confirm your Firebase configuration, authorized domains, and Firestore rules are in place so authentication and data access work normally.',
          ],
        },
        {
          title: 'Common questions',
          body: [
            'If a team member cannot sign in, reset credentials in Firebase Authentication and verify that the deployed environment contains the required NEXT_PUBLIC_FIREBASE values.',
            'If a module looks empty, first confirm records exist in Firestore under the correct business document. BizManage keeps business-specific data in subcollections such as students, gymMembers, and gymPayments.',
          ],
        },
        {
          title: 'Support channels',
          body: [
            'For account, billing, or setup help, use the contact section on the landing page or direct your users to your preferred support inbox. If you want, we can also wire a dedicated support email or ticketing CTA into this page next.',
            'Operational incidents should be mirrored on the public status page so customers can check service health without contacting support individually.',
          ],
        },
      ]}
    />
  );
}
