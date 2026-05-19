
import { NextResponse } from 'next/server';
import { fulfillPaymentAction } from '@/app/actions/payment-actions';

/**
 * @fileOverview Webhook for PesaPal payment notifications.
 * Automatically fulfills coin orders upon successful payment verification.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Handle both possible PesaPal parameter casings
  const orderTrackingId = searchParams.get('OrderTrackingId') || searchParams.get('orderTrackingId');
  const merchantReference = searchParams.get('OrderMerchantReference') || searchParams.get('orderMerchantReference');

  console.log("🔥 [PesaPal IPN] Webhook Hit Received");
  console.log(`[PesaPal IPN] Tracking ID: ${orderTrackingId}`);
  console.log(`[PesaPal IPN] Merchant Ref: ${merchantReference}`);

  if (!orderTrackingId || !merchantReference) {
    console.error("[PesaPal IPN] Error: Missing required parameters in callback.");
    return NextResponse.json({ status: 'Error', message: 'Missing parameters' }, { status: 400 });
  }

  try {
    const result = await fulfillPaymentAction(orderTrackingId, merchantReference);
    
    if (result.success) {
      console.log(`✅ [PesaPal IPN] Fulfillment Success for ${merchantReference}`);
    } else {
      console.warn(`⚠️ [PesaPal IPN] Fulfillment logic declined: ${result.error}`);
    }

    // Required: Respond with OK so PesaPal stops retrying the IPN
    return NextResponse.json({
      OrderTrackingId: orderTrackingId,
      status: 'OK',
      processed: result.success
    });
  } catch (error: any) {
    console.error("[PesaPal IPN] CRITICAL FAILURE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
