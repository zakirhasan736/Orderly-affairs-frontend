'use client';

import React from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useConfirmCardMutation } from '@/services/billingApi';
import { devError } from '@/utils/clientLogger';

interface Props {
  onSuccess: () => void;
}

export const StripePaymentForm: React.FC<Props> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [confirmCard, { isLoading }] = useConfirmCardMutation();

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      alert(error.message);
      return;
    }

    try {
      await confirmCard({
        payment_method_id: paymentMethod.id,
      }).unwrap();

      onSuccess();
    } catch (err) {
      devError('Card confirmation failed', err);
      alert('Failed to save card');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: '16px',
                color: '#0f172a',
                '::placeholder': {
                  color: '#94a3b8',
                },
              },
            },
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-4 bg-[#1e293b] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50"
      >
        {isLoading ? 'Saving…' : 'Save Card'}
      </button>
    </div>
  );
};
