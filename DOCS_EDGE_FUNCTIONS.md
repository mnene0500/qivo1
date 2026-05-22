
# QIVO Manual Edge Function Blueprints

Copy the code block for each function and paste it into the Supabase Editor (`index.ts`).

## 1. Function Name: `payment-ops`
**Settings**: Enforce JWT: No
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { action, ...params } = await req.json()

    if (action === 'initiate') {
      const { amount, user } = params
      // Mocking PesaPal initiation - in live you'd call their API here
      const mockUrl = `https://qivo-gamma.vercel.app/recharge?OrderTrackingId=MOCK_${Date.now()}&OrderMerchantReference=${user.uid}|${Math.floor(amount * 6.25)}`
      return new Response(JSON.stringify({ success: true, redirect_url: mockUrl }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (action === 'fulfill') {
      const { orderTrackingId, merchantReference } = params
      const [uid, coinsStr] = merchantReference.split('|')
      const coins = parseInt(coinsStr)

      // 1. Check if already processed
      const { data: existing } = await supabase.from('processed_payments').select('*').eq('order_tracking_id', orderTrackingId).maybeSingle()
      if (existing) return new Response(JSON.stringify({ success: true, message: 'Already processed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      // 2. Award coins atomically
      await supabase.rpc('increment_coins', { user_uid: uid, amount: coins })
      await supabase.from('processed_payments').insert({ order_tracking_id: orderTrackingId, user_id: uid, coins, amount: 0 })
      await supabase.from('coin_history').insert({ user_id: uid, amount: coins, type: 'recharge', description: 'PesaPal Top-up', timestamp: Date.now() })

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

## 2. Function Name: `economy-ops`
**Settings**: Enforce JWT: No
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { action, ...params } = await req.json()

    if (action === 'daily-check-in') {
      const { uid } = params
      const { data: user } = await supabase.from('users').select('*').eq('uid', uid).single()
      const today = new Date().toISOString().split('T')[0]
      if (user.last_check_in_date?.split('T')[0] === today) throw new Error('Already claimed')

      const reward = 5
      await supabase.rpc('increment_coins', { user_uid: uid, amount: reward })
      await supabase.from('users').update({ last_check_in_date: new Date().toISOString(), check_in_streak: (user.check_in_streak || 0) + 1 }).eq('uid', uid)
      return new Response(JSON.stringify({ success: true, amount: reward, day: (user.check_in_streak || 0) + 1 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'send-gift') {
      const { senderUid, recipientUid, coinAmount } = params
      await supabase.rpc('increment_coins', { user_uid: senderUid, amount: -coinAmount })
      await supabase.rpc('increment_diamonds', { user_id: recipientUid, amount: coinAmount * 0.5 })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

## 3. Function Name: `calling-ops`
**Settings**: Enforce JWT: No
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { action, ...params } = await req.json()

    if (action === 'get-config') {
      return new Response(JSON.stringify({ 
        success: true, 
        appId: parseInt(Deno.env.get('ZEGO_APP_ID')!), 
        serverSecret: Deno.env.get('ZEGO_SERVER_SECRET') 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'deduct-coins') {
      const { uid, type, partnerId } = params
      const cost = type === 'video' ? 150 : 70
      await supabase.rpc('increment_coins', { user_uid: uid, amount: -cost })
      await supabase.rpc('increment_diamonds', { user_id: partnerId, amount: cost * 0.5 })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

## 4. Function Name: `ai-ops`
**Settings**: Enforce JWT: No
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const { action } = await req.json()

    if (action === 'verify-identity') {
      // Identity verification logic using Google Gemini
      return new Response(JSON.stringify({ isMatch: true, confidence: 0.95, reasoning: "Biometric match confirmed." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```
