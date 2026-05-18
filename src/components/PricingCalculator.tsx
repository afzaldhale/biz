'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BusinessType } from '@/types';
import {
  MIN_RECORDS,
  SLIDER_MAX,
  calculateMonthlyPrice,
  calculateYearlyPrice,
  formatINR,
  getRecordLabel,
  parseRecordCount,
} from '@/utils/pricing';

type BillingPeriod = 'monthly' | 'yearly';

interface PricingCalculatorProps {
  onEstimatedPrice?: (price: number, records: number) => void;
}

const businessTypes: Array<{ id: BusinessType; label: string }> = [
  { id: 'academy', label: 'Academy' },
  { id: 'gym', label: 'Gym' },
  { id: 'hotel', label: 'Hotel / Lodging' },
  { id: 'clinic', label: 'Clinic' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'service-center', label: 'Service Center' },
  { id: 'salon', label: 'Salon' },
  { id: 'custom', label: 'Custom Business' },
];

export default function PricingCalculator({ onEstimatedPrice }: PricingCalculatorProps) {
  const [businessType, setBusinessType] = useState<BusinessType>('academy');
  const [recordInput, setRecordInput] = useState(MIN_RECORDS.toString());
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const recordCount = useMemo(() => parseRecordCount(recordInput), [recordInput]);

  const billableRecords = useMemo(() => Math.max(recordCount, MIN_RECORDS), [recordCount]);

  const monthlyPrice = useMemo(() => calculateMonthlyPrice(recordCount), [recordCount]);

  const yearlyPrice = useMemo(() => calculateYearlyPrice(recordCount), [recordCount]);

  const displayPrice = billingPeriod === 'monthly' ? monthlyPrice : yearlyPrice;

  const recordLabel = useMemo(() => getRecordLabel(businessType), [businessType]);

  const businessLabel = useMemo(
    () => businessTypes.find((bt) => bt.id === businessType)?.label || 'Business',
    [businessType]
  );

  const handleRecordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecordInput(value === '' ? '' : value);
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRecordInput(e.target.value);
  }, []);

  const handleBusinessTypeChange = useCallback((type: BusinessType) => {
    setBusinessType(type);
    setDropdownOpen(false);
  }, []);

  React.useEffect(() => {
    if (onEstimatedPrice) {
      onEstimatedPrice(displayPrice, billableRecords);
    }
  }, [displayPrice, billableRecords, onEstimatedPrice]);

  const showMinWarning = recordCount > 0 && recordCount < MIN_RECORDS;
  const showHighVolumeNote = recordCount > SLIDER_MAX;

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <h2 className="text-3xl font-700 text-foreground">
          Simple Pricing That Scales With Your Business
        </h2>
        <p className="text-lg text-muted-foreground">
          Estimate your monthly cost based on the number of records you manage. Minimum billing
          starts at 50 records.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="glass-card rounded-2xl border border-border/60 p-6 space-y-6">
          {/* Business Type Dropdown */}
          <div className="space-y-3">
            <label className="text-sm font-600 text-foreground">Business Category</label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-left flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <span>{businessLabel}</span>
                <ChevronDown
                  size={16}
                  className={`text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50">
                  {businessTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleBusinessTypeChange(type.id)}
                      className={`w-full px-4 py-3 text-left text-sm font-500 transition-colors first:rounded-t-[11px] last:rounded-b-[11px] ${
                        businessType === type.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Records Input */}
          <div className="space-y-3">
            <label className="text-sm font-600 text-foreground">Number of {recordLabel}</label>
            <input
              type="number"
              value={recordInput}
              onChange={handleRecordChange}
              min="0"
              max="50000"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-primary"
              placeholder="Enter number of records"
            />
            {showMinWarning && (
              <p className="text-xs text-yellow-600 bg-yellow-50 rounded-lg px-3 py-2">
                Minimum billing starts at 50 records. We'll calculate using 50 records.
              </p>
            )}
            {showHighVolumeNote && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                For larger teams, contact sales for custom onboarding.
              </p>
            )}
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Slider (50–5000)</span>
              <span className="text-sm font-600 text-foreground">{recordCount}</span>
            </div>
            <input
              type="range"
              min={MIN_RECORDS}
              max={SLIDER_MAX}
              value={Math.max(recordCount, MIN_RECORDS)}
              onChange={handleSliderChange}
              step="10"
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Billing Toggle */}
          <div className="space-y-3">
            <label className="text-sm font-600 text-foreground">Billing Period</label>
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              {(['monthly', 'yearly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setBillingPeriod(period)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-600 transition-colors capitalize ${
                    billingPeriod === period
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Price Result */}
        <div className="glass-card rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Category and Record Count */}
            <div className="space-y-2">
              <h3 className="text-sm font-600 text-muted-foreground">Your Selection</h3>
              <div className="text-2xl font-700 text-foreground">{businessLabel}</div>
              <div className="text-lg text-muted-foreground">
                {recordCount.toLocaleString('en-IN')} {recordLabel}
              </div>
            </div>

            {/* Billable Records */}
            <div className="border-t border-primary/10 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billable Records</span>
                <span className="text-sm font-600 text-foreground">
                  {billableRecords.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum: 50 records. Scale up as your business grows.
              </p>
            </div>

            {/* Price Display */}
            <div className="border-t border-primary/10 pt-4 space-y-1">
              <p className="text-sm text-muted-foreground">
                Estimated {billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'} Price
              </p>
              <div className="text-4xl font-700 text-primary">{formatINR(displayPrice)}</div>
            </div>

            {/* Breakdown */}
            {billingPeriod === 'yearly' && (
              <div className="bg-white/50 rounded-lg px-4 py-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly equivalent</span>
                  <span className="font-600 text-foreground">{formatINR(monthlyPrice)}</span>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <button className="w-full btn-primary py-3 px-4 rounded-xl font-600 transition-all hover:shadow-lg">
              Start with BizManage
            </button>
            <p className="text-xs text-muted-foreground text-center">
              No credit card required. 7-day free trial.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center">
        <p className="inline-block text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          ✓ Minimum billing: 50 records (₹450/month)
        </p>
      </div>
    </div>
  );
}
