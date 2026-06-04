import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GymMemberRecord, GymPaymentRecord, GymReceiptRecord } from '@/types';

interface GymReceiptPrintProps {
  businessName: string;
  businessPhone?: string;
  businessAddress?: string;
  member?: GymMemberRecord | null;
  payment: GymPaymentRecord;
  receipt?: GymReceiptRecord;
}

export default function GymReceiptPrint({
  businessName,
  businessPhone,
  businessAddress,
  member,
  payment,
  receipt,
}: GymReceiptPrintProps) {
  const displayMemberCode = payment.memberCode || member?.memberCode || payment.memberId;

  return (
    <div
      className="receipt-print-area"
      style={{ fontFamily: 'Arial, sans-serif', color: '#0f172a' }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 820,
          margin: '0 auto',
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 24,
          padding: 32,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>{businessName}</div>
            {businessPhone ? (
              <div style={{ marginTop: 6, color: '#475569' }}>{businessPhone}</div>
            ) : null}
            {businessAddress ? (
              <div style={{ marginTop: 4, color: '#475569' }}>{businessAddress}</div>
            ) : null}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Payment Receipt</div>
            <div style={{ marginTop: 8, color: '#475569' }}>
              Receipt No: {receipt?.receiptNumber ?? payment.receiptNumber ?? payment.invoiceId}
            </div>
            <div style={{ marginTop: 4, color: '#475569' }}>
              Date: {receipt?.paymentDate ?? payment.paymentDate}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          {[
            ['Member Name', payment.memberName],
            ['Member ID', displayMemberCode],
            ['Billing Period', receipt?.billingPeriod ?? payment.billingPeriod],
            [
              'Amount Paid',
              new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(payment.amount),
            ],
            ['Payment Method', String(payment.paymentMethod).toUpperCase()],
            ['Transaction ID', payment.transactionId || receipt?.transactionId || '-'],
          ].map(([label, value]) => (
            <div key={label} style={{ border: '1px solid #e2e8f0', borderRadius: 18, padding: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  color: '#64748b',
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ color: '#475569' }}>
            <div>Authorized Signature</div>
            <div style={{ marginTop: 36, width: 180, borderTop: '1px solid #94a3b8' }} />
          </div>
          <div style={{ textAlign: 'right', color: '#475569' }}>
            <div>Thank you for your payment.</div>
            <div style={{ marginTop: 8 }}>This receipt can be printed or saved as PDF.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function renderGymReceiptPrintDocument(props: GymReceiptPrintProps) {
  const markup = renderToStaticMarkup(<GymReceiptPrint {...props} />);

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Receipt ${props.receipt?.receiptNumber ?? props.payment.receiptNumber ?? props.payment.invoiceId}</title>
      <style>
        body { margin: 0; padding: 24px; background: #f8fafc; }
        @media print {
          body * { visibility: hidden; }
          .receipt-print-area, .receipt-print-area * { visibility: visible; }
          .receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          body { background: #fff; padding: 0; }
        }
      </style>
    </head>
    <body>${markup}</body>
  </html>`;
}
