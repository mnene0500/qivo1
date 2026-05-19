
import { NextResponse } from 'next/server';
import { fulfillPaymentAction } from '@/app/actions/payment-actions';

/**
 * @fileOverview Webhook for PesaPal payment notifications.
 * Automatically fulfills coin orders upon successful payment verification in Realtime.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Handle both possible PesaPal parameter casings
  const orderTrackingId = searchParams.get('OrderTrackingId') || searchParams.get('orderTrackingId');
  const merchantReference = searchParams.get('OrderMerchantReference') || searchParams.get('orderMerchantReference');

  console.log("🔥 IPN HIT RECEIVED - BACKGROUND FULFILLMENT START");
  console.log(`[PesaPal Params] Tracking: ${orderTrackingId}, Reference: ${merchantReference}`);

  if (!orderTrackingId || !merchantReference) {
    console.error("[PesaPal IPN Error] Missing required parameters in callback URL.");
    return NextResponse.json({ 
      status: 'Invalid Request', 
      message: 'Missing OrderTrackingId or MerchantReference' 
    }, { status: 400 });
  }

  try {
    const result = await fulfillPaymentAction(orderTrackingId, merchantReference);
    
    if (result.success) {
      console.log(`✅ [IPN SUCCESS] Fulfilled payment for ref: ${merchantReference}`);
    } else {
      console.warn(`⚠️ [IPN WARNING] Fulfillment logic returned success:false: ${result.error}`);
    }

    // Respond with status OK so PesaPal knows the IPN was successfully received
    return NextResponse.json({
      OrderTrackingId: orderTrackingId,
      status: 'OK',
      awarded: result.success
    });
  } catch (error: any) {
    console.error("[PesaPal IPN Critical Failure]:", error.message);
    // Return a 500 error to force PesaPal to retry later if it was a temporary failure
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
