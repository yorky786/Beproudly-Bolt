export interface Profile {
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
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'matched' | 'unmatched';
  compatibility_score?: number;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'voice';
  created_at: string;
  read_at: string | null;
  delivered_at: string | null;
}

export interface Like {
  id: string;
  liker_id: string;
  liked_id: string;
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

export interface Blaze {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  duration: number;
  view_count: number;
  like_count: number;
  stoke_count: number;
  vibe_score: number | null;
  is_spotlight: boolean;
  created_at: string;
  profile?: Profile;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  flame_reward: number;
  participant_count: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  user_id: string;
  video_url: string;
  status: 'pending' | 'approved' | 'winner';
  votes: number;
  created_at: string;
  profile?: Profile;
}

export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirement: string | null;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface Flames {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'earned' | 'spent' | 'purchased' | 'refunded';
  description: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  duration: number;
  created_at: string;
}

export interface CompatibilityFactors {
  age_similarity: number;
  location_proximity: number;
  interest_overlap: number;
  activity_level: number;
  response_rate: number;
}

export interface CompatibilityScore {
  overall_score: number;
  factors: CompatibilityFactors;
  recommendation: 'high' | 'medium' | 'low';
}

export interface UserPreferences {
  user_id: string;
  min_age: number;
  max_age: number;
  max_distance: number;
  interests: string[];
  looking_for: string[];
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'match' | 'message' | 'like' | 'achievement' | 'challenge';
  title: string;
  message: string;
  read: boolean;
  data: Record<string, any>;
  created_at: string;
}

export interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  properties: Record<string, any>;
  timestamp: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    total?: number;
    has_more?: boolean;
  };
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface VideoQualityOption {
  label: string;
  resolution: string;
  bitrate: number;
  value: '360p' | '480p' | '720p' | '1080p';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'annual';
  features: string[];
  flame_bonus: number;
}
