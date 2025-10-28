import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useCEODataImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importData = async (data: any, dataType: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: importError } = await supabase.from(`ceo_${dataType}`).insert(data);

      if (importError) throw importError;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { importData, loading, error };
}
