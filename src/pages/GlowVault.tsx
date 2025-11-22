import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trophy, Award, Star, Flame, Lock, Sparkles } from 'lucide-react';

type Achievement = {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  category: string;
  rarity: string;
  requirement: string | null;
};

type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement: Achievement;
};

export default function GlowVault() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [flames, setFlames] = useState({ balance: 0, lifetime_earned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [achievementsRes, userAchievementsRes, flamesRes] = await Promise.all([
        supabase.from('achievements').select('*').order('rarity', { ascending: false }),
        supabase
          .from('user_achievements')
          .select(`
            *,
            achievement:achievements(*)
          `)
          .eq('user_id', user.id),
        supabase.from('flames').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (achievementsRes.data) setAchievements(achievementsRes.data);
      if (userAchievementsRes.data) setUserAchievements(userAchievementsRes.data);
      if (flamesRes.data) {
        setFlames({
          balance: flamesRes.data.balance,
          lifetime_earned: flamesRes.data.lifetime_earned,
        });
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-400 to-gray-600';
      case 'uncommon':
        return 'from-green-400 to-green-600';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'legendary':
        return 'from-yellow-400 to-yellow-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return Sparkles;
      case 'epic':
        return Trophy;
      case 'rare':
        return Award;
      default:
        return Star;
    }
  };

  const isAchievementEarned = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading GlowVault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">GlowVault</h1>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl shadow-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Flame className="w-6 h-6" fill="white" />
              </div>
              <div>
                <p className="text-sm opacity-90">Current Balance</p>
                <p className="text-3xl font-bold">{flames.balance}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm opacity-90">
              <span>Lifetime Earned</span>
              <span className="font-semibold">{flames.lifetime_earned} Flames</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl shadow-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Achievements</p>
                <p className="text-3xl font-bold">
                  {userAchievements.length}/{achievements.length}
                </p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{
                  width: `${(userAchievements.length / achievements.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Achievements</h2>

          {achievements.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No achievements available yet</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {achievements.map((achievement) => {
                const earned = isAchievementEarned(achievement.id);
                const RarityIcon = getRarityIcon(achievement.rarity);
                const rarityColor = getRarityColor(achievement.rarity);

                return (
                  <div
                    key={achievement.id}
                    className={`relative rounded-2xl p-6 transition-all ${
                      earned
                        ? 'bg-gradient-to-br ' + rarityColor + ' text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {!earned && (
                      <div className="absolute top-4 right-4">
                        <Lock className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center ${
                          earned ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-200'
                        }`}
                      >
                        <RarityIcon className="w-7 h-7" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{achievement.name}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              earned ? 'bg-white/20' : 'bg-gray-300 text-gray-600'
                            }`}
                          >
                            {achievement.rarity}
                          </span>
                        </div>
                        <p className={`text-sm ${earned ? 'opacity-90' : 'opacity-70'} mb-2`}>
                          {achievement.description}
                        </p>
                        {achievement.requirement && (
                          <p className={`text-xs ${earned ? 'opacity-75' : 'opacity-60'}`}>
                            {achievement.requirement}
                          </p>
                        )}
                      </div>
                    </div>

                    {earned && (
                      <div className="mt-4 flex items-center gap-2 text-sm opacity-90">
                        <Award className="w-4 h-4" />
                        <span>
                          Earned{' '}
                          {new Date(
                            userAchievements.find((ua) => ua.achievement_id === achievement.id)
                              ?.earned_at || ''
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl shadow-xl p-8 text-white text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Keep Going!</h2>
          <p className="opacity-90 mb-4">
            Complete challenges, create blazes, and connect with others to earn more achievements
            and flames.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => (window.location.href = '/challenges')}
              className="bg-white text-pink-600 px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition"
            >
              View Challenges
            </button>
            <button
              onClick={() => (window.location.href = '/blazebold')}
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-xl font-semibold hover:bg-white/30 transition"
            >
              Create Blaze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
