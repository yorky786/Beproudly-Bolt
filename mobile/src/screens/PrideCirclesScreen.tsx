import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

type Circle = {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  is_public: boolean;
};

export default function PrideCirclesScreen() {
  const [circles, setCircles] = useState<Circle[]>([]);
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
    } catch (error) {
      console.error('Error loading circles:', error);
    }
  };

  const renderCircle = ({ item }: { item: Circle }) => (
    <TouchableOpacity style={styles.circleCard}>
      <LinearGradient
        colors={['#ff5555', '#ff9500']}
        style={styles.circleHeader}
      >
        <Ionicons name="heart" size={32} color="#fff" />
      </LinearGradient>
      <View style={styles.circleContent}>
        <Text style={styles.circleName}>{item.name}</Text>
        <Text style={styles.circleDescription} numberOfLines={2}>
          {item.description || 'Join this community to connect with like-minded individuals'}
        </Text>
        <View style={styles.circleMeta}>
          <View style={styles.memberCount}>
            <Ionicons name="people" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.memberCountText}>{item.member_count}</Text>
          </View>
          <TouchableOpacity>
            <LinearGradient
              colors={['rgba(255,85,85,0.2)', 'rgba(255,149,0,0.2)']}
              style={styles.joinButton}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pride Circles</Text>
          <Text style={styles.subtitle}>Join communities that matter</Text>
        </View>
        <TouchableOpacity>
          <LinearGradient colors={['#ff5555', '#ff9500']} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setSelectedTab('explore')}
          style={[styles.tab, selectedTab === 'explore' && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'explore' && styles.tabTextActive,
            ]}
          >
            Explore
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab('my-circles')}
          style={[styles.tab, selectedTab === 'my-circles' && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'my-circles' && styles.tabTextActive,
            ]}
          >
            My Circles
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={circles}
        renderItem={renderCircle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        numColumns={2}
      />
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
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,85,85,0.2)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    padding: 12,
  },
  circleCard: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,85,85,0.2)',
  },
  circleHeader: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    padding: 12,
  },
  circleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  circleDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 12,
  },
  circleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,85,85,0.3)',
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff9500',
  },
});
