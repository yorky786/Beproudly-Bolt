import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Flame, Users, Lock, Clock, Plus, MessageCircle } from 'lucide-react';

type Room = {
  id: string;
  name: string;
  created_by: string;
  is_private: boolean;
  room_type: string;
  topic: string | null;
  expires_at: string | null;
  max_participants: number;
  created_at: string;
  participant_count?: number;
};

export default function DevilsDen() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomTopic, setRoomTopic] = useState('');
  const [roomType, setRoomType] = useState<'private' | 'flame_room'>('private');

  useEffect(() => {
    loadRooms();
  }, [user]);

  const loadRooms = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('devils_den_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const roomsWithCounts = await Promise.all(
        (data || []).map(async (room) => {
          const { count } = await supabase
            .from('room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          return { ...room, participant_count: count || 0 };
        })
      );

      setRooms(roomsWithCounts);
    } catch (err) {
      console.error('Error loading rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!user || !roomName.trim()) return;

    try {
      const expiresAt = roomType === 'flame_room'
        ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: room, error } = await supabase
        .from('devils_den_rooms')
        .insert({
          name: roomName,
          created_by: user.id,
          is_private: roomType === 'private',
          room_type: roomType,
          topic: roomTopic || null,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('room_participants').insert({
        room_id: room.id,
        user_id: user.id,
        role: 'admin',
      });

      setShowCreateRoom(false);
      setRoomName('');
      setRoomTopic('');
      loadRooms();
    } catch (err) {
      console.error('Error creating room:', err);
    }
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'flame_room':
        return Flame;
      case 'pride_circle':
        return Users;
      default:
        return Lock;
    }
  };

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff5555] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading Devil's Den...</p>
        </div>
      </div>
    );
  }

  if (showCreateRoom) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] p-4 flex items-center justify-center">
        <div className="bg-[#2a2a2a] rounded-3xl p-8 max-w-md w-full devil-shadow">
          <h2 className="text-2xl font-bold text-white mb-6">Create New Room</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-white/70 text-sm mb-2">Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#ff5555]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5555]"
                placeholder="Enter room name"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Topic (Optional)</label>
              <input
                type="text"
                value={roomTopic}
                onChange={(e) => setRoomTopic(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#ff5555]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5555]"
                placeholder="What's this room about?"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Room Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setRoomType('private')}
                  className={`flex-1 py-3 rounded-xl font-semibold transition ${
                    roomType === 'private'
                      ? 'bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white'
                      : 'bg-[#1a1a1a] text-white/70 border border-[#ff5555]/30'
                  }`}
                >
                  <Lock className="w-4 h-4 inline mr-2" />
                  Private
                </button>
                <button
                  onClick={() => setRoomType('flame_room')}
                  className={`flex-1 py-3 rounded-xl font-semibold transition ${
                    roomType === 'flame_room'
                      ? 'bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white'
                      : 'bg-[#1a1a1a] text-white/70 border border-[#ff5555]/30'
                  }`}
                >
                  <Flame className="w-4 h-4 inline mr-2" />
                  Flame Room
                </button>
              </div>
              {roomType === 'flame_room' && (
                <p className="text-white/50 text-xs mt-2">
                  Flame Rooms expire after 2 hours
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateRoom(false)}
              className="flex-1 bg-[#1a1a1a] text-white py-3 rounded-xl font-semibold border border-[#ff5555]/30 hover:bg-[#2a2a2a] transition"
            >
              Cancel
            </button>
            <button
              onClick={createRoom}
              className="flex-1 bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white py-3 rounded-xl font-semibold hover:from-[#ff6666] hover:to-[#ffaa00] transition fiery-glow"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Devil's Den</h1>
            <p className="text-white/70">Private rooms for deeper connections</p>
          </div>
          <button
            onClick={() => setShowCreateRoom(true)}
            className="bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white px-4 py-3 rounded-xl font-semibold hover:from-[#ff6666] hover:to-[#ffaa00] transition fiery-glow"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-3xl p-12 text-center devil-shadow">
            <Flame className="w-16 h-16 text-[#ff5555] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Active Rooms</h2>
            <p className="text-white/70 mb-6">Create a room to start connecting</p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#ff6666] hover:to-[#ffaa00] transition inline-flex items-center gap-2 fiery-glow"
            >
              <Plus className="w-5 h-5" />
              Create Room
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rooms.map((room) => {
              const Icon = getRoomIcon(room.room_type);
              const timeRemaining = getTimeRemaining(room.expires_at);

              return (
                <div
                  key={room.id}
                  className="bg-[#2a2a2a] rounded-2xl p-6 devil-shadow hover:scale-105 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#ff5555] to-[#ff9500] rounded-full flex items-center justify-center fiery-glow">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{room.name}</h3>
                        {room.topic && (
                          <p className="text-white/70 text-sm">{room.topic}</p>
                        )}
                      </div>
                    </div>
                    {room.is_private && (
                      <Lock className="w-4 h-4 text-white/50" />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-white/70">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {room.participant_count}/{room.max_participants}
                    </div>
                    {timeRemaining && (
                      <div className="flex items-center gap-2 text-[#ff9500]">
                        <Clock className="w-4 h-4" />
                        {timeRemaining}
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-4 bg-gradient-to-r from-[#ff5555]/20 to-[#ff9500]/20 text-white py-2 rounded-xl font-semibold hover:from-[#ff5555]/30 hover:to-[#ff9500]/30 transition flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Join Room
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
