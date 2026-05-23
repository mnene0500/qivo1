import { NextResponse } from 'next/server';

/**
 * @fileOverview PesaPal IPN Callback.
 * This route is pinged by PesaPal to confirm status updates.
 */
export async function GET() {
  // PesaPal requires a 200 OK response for IPN pings
  return new NextResponse("OK", { status: 200 });
}

export async function POST() {
  // Handle POST if PesaPal sends notification data this way
  return new NextResponse("OK", { status: 200 });
}
