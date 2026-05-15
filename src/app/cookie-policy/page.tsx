import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function CookiePolicyPage() {
  return (
    <InfoPageShell
      badge="Legal"
      updatedAt="May 14, 2026"
      title="Cookie Policy"
      description="This Cookie Policy explains how BizManage may use cookies and similar browser technologies to keep the product secure and usable."
      sections={[
        {
          title: 'Why cookies are used',
          body: [
            'Cookies and related browser storage technologies may be used to support sign-in state, product preferences, session continuity, and performance measurement.',
            'Some infrastructure providers used by BizManage may also set technical cookies or similar identifiers required to deliver authentication and hosting behavior.',
          ],
        },
        {
          title: 'Categories',
          body: [
            'Strictly necessary cookies help the product function correctly. Functional cookies may remember non-essential preferences. Analytics cookies should only be used if analytics tooling is enabled for the product experience.',
            'If you later add marketing, analytics, or advertising tools, update this page so it accurately reflects the categories and providers actually in use.',
          ],
        },
        {
          title: 'Your choices',
          body: [
            'Most browsers allow you to control cookies through settings or extensions. Disabling some cookies may affect login persistence or portions of the product experience.',
          ],
        },
      ]}
    />
  );
}
