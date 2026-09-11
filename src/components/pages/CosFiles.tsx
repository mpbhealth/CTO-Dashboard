import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { CosPage, CosPageHero } from '../cos/CosPage';

interface CosFile {
  id: string;
  title: string | null;
  storage_key: string;
  bucket: string;
  mime: string | null;
  size_bytes: number | null;
  created_at: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CosFiles() {
  const { orgId } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const files = useQuery({
    queryKey: ['cos-files', orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select('id, title, storage_key, bucket, mime, size_bytes, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CosFile[];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!orgId || !user?.id) throw new Error('Sign in to upload files.');
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const storageKey = `${orgId}/${Date.now()}-${safeName}`;
      const { error: storageError } = await supabase.storage.from('cos-files').upload(storageKey, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (storageError) throw storageError;
      const { error: rowError } = await supabase.from('files').insert({
        org_id: orgId,
        owner_user_id: user.id,
        title: file.name,
        storage_key: storageKey,
        bucket: 'cos-files',
        mime: file.type || null,
        size_bytes: file.size,
      });
      if (rowError) throw rowError;
    },
    onSuccess: () => {
      setSelectedFile(null);
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ['cos-files', orgId] });
    },
    onError: (error) => {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    },
  });

  const remove = useMutation({
    mutationFn: async (file: CosFile) => {
      await supabase.storage.from(file.bucket || 'cos-files').remove([file.storage_key]);
      const { error } = await supabase.from('files').delete().eq('id', file.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cos-files', orgId] }),
  });

  const download = async (file: CosFile) => {
    const { data, error } = await supabase.storage.from(file.bucket || 'cos-files').createSignedUrl(file.storage_key, 60);
    if (error || !data?.signedUrl) {
      setUploadError(error?.message || 'Could not create a download link');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  return (
    <CosPage>
      <CosPageHero
        eyebrow="Files"
        title="Company files."
        lede="Upload and share operating documents for this org."
      />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <input
          id="cos-file-upload"
          type="file"
          onChange={(event) => {
            setSelectedFile(event.target.files?.[0] || null);
            setUploadError(null);
          }}
          className="text-sm"
        />
        <button
          type="button"
          disabled={!selectedFile || upload.isPending}
          onClick={() => selectedFile && upload.mutate(selectedFile)}
          className="inline-flex items-center gap-2 rounded-full bg-aryx-ink px-4 py-2 text-sm text-aryx-bg disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {upload.isPending ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      {(uploadError || files.error) && (
        <p className="mb-4 text-sm text-red-600">{uploadError || (files.error as Error).message}</p>
      )}

      <div className="space-y-2">
        {(files.data || []).map((file) => (
          <div key={file.id} className="flex items-center justify-between gap-4 rounded-2xl border border-aryx-line bg-aryx-elevated px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{file.title || file.storage_key}</p>
              <p className="text-xs text-aryx-faint">
                {formatFileSize(file.size_bytes)} · {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => download(file)} className="rounded-full p-2 text-aryx-muted hover:bg-aryx-ink/5" aria-label="Download">
                <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove.mutate(file)}
                className="rounded-full p-2 text-aryx-muted hover:bg-aryx-ink/5"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {!files.isLoading && (files.data || []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-aryx-line px-6 py-10 text-center text-sm text-aryx-muted">
            <FileText className="mx-auto mb-3 h-8 w-8 text-aryx-faint" />
            No files yet. Upload the first operating document.
          </div>
        )}
      </div>
    </CosPage>
  );
}

export default CosFiles;
