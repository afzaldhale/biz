import React from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function BillingPolicyPage() {
  return (
    <InfoPageShell
      badge="Billing"
      updatedAt="May 14, 2026"
      title="Billing Policy"
      description="This Billing Policy explains how BizManage plans, subscription charges, renewals, cancellations, and billing questions should be handled."
      sections={[
        {
          title: 'Plan charges',
          body: [
            'BizManage may offer monthly or custom subscription plans depending on your selected package and business requirements. Charges should be presented clearly at the time of signup or upgrade.',
            'If you enable production billing later, keep this page aligned with the actual billing provider, invoice timing, taxes, and renewal intervals you configure.',
          ],
        },
        {
          title: 'Renewals and cancellations',
          body: [
            'Unless otherwise agreed in writing for a custom plan, subscriptions typically renew at the end of each billing cycle until cancelled. Customers should cancel before the next renewal date to avoid a new cycle being charged.',
            'Cancellation stops future renewal charges, but does not automatically erase existing business records unless your data retention process says otherwise.',
          ],
        },
        {
          title: 'Refunds and billing disputes',
          body: [
            'Because BizManage is a software subscription service, charges are generally treated as non-refundable once a billing period begins, except where a refund is required by law or explicitly promised in writing.',
            'If a customer believes they were charged incorrectly, the correct workflow is to contact support with account, invoice, and payment details so the issue can be reviewed promptly.',
          ],
        },
      ]}
    />
  );
}
