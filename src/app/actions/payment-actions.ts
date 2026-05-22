
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

    if (error) {
      console.error("[Initiate Payment Error]", error);
      return { success: false, error: `Function Error: ${error.message || 'Check if payment-ops is deployed.'}` };
    }

    return data || { success: false, error: "Empty response from payment service." };
  } catch (err: any) { 
    console.error("[Initiate Payment Proxy Crash]", err);
    return { success: false, error: "Payment service connection failed." }; 
  }
}

export async function fulfillPaymentAction(orderTrackingId: string, merchantReference: string) {
  try {
    // 1. Check local DB first for instant fulfillment detection
    const { data: existing } = await supabase
      .from('processed_payments')
      .select('order_tracking_id')
      .eq('order_tracking_id', orderTrackingId)
      .maybeSingle();

    if (existing) {
      return { success: true, message: 'Payment already processed.' };
    }

    // 2. Otherwise, invoke the edge function to verify with PesaPal
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
    return { success: false, error: "Verification delayed. Real-time listener active." }; 
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
