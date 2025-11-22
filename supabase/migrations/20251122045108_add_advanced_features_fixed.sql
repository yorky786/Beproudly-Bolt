/*
  # Add Advanced BeProudly Features

  1. New Tables
    - `devils_den_rooms` - Private chat rooms
    - `room_participants` - Room membership
    - `pride_circles` - Community groups
    - `blaze_trails` - Video narrative sequences
    - `trail_blazes` - Blazes in trails
    - `virtual_gifts` - Gift catalog
    - `gifts_sent` - Gift transactions
    - `vibe_scores` - AI compatibility scores

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Devils Den Rooms
CREATE TABLE IF NOT EXISTS devils_den_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  is_private boolean DEFAULT true,
  room_type text DEFAULT 'private',
  topic text,
  expires_at timestamptz,
  max_participants integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE devils_den_rooms ENABLE ROW LEVEL SECURITY;

-- Room Participants
CREATE TABLE IF NOT EXISTS room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES devils_den_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Now add policies for devils_den_rooms that reference room_participants
CREATE POLICY "Users can view rooms they participate in"
  ON devils_den_rooms FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = id
      AND room_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rooms"
  ON devils_den_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view room participants"
  ON room_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_participants rp
      WHERE rp.room_id = room_id
      AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms"
  ON room_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Pride Circles
CREATE TABLE IF NOT EXISTS pride_circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  is_public boolean DEFAULT true,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pride_circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public circles"
  ON pride_circles FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create circles"
  ON pride_circles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Blaze Trails
CREATE TABLE IF NOT EXISTS blaze_trails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  theme text,
  is_collaborative boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blaze_trails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trails"
  ON blaze_trails FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create trails"
  ON blaze_trails FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Trail Blazes
CREATE TABLE IF NOT EXISTS trail_blazes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id uuid REFERENCES blaze_trails(id) ON DELETE CASCADE NOT NULL,
  blaze_id uuid REFERENCES blazes(id) ON DELETE CASCADE NOT NULL,
  sequence_order integer NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(trail_id, blaze_id)
);

ALTER TABLE trail_blazes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trail blazes"
  ON trail_blazes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can add blazes to their trails"
  ON trail_blazes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blaze_trails
      WHERE blaze_trails.id = trail_id
      AND (blaze_trails.created_by = auth.uid() OR blaze_trails.is_collaborative = true)
    )
  );

-- Virtual Gifts
CREATE TABLE IF NOT EXISTS virtual_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  flame_cost integer DEFAULT 10,
  rarity text DEFAULT 'common',
  category text DEFAULT 'general'
);

ALTER TABLE virtual_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gifts"
  ON virtual_gifts FOR SELECT
  TO authenticated
  USING (true);

-- Gifts Sent
CREATE TABLE IF NOT EXISTS gifts_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id uuid REFERENCES virtual_gifts(id) NOT NULL,
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  recipient_id uuid REFERENCES profiles(id) NOT NULL,
  blaze_id uuid REFERENCES blazes(id),
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gifts_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gifts they sent or received"
  ON gifts_sent FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    recipient_id = auth.uid()
  );

CREATE POLICY "Users can send gifts"
  ON gifts_sent FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Vibe Scores
CREATE TABLE IF NOT EXISTS vibe_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  target_user_id uuid REFERENCES profiles(id) NOT NULL,
  compatibility_score integer DEFAULT 0,
  vibe_factors jsonb,
  icebreaker_suggestion text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

ALTER TABLE vibe_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vibe scores"
  ON vibe_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample virtual gifts
INSERT INTO virtual_gifts (name, description, flame_cost, rarity, category) VALUES
  ('Fire Rose', 'A blazing rose for someone special', 25, 'common', 'romantic'),
  ('Devil Horns', 'Show your devilish side', 50, 'uncommon', 'playful'),
  ('Rainbow Crown', 'For the royalty of pride', 100, 'rare', 'pride'),
  ('Flame Heart', 'Burning passion', 150, 'epic', 'romantic'),
  ('Pride Phoenix', 'Rising from the ashes', 500, 'legendary', 'pride')
ON CONFLICT DO NOTHING;
