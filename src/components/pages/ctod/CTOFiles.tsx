import { useState } from 'react';
import { FileText, Upload, Download, Share2, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useResources, useWorkspace, useCurrentProfile } from '../../../hooks/useDualDashboard';
import { uploadFile, getSignedUrl } from '../../../lib/dualDashboard';
import { ShareModal } from '../../modals/ShareModal';
import { VisibilityBadge } from '../../ui/VisibilityBadge';
import type { Resource } from '../../../lib/dualDashboard';

export function CTOFiles() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  const { data: workspace } = useWorkspace(profile?.org_id || '', 'CTO', 'CTO Workspace');
  const { data: resources = [] } = useResources({ workspaceId: workspace?.id, type: 'file' });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shareModalResource, setShareModalResource] = useState<Resource | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess(false);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError(null);

    try {
      const result = await uploadFile(selectedFile, 'CTO');

      if (result) {
        setUploadSuccess(true);
        queryClient.invalidateQueries({ queryKey: ['resources'] });
        setSelectedFile(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        console.error('[CTOFiles] Upload failed: No result returned');
        setUploadError('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('[CTOFiles] Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      const { data: files } = await supabase
        .from('files')
        .select('storage_key')
        .eq('resource_id', resource.id)
        .maybeSingle();

      if (files?.storage_key) {
        const signedUrl = await getSignedUrl(files.storage_key, 'ctod');
        if (signedUrl) {
          window.open(signedUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('[CTOFiles] Download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const deleteFile = useMutation({
    mutationFn: async (resourceId: string) => {
      const { error } = await supabase.from('resources').delete().eq('id', resourceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (error) => {
      console.error('[CTOFiles] Delete error:', error);
      alert('Failed to delete file. Please try again.');
    }
  });

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="text-blue-600" size={32} />
            Files & Documents
          </h1>
          <p className="text-gray-600 mt-1">Upload, manage, and share technical documents</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h2>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-gradient-to-r file:from-blue-500 file:to-blue-600
                file:text-white
                hover:file:opacity-90
                file:cursor-pointer
                file:transition-opacity
                file:shadow-md"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium"
          >
            <Upload size={18} />
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {selectedFile && !isUploading && !uploadSuccess && (
          <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <strong>Selected:</strong> <span className="font-medium text-blue-700">{selectedFile.name}</span> ({formatFileSize(selectedFile.size)})
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-3 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
            ✅ File uploaded successfully!
          </div>
        )}

        {uploadError && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
            ❌ Upload failed: {uploadError}
          </div>
        )}

        {isUploading && (
          <div className="mt-3 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200 animate-pulse">
            ⏳ Uploading file to CTO workspace...
          </div>
        )}
      </div>

      {/* Files List */}
      {resources.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No files yet</h3>
          <p className="text-gray-500">Upload your first file to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Files ({resources.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-500 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate" title={resource.title || 'Untitled'}>
                        {resource.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(resource.meta?.size)} • {formatDate(resource.created_at)}
                      </p>
                    </div>
                  </div>
                  <VisibilityBadge visibility={resource.visibility} />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(resource)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    title="Download file"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button
                    onClick={() => setShareModalResource(resource)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                    title="Share file"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${resource.title}"?`)) {
                        deleteFile.mutate(resource.id);
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    title="Delete file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {shareModalResource && (
        <ShareModal
          resource={shareModalResource}
          onClose={() => setShareModalResource(null)}
        />
      )}
    </div>
  );
}
