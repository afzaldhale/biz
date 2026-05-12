import { Plan } from '@/types';

export const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 499,
    recordLimit: 50,
    color: '#64748B',
    features: [
      'Up to 50 records',
      '1 staff account',
      'Basic reports',
      'Email support',
      'Core dashboard modules',
    ],
  },
  {
    id: 'medium',
    name: 'Medium',
    price: 999,
    recordLimit: 150,
    color: '#2563EB',
    features: [
      'Up to 150 records',
      '3 staff accounts',
      'Advanced reports',
      'Priority email support',
      'All dashboard modules',
      'Export to PDF',
    ],
  },
  {
    id: 'advance',
    name: 'Advance',
    price: 1499,
    recordLimit: 250,
    color: '#7C3AED',
    features: [
      'Up to 250 records',
      '5 staff accounts',
      'Full analytics suite',
      'Phone + email support',
      'All dashboard modules',
      'Export to PDF & Excel',
      'SMS notifications',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1999,
    recordLimit: 500,
    color: '#0891B2',
    features: [
      'Up to 500 records',
      '10 staff accounts',
      'Full analytics suite',
      'Dedicated support manager',
      'All dashboard modules',
      'Custom branding',
      'API access',
      'WhatsApp notifications',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2999,
    recordLimit: 1000,
    color: '#D97706',
    features: [
      'Up to 1000 records',
      '25 staff accounts',
      'Enterprise analytics',
      '24/7 priority support',
      'All dashboard modules',
      'White-label option',
      'Full API access',
      'Multi-branch support',
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    price: 0,
    recordLimit: null,
    color: '#10B981',
    features: [
      'Unlimited records',
      'Unlimited staff accounts',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise deployment option',
      'Custom feature development',
    ],
  },
];

export const getPlanById = (id: string): Plan | undefined =>
  plans.find((p) => p.id === id);

export const getRecordLimit = (planId: string): number | null => {
  const plan = getPlanById(planId);
  return plan ? plan.recordLimit : 50;
};