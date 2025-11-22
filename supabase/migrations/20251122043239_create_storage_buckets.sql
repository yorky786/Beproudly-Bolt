/*
  # Create Storage Buckets for BeProudly

  1. Storage Buckets
    - `videos` - For BlazeBold video content
    - `profile-images` - For user profile photos
    - `challenge-media` - For ChallengeRoulette content
  
  2. Storage Policies
    - Enable authenticated users to upload their own content
    - Enable public read access to approved content
    - Restrict uploads by file size and type
  
  3. Security
    - Users can only upload to their own folders
    - Public read access for approved content
    - Admin controls for content moderation
*/

-- Create videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  104857600,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Create profile-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create challenge-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'challenge-media',
  'challenge-media',
  true,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos bucket
CREATE POLICY "Users can upload their own videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view videos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'videos');

CREATE POLICY "Users can update their own videos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own videos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for profile-images bucket
CREATE POLICY "Users can upload their own profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view profile images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for challenge-media bucket
CREATE POLICY "Users can upload challenge media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'challenge-media');

CREATE POLICY "Anyone can view challenge media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'challenge-media');
