import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string;
  pronouns: string | null;
  age: number | null;
  location: string | null;
  bio: string | null;
  profile_image_url: string | null;
  profile_video_url: string | null;
  video_thumbnail_url: string | null;
  video_duration: number | null;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'matched' | 'unmatched';
  created_at: string;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export type Like = {
  id: string;
  liker_id: string;
  liked_id: string;
  created_at: string;
};
