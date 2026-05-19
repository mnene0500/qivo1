
# PesaPal v3 LIVE Integration Guide for QIVO

This guide is specific to your production domain: **qivo-gamma.vercel.app**.

## 1. PesaPal Dashboard Settings
In your PesaPal Live Dashboard, configure your IPN settings as follows:

- **Merchant IPN Listener URL**: `https://qivo-gamma.vercel.app/api/pesapal/callback`
- **IPN Notification Type**: `GET`

## 2. Environment Variables (Vercel Settings)
Add the following variables exactly as shown to your Vercel project environment:

| Variable | Value | 
| :--- | :--- |
| `PESAPAL_CONSUMER_KEY` | *Get this from PesaPal Live Dashboard* |
| `PESAPAL_CONSUMER_SECRET` | *Get this from PesaPal Live Dashboard* |
| `PESAPAL_API_BASE_URL` | `https://pay.pesapal.com/v3` |
| `PESAPAL_IPN_URL` | `https://qivo-gamma.vercel.app/api/pesapal/callback` |
| `PESAPAL_CALLBACK_URL` | `https://qivo-gamma.vercel.app/recharge` |
| `PESAPAL_IPN_ID` | *Retrieved in Step 3* |

## 3. Registering your Live IPN (The "IPN ID")
Once you have added the first 5 variables and redeployed:
1. Log in to QIVO as an **Admin**.
2. Go to `https://qivo-gamma.vercel.app/pesapal-admin`.
3. Click **"Run Diagnostics & Register"**.
4. The tool will talk to PesaPal Live and return a `recommended_ipn_id`. 
5. Copy that ID and add it to Vercel as `PESAPAL_IPN_ID`.
6. **Redeploy one last time.**

## 4. Realtime Database (RTDB) Rules
**CRITICAL:** For chats, calls, and payments to work correctly, your RTDB rules MUST allow both authenticated users and the background fulfillment process to write data. Copy and paste this into your Firebase Console:

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
    "diamond_history": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null"
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

## 5. Troubleshooting
If coins are not being awarded:
1. Check Vercel logs for `🔥 IPN HIT RECEIVED`.
2. Ensure `PESAPAL_IPN_ID` matches the one shown in your dashboard.
3. Verify that your Merchant Reference prefix in `payment-actions.ts` is `QV_`.
