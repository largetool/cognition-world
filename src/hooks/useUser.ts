import { useState, useEffect, useCallback, useRef } from 'react';
import type { Profile, BackgroundImage } from '../types';
import { getUserById, getUserByDisplayId, isNumericDisplayId } from '../utils/auth';
import { getUserBackgroundImages, getActiveBackgroundImage } from '../utils/storage';

/** 零依赖获取日志（避开 webpack chunk TDZ） */
async function getLogsDirectInline(
  userId: string,
  currentUserId?: string,
  isAdmin?: boolean
): Promise<any[]> {
  const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';
  let token: string | null = null;
  try {
    const raw = localStorage.getItem('sb-' + SUPABASE_URL.replace('https://', '') + '-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      token = parsed?.access_token || null;
    }
  } catch (_) {}
  const params = new URLSearchParams({
    select: '*',
    user_id: `eq.${userId}`,
    order: 'created_at.desc',
    limit: '100',
  });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/logs?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    console.error('[getLogsDirect] HTTP', res.status);
    return [];
  }
  const data = await res.json();
  const now = new Date();
  return (Array.isArray(data) ? data : []).map((log: any) => {
    const ct = new Date(log.created_at || '');
    const tenMin = new Date(ct.getTime() + 10 * 60 * 1000);
    const isPublic = log.is_public === true || now >= tenMin;
    const canDelete = isAdmin === true || (currentUserId === userId && now < tenMin);
    return { ...log, is_public: isPublic, canDelete };
  });
}

interface LogWithPublicStatus {
  id: string;
  content: string;
  created_at: string | null;
  user_id: string;
  is_public?: boolean | null;
  published_at?: string | null;
  canDelete?: boolean;
}

interface UserData {
  profile: Profile | null;
  logs: LogWithPublicStatus[];
  backgrounds: BackgroundImage[];
  activeBackground: { url: string } | null;
  isLoading: boolean;
  error: string | null;
}

export function useUser(userId: string | undefined, isAdmin?: boolean) {
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
      // 支持 display_id（纯数字）和 user_id（拼音+数字）两种查询
      const profile = isNumericDisplayId(userId)
        ? await getUserByDisplayId(parseInt(userId, 10))
        : await getUserById(userId);

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
        getLogsDirectInline(profile.user_id, undefined, isAdmin),
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
      const logs = await getLogsDirectInline(data.profile.user_id, undefined, isAdmin);
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
