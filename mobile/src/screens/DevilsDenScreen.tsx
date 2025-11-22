import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Room = {
  id: string;
  name: string;
  topic: string | null;
  room_type: string;
  expires_at: string | null;
  participant_count?: number;
};

export default function DevilsDenScreen() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomTopic, setRoomTopic] = useState('');
  const [roomType, setRoomType] = useState<'private' | 'flame_room'>('private');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('devils_den_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const createRoom = async () => {
    if (!user || !roomName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    try {
      const expiresAt =
        roomType === 'flame_room'
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

      setShowModal(false);
      setRoomName('');
      setRoomTopic('');
      loadRooms();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity style={styles.roomCard}>
      <LinearGradient colors={['#ff5555', '#ff9500']} style={styles.roomIcon}>
        <Ionicons
          name={item.room_type === 'flame_room' ? 'flame' : 'lock-closed'}
          size={24}
          color="#fff"
        />
      </LinearGradient>
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{item.name}</Text>
        {item.topic && <Text style={styles.roomTopic}>{item.topic}</Text>}
        <View style={styles.roomMeta}>
          <Ionicons name="people" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.roomMetaText}>{item.participant_count || 0}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Devil's Den</Text>
          <Text style={styles.subtitle}>Private rooms for deeper connections</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <LinearGradient colors={['#ff5555', '#ff9500']} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Room</Text>

            <TextInput
              style={styles.input}
              placeholder="Room Name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={roomName}
              onChangeText={setRoomName}
            />

            <TextInput
              style={styles.input}
              placeholder="Topic (Optional)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={roomTopic}
              onChangeText={setRoomTopic}
            />

            <View style={styles.roomTypeSelector}>
              <TouchableOpacity
                onPress={() => setRoomType('private')}
                style={[
                  styles.roomTypeButton,
                  roomType === 'private' && styles.roomTypeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.roomTypeText,
                    roomType === 'private' && styles.roomTypeTextActive,
                  ]}
                >
                  Private
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRoomType('flame_room')}
                style={[
                  styles.roomTypeButton,
                  roomType === 'flame_room' && styles.roomTypeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.roomTypeText,
                    roomType === 'flame_room' && styles.roomTypeTextActive,
                  ]}
                >
                  Flame Room
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createRoom}>
                <LinearGradient
                  colors={['#ff5555', '#ff9500']}
                  style={styles.createButton}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#2a2a2a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,85,85,0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,85,85,0.2)',
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  roomTopic: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,85,85,0.3)',
  },
  roomTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roomTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,85,85,0.3)',
    alignItems: 'center',
  },
  roomTypeButtonActive: {
    backgroundColor: 'rgba(255,85,85,0.2)',
  },
  roomTypeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  roomTypeTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
