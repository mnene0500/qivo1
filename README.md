
# QIVO Production Platform

This is the production-ready build of QIVO, optimized for Supabase and integrated with PesaPal, ZegoCloud, and Gemini AI.

## 🚀 Critical Production Checklist

To enable all features, you MUST complete these steps in order:

### 1. Database Initialization
Run the SQL script found in [DOCS_SUPABASE_SQL.md](./DOCS_SUPABASE_SQL.md) in your **Supabase SQL Editor**. This sets up the wallet, gifting, and Row Level Security (RLS).

### 2. Vercel Environment Variables
Add the following keys to your **Vercel Dashboard > Settings > Environment Variables**:

| Service | Variable Name | Importance |
| :--- | :--- | :--- |
| **Supabase (Public)** | `NEXT_PUBLIC_SUPABASE_URL` | **CRITICAL** (Browser connection) |
| **Supabase (Public)** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **CRITICAL** (Browser connection) |
| **Supabase (Secret)** | `SUPABASE_SERVICE_ROLE_KEY` | **CRITICAL** (Financial transactions) |
| **ZegoCloud** | `ZEGO_APP_ID`, `ZEGO_SERVER_SECRET` | Voice/Video Calling |
| **PesaPal** | `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET`, `PESAPAL_IPN_ID` | Coin Recharge |
| **Gemini AI** | `GOOGLE_GENAI_API_KEY` | Identity Verification |

### 3. PesaPal IPN Registration
Once the app is live on Vercel:
1. Log in as an Admin.
2. Visit `/pesapal-admin`.
3. Run the "Live Registration" tool to get your `PESAPAL_IPN_ID`.
4. Update Vercel with this ID and redeploy.

## 💎 Core Features
- **Secure Economy**: Coins/Diamonds managed via atomic server-side transactions.
- **Biometric Verification**: AI face-matching using Genkit and Gemini 2.5 Flash.
- **Premium Calling**: One-on-one video/voice calls with per-minute billing and recipient rewards.
- **Agency Ecosystem**: Integrated recruitment and diamond withdrawal management.
- **Safe Community**: Multi-layered reporting, blocking, and admin control centers.
