import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Play, Heart, Flame, TrendingUp, Upload, Video as VideoIcon } from 'lucide-react';

type Blaze = {
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
  profile: {
    name: string;
    profile_image_url: string | null;
    pronouns: string | null;
  };
};

export default function BlazeBold() {
  const { user } = useAuth();
  const [blazes, setBlazes] = useState<Blaze[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadBlazes();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  const loadBlazes = async () => {
    try {
      const { data, error } = await supabase
        .from('blazes')
        .select(`
          *,
          profile:profiles(name, profile_image_url, pronouns)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBlazes(data || []);
    } catch (err) {
      console.error('Error loading blazes:', err);
    } finally {
      setLoading(false);
    }
  };

  const recordView = async (blazeId: string) => {
    try {
      await supabase.from('blaze_views').insert({
        blaze_id: blazeId,
        user_id: user?.id || null,
      });

      await supabase.rpc('increment', {
        table_name: 'blazes',
        row_id: blazeId,
        column_name: 'view_count',
      });
    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  const handleLike = async (blazeId: string) => {
    if (!user) return;

    try {
      const { data: existingLike } = await supabase
        .from('blaze_likes')
        .select('id')
        .eq('blaze_id', blazeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('blaze_likes').delete().eq('id', existingLike.id);

        setBlazes((prev) =>
          prev.map((b) =>
            b.id === blazeId ? { ...b, like_count: b.like_count - 1 } : b
          )
        );
      } else {
        await supabase.from('blaze_likes').insert({
          blaze_id: blazeId,
          user_id: user.id,
        });

        setBlazes((prev) =>
          prev.map((b) =>
            b.id === blazeId ? { ...b, like_count: b.like_count + 1 } : b
          )
        );
      }
    } catch (err) {
      console.error('Error liking blaze:', err);
    }
  };

  const handleStoke = async (blazeId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('blazes')
        .update({ stoke_count: blazes.find((b) => b.id === blazeId)!.stoke_count + 1 })
        .eq('id', blazeId);

      setBlazes((prev) =>
        prev.map((b) =>
          b.id === blazeId ? { ...b, stoke_count: b.stoke_count + 1 } : b
        )
      );
    } catch (err) {
      console.error('Error stoking blaze:', err);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const windowHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / windowHeight);

    if (newIndex !== currentIndex && newIndex < blazes.length) {
      setCurrentIndex(newIndex);
      recordView(blazes[newIndex].id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading BlazeBold...</p>
        </div>
      </div>
    );
  }

  if (showUpload) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-4">Create Your Blaze</h2>
          <div className="border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center mb-6">
            <VideoIcon className="w-12 h-12 text-pink-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Video upload coming soon</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUpload(false)}
              className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition">
              Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (blazes.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Flame className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Blazes Yet</h2>
          <p className="text-gray-400 mb-6">Be the first to create a Blaze!</p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition inline-flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Create Blaze
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      <div
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
      >
        {blazes.map((blaze, index) => (
          <div key={blaze.id} className="h-screen snap-start relative">
            <video
              ref={index === currentIndex ? videoRef : null}
              src={blaze.video_url}
              poster={blaze.thumbnail_url || undefined}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted={false}
            />

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

            {blaze.is_spotlight && (
              <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Spotlight
              </div>
            )}

            <div className="absolute bottom-20 left-0 right-0 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 overflow-hidden">
                      {blaze.profile.profile_image_url ? (
                        <img
                          src={blaze.profile.profile_image_url}
                          alt={blaze.profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-pink-600 font-bold">
                          {blaze.profile.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{blaze.profile.name}</p>
                      {blaze.profile.pronouns && (
                        <p className="text-white/70 text-sm">{blaze.profile.pronouns}</p>
                      )}
                    </div>
                  </div>
                  {blaze.caption && (
                    <p className="text-white text-sm mb-2">{blaze.caption}</p>
                  )}
                  <div className="flex items-center gap-4 text-white/70 text-sm">
                    <span className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      {blaze.view_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {blaze.like_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {blaze.stoke_count.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => handleLike(blaze.id)}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition"
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={() => handleStoke(blaze.id)}
                    className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center hover:from-orange-600 hover:to-red-600 transition shadow-lg"
                  >
                    <Flame className="w-6 h-6 text-white" fill="white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowUpload(true)}
        className="absolute bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl hover:from-pink-600 hover:to-purple-600 transition z-10"
      >
        <Upload className="w-6 h-6 text-white" />
      </button>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
