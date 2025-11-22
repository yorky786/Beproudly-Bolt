import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Match, Message, Profile } from '../lib/supabase';
import { Send, ArrowLeft, Heart } from 'lucide-react';

type MatchWithProfile = Match & {
  otherProfile: Profile;
};

export default function Messages() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMatches();
  }, [user]);

  useEffect(() => {
    if (selectedMatch) {
      loadMessages(selectedMatch.id);
      subscribeToMessages(selectedMatch.id);
    }
  }, [selectedMatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMatches = async () => {
    if (!user) return;

    try {
      const { data: matchData, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'matched')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const matchesWithProfiles = await Promise.all(
        (matchData || []).map(async (match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();

          return {
            ...match,
            otherProfile: profile!,
          };
        })
      );

      setMatches(matchesWithProfiles);
    } catch (err) {
      console.error('Error loading matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (matchId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const subscribeToMessages = (matchId: string) => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch || !user) return;

    try {
      const { error } = await supabase.from('messages').insert({
        match_id: selectedMatch.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!selectedMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

          {matches.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No matches yet</h2>
              <p className="text-gray-600 mb-6">
                Start swiping to find your perfect match!
              </p>
              <button
                onClick={() => (window.location.href = '/discover')}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition"
              >
                Start Discovering
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className="w-full bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {match.otherProfile.profile_image_url ? (
                        <img
                          src={match.otherProfile.profile_image_url}
                          alt={match.otherProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Heart className="w-8 h-8 text-pink-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {match.otherProfile.name}
                      </h3>
                      {match.otherProfile.pronouns && (
                        <p className="text-sm text-gray-600">{match.otherProfile.pronouns}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      <div className="bg-white shadow-md px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setSelectedMatch(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center overflow-hidden">
            {selectedMatch.otherProfile.profile_image_url ? (
              <img
                src={selectedMatch.otherProfile.profile_image_url}
                alt={selectedMatch.otherProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Heart className="w-5 h-5 text-pink-500" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{selectedMatch.otherProfile.name}</h2>
            {selectedMatch.otherProfile.pronouns && (
              <p className="text-sm text-gray-600">{selectedMatch.otherProfile.pronouns}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => {
            const isMine = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isMine
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <p>{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMine ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center hover:from-pink-600 hover:to-purple-600 transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
