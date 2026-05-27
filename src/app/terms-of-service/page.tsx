import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function TermsOfServicePage() {
  return (
    <InfoPageShell
      badge="Legal"
      updatedAt="May 14, 2026"
      title="Terms of Service"
      description="These Terms of Service govern access to and use of BizManage as a business software platform."
      sections={[
        {
          title: 'Use of the service',
          body: [
            'By creating an account or using BizManage, you agree to use the platform only for lawful business purposes and in a way that does not interfere with the service or the rights of other users.',
            'You are responsible for the accuracy of the information you enter and for maintaining the confidentiality of your account credentials.',
          ],
        },
        {
          title: 'Subscriptions and accounts',
          body: [
            'Access to some features may depend on your selected record capacity, usage limits, or future billing terms. We may change subscription terms, limits, or features over time, provided such changes are reflected clearly in the product or related documentation.',
            'You remain responsible for all activity that occurs under your account unless caused directly by our own unauthorized actions.',
          ],
        },
        {
          title: 'Service availability and liability',
          body: [
            'BizManage is provided on an as-available basis. While we work to keep the platform stable and reliable, we do not promise uninterrupted availability in every circumstance.',
            'To the maximum extent allowed by law, BizManage is not liable for indirect, incidental, special, or consequential damages arising from use of the platform.',
          ],
        },
      ]}
    />
  );
}
