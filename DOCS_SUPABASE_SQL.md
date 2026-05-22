
# QIVO Supabase SQL Setup

To enable the economy, gifting, reporting, and realtime systems, copy and run the following script in your **Supabase SQL Editor**. 

**IMPORTANT**: If you get a "type mismatch" error, it means your old tables have different column types. In that case, run `DROP TABLE IF EXISTS public.users, public.balances, public.reports CASCADE;` first (WARNING: this deletes existing data).

## 1. Core Tables & Realtime Schema

```sql
-- 1. EXTEND USERS TABLE (Ensure UID is UUID)
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  name TEXT,
  gender TEXT,
  dob DATE,
  country TEXT,
  looking_for TEXT,
  interests TEXT,
  photo_url TEXT,
  additional_photos TEXT[] DEFAULT '{}',
  match_flow_id TEXT UNIQUE,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_coin_seller BOOLEAN DEFAULT FALSE,
  is_agent BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  agency_id TEXT,
  agency_status TEXT, -- 'pending', 'approved', 'rejected'
  check_in_streak INTEGER DEFAULT 0,
  last_check_in_date TIMESTAMPTZ,
  blocking UUID[] DEFAULT '{}',
  blocked_by UUID[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WALLET BALANCES
CREATE TABLE IF NOT EXISTS public.balances (
  user_id UUID PRIMARY KEY REFERENCES public.users(uid) ON DELETE CASCADE,
  coins BIGINT DEFAULT 0,
  diamonds NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COIN LEDGER
CREATE TABLE IF NOT EXISTS public.coin_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE,
  amount BIGINT,
  type TEXT, -- 'recharge', 'gift_sent', 'chat', 'call', 'bonus', 'task'
  description TEXT,
  timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- 4. DIAMOND LEDGER
CREATE TABLE IF NOT EXISTS public.diamond_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE,
  amount NUMERIC,
  type TEXT, -- 'gift_received', 'conversion', 'withdrawal'
  description TEXT,
  timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- 5. PAYMENT TRACKING
CREATE TABLE IF NOT EXISTS public.processed_payments (
  order_tracking_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE,
  amount NUMERIC,
  coins BIGINT,
  payment_method TEXT,
  timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- 6. CHATS & MESSAGING
CREATE TABLE IF NOT EXISTS public.chats (
  id TEXT PRIMARY KEY,
  participant_ids UUID[] NOT NULL,
  last_message TEXT,
  last_message_at BIGINT,
  cleared_at JSONB DEFAULT '{}'::jsonb,
  last_seen_at JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(uid) ON DELETE CASCADE,
  text TEXT,
  timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
  is_gift BOOLEAN DEFAULT FALSE
);

-- 7. AGENCY SYSTEM
CREATE TABLE IF NOT EXISTS public.agencies (
  code TEXT PRIMARY KEY,
  agent_uid UUID REFERENCES public.users(uid) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE,
  agency_id TEXT REFERENCES public.agencies(code) ON DELETE CASCADE,
  diamonds NUMERIC,
  amount_kes NUMERIC,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'rejected'
  timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- 8. REPORTING SYSTEM
CREATE TABLE IF NOT EXISTS public.reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(uid) ON DELETE CASCADE,
  reported_id UUID REFERENCES public.users(uid) ON DELETE CASCADE,
  reason TEXT,
  description TEXT,
  proof_photo_url TEXT,
  status TEXT DEFAULT 'pending',
  timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- 9. ENABLE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.balances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coin_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diamond_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;

-- 10. PERMISSIONS (For Prototype Ease)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
```

## Next Steps
1. Execute the SQL above.
2. Go to **Database -> Replication** and confirm `supabase_realtime` has these tables enabled.
3. Your app is now ready for production-level live interactions.
