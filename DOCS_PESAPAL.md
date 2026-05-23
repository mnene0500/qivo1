
# QIVO PesaPal Production Secrets (Vercel Native)

Add these variables to your **Vercel Dashboard > Settings > Environment Variables** to enable live payments.

| Variable | Value | Description |
| :--- | :--- | :--- |
| `PESAPAL_CONSUMER_KEY` | *Your Key* | From PesaPal Live Dashboard |
| `PESAPAL_CONSUMER_SECRET` | *Your Secret* | From PesaPal Live Dashboard |
| `PESAPAL_IPN_ID` | *Unique ID* | Retrieve from `https://qivo-gamma.vercel.app/api/pesapal/setup` |

## ✅ Production URLs for PesaPal Dashboard
When configuring your PesaPal merchant account, use these URLs:

1. **Merchant IPN URL**: `https://qivo-gamma.vercel.app/api/pesapal/callback`
2. **Callback URL**: `https://qivo-gamma.vercel.app/payment-success`

## ✅ Phishing Protection
- **S2S (Server-to-Server) Verification**: We only trust PesaPal's API directly from Vercel, not user input.
- **Idempotency**: Every transaction is recorded in `processed_payments` to prevent double-awarding of coins.
- **Zero Latency**: No more cold starts from Edge Functions.
