
import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Secure Supabase Proxy Route.
 * This acts as a middleman that adds your private keys to every request.
 * The user's browser never sees your SUPABASE_URL or SUPABASE_ANON_KEY.
 */

export async function GET(req: NextRequest) { return handleProxy(req); }
export async function POST(req: NextRequest) { return handleProxy(req); }
export async function PUT(req: NextRequest) { return handleProxy(req); }
export async function PATCH(req: NextRequest) { return handleProxy(req); }
export async function DELETE(req: NextRequest) { return handleProxy(req); }

async function handleProxy(req: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase configuration missing on server." }, { status: 500 });
  }

  // Extract the target path (e.g., /auth/v1/token or /rest/v1/users)
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/supabase', '');
  const searchParams = url.search;
  
  const targetUrl = `${supabaseUrl}${path}${searchParams}`;

  // Forward the headers, but override the ones for Supabase
  const headers = new Headers(req.headers);
  headers.set('apikey', supabaseAnonKey);
  
  // If the client sent a generic 'proxy-auth-active' auth header, replace it with the real key
  // unless they provided their own user token (Bearer)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader.includes('proxy-auth-active')) {
    headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
  }

  // Remove host header to prevent SSL mismatches
  headers.delete('host');

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = await req.clone().arrayBuffer();
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    // Create the response from the Supabase result
    const resHeaders = new Headers(response.headers);
    // Don't leak Supabase internal headers
    resHeaders.delete('content-encoding'); 
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders
    });
  } catch (error: any) {
    console.error("[Supabase Proxy Error]:", error.message);
    return NextResponse.json({ error: "Failed to reach Supabase via Proxy." }, { status: 502 });
  }
}
