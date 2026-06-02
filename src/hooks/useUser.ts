import { useState, useEffect, useCallback, useRef } from 'react';
import type { Profile, BackgroundImage } from '../types';

interface LogWithPublicStatus {
  id: string;
  content: string;
  created_at: string | null;
  user_id: string;
  is_public?: boolean | null;
  published_at?: string | null;
  canDelete?: boolean;
}
import { getUserById } from '../utils/auth';
import { getUserLogs, getUserBackgroundImages, getActiveBackgroundImage } from '../utils/storage';

interface UserData {
  profile: Profile | null;
  logs: LogWithPublicStatus[];
  backgrounds: BackgroundImage[];
  activeBackground: { url: string } | null;
  isLoading: boolean;
  error: string | null;
}

export function useUser(userId: string | undefined) {
  const [data, setData] = useState<UserData>({
    profile: null,
    logs: [],
    backgrounds: [],
    activeBackground: null,
    isLoading: true,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!userId) {
      setData(prev => ({ ...prev, isLoading: false, error: 'No user ID provided' }));
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const profile = await getUserById(userId);

      if (!profile) {
        setData({
          profile: null,
          logs: [],
          backgrounds: [],
          activeBackground: null,
          isLoading: false,
          error: 'User not found',
        });
        return;
      }

      if (profile.is_hidden) {
        setData({
          profile: null,
          logs: [],
          backgrounds: [],
          activeBackground: null,
          isLoading: false,
          error: 'User is hidden',
        });
        return;
      }

      const [logs, backgrounds, activeBg] = await Promise.all([
        getUserLogs(profile.user_id),
        getUserBackgroundImages(profile.user_id),
        getActiveBackgroundImage(profile.user_id),
      ]);

      setData({
        profile,
        logs,
        backgrounds,
        activeBackground: activeBg ? { url: activeBg.url } : null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setData({
        profile: null,
        logs: [],
        backgrounds: [],
        activeBackground: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load user data',
      });
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchUserData]);

  const refreshLogs = useCallback(async () => {
    if (!data.profile) return;
    try {
      const logs = await getUserLogs(data.profile.user_id);
      setData(prev => ({ ...prev, logs }));
    } catch (err) {
      console.error('Failed to refresh logs:', err);
    }
  }, [data.profile]);

  const refreshBackgrounds = useCallback(async () => {
    if (!data.profile) return;
    try {
      const [backgrounds, activeBg] = await Promise.all([
        getUserBackgroundImages(data.profile.user_id),
        getActiveBackgroundImage(data.profile.user_id),
      ]);
      setData(prev => ({
        ...prev,
        backgrounds,
        activeBackground: activeBg ? { url: activeBg.url } : null
      }));
    } catch (err) {
      console.error('Failed to refresh backgrounds:', err);
    }
  }, [data.profile]);

  return {
    ...data,
    refreshLogs,
    refreshBackgrounds,
    refetch: fetchUserData,
  };
}
