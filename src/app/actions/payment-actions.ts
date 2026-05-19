
'use server';

import { PESAPAL_CONFIG } from '@/lib/pesapal-config';
import { initializeFirebase } from '@/firebase';
import { ref, update, increment, push, set, get } from 'firebase/database';

/**
 * @fileOverview PesaPal integration actions for API v3.
 * Optimized for secure fulfillment and clear logging.
 */

export interface TransactionStatusResponse {
  amount: number;
  currency: string;
  status_code: number;
  payment_method: string;
}

/**
 * Authenticates with PesaPal and returns an access token.
 */
export async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    console.error("[PesaPal Auth] CRITICAL ERROR: PESAPAL_CONSUMER_KEY or SECRET missing in environment.");
    throw new Error('PesaPal Configuration Error: Missing Keys');
  }

  const response = await fetch(`${PESAPAL_CONFIG.API_BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[PesaPal Auth] Failed to get token. Response:", errText);
    throw new Error('Failed to fetch PesaPal access token.');
  }

  const data = await response.json();
  return data.token;
}

/**
 * Initiates a payment request with PesaPal.
 */
export async function initiatePesaPalPayment(amount: number, user: { uid: string, email: string, name: string }) {
  console.log(`[PesaPal Payment] Initiating KES ${amount} for User ${user.uid}`);
  
  try {
    const ipnId = process.env.PESAPAL_IPN_ID;
    if (!ipnId) {
      console.error("[PesaPal Payment] FAILED: PESAPAL_IPN_ID is missing in Vercel.");
      return { 
        success: false, 
        error: "Configuration Error: IPN ID is missing. Go to /pesapal-admin to register your domain." 
      };
    }

    const token = await getAccessToken();
    // Reference format: QV_{uid}_{timestamp}
    const merchantReference = `QV_${user.uid}_${Date.now()}`;
    
    const payload = {
      id: merchantReference,
      currency: "KES",
      amount: amount,
      description: `QIVO Coin Recharge for ${user.name}`,
      callback_url: PESAPAL_CONFIG.CALLBACK_URL,
      notification_id: ipnId,
      billing_address: {
        email_address: user.email,
        phone_number: "",
        country_code: "KE",
        first_name: user.name.split(' ')[0] || "User",
        last_name: user.name.split(' ')[1] || "QIVO",
        line_1: "Nairobi",
        line_2: "",
        city: "Nairobi",
        state: "Nairobi",
        postal_code: "00100",
        zip_code: "00100"
      }
    };

    const response = await fetch(`${PESAPAL_CONFIG.API_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[PesaPal Payment] Order rejected:", JSON.stringify(errorData));
      return { success: false, error: errorData.message || 'PesaPal rejected the order.' };
    }

    const data = await response.json();
    console.log(`[PesaPal Payment] Order Created: ${data.order_tracking_id}`);
    return { 
      success: true, 
      redirect_url: data.redirect_url, 
      order_tracking_id: data.order_tracking_id 
    };
  } catch (error: any) {
    console.error("[PesaPal Payment] Exception during initiation:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches the status of a transaction from PesaPal.
 */
export async function getTransactionStatus(orderTrackingId: string): Promise<TransactionStatusResponse | null> {
  try {
    const token = await getAccessToken();
    const response = await fetch(`${PESAPAL_CONFIG.API_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error("[PesaPal Status] Failed to fetch status for", orderTrackingId, await response.text());
      return null;
    }
    
    const data = await response.json();
    console.log(`[PesaPal Status] API Response for ${orderTrackingId}:`, JSON.stringify(data));
    
    return {
      amount: Number(data.amount || 0),
      currency: data.currency || 'KES',
      status_code: Number(data.status_code),
      payment_method: data.payment_method || 'Unknown'
    };
  } catch (error: any) {
    console.error("[PesaPal Status] Exception during fetch:", error.message);
    return null;
  }
}

/**
 * Securely fulfills a payment by checking status and updating RTDB.
 * This is the SINGLE SOURCE OF TRUTH for awarding coins.
 */
export async function fulfillPaymentAction(orderTrackingId: string, merchantReference: string) {
  console.log(`[PesaPal Fulfillment] START. Order: ${orderTrackingId}, Ref: ${merchantReference}`);
  
  try {
    const status = await getTransactionStatus(orderTrackingId);
    
    if (status && status.status_code === 1) {
      const { database: rtdb } = initializeFirebase();
      if (!rtdb) {
        console.error("[PesaPal Fulfillment] CRITICAL: Firebase Database not available.");
        return { success: false, error: "Database not connected" };
      }
      
      // Extraction: QV_{uid}_{timestamp}
      const parts = merchantReference.split('_');
      // Parts should be ["QV", "UID", "TIMESTAMP"]
      const uid = parts[1];

      if (!uid || uid.length < 5) {
        console.error("[PesaPal Fulfillment] INVALID REFERENCE. UID missing or too short:", merchantReference);
        return { success: false, error: "Invalid User Reference" };
      }

      // Idempotency: Prevent double-award
      const processedRef = ref(rtdb, `processed_payments/${orderTrackingId}`);
      const snap = await get(processedRef);
      if (snap.exists()) {
        console.log(`[PesaPal Fulfillment] ALREADY PROCESSED. Order: ${orderTrackingId}`);
        return { success: true, message: "Already awarded", coins: snap.val().coins };
      }

      // Coin Tier Mapping (Matches package amounts in recharge page)
      const amount = Number(status.amount);
      let coinsToAward = 0;
      
      if (amount >= 1800) coinsToAward = 20000;
      else if (amount >= 1000) coinsToAward = 10000;
      else if (amount >= 550) coinsToAward = 5000;
      else if (amount >= 230) coinsToAward = 2000;
      else if (amount >= 120) coinsToAward = 1000;
      else if (amount >= 80) coinsToAward = 500;
      else if (amount >= 1) coinsToAward = 200; // Smallest test package

      if (coinsToAward > 0) {
        const timestamp = Date.now();
        const updates: any = {};
        
        updates[`balances/${uid}/coins`] = increment(coinsToAward);
        updates[`balances/${uid}/updatedAt`] = timestamp;
        
        updates[`processed_payments/${orderTrackingId}`] = {
          uid,
          amount,
          coins: coinsToAward,
          timestamp,
          merchantReference,
          payment_method: status.payment_method
        };

        console.log(`[PesaPal Fulfillment] WRITING TO DATABASE for User: ${uid}, Coins: ${coinsToAward}`);
        await update(ref(rtdb), updates);

        // Record history
        const historyRef = push(ref(rtdb, `coin_history/${uid}`));
        await set(historyRef, {
          amount: coinsToAward,
          type: 'recharge',
          description: `PesaPal: KES ${amount}`,
          timestamp
        });

        console.log(`[PesaPal Fulfillment] SUCCESS: Awarded ${coinsToAward} coins to ${uid}`);
        return { success: true, coins: coinsToAward };
      } else {
        console.warn(`[PesaPal Fulfillment] FAILED: Amount ${amount} did not match any coin tier.`);
        return { success: false, error: "Amount too low for coins" };
      }
    }
    
    console.warn(`[PesaPal Fulfillment] Payment not successful or status pending. Code: ${status?.status_code}`);
    return { success: false, error: "Payment verification failed or pending" };
  } catch (err: any) {
    console.error("[PesaPal Fulfillment] EXCEPTION:", err.message);
    return { success: false, error: err.message };
  }
}

export async function registerIPN() {
  try {
    const token = await getAccessToken();
    const response = await fetch(`${PESAPAL_CONFIG.API_BASE_URL}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url: PESAPAL_CONFIG.IPN_URL,
        ipn_notification_type: 'GET',
      }),
    });
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getIpnList() {
  try {
    const token = await getAccessToken();
    const response = await fetch(`${PESAPAL_CONFIG.API_BASE_URL}/api/URLSetup/GetIpnList`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}
