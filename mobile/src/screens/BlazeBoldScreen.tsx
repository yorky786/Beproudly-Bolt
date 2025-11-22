import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

type Blaze = {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  stokes_count: number;
  blazes_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
};

export default function BlazeBoldScreen() {
  const [blazes, setBlazes] = useState<Blaze[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBlazes();
  }, []);

  const loadBlazes = async () => {
    try {
      const { data, error } = await supabase
        .from('blazes')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBlazes(data || []);
    } catch (error) {
      console.error('Error loading blazes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBlazes();
  };

  const handleStoke = async (blazeId: string) => {
    try {
      const blaze = blazes.find((b) => b.id === blazeId);
      if (!blaze) return;

      const { error } = await supabase
        .from('blazes')
        .update({ stokes_count: blaze.stokes_count + 1 })
        .eq('id', blazeId);

      if (error) throw error;

      setBlazes(
        blazes.map((b) =>
          b.id === blazeId ? { ...b, stokes_count: b.stokes_count + 1 } : b
        )
      );
    } catch (error) {
      console.error('Error stoking blaze:', error);
    }
  };

  const renderBlaze = ({ item }: { item: Blaze }) => (
    <View style={styles.blazeContainer}>
      <Video
        source={{ uri: item.video_url }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping
        useNativeControls
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
      >
        <View style={styles.blazeInfo}>
          <View style={styles.userInfo}>
            <View style={styles.avatarSmall}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
            <Text style={styles.username}>@{item.profiles.username}</Text>
          </View>
          {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleStoke(item.id)}
          >
            <LinearGradient
              colors={['#ff5555', '#ff9500']}
              style={styles.actionIcon}
            >
              <Ionicons name="flame" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionCount}>{item.stokes_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIconSecondary}>
              <Ionicons name="chatbubble" size={24} color="#fff" />
            </View>
            <Text style={styles.actionCount}>{item.blazes_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIconSecondary}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient colors={['#ff5555', '#ff9500']} style={styles.headerGradient}>
          <Ionicons name="flame" size={24} color="#fff" />
          <Text style={styles.headerTitle}>BlazeBold</Text>
        </LinearGradient>
        <TouchableOpacity style={styles.recordButton}>
          <LinearGradient colors={['#ff5555', '#ff9500']} style={styles.recordGradient}>
            <Ionicons name="videocam" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={blazes}
        renderItem={renderBlaze}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height - 100}
        decelerationRate="fast"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ff5555"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  recordButton: {
    width: 48,
    height: 48,
  },
  recordGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blazeContainer: {
    width,
    height: height - 100,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  blazeInfo: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  caption: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  actions: {
    gap: 20,
    alignItems: 'center',
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
});
