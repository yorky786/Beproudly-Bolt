import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile } from '../lib/supabase';
import { Heart, X, AlertCircle, Play } from 'lucide-react';

export default function Discover() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    loadProfiles();
  }, [user]);

  const loadProfiles = async () => {
    if (!user) return;

    try {
      const { data: likedUsers } = await supabase
        .from('likes')
        .select('liked_id')
        .eq('liker_id', user.id);

      const likedIds = likedUsers?.map((like) => like.liked_id) || [];

      const { data: blockedUsers } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      const blockedIds = blockedUsers?.map((block) => block.blocked_id) || [];

      const excludeIds = [...likedIds, ...blockedIds, user.id];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(20);

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error loading profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkForMatch = async (likedUserId: string) => {
    if (!user) return false;

    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('liker_id', likedUserId)
      .eq('liked_id', user.id)
      .maybeSingle();

    return !!data;
  };

  const createMatch = async (otherUserId: string) => {
    if (!user) return;

    const userIds = [user.id, otherUserId].sort();

    await supabase.from('matches').insert({
      user1_id: userIds[0],
      user2_id: userIds[1],
      status: 'matched',
    });
  };

  const handleLike = async () => {
    if (swiping || currentIndex >= profiles.length) return;

    setSwiping(true);
    const currentProfile = profiles[currentIndex];

    try {
      await supabase.from('likes').insert({
        liker_id: user!.id,
        liked_id: currentProfile.id,
      });

      const isMatch = await checkForMatch(currentProfile.id);

      if (isMatch) {
        await createMatch(currentProfile.id);
        setMatchedProfile(currentProfile);
        setMatchFound(true);
      }

      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Error liking profile:', err);
    } finally {
      setSwiping(false);
    }
  };

  const handlePass = () => {
    if (swiping || currentIndex >= profiles.length) return;
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (matchFound && matchedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-white" fill="white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">It's a Match!</h2>
          <p className="text-gray-600 mb-6">
            You and {matchedProfile.name} liked each other
          </p>
          <div className="flex gap-4 mb-6">
            {matchedProfile.profile_image_url && (
              <div className="flex-1">
                <img
                  src={matchedProfile.profile_image_url}
                  alt={matchedProfile.name}
                  className="w-full aspect-square object-cover rounded-2xl"
                />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = '/messages')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition"
            >
              Send a Message
            </button>
            <button
              onClick={() => {
                setMatchFound(false);
                setMatchedProfile(null);
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Keep Swiping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No More Profiles</h2>
          <p className="text-gray-600 mb-6">Check back later for new people!</p>
          <button
            onClick={loadProfiles}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative aspect-[9/16]">
            {currentProfile.profile_video_url ? (
              <div className="relative w-full h-full bg-black">
                <video
                  src={currentProfile.profile_video_url}
                  poster={currentProfile.video_thumbnail_url || undefined}
                  className="w-full h-full object-cover"
                  controls
                />
                <div className="absolute top-4 right-4 bg-pink-500 text-white p-2 rounded-full">
                  <Play className="w-5 h-5" fill="white" />
                </div>
              </div>
            ) : currentProfile.profile_image_url ? (
              <img
                src={currentProfile.profile_image_url}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <Heart className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>No photo</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <h3 className="text-3xl font-bold text-white mb-1">
                {currentProfile.name}
                {currentProfile.age && `, ${currentProfile.age}`}
              </h3>
              {currentProfile.pronouns && (
                <p className="text-white/90 text-sm mb-2">{currentProfile.pronouns}</p>
              )}
              {currentProfile.location && (
                <p className="text-white/80 text-sm mb-3">{currentProfile.location}</p>
              )}
              {currentProfile.bio && (
                <p className="text-white/90 text-sm line-clamp-3">{currentProfile.bio}</p>
              )}
            </div>
          </div>

          <div className="p-6 flex gap-4 justify-center">
            <button
              onClick={handlePass}
              disabled={swiping}
              className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-50"
            >
              <X className="w-8 h-8 text-gray-600" />
            </button>
            <button
              onClick={handleLike}
              disabled={swiping}
              className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center hover:from-pink-600 hover:to-purple-600 transition shadow-lg disabled:opacity-50"
            >
              <Heart className="w-10 h-10 text-white" fill="white" />
            </button>
          </div>
        </div>

        <div className="text-center mt-4 text-sm text-gray-600">
          {currentIndex + 1} of {profiles.length} profiles
        </div>
      </div>
    </div>
  );
}
