-- Migration: Add Stripe fields to profiles
-- Run manually in Supabase SQL Editor.
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id    TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Optional: index for webhook lookups by customer ID
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
