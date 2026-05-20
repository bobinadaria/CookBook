-- Migration: add cook_time and servings to recipes
-- Run this once in Supabase Dashboard → SQL Editor

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cook_time integer;  -- total minutes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS servings  integer;  -- number of portions
