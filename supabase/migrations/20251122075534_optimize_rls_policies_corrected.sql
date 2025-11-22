/*
  # Optimize RLS Policies for Performance - Corrected

  1. Performance Improvements
    - Replace auth.uid() with (select auth.uid()) in all RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  2. Notes
    - Proper type casting for all comparisons
    - All security rules remain the same
*/

-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles except blocked users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can view profiles except blocked users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id NOT IN (
      SELECT blocked_id FROM public.blocks
      WHERE blocker_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- VIDEOS TABLE
DROP POLICY IF EXISTS "Users can view videos from non-blocked users" ON public.videos;
DROP POLICY IF EXISTS "Users can insert own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON public.videos;

CREATE POLICY "Users can view videos from non-blocked users"
  ON public.videos FOR SELECT
  TO authenticated
  USING (
    user_id NOT IN (
      SELECT blocked_id FROM public.blocks
      WHERE blocker_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own videos"
  ON public.videos FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own videos"
  ON public.videos FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own videos"
  ON public.videos FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- LIKES TABLE
DROP POLICY IF EXISTS "Users can view own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

CREATE POLICY "Users can view own likes"
  ON public.likes FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = liker_id);

CREATE POLICY "Users can insert own likes"
  ON public.likes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = liker_id);

CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = liker_id);

-- MATCHES TABLE
DROP POLICY IF EXISTS "Users can view own matches" ON public.matches;
DROP POLICY IF EXISTS "System can insert matches" ON public.matches;
DROP POLICY IF EXISTS "Users can update own matches" ON public.matches;

CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IN (user1_id, user2_id));

CREATE POLICY "System can insert matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IN (user1_id, user2_id));

CREATE POLICY "Users can update own matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IN (user1_id, user2_id))
  WITH CHECK ((select auth.uid()) IN (user1_id, user2_id));

-- MESSAGES TABLE
DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

CREATE POLICY "Users can view messages in their matches"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
      AND (select auth.uid()) IN (matches.user1_id, matches.user2_id)
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
      AND (select auth.uid()) IN (matches.user1_id, matches.user2_id)
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = sender_id)
  WITH CHECK ((select auth.uid()) = sender_id);

-- BLOCKS, REPORTS, CHALLENGES, BLAZES, etc.
DROP POLICY IF EXISTS "Users can view own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can insert own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete own blocks" ON public.blocks;

CREATE POLICY "Users can view own blocks"
  ON public.blocks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = blocker_id);

CREATE POLICY "Users can insert own blocks"
  ON public.blocks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = blocker_id);

CREATE POLICY "Users can delete own blocks"
  ON public.blocks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = reporter_id);

CREATE POLICY "Users can insert reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "Users can submit challenge entries" ON public.challenge_participations;
DROP POLICY IF EXISTS "Users can update their entries" ON public.challenge_participations;

CREATE POLICY "Users can submit challenge entries"
  ON public.challenge_participations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their entries"
  ON public.challenge_participations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own blazes" ON public.blazes;
DROP POLICY IF EXISTS "Users can update their own blazes" ON public.blazes;
DROP POLICY IF EXISTS "Users can delete their own blazes" ON public.blazes;

CREATE POLICY "Users can create their own blazes"
  ON public.blazes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own blazes"
  ON public.blazes FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own blazes"
  ON public.blazes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can like blazes" ON public.blaze_likes;
DROP POLICY IF EXISTS "Users can unlike blazes" ON public.blaze_likes;

CREATE POLICY "Users can like blazes"
  ON public.blaze_likes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can unlike blazes"
  ON public.blaze_likes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "System awards achievements" ON public.user_achievements;

CREATE POLICY "System awards achievements"
  ON public.user_achievements FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own flames" ON public.flames;
DROP POLICY IF EXISTS "Users can update their flames" ON public.flames;
DROP POLICY IF EXISTS "System can create flames for users" ON public.flames;

CREATE POLICY "Users can view their own flames"
  ON public.flames FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their flames"
  ON public.flames FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "System can create flames for users"
  ON public.flames FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view rooms they participate in" ON public.devils_den_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.devils_den_rooms;

CREATE POLICY "Users can view rooms they participate in"
  ON public.devils_den_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants
      WHERE room_participants.room_id = devils_den_rooms.id
      AND room_participants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create rooms"
  ON public.devils_den_rooms FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can view room participants" ON public.room_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_participants;

CREATE POLICY "Users can view room participants"
  ON public.room_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = room_participants.room_id
      AND rp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can join rooms"
  ON public.room_participants FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Anyone can view public circles" ON public.pride_circles;
DROP POLICY IF EXISTS "Users can create circles" ON public.pride_circles;

CREATE POLICY "Anyone can view public circles"
  ON public.pride_circles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Users can create circles"
  ON public.pride_circles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can create trails" ON public.blaze_trails;

CREATE POLICY "Users can create trails"
  ON public.blaze_trails FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can add blazes to their trails" ON public.trail_blazes;

CREATE POLICY "Users can add blazes to their trails"
  ON public.trail_blazes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blaze_trails
      WHERE blaze_trails.id = trail_blazes.trail_id
      AND blaze_trails.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view gifts they sent or received" ON public.gifts_sent;
DROP POLICY IF EXISTS "Users can send gifts" ON public.gifts_sent;

CREATE POLICY "Users can view gifts they sent or received"
  ON public.gifts_sent FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IN (sender_id, recipient_id));

CREATE POLICY "Users can send gifts"
  ON public.gifts_sent FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = sender_id);

DROP POLICY IF EXISTS "Users can view their own vibe scores" ON public.vibe_scores;
DROP POLICY IF EXISTS "Users can view vibe scores for their interactions" ON public.vibe_scores;

CREATE POLICY "Users can view their own vibe scores"
  ON public.vibe_scores FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view vibe scores for their interactions"
  ON public.vibe_scores FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = target_user_id);

DROP POLICY IF EXISTS "Users can view own rate limits" ON public.rate_limits;

CREATE POLICY "Users can view own rate limits"
  ON public.rate_limits FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own update tracker" ON public.profile_update_tracker;

CREATE POLICY "Users can view own update tracker"
  ON public.profile_update_tracker FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
