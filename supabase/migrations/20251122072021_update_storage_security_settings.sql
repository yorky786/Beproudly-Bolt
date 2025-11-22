/*
  # Update Storage Security Settings

  ## Overview
  This migration updates storage bucket configurations with proper file size limits
  and MIME type restrictions to prevent abuse.

  ## Security Improvements

  1. **File Size Limits**
     - Profile images: 10MB max (prevents large file abuse)
     - Profile videos: 100MB max (reasonable for profile videos)

  2. **MIME Type Restrictions**
     - Profile images: JPEG, PNG, WebP only (prevents executable uploads)
     - Profile videos: MP4, WebM, QuickTime only (standard video formats)

  ## Changes Made

  1. Update bucket configurations with size/type limits
*/

-- Update profile-images bucket with security settings
UPDATE storage.buckets
SET 
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE name = 'profile-images';

-- Update profile-videos bucket with security settings
UPDATE storage.buckets
SET 
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime']
WHERE name = 'profile-videos';
