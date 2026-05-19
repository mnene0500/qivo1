
import { NextResponse } from 'next/server';
import { fulfillPaymentAction } from '@/app/actions/payment-actions';

/**
 * @fileOverview Webhook for PesaPal payment notifications.
 * Automatically fulfills coin orders upon successful payment verification.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Log the entire raw request for debugging in Vercel Console
  console.log("🔥 [PesaPal IPN] Webhook Received!");
  console.log(`[PesaPal IPN] Raw Query: ${searchParams.toString()}`);

  // PesaPal typically sends: OrderTrackingId, OrderMerchantReference, OrderNotificationType
  const orderTrackingId = searchParams.get('OrderTrackingId') || searchParams.get('orderTrackingId');
  const merchantReference = searchParams.get('OrderMerchantReference') || searchParams.get('orderMerchantReference');

  if (!orderTrackingId || !merchantReference) {
    console.error("[PesaPal IPN] ERROR: Missing required parameters (TrackingId or MerchantRef).");
    return NextResponse.json({ status: 'Error', message: 'Missing parameters' }, { status: 400 });
  }

  try {
    console.log(`[PesaPal IPN] Calling Fulfillment Action for Ref: ${merchantReference}`);
    const result = await fulfillPaymentAction(orderTrackingId, merchantReference);
    
    if (result.success) {
      console.log(`✅ [PesaPal IPN] SUCCESS. Coins awarded for ${merchantReference}`);
    } else {
      console.warn(`⚠️ [PesaPal IPN] LOGIC DECLINED: ${result.error}`);
    }

    // Required: Respond with OK so PesaPal stops retrying the IPN
    return NextResponse.json({
      OrderTrackingId: orderTrackingId,
      status: 'OK',
      processed: result.success,
      reason: result.error || 'Success'
    });
  } catch (error: any) {
    console.error("[PesaPal IPN] CRITICAL ERROR in Callback Route:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
