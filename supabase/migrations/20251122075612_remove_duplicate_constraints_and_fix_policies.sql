/*
  # Remove Duplicate Constraints and Fix Multiple Permissive Policies

  1. Constraint Cleanup
    - Remove duplicate unique constraints keeping only one
    - blaze_likes, blocks, likes tables have duplicate constraints

  2. Policy Consolidation
    - Merge multiple permissive SELECT policies into single policies
    - Fixes profiles and vibe_scores tables

  3. Performance
    - Reduces constraint maintenance overhead
    - Simplifies policy evaluation
*/

-- Remove duplicate constraints (keep the _key constraint, drop the named one)
ALTER TABLE public.blaze_likes DROP CONSTRAINT IF EXISTS unique_blaze_like;
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS unique_block;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS unique_like;

-- Fix multiple permissive policies on profiles table
-- Combine both SELECT policies into one comprehensive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles except blocked users" ON public.profiles;

CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    -- User can view their own profile OR profiles not blocked by them
    (select auth.uid()) = id
    OR id NOT IN (
      SELECT blocked_id FROM public.blocks
      WHERE blocker_id = (select auth.uid())
    )
  );

-- Fix multiple permissive policies on vibe_scores table
-- Combine both SELECT policies into one comprehensive policy
DROP POLICY IF EXISTS "Users can view their own vibe scores" ON public.vibe_scores;
DROP POLICY IF EXISTS "Users can view vibe scores for their interactions" ON public.vibe_scores;

CREATE POLICY "Users can view vibe scores"
  ON public.vibe_scores FOR SELECT
  TO authenticated
  USING (
    -- User can view their own scores OR scores targeting them
    (select auth.uid()) = user_id
    OR (select auth.uid()) = target_user_id
  );
