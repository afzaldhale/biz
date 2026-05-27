import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function PrivacyPolicyPage() {
  return (
    <InfoPageShell
      badge="Legal"
      updatedAt="May 14, 2026"
      title="Privacy Policy"
      description="This Privacy Policy explains how BizManage handles account details, operational records, and platform usage information for businesses using the service."
      sections={[
        {
          title: 'Information we collect',
          body: [
            'BizManage collects account and business information you provide during signup, such as owner name, business name, email address, phone number, selected business type, and chosen record capacity.',
            'The platform also stores operational records you create inside the product, including items such as student records, gym member records, payment history, and similar business workflow data.',
          ],
        },
        {
          title: 'How information is used',
          body: [
            'We use your information to provide the service, secure account access, store your business records, improve product reliability, and support customer requests.',
            'We do not treat your business records as public content. Access is intended to remain limited to authenticated users and the infrastructure providers required to deliver the service.',
          ],
        },
        {
          title: 'Storage and security',
          body: [
            'BizManage currently relies on Firebase services for authentication and data storage, and may rely on Vercel for application hosting and deployment delivery. You are responsible for maintaining appropriate account access controls within your organization.',
            'No internet-connected system can be guaranteed perfectly secure, but we aim to use commercially reasonable safeguards appropriate for a SaaS platform of this kind.',
          ],
        },
      ]}
    />
  );
}
