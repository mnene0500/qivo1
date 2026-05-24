-- V3: Hardened Supabase Economy SQL (match_flow_id based)

-- This script transitions your economy functions to use `match_flow_id` as the primary input,
-- while safely interacting with the `balances` table, which is keyed by `user_id` (UUID).

-- 1. Drop old functions to ensure a clean slate.
DROP FUNCTION IF EXISTS public.increment_coins(user_id UUID, amount BIGINT);
DROP FUNCTION IF EXISTS public.increment_diamonds(user_id UUID, amount NUMERIC);
DROP FUNCTION IF EXISTS public.increment_coins(p_user_id UUID, p_amount BIGINT);
DROP FUNCTION IF EXISTS public.increment_diamonds(p_user_id UUID, p_amount NUMERIC);

-- 2. Create the new `increment_coins` function using match_flow_id.
-- It now accepts a TEXT parameter for the `match_flow_id`.
CREATE OR REPLACE FUNCTION public.increment_coins(p_match_flow_id TEXT, p_amount BIGINT)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Look up the user\'s internal UUID from their public-facing match_flow_id.
  -- This is crucial for maintaining referential integrity with the balances table.
  SELECT uid INTO v_user_id FROM public.users WHERE match_flow_id = p_match_flow_id;

  -- If no user is found for the given match_flow_id, raise a clear error.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'MatchFlowID % not found. Cannot increment coins.', p_match_flow_id;
  END IF;

  -- Atomically insert a new balance record or update an existing one using the looked-up UUID.
  INSERT INTO public.balances (user_id, coins)
  VALUES (v_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    coins = COALESCE(balances.coins, 0) + p_amount, 
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the corresponding `increment_diamonds` function for consistency.
CREATE OR REPLACE FUNCTION public.increment_diamonds(p_match_flow_id TEXT, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Look up the user\'s internal UUID.
    SELECT uid INTO v_user_id FROM public.users WHERE match_flow_id = p_match_flow_id;

    -- Raise an error if not found.
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'MatchFlowID % not found. Cannot increment diamonds.', p_match_flow_id;
    END IF;

    -- Atomically insert or update the diamond balance using the UUID.
    INSERT INTO public.balances (user_id, diamonds)
    VALUES (v_user_id, p_amount)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        diamonds = COALESCE(balances.diamonds, 0) + p_amount, 
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Grant permissions for the new functions.
GRANT EXECUTE ON FUNCTION public.increment_coins(p_match_flow_id TEXT, p_amount BIGINT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_diamonds(p_match_flow_id TEXT, p_amount NUMERIC) TO authenticated, anon;
