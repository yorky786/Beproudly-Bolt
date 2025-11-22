import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Heart, Users, Plus, TrendingUp, Lock } from 'lucide-react';

type Circle = {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  created_by: string;
  is_public: boolean;
  member_count: number;
  created_at: string;
};

export default function PrideCircles() {
  const { } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'explore' | 'my-circles'>('explore');

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = async () => {
    try {
      const { data, error } = await supabase
        .from('pride_circles')
        .select('*')
        .eq('is_public', true)
        .order('member_count', { ascending: false });

      if (error) throw error;
      setCircles(data || []);
    } catch (err) {
      console.error('Error loading circles:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff5555] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading Pride Circles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Pride Circles</h1>
            <p className="text-white/70">Join communities that matter to you</p>
          </div>
          <button className="bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white px-4 py-3 rounded-xl font-semibold hover:from-[#ff6666] hover:to-[#ffaa00] transition fiery-glow">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setSelectedTab('explore')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              selectedTab === 'explore'
                ? 'bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white'
                : 'bg-[#2a2a2a] text-white/70'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setSelectedTab('my-circles')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              selectedTab === 'my-circles'
                ? 'bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white'
                : 'bg-[#2a2a2a] text-white/70'
            }`}
          >
            My Circles
          </button>
        </div>

        {circles.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-3xl p-12 text-center devil-shadow">
            <Heart className="w-16 h-16 text-[#ff5555] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Circles Yet</h2>
            <p className="text-white/70 mb-6">Be the first to create a Pride Circle!</p>
            <button className="bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#ff6666] hover:to-[#ffaa00] transition inline-flex items-center gap-2 fiery-glow">
              <Plus className="w-5 h-5" />
              Create Circle
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {circles.map((circle) => (
              <div
                key={circle.id}
                className="bg-[#2a2a2a] rounded-2xl overflow-hidden devil-shadow hover:scale-105 transition cursor-pointer"
              >
                <div className="h-32 bg-gradient-to-br from-[#ff5555] to-[#ff9500] flex items-center justify-center">
                  <Heart className="w-16 h-16 text-white" fill="white" />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">{circle.name}</h3>
                      <p className="text-white/70 text-sm line-clamp-2">
                        {circle.description || 'Join this community to connect with like-minded individuals'}
                      </p>
                    </div>
                    {!circle.is_public && (
                      <Lock className="w-4 h-4 text-white/50 ml-2" />
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-white/70">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {circle.member_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Active
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-[#ff5555]/20 to-[#ff9500]/20 text-white py-2 rounded-xl font-semibold hover:from-[#ff5555]/30 hover:to-[#ff9500]/30 transition">
                    Join Circle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-[#ff5555] to-[#ff9500] rounded-3xl p-8 text-white text-center devil-shadow">
          <Heart className="w-12 h-12 mx-auto mb-4" fill="white" />
          <h2 className="text-2xl font-bold mb-2">Build Your Community</h2>
          <p className="opacity-90 mb-4">
            Create or join Pride Circles to connect with people who share your passions and values
          </p>
          <button className="bg-white text-[#ff5555] px-6 py-2 rounded-xl font-semibold hover:bg-white/90 transition">
            Create Your Circle
          </button>
        </div>
      </div>
    </div>
  );
}
