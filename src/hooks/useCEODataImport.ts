import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface DataImportResult {
  success: boolean;
  rowsImported: number;
  errors?: string[];
}

export function useCEODataImport() {
  const queryClient = useQueryClient();

  const importData = useMutation({
    mutationFn: async ({
      tableName,
      data,
    }: {
      tableName: string;
      data: any[];
    }): Promise<DataImportResult> => {
      try {
        const { data: inserted, error } = await supabase.from(tableName).insert(data);

        if (error) {
          return {
            success: false,
            rowsImported: 0,
            errors: [error.message],
          };
        }

        return {
          success: true,
          rowsImported: data.length,
        };
      } catch (err: any) {
        return {
          success: false,
          rowsImported: 0,
          errors: [err.message || 'Unknown error'],
        };
      }
    },
    onSuccess: (result, variables) => {
      // Invalidate relevant queries after import
      queryClient.invalidateQueries({ queryKey: [variables.tableName] });
    },
  });

  return {
    importData,
    isImporting: importData.isPending,
    error: importData.error,
  };
}

export default useCEODataImport;
