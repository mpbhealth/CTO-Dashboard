import { supabase } from '../supabase';
import type { ConnectorKey, ConnectorResult } from './types';

export async function syncConnectors(source: ConnectorKey = 'all'): Promise<ConnectorResult[]> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connector-sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source }),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || 'Connector sync failed');
  }
  return (json.results || []) as ConnectorResult[];
}
