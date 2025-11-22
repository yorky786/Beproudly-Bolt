import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile } from '../lib/supabase';
import { Heart, X, AlertCircle, Play, MapPin, Navigation } from 'lucide-react';
import {
  findNearbyUsers,
  requestLocationPermission,
  getCurrentPosition,
  updateUserLocation,
  formatDistance,
  NearbyUser
} from '../utils/location';

interface ExtendedProfile extends Profile {
  distance_km?: number;
}

export default function Discover() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ExtendedProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [showNearby, setShowNearby] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (showNearby && locationEnabled) {
      loadNearbyProfiles();
    } else {
      loadProfiles();
    }
  }, [user, showNearby]);

  const checkLocationPermission = async () => {
    const permission = await requestLocationPermission();
    setLocationEnabled(permission.granted);
  };

  const enableLocation = async () => {
    try {
      const position = await getCurrentPosition();
      await updateUserLocation(position, true);
      setLocationEnabled(true);
      setShowNearby(true);
    } catch (error) {
      console.error('Error enabling location:', error);
      alert('Unable to access location. Please enable location permissions in your browser.');
    }
  };

  const loadNearbyProfiles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: nearbyData, error } = await findNearbyUsers(maxDistance, 50);

      if (error) throw error;

      const nearbyProfiles: ExtendedProfile[] = (nearbyData || []).map((nearby: NearbyUser) => ({
        id: nearby.id,
        name: nearby.name,
        age: nearby.age,
        location: nearby.location,
        bio: nearby.bio,
        profile_image_url: nearby.profile_image_url,
        profile_video_url: null,
        video_thumbnail_url: null,
        video_duration: null,
        pronouns: null,
        created_at: '',
        updated_at: '',
        distance_km: nearby.distance_km,
      }));

      setProfiles(nearbyProfiles);
    } catch (err) {
      console.error('Error loading nearby profiles:', err);
      setShowNearby(false);
      await loadProfiles();
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff5555] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading profiles...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-4 flex gap-3 items-center justify-center" role="group" aria-label="Profile filter options">
          <button
            onClick={() => setShowNearby(false)}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              !showNearby
                ? 'bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white shadow-lg'
                : 'bg-[#2a2a2a] text-white/70 border border-[#ff5555]/20'
            }`}
            aria-label="Show all users"
            aria-pressed={!showNearby}
          >
            All Users
          </button>

          {locationEnabled ? (
            <button
              onClick={() => setShowNearby(true)}
              className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
                showNearby
                  ? 'bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white shadow-lg'
                  : 'bg-[#2a2a2a] text-white/70 border border-[#ff5555]/20'
              }`}
              aria-label="Show nearby users only"
              aria-pressed={showNearby}
            >
              <Navigation className="w-4 h-4" aria-hidden="true" />
              Nearby
            </button>
          ) : (
            <button
              onClick={enableLocation}
              className="px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 bg-[#2a2a2a] text-white/70 border border-[#ff5555]/20 hover:border-[#ff5555]/50"
              aria-label="Enable location to see nearby users"
            >
              <MapPin className="w-4 h-4" aria-hidden="true" />
              Enable Location
            </button>
          )}
        </div>

        <div className="bg-[#2a2a2a] rounded-3xl shadow-2xl overflow-hidden border border-[#ff5555]/20">
          <div className="relative aspect-[9/16]">
            {currentProfile.profile_video_url ? (
              <div className="relative w-full h-full bg-black">
                <video
                  src={currentProfile.profile_video_url}
                  poster={currentProfile.video_thumbnail_url || undefined}
                  className="w-full h-full object-cover"
                  controls
                />
                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white p-2 rounded-full shadow-lg">
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
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] flex items-center justify-center">
                <div className="text-center text-white/50">
                  <Heart className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>No photo</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
              {currentProfile.distance_km !== undefined && (
                <div className="mb-2 inline-flex items-center gap-1 bg-[#ff5555]/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Navigation className="w-3 h-3 text-[#ff5555]" />
                  <span className="text-white text-xs font-medium">
                    {formatDistance(currentProfile.distance_km)}
                  </span>
                </div>
              )}
              <h3 className="text-3xl font-bold text-white mb-1">
                {currentProfile.name}
                {currentProfile.age && `, ${currentProfile.age}`}
              </h3>
              {currentProfile.pronouns && (
                <p className="text-white/90 text-sm mb-2">{currentProfile.pronouns}</p>
              )}
              {currentProfile.location && (
                <div className="flex items-center gap-1 text-white/80 text-sm mb-3">
                  <MapPin className="w-4 h-4" />
                  {currentProfile.location}
                </div>
              )}
              {currentProfile.bio && (
                <p className="text-white/90 text-sm line-clamp-3">{currentProfile.bio}</p>
              )}
            </div>
          </div>

          <div className="p-6 flex gap-4 justify-center bg-[#1a1a1a]/50">
            <button
              onClick={handlePass}
              disabled={swiping}
              className="w-16 h-16 bg-[#3a3a3a] border border-[#ff5555]/20 rounded-full flex items-center justify-center hover:bg-[#4a4a4a] transition disabled:opacity-50"
              aria-label={`Pass on ${currentProfile.name}`}
              aria-busy={swiping}
            >
              <X className="w-8 h-8 text-white/70" aria-hidden="true" />
            </button>
            <button
              onClick={handleLike}
              disabled={swiping}
              className="w-20 h-20 bg-gradient-to-r from-[#ff5555] to-[#ff9500] rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-[#ff5555]/50 transition disabled:opacity-50"
              aria-label={`Like ${currentProfile.name}`}
              aria-busy={swiping}
            >
              <Heart className="w-10 h-10 text-white" fill="white" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="text-center mt-4 text-sm text-white/70">
          {currentIndex + 1} of {profiles.length} profiles
        </div>
      </div>
    </div>
  );
}
