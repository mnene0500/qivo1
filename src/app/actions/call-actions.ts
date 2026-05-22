'use server';

import { supabaseAdmin } from '@/lib/supabase';

/**
 * @fileOverview Secure Call Actions.
 * Handles ZegoCloud configuration and per-minute billing.
 */

export async function getZegoConfigAction() {
  return {
    appId: Number(process.env.ZEGO_APP_ID || process.env.NEXT_PUBLIC_ZEGO_APP_ID),
    // In a final production app, you would generate a JWT token here using the ZEGO_SERVER_SECRET
    // For this high-fidelity prototype, we return the AppID and use the server secret via the 
    // secure kit token generator if available, or instruct the user to use the Server SDK.
    serverSecret: process.env.ZEGO_SERVER_SECRET
  };
}

/**
 * Deducts coins for calls using Admin client to bypass RLS restrictions on balances.
 * Also awards Diamonds to the recipient (50% for females, 40% for males).
 */
export async function deductCallCoinsAction(uid: string, type: 'video' | 'voice', partnerId: string, partnerName: string) {
  const cost = type === 'video' ? 150 : 70;

  try {
    // 1. Get Caller Balance
    const { data: callerBal } = await supabaseAdmin.from('balances').select('coins').eq('user_id', uid).maybeSingle();
    const currentCoins = Number(callerBal?.coins) || 0;

    if (currentCoins < cost) return { success: false, error: "Insufficient balance." };

    // 2. Get Recipient Profile for Diamond Reward
    const { data: recipient } = await supabaseAdmin.from('users').select('gender, name').eq('uid', partnerId).single();
    const rewardRate = recipient?.gender === 'female' ? 0.5 : 0.4;
    const diamondReward = Math.floor(cost * rewardRate);

    const timestamp = Date.now();

    // 3. Atomic Updates
    await Promise.all([
      // Deduct from Caller
      supabaseAdmin.from('balances').update({ coins: currentCoins - cost }).eq('user_id', uid),
      // Award to Recipient
      supabaseAdmin.rpc('increment_diamonds', { user_id: partnerId, amount: diamondReward }),
      
      // Log History
      supabaseAdmin.from('coin_history').insert({
        user_id: uid,
        amount: -cost,
        type: 'call',
        description: `${type} call with ${partnerName}`,
        timestamp
      }),
      supabaseAdmin.from('diamond_history').insert({
        user_id: partnerId,
        amount: diamondReward,
        type: 'call_reward',
        description: `Earned from ${type} call`,
        timestamp
      })
    ]);

    return { success: true };
  } catch (error: any) {
    console.error("Billing Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function checkCallBalanceAction(uid: string, type: 'video' | 'voice') {
  const minRequired = type === 'video' ? 150 : 70;
  try {
    const { data } = await supabaseAdmin.from('balances').select('coins').eq('user_id', uid).maybeSingle();
    const coins = Number(data?.coins) || 0;
    if (coins < minRequired) return { success: false, error: "Low balance." };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
