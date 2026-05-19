
# PesaPal v3 LIVE Integration Guide for QIVO

This guide is specific to your production domain: **qivo-gamma.vercel.app**.

## 1. PesaPal Dashboard Settings
In your PesaPal Live Dashboard, configure your IPN settings as follows:

- **Merchant IPN Listener URL**: `https://qivo-gamma.vercel.app/api/pesapal/callback`
- **IPN Notification Type**: `GET`

*Note: Ensure the URL ends in `/callback` exactly as shown above.*

## 2. Environment Variables (Vercel Settings)
Add these EXACT variables to your Vercel project:

| Variable | Source | 
| :--- | :--- |
| `PESAPAL_CONSUMER_KEY` | PesaPal Live Dashboard |
| `PESAPAL_CONSUMER_SECRET` | PesaPal Live Dashboard |
| `PESAPAL_API_BASE_URL` | `https://pay.pesapal.com/v3` |
| `PESAPAL_IPN_URL` | `https://qivo-gamma.vercel.app/api/pesapal/callback` |
| `PESAPAL_CALLBACK_URL` | `https://qivo-gamma.vercel.app/recharge` |
| `PESAPAL_IPN_ID` | *Retrieved in Step 3 below* |

## 3. Registering your Live IPN (The "IPN ID")
This is the most critical step. Without it, PesaPal won't know where to send payment confirmations.
1. Log in to QIVO as an **Admin**.
2. Go to `https://qivo-gamma.vercel.app/pesapal-admin`.
3. Click **"Run Diagnostics & Register"**.
4. Copy the `recommended_ipn_id`. 
5. Add that ID to Vercel as `PESAPAL_IPN_ID` and **Redeploy**.

## 4. Realtime Database (RTDB) Rules
Your rules MUST allow the PesaPal background process to award coins. Copy this into your Firebase Console:

```json
{
  "rules": {
    "balances": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "true" 
      }
    },
    "coin_history": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "true"
      }
    },
    "processed_payments": {
      ".read": "true",
      ".write": "true" 
    },
    "user_chats": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null"
      }
    },
    "chat_messages": {
      "$chatId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "calls": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null"
      }
    }
  }
}
```
