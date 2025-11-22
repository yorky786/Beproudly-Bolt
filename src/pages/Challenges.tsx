import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trophy, Flame, Users, Calendar, Video } from 'lucide-react';

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  flame_reward: number;
  participant_count: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

type Participation = {
  id: string;
  challenge_id: string;
  user_id: string;
  video_url: string;
  status: string;
  votes: number;
  created_at: string;
  profile: {
    name: string;
    profile_image_url: string | null;
  };
};

export default function Challenges() {
  const { } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'entries'>('active');

  useEffect(() => {
    loadChallenges();
  }, []);

  useEffect(() => {
    if (selectedChallenge) {
      loadParticipations(selectedChallenge.id);
    }
  }, [selectedChallenge]);

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (err) {
      console.error('Error loading challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipations = async (challengeId: string) => {
    try {
      const { data, error } = await supabase
        .from('challenge_participations')
        .select(`
          *,
          profile:profiles(name, profile_image_url)
        `)
        .eq('challenge_id', challengeId)
        .order('votes', { ascending: false });

      if (error) throw error;
      setParticipations(data || []);
    } catch (err) {
      console.error('Error loading participations:', err);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-500 bg-green-100';
      case 'medium':
        return 'text-yellow-500 bg-yellow-100';
      case 'hard':
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    );
  }

  if (selectedChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedChallenge(null)}
            className="text-pink-600 hover:text-pink-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Challenges
          </button>

          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedChallenge.title}</h1>
                <p className="text-gray-600 mb-4">{selectedChallenge.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(selectedChallenge.difficulty)}`}>
                  {selectedChallenge.difficulty.toUpperCase()}
                </div>
                <div className="flex items-center gap-1 text-orange-600 font-bold">
                  <Flame className="w-5 h-5" fill="currentColor" />
                  {selectedChallenge.flame_reward}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {selectedChallenge.participant_count} participants
              </div>
              {selectedChallenge.expires_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {getDaysRemaining(selectedChallenge.expires_at)} days left
                </div>
              )}
            </div>

            <button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition flex items-center justify-center gap-2">
              <Video className="w-5 h-5" />
              Join Challenge
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Entries</h2>

            {participations.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No entries yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {participations.map((participation, index) => (
                  <div
                    key={participation.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition"
                  >
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 overflow-hidden">
                      {participation.profile.profile_image_url ? (
                        <img
                          src={participation.profile.profile_image_url}
                          alt={participation.profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-pink-600 font-bold">
                          {participation.profile.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{participation.profile.name}</p>
                      <p className="text-sm text-gray-600">{participation.votes} votes</p>
                    </div>
                    {participation.status === 'winner' && (
                      <div className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        Winner
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">ChallengeRoulette</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setTab('active')}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                tab === 'active'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setTab('entries')}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                tab === 'entries'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              My Entries
            </button>
          </div>
        </div>

        {challenges.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Challenges</h2>
            <p className="text-gray-600">Check back soon for new challenges!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {challenges.map((challenge) => {
              const daysLeft = getDaysRemaining(challenge.expires_at);
              return (
                <div
                  key={challenge.id}
                  className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition cursor-pointer"
                  onClick={() => setSelectedChallenge(challenge)}
                >
                  <div className="h-48 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-white" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 flex-1">{challenge.title}</h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {challenge.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {challenge.participant_count}
                        </div>
                        {daysLeft !== null && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {daysLeft}d
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-orange-600 font-bold">
                        <Flame className="w-5 h-5" fill="currentColor" />
                        {challenge.flame_reward}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
