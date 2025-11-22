/*
  # Create BlazeBold and ChallengeRoulette Features

  1. New Tables
    - `blazes` - Short video content (BlazeBold feature)
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `video_url` (text)
      - `thumbnail_url` (text)
      - `caption` (text)
      - `duration` (integer)
      - `view_count` (integer)
      - `like_count` (integer)
      - `stoke_count` (integer, engagement metric)
      - `vibe_score` (integer, AI sentiment score)
      - `is_spotlight` (boolean, promoted content)
      - `created_at` (timestamp)
    
    - `blaze_likes` - Track who liked which blaze
      - `id` (uuid, primary key)
      - `blaze_id` (uuid)
      - `user_id` (uuid)
      - `created_at` (timestamp)
    
    - `blaze_views` - Track blaze views
      - `id` (uuid, primary key)
      - `blaze_id` (uuid)
      - `user_id` (uuid, nullable for anonymous)
      - `created_at` (timestamp)
    
    - `challenges` - ChallengeRoulette dares
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `difficulty` (text)
      - `flame_reward` (integer, currency reward)
      - `participant_count` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
    
    - `challenge_participations` - User challenge entries
      - `id` (uuid, primary key)
      - `challenge_id` (uuid)
      - `user_id` (uuid)
      - `video_url` (text)
      - `status` (text)
      - `votes` (integer)
      - `created_at` (timestamp)
    
    - `achievements` - GlowVault badges
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `icon_url` (text)
      - `category` (text)
      - `rarity` (text)
      - `requirement` (text)
    
    - `user_achievements` - Track earned badges
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `achievement_id` (uuid)
      - `earned_at` (timestamp)
    
    - `flames` - Premium currency
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `balance` (integer)
      - `lifetime_earned` (integer)
      - `updated_at` (timestamp)
    
    - `transactions` - Currency transactions
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `amount` (integer)
      - `type` (text)
      - `description` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create blazes table
CREATE TABLE IF NOT EXISTS blazes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  caption text,
  duration integer DEFAULT 0,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  stoke_count integer DEFAULT 0,
  vibe_score integer,
  is_spotlight boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blazes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blazes"
  ON blazes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own blazes"
  ON blazes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blazes"
  ON blazes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blazes"
  ON blazes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create blaze_likes table
CREATE TABLE IF NOT EXISTS blaze_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blaze_id uuid REFERENCES blazes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blaze_id, user_id)
);

ALTER TABLE blaze_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blaze likes"
  ON blaze_likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can like blazes"
  ON blaze_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike blazes"
  ON blaze_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create blaze_views table
CREATE TABLE IF NOT EXISTS blaze_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blaze_id uuid REFERENCES blazes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blaze_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record their views"
  ON blaze_views FOR INSERT
  TO public
  WITH CHECK (true);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text DEFAULT 'general',
  difficulty text DEFAULT 'medium',
  flame_reward integer DEFAULT 50,
  participant_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  TO public
  USING (is_active = true);

-- Create challenge_participations table
CREATE TABLE IF NOT EXISTS challenge_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  video_url text NOT NULL,
  status text DEFAULT 'pending',
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenge participations"
  ON challenge_participations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can submit challenge entries"
  ON challenge_participations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their entries"
  ON challenge_participations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  category text DEFAULT 'general',
  rarity text DEFAULT 'common',
  requirement text
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO public
  USING (true);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  achievement_id uuid REFERENCES achievements(id) NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System awards achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create flames table
CREATE TABLE IF NOT EXISTS flames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) UNIQUE NOT NULL,
  balance integer DEFAULT 0,
  lifetime_earned integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE flames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own flames"
  ON flames FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their flames"
  ON flames FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert some starter achievements
INSERT INTO achievements (name, description, category, rarity, requirement) VALUES
  ('First Blaze', 'Posted your first BlazeBold video', 'blazebold', 'common', 'Post 1 blaze'),
  ('Rising Star', 'Got 100 likes on a single blaze', 'blazebold', 'rare', 'Get 100 likes'),
  ('Challenge Champion', 'Won a ChallengeRoulette', 'challenge', 'epic', 'Win a challenge'),
  ('Social Butterfly', 'Matched with 10 people', 'social', 'uncommon', 'Get 10 matches'),
  ('Pride Icon', 'Been on the platform for 30 days', 'milestone', 'rare', '30 days active'),
  ('Flame Collector', 'Earned 1000 Flames', 'currency', 'epic', 'Earn 1000 flames')
ON CONFLICT DO NOTHING;

-- Insert some starter challenges
INSERT INTO challenges (title, description, category, difficulty, flame_reward, expires_at) VALUES
  ('30 Second Pride Story', 'Share your coming out story or a proud moment in 30 seconds', 'storytelling', 'easy', 50, now() + interval '7 days'),
  ('Dance Challenge', 'Show us your best dance moves to your favorite queer anthem', 'entertainment', 'medium', 100, now() + interval '7 days'),
  ('Creative Makeup', 'Create a bold makeup look that expresses your identity', 'creativity', 'medium', 100, now() + interval '7 days'),
  ('Community Love', 'Give a shoutout to someone who supports you', 'social', 'easy', 50, now() + interval '7 days')
ON CONFLICT DO NOTHING;
