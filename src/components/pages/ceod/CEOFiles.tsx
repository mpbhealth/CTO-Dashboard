import { useState } from 'react';
import { FileText, Upload, Download, Share2, Trash2, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useResources, useWorkspace, useCurrentProfile } from '../../../hooks/useDualDashboard';
import { uploadFile, getSignedUrl } from '../../../lib/dualDashboard';
import { ShareModal } from '../../modals/ShareModal';
import { VisibilityBadge } from '../../ui/VisibilityBadge';
import type { Resource } from '../../../lib/dualDashboard';

export function CEOFiles() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  const { data: workspace } = useWorkspace(profile?.org_id || '', 'CEO', 'CEO Workspace');
  const { data: resources = [] } = useResources({ workspaceId: workspace?.id, type: 'file' });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shareModalResource, setShareModalResource] = useState<Resource | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(selectedFile, 'CEO');
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['resources'] });
        setSelectedFile(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
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
        const signedUrl = await getSignedUrl(files.storage_key, 'ceod');
        if (signedUrl) {
          window.open(signedUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
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
              <FileText className="text-[#1a3d97]" size={32} />
              Files
            </h1>
            <p className="text-gray-600 mt-1">Upload, manage, and share documents</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                  file:bg-gradient-to-r file:from-pink-400 file:to-pink-500
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
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium"
            >
              <Upload size={18} />
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {selectedFile && (
            <div className="mt-3 text-sm text-gray-600">
              Selected: <span className="font-medium text-pink-500">{selectedFile.name}</span> ({formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>

        {resources.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No files yet</h3>
            <p className="text-gray-500">Upload your first file to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#1a3d97] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#1a3d97] to-[#00A896] flex items-center justify-center">
                      <FileText size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{resource.title}</h3>
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
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors text-sm"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button
                    onClick={() => setShareModalResource(resource)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this file?')) {
                        deleteFile.mutate(resource.id);
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
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

