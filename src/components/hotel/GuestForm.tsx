'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { handleAppError } from '@/utils/appErrorHandler';
import { useBusiness } from '@/context/BusinessContext';
import { addHotelGuest, updateHotelGuest } from '@/services/hotelGuestsService';

interface Props {
  initial?: any;
  onSaved?: (savedId?: string) => void;
  onCancel?: () => void;
}

export default function GuestForm({ initial, onSaved, onCancel }: Props) {
  const { business } = useBusiness();
  const businessId = business?.businessId ?? '';

  const { register, handleSubmit, watch, setValue, formState } = useForm<any>({
    defaultValues: initial ?? {},
  });

  useEffect(() => {
    const toInput = (iso?: string) => {
      if (!iso) return undefined;
      // datetime-local expects YYYY-MM-DDTHH:mm
      try {
        return new Date(iso).toISOString().slice(0, 16);
      } catch {
        return iso.slice(0, 16);
      }
    };

    if (!initial) {
      const now = new Date().toISOString().slice(0, 16);
      setValue('checkInDateTime', now);
    } else {
      if (initial.checkInDateTime) setValue('checkInDateTime', toInput(initial.checkInDateTime));
      if (initial.checkOutDateTime) setValue('checkOutDateTime', toInput(initial.checkOutDateTime));
    }
  }, [initial, setValue]);

  const onSubmit = async (values: any) => {
    try {
      if (!businessId) throw new Error('NO_BUSINESS');

      if (!/^[0-9]{12}$/.test(String(values.aadhaarNumber ?? '').trim())) {
        toast.error('Please enter a valid 12 digit Aadhaar number');
        return;
      }

      if (initial?.guestId) {
        await updateHotelGuest(businessId, initial.guestId, values);
        toast.success('Guest Updated Successfully');
        onSaved?.(initial.guestId);
      } else {
        const id = await addHotelGuest(businessId, values);
        toast.success('Guest Added Successfully');
        onSaved?.(id);
      }
    } catch (err: any) {
      console.error('[guest-form] save error', err);
      if (err?.message === 'DUPLICATE_AADHAAR') {
        toast.error('Unable To Save Guest');
      } else if (err?.message === 'INVALID_AADHAAR') {
        toast.error('Unable To Save Guest');
      } else {
        handleAppError(err, 'Unable To Save Guest');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="text-sm font-600">Customer Name *</label>
        <input
          {...register('customerName', { required: true })}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-border"
        />
      </div>

      <div>
        <label className="text-sm font-600">Age *</label>
        <input
          type="number"
          {...register('age', { required: true, min: 0 })}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-border"
        />
      </div>

      <div>
        <label className="text-sm font-600">Aadhaar Card Number *</label>
        <input
          {...register('aadhaarNumber', { required: true, pattern: /^[0-9]{12}$/ })}
          maxLength={12}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-border"
        />
      </div>

      <div>
        <label className="text-sm font-600">Vehicle Number</label>
        <input
          {...register('vehicleNumber')}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-border"
        />
      </div>

      <div>
        <label className="text-sm font-600">Address *</label>
        <textarea
          {...register('address', { required: true })}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-border"
        />
      </div>

      <div>
        <label className="text-sm font-600">Check-In Date & Time *</label>
        <input
          type="datetime-local"
          {...register('checkInDateTime', { required: true })}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-border"
        />
      </div>

      <div>
        <label className="text-sm font-600">Check-Out Date & Time (optional)</label>
        <input
          type="datetime-local"
          {...register('checkOutDateTime')}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-border"
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">
          {initial ? 'Update' : 'Add'} Guest
        </button>
        <button type="button" onClick={() => onCancel?.()} className="px-4 py-2 border rounded-lg">
          Cancel
        </button>
      </div>
    </form>
  );
}
