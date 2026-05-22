# QIVO Edge Function Production Code

Update your Supabase Edge Functions with these standardized code blocks.

## 1. Function Name: `payment-ops`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const PESA_ENV = "https://pay.pesapal.com/v3"

async function getPesapalToken() {
  const res = await fetch(`${PESA_ENV}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      consumer_key: Deno.env.get("PESAPAL_CONSUMER_KEY"),
      consumer_secret: Deno.env.get("PESAPAL_CONSUMER_SECRET"),
    }),
  })
  const data = await res.json()
  return data.token
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const body = await req.json()
    const { action } = body

    if (action === "initiate") {
      const { amount, user } = body
      const token = await getPesapalToken()
      
      const order = {
        id: crypto.randomUUID(),
        currency: "KES",
        amount: Number(amount),
        description: "QIVO Coins Recharge",
        callback_url: Deno.env.get("PESAPAL_CALLBACK_URL"),
        notification_id: Deno.env.get("PESAPAL_IPN_ID"),
        billing_address: { email_address: user.email || "user@qivo.app" },
      }

      const res = await fetch(`${PESA_ENV}/api/Transactions/SubmitOrderRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(order),
      })
      const data = await res.json()
      
      return new Response(JSON.stringify({ success: true, redirect_url: data.redirect_url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === "fulfill") {
      const { orderTrackingId, user_uid } = body
      const token = await getPesapalToken()
      
      const verifyRes = await fetch(`${PESA_ENV}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
      const statusData = await verifyRes.json()

      if (statusData.payment_status_description === "Completed") {
        const paidAmount = Number(statusData.amount)
        let coins = 0

        // PACKAGE MAPPING (Matches your Recharge Page)
        if (paidAmount >= 1800) coins = 20000
        else if (paidAmount >= 1000) coins = 10000
        else if (paidAmount >= 550) coins = 5000
        else if (paidAmount >= 230) coins = 2000
        else if (paidAmount >= 120) coins = 1000
        else if (paidAmount >= 80) coins = 500
        else coins = Math.floor(paidAmount * 200) // Support for 1 KES = 200 Coins test
        
        // 1. Atomic update
        const { error: rpcError } = await supabase.rpc("increment_coins", { user_uid, amount: coins })
        if (rpcError) throw rpcError

        // 2. Log history (CRITICAL: timestamp must be BIGINT / Number)
        await supabase.from("coin_history").insert({
          user_id: user_uid,
          amount: coins,
          type: "recharge",
          description: "Pesapal verified recharge",
          timestamp: Date.now(), 
        })

        return new Response(JSON.stringify({ success: true, verified: true, coins_added: coins }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }
      
      return new Response(JSON.stringify({ success: false, message: "Payment not completed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})
```

## 2. Function Name: `economy-ops`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const { action, ...params } = await req.json()

    if (action === "daily-check-in") {
      const { uid } = params
      const { data: user } = await supabase.from("users").select("*").eq("uid", uid).maybeSingle()
      if (!user) throw new Error("Profile not found")
      
      const reward = 5
      await supabase.rpc("increment_coins", { user_uid: uid, amount: reward })
      await supabase.from("users").update({ 
        last_check_in_date: new Date().toISOString(), 
        check_in_streak: (user.check_in_streak || 0) + 1 
      }).eq("uid", uid)
      
      return new Response(JSON.stringify({ success: true, amount: reward, day: (user.check_in_streak || 0) + 1 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === "award-coins") {
      const { targetMatchFlowId, amount } = params
      const { data: target } = await supabase.from("users").select("uid").eq("match_flow_id", targetMatchFlowId).single()
      if (!target) throw new Error("User ID not found.")
      
      await supabase.rpc("increment_coins", { user_uid: target.uid, amount: amount })
      await supabase.from("coin_history").insert({ 
        user_id: target.uid, 
        amount: amount, 
        type: "transfer", 
        description: "Merchant Award", 
        timestamp: Date.now() 
      })
      return new Response(JSON.stringify({ success: true, message: `Awarded ${amount} coins.` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === "send-gift") {
      const { senderUid, recipientUid, coinAmount } = params
      await supabase.rpc("increment_coins", { user_uid: senderUid, amount: -coinAmount })
      await supabase.rpc("increment_diamonds", { user_id: recipientUid, amount: coinAmount * 0.5 })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
    
    return new Response(JSON.stringify({ error: "Action not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})
```
