import { supabase, supabaseUrl } from '../supabase/client';
import type { IPBlacklist } from '../types';

export async function checkIPBlockedServerSide(): Promise<{ blocked: boolean; ip: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/check-ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { blocked: false, ip: '' };
    }

    const data = await response.json();
    return { blocked: data.blocked || false, ip: data.ip || '' };
  } catch {
    return { blocked: false, ip: '' };
  }
}

export async function getIPBlacklist(): Promise<IPBlacklist[]> {
  const { data, error } = await supabase
    .from('ip_blacklist')
    .select('*');

  if (error) {
    console.error('Error fetching IP blacklist:', error);
    return [];
  }

  return data || [];
}

export async function checkIPBlocked(): Promise<boolean> {
  const { blocked } = await checkIPBlockedServerSide();
  return blocked;
}

export async function addToBlacklist(cidr: string, description?: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('ip_blacklist').insert({
    cidr,
    description,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeFromBlacklist(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('ip_blacklist')
    .delete()
    .eq('id', id);

  return !error;
}

export async function getAllBlacklist(): Promise<import('../types').IPBlacklist[]> {
  const { data, error } = await supabase
    .from('ip_blacklist')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blacklist:', error);
    return [];
  }

  return data || [];
}
