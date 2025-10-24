import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ImportResult {
  success: boolean;
  batchId: string;
  rowsImported: number;
  rowsFailed: number;
  errors?: string[];
}

interface ImportOptions {
  targetTable: 'cancellations' | 'leads' | 'sales' | 'concierge';
  sheetName?: string;
}

export function useCEODataImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  const importData = async (
    data: Array<Record<string, unknown>>,
    options: ImportOptions
  ): Promise<ImportResult> => {
    setImporting(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      if (!['ceo', 'admin'].includes(profile.role)) {
        throw new Error('Insufficient permissions');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/ceo-data-import`;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          data,
          targetTable: options.targetTable,
          sheetName: options.sheetName,
          orgId: profile.org_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result: ImportResult = await response.json();
      setProgress(100);

      return result;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    } finally {
      setImporting(false);
    }
  };

  const getImportHistory = async (limit = 50) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile) return [];

    const { data, error } = await supabase
      .from('data_import_history')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching import history:', error);
      return [];
    }

    return data || [];
  };

  return {
    importing,
    progress,
    importData,
    getImportHistory,
  };
}
