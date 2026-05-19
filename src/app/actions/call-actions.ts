'use server';

import { initializeFirebase } from '@/firebase';
import { ref, update, increment as rtdbIncrement, push, set, get } from 'firebase/database';

/**
 * Deducts coins from a user for an active call.
 */
export async function deductCallCoinsAction(uid: string, type: 'video' | 'voice', partnerName: string) {
  const { database: rtdb } = initializeFirebase();
  const cost = type === 'video' ? 150 : 70;

  try {
    const balanceSnap = await get(ref(rtdb, `balances/${uid}`));
    const currentBalance = balanceSnap.val()?.coins || 0;

    if (currentBalance < cost) {
      return { success: false, error: "Insufficient balance to continue call." };
    }

    const timestamp = Date.now();
    const updates: any = {};
    updates[`balances/${uid}/coins`] = rtdbIncrement(-cost);
    updates[`balances/${uid}/updatedAt`] = timestamp;

    await update(ref(rtdb), updates);

    // Log to history
    const historyRef = push(ref(rtdb, `coin_history/${uid}`));
    await set(historyRef, {
      amount: -cost,
      type: 'call',
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} call with ${partnerName}`,
      timestamp
    });

    return { success: true, newBalance: currentBalance - cost };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
