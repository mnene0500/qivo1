
# Agora Production Secrets (Vercel Private)

Agora credentials are now strictly private. No more `NEXT_PUBLIC_` prefixes.

| Variable | Importance |
| :--- | :--- |
| `AGORA_APP_ID` | Critical |
| `AGORA_APP_CERTIFICATE` | **SECRET (Private)** |

## ✅ Security Model
QIVO generates **Dynamic Tokens** on the server for every call. 
1. The client requests a call.
2. Vercel uses the `AGORA_APP_CERTIFICATE` (which never reaches the user's phone) to sign an encrypted token.
3. The client joins the call using this secure token.
4. Billing (Coin deductions) happens atomically on Vercel via Server Actions.
