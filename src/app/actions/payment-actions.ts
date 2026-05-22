
'use server';

import { supabase } from '@/lib/supabase';
import { PESAPAL_CONFIG } from '@/lib/pesapal-config';

/**
 * @fileOverview Secure PesaPal Proxies via Supabase Edge Functions.
 * These actions invoke your Edge Functions where keys are stored.
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

    if (error) throw error;
    return data;
  } catch (error: any) { 
    console.error("[Initiate Payment Proxy Error]", error);
    return { success: false, error: "Payment service unavailable." }; 
  }
}

export async function fulfillPaymentAction(orderTrackingId: string, merchantReference: string) {
  try {
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
    return { success: false, error: "Network delay. Please refresh." }; 
  }
}

export async function registerIPN() {
  try {
    const { data, error } = await supabase.functions.invoke('payment-ops', {
      body: { action: 'register-ipn', ipn_url: PESAPAL_CONFIG.IPN_URL }
    });
    if (error) throw error;
    return data;
  } catch (error: any) { return { error: error.message }; }
}

export async function getIpnList() {
  try {
    const { data, error } = await supabase.functions.invoke('payment-ops', {
      body: { action: 'get-ipn-list' }
    });
    if (error) throw error;
    return data;
  } catch (error: any) { return { error: error.message }; }
}
