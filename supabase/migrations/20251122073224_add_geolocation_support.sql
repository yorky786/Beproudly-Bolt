/*
  # Add Geolocation Support

  ## Overview
  This migration adds geolocation support to enable finding nearby users
  based on their real-time location or stored location coordinates.

  ## Changes Made

  1. **Add Coordinates to Profiles**
     - latitude and longitude columns
     - last_location_update timestamp
     - location_enabled boolean flag

  2. **Create Distance Calculation Function**
     - PostgreSQL function to calculate distance between coordinates
     - Uses Haversine formula for accurate earth-surface distance

  3. **Create Nearby Users Function**
     - Returns users within specified radius
     - Ordered by distance from user's location

  4. **Add Indexes**
     - Geospatial indexes for performance

  ## Security
  - RLS policies ensure users can only update their own coordinates
  - Location data is optional and can be disabled by user
*/

-- Add geolocation columns to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS last_location_update timestamptz,
  ADD COLUMN IF NOT EXISTS location_enabled boolean DEFAULT false;

-- Add constraint to ensure valid coordinates
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_latitude;
ALTER TABLE profiles ADD CONSTRAINT valid_latitude 
  CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_longitude;
ALTER TABLE profiles ADD CONSTRAINT valid_longitude 
  CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Create function to calculate distance between two points (Haversine formula)
-- Returns distance in kilometers
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision AS $$
DECLARE
  earth_radius double precision := 6371;
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;

  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to find nearby users
CREATE OR REPLACE FUNCTION find_nearby_users(
  user_latitude double precision,
  user_longitude double precision,
  max_distance_km double precision DEFAULT 50,
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  age integer,
  location text,
  bio text,
  profile_image_url text,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.age,
    p.location,
    p.bio,
    p.profile_image_url,
    calculate_distance(
      user_latitude,
      user_longitude,
      p.latitude,
      p.longitude
    ) as distance_km
  FROM profiles p
  WHERE 
    p.id != auth.uid()
    AND p.location_enabled = true
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND calculate_distance(
      user_latitude,
      user_longitude,
      p.latitude,
      p.longitude
    ) <= max_distance_km
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.id)
         OR (b.blocker_id = p.id AND b.blocked_id = auth.uid())
    )
  ORDER BY distance_km ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) 
  WHERE location_enabled = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_location_enabled ON profiles(location_enabled);

-- Add trigger to update last_location_update timestamp
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.latitude IS DISTINCT FROM OLD.latitude) OR 
     (NEW.longitude IS DISTINCT FROM OLD.longitude) THEN
    NEW.last_location_update := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profile_location_timestamp ON profiles;
CREATE TRIGGER update_profile_location_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_location_timestamp();

-- Create function to get distance to specific user
CREATE OR REPLACE FUNCTION get_distance_to_user(target_user_id uuid)
RETURNS double precision AS $$
DECLARE
  user_lat double precision;
  user_lon double precision;
  target_lat double precision;
  target_lon double precision;
BEGIN
  SELECT latitude, longitude INTO user_lat, user_lon
  FROM profiles
  WHERE id = auth.uid();

  SELECT latitude, longitude INTO target_lat, target_lon
  FROM profiles
  WHERE id = target_user_id;

  RETURN calculate_distance(user_lat, user_lon, target_lat, target_lon);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
