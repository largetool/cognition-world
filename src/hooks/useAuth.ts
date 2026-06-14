import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import type { Profile, UserSession } from '../types';
import { getCurrentUser, onAuthStateChange } from '../utils/auth';
import { checkAndTransitionAccountHide } from '../utils/storage';

export function useAuth() {
  const [session, setSession] = useState<UserSession>({
    user: null,
    session: null,
    isLoading: true,
  });
  const mountedRef = useRef(true);

  const refreshUser = useCallback(async () => {
    try {
      const { profile, error } = await getCurrentUser();
      if (mountedRef.current) {
        setSession(prev => ({ ...prev, user: profile, isLoading: false }));
      }
    } catch (err) {
      if (mountedRef.current) {
        setSession(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (session?.user) {
          const { profile } = await getCurrentUser();
          // 检查并转换冷静期到冻结期（独立 try/catch，失败不影响登录）
          try {
            await checkAndTransitionAccountHide();
          } catch (_e) {
            console.warn('[useAuth] checkAndTransitionAccountHide 失败（可忽略）:', _e);
          }
          if (mountedRef.current) {
            setSession({
              user: profile,
              session,
              isLoading: false,
            });
          }
        } else {
          if (mountedRef.current) {
            setSession({
              user: null,
              session: null,
              isLoading: false,
            });
          }
        }
      } catch (error) {
        if (mountedRef.current) {
          setSession({
            user: null,
            session: null,
            isLoading: false,
          });
        }
      }
    };

    init();

    const subscription = onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setSession(prev => ({ ...prev, isLoading: true }));
        // 同步 auth_user_id（fire-and-forget）
        supabase.rpc('sync_my_auth_id').then(undefined, () => {});
        try {
          const { profile } = await getCurrentUser();
          // 检查并转换冷静期到冻结期
          await checkAndTransitionAccountHide();
          if (mountedRef.current) {
            setSession({
              user: profile,
              session,
              isLoading: false,
            });
          }
        } catch (error) {
          if (mountedRef.current) {
            setSession(prev => ({ ...prev, isLoading: false }));
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (mountedRef.current) {
          setSession({
            user: null,
            session: null,
            isLoading: false,
          });
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...session,
    refreshUser,
  };
}
