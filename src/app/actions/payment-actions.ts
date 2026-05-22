
'use server';

import { supabase } from '@/lib/supabase';
import { PESAPAL_CONFIG } from '@/lib/pesapal-config';

/**
 * @fileOverview Secure PesaPal Proxies via Supabase Edge Functions.
 */

export async function initiatePesaPalPayment(amount: number, user: { uid: string, email: string, name: string }) {
  try {
    const { data, error } = await supabase.functions.invoke('payment-ops', {
      body: { 
        action: 'initiate',
        amount,
        user,
        callback_url: PESAPAL_CONFIG.CALLBACK_URL
      }
    });

    if (error) {
      console.error("[Initiate Payment Error]", error);
      return { success: false, error: `Edge Function Error: ${error.message}` };
    }

    return data || { success: false, error: "Empty response from payment service." };
  } catch (err: any) { 
    console.error("[Initiate Payment Proxy Crash]", err);
    return { success: false, error: "Payment service connection failed." }; 
  }
}

export async function fulfillPaymentAction(orderTrackingId: string, merchantReference: string) {
  try {
    // Instant check against the balance ledger
    const { data, error } = await supabase.functions.invoke('payment-ops', {
      body: { 
        action: 'fulfill',
        orderTrackingId,
        merchantReference
      }
    });

    if (error) throw error;
    return data;
  } catch (err: any) { 
    console.error("[Fulfill Payment Proxy Error]", err);
    return { success: false, error: "Verifying with server..." }; 
  }
}
