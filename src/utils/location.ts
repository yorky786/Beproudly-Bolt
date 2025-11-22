import { supabase } from '../lib/supabase';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface NearbyUser {
  id: string;
  name: string;
  age: number | null;
  location: string | null;
  bio: string | null;
  profile_image_url: string | null;
  distance_km: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export const requestLocationPermission = async (): Promise<LocationPermissionStatus> => {
  if (!navigator.geolocation) {
    return { granted: false, denied: true, prompt: false };
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });

    return {
      granted: permission.state === 'granted',
      denied: permission.state === 'denied',
      prompt: permission.state === 'prompt',
    };
  } catch (error) {
    return { granted: false, denied: false, prompt: true };
  }
};

export const getCurrentPosition = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

export const updateUserLocation = async (
  coordinates: Coordinates,
  enabled: boolean = true
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        location_enabled: enabled,
      })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const disableLocation = async (): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        location_enabled: false,
      })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const findNearbyUsers = async (
  maxDistanceKm: number = 50,
  limitCount: number = 50
): Promise<{ data: NearbyUser[] | null; error: any }> => {
  try {
    const position = await getCurrentPosition();

    const { data, error } = await supabase.rpc('find_nearby_users', {
      user_latitude: position.latitude,
      user_longitude: position.longitude,
      max_distance_km: maxDistanceKm,
      limit_count: limitCount,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getDistanceToUser = async (
  targetUserId: string
): Promise<{ distance: number | null; error: any }> => {
  try {
    const { data, error } = await supabase.rpc('get_distance_to_user', {
      target_user_id: targetUserId,
    });

    if (error) throw error;

    return { distance: data, error: null };
  } catch (error) {
    return { distance: null, error };
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km away`;
  } else {
    return `${Math.round(distanceKm)}km away`;
  }
};

export const isLocationEnabled = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select('location_enabled')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) return false;

    return data.location_enabled || false;
  } catch {
    return false;
  }
};

export const watchPosition = (
  onSuccess: (coordinates: Coordinates) => void,
  onError: (error: Error) => void
): number => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported'));
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      onError(new Error(error.message));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    }
  );
};

export const clearWatch = (watchId: number): void => {
  if (navigator.geolocation && watchId !== -1) {
    navigator.geolocation.clearWatch(watchId);
  }
};
