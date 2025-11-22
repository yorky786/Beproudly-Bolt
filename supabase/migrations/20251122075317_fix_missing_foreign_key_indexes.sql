/*
  # Fix Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes for all unindexed foreign keys
    - This significantly improves JOIN performance and query optimization
    
  2. Tables Affected
    - blaze_likes, blaze_trails, blaze_views, blazes
    - challenge_participations, devils_den_rooms
    - gifts_sent, pride_circles, room_participants
    - trail_blazes, transactions, user_achievements, vibe_scores

  3. Notes
    - These indexes are critical for query performance at scale
    - Foreign keys without indexes can cause table scans
*/

-- Blaze-related tables
CREATE INDEX IF NOT EXISTS idx_blaze_likes_user_id ON public.blaze_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_blaze_trails_created_by ON public.blaze_trails(created_by);
CREATE INDEX IF NOT EXISTS idx_blaze_views_blaze_id ON public.blaze_views(blaze_id);
CREATE INDEX IF NOT EXISTS idx_blaze_views_user_id ON public.blaze_views(user_id);
CREATE INDEX IF NOT EXISTS idx_blazes_user_id ON public.blazes(user_id);

-- Challenge participations
CREATE INDEX IF NOT EXISTS idx_challenge_participations_user_id ON public.challenge_participations(user_id);

-- Devils Den
CREATE INDEX IF NOT EXISTS idx_devils_den_rooms_created_by ON public.devils_den_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON public.room_participants(user_id);

-- Gifts
CREATE INDEX IF NOT EXISTS idx_gifts_sent_blaze_id ON public.gifts_sent(blaze_id);
CREATE INDEX IF NOT EXISTS idx_gifts_sent_gift_id ON public.gifts_sent(gift_id);
CREATE INDEX IF NOT EXISTS idx_gifts_sent_recipient_id ON public.gifts_sent(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gifts_sent_sender_id ON public.gifts_sent(sender_id);

-- Pride Circles
CREATE INDEX IF NOT EXISTS idx_pride_circles_created_by ON public.pride_circles(created_by);

-- Trail Blazes
CREATE INDEX IF NOT EXISTS idx_trail_blazes_blaze_id ON public.trail_blazes(blaze_id);

-- Transactions and Achievements
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- Vibe Scores
CREATE INDEX IF NOT EXISTS idx_vibe_scores_target_user_id ON public.vibe_scores(target_user_id);
