import { NextResponse } from 'next/server';
import { registerIPN, getIpnList } from '@/app/actions/payment-actions';
import { PESAPAL_CONFIG } from '@/lib/pesapal-config';

/**
 * @fileOverview Setup tool to retrieve IPN ID from PesaPal Live.
 */
export async function GET() {
  if (!PESAPAL_CONFIG.CONSUMER_KEY || !PESAPAL_CONFIG.CONSUMER_SECRET) {
    return NextResponse.json({
      status: "Config Error",
      message: "PesaPal credentials missing. Please set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET in your Environment Variables."
    }, { status: 400 });
  }

  try {
    // 1. Try to register the IPN for the current domain
    const registrationAttempt = await registerIPN();
    
    // 2. Fetch all currently registered IPNs
    const ipnList = await getIpnList();

    // 3. Find if our URL is already in the list
    const currentIpn = Array.isArray(ipnList) 
      ? ipnList.find((item: any) => item.url === PESAPAL_CONFIG.IPN_URL)
      : null;

    return NextResponse.json({
      message: "PesaPal Diagnostics",
      status: "Connected",
      target_url: PESAPAL_CONFIG.IPN_URL,
      instruction: currentIpn 
        ? `SUCCESS! Your IPN ID is found. Copy the value of 'recommended_ipn_id' below into your environment as PESAPAL_IPN_ID.` 
        : `Check 'currently_registered_ipns' below. If you don't see your URL, make sure the deployment is successful and public.`,
      recommended_ipn_id: currentIpn?.ipn_id || "Not found yet - check list below",
      registration_attempt: registrationAttempt,
      currently_registered_ipns: ipnList
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Diagnostics Failed",
      message: error.message
    }, { status: 500 });
  }
}
