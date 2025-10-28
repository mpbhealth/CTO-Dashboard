import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { HIPAAEvidence } from '../../types/compliance';

interface EvidenceUploaderProps {
  category: string;
  onUploadComplete?: (evidence: HIPAAEvidence) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  category,
  onUploadComplete,
  maxSizeMB = 10,
  allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain',
    'text/csv',
  ],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        setSelectedFile(file);
        setTitle(file.name);
        setError(null);
      }
    }
  }, [maxSizeMB, allowedTypes]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        setSelectedFile(file);
        setTitle(file.name);
        setError(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title) {
      setError('Please provide a file and title');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${category}/${user.id}/${timestamp}_${sanitizedTitle}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('hipaa-evidence')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create evidence record
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const { data: evidence, error: dbError } = await supabase
        .from('hipaa_evidence')
        .insert({
          path: filePath,
          title,
          category,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          owner: user.id,
          tags: tagsArray,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess(true);
      setSelectedFile(null);
      setTitle('');
      setTags('');

      if (onUploadComplete && evidence) {
        onUploadComplete(evidence as HIPAAEvidence);
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-pink-500 bg-pink-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileSelect}
          accept={allowedTypes.join(',')}
        />
        
        {selectedFile ? (
          <div className="flex items-center justify-center space-x-3">
            <FileText className="w-8 h-8 text-pink-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">Drag and drop your file here, or</p>
            <label
              htmlFor="file-upload"
              className="inline-block px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 cursor-pointer"
            >
              Browse Files
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Max size: {maxSizeMB}MB
            </p>
          </>
        )}
      </div>

      {selectedFile && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-pink-500"
              placeholder="Enter evidence title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-pink-500"
              placeholder="e.g., policy, training, 2025"
            />
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !title}
            className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Evidence</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Evidence uploaded successfully!</span>
        </div>
      )}
    </div>
  );
};

