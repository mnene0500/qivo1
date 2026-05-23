
# QIVO PesaPal Production (Vercel Private)

All PesaPal secrets are now stored as **Private Environment Variables** in Vercel. 
They do NOT have the `NEXT_PUBLIC_` prefix.

| Variable | Importance | Description |
| :--- | :--- | :--- |
| `PESAPAL_CONSUMER_KEY` | Critical | From PesaPal Dashboard |
| `PESAPAL_CONSUMER_SECRET` | Critical | From PesaPal Dashboard |
| `PESAPAL_IPN_ID` | Critical | Retrieve via `/api/pesapal/setup` |

## 🛡️ Phishing Protection
QIVO uses **Server-to-Server (S2S)** verification. 
1. The user pays on PesaPal.
2. PesaPal redirects the user back to QIVO.
3. QIVO's **Server Action** calls PesaPal's API directly using your secret keys to confirm the payment.
4. Coins are only awarded if PesaPal confirms the status is "Completed".
5. Every transaction is recorded in `processed_payments` to prevent double-awarding (Idempotency).
