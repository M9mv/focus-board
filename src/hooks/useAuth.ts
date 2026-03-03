import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async (currentUser: User) => {
    setProfileLoading(true);

    const fallbackName =
      currentUser.user_metadata?.display_name ||
      currentUser.email?.split('@')[0] ||
      'User';

    const { data: existing, error: existingError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (existingError) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    if (existing) {
      setProfile(existing);
      setProfileLoading(false);
      return;
    }

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .upsert({
        id: currentUser.id,
        display_name: fallbackName,
      })
      .select('id, display_name, avatar_url')
      .single();

    if (!createError && created) {
      setProfile(created);
    } else {
      setProfile({
        id: currentUser.id,
        display_name: fallbackName,
        avatar_url: '',
      });
    }

    setProfileLoading(false);
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setProfileLoading(false);
      } else {
        void loadProfile(nextUser);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      const existingUser = existingSession?.user ?? null;
      setUser(existingUser);

      if (existingUser) {
        await loadProfile(existingUser);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });

    return { error: result.error ?? null };
  };

  const updateProfile = async (displayName: string, avatarUrl: string) => {
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
        },
        { onConflict: 'id' }
      )
      .select('id, display_name, avatar_url')
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    profile,
    profileLoading,
    signInWithOAuth,
    updateProfile,
    signOut,
  };
};
