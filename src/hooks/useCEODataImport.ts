import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useCEODataImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importData = async (data: Record<string, unknown>[], dataType: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: importError } = await supabase.from(`ceo_${dataType}`).insert(data);

      if (importError) throw importError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { importData, loading, error };
}
