import React, { useState, useCallback } from 'react';
import { Plus, FileCheck, Calendar, AlertCircle, Upload, X, FileText, CheckCircle } from 'lucide-react';
import { useBAAs, useCreateBAA } from '../../hooks/useComplianceData';
import { BAAStatusChip } from '../compliance/ComplianceChips';
import { supabase } from '../../lib/supabase';
import type { BAAFormData } from '../../types/compliance';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE_MB = 25;

const ComplianceBAAs: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: baas = [], isLoading } = useBAAs();
  const createBAA = useCreateBAA();

  const [newBAA, setNewBAA] = useState<BAAFormData>({
    vendor: '',
    services_provided: '',
    effective_date: '',
    renewal_date: '',
    auto_renews: false,
    contact_email: '',
    contact_phone: '',
    vendor_contact_name: '',
    notes: '',
    document_url: '',
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'File type not allowed. Please upload PDF, Word document, or image files.';
    }
    return null;
  }, []);

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
        setUploadError(validationError);
      } else {
        setSelectedFile(file);
        setUploadError(null);
      }
    }
  }, [validateFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
      } else {
        setSelectedFile(file);
        setUploadError(null);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const timestamp = Date.now();
      const sanitizedVendor = newBAA.vendor.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileExt = file.name.split('.').pop();
      const filePath = `baas/${user.id}/${timestamp}_${sanitizedVendor}.${fileExt}`;

      setUploadProgress('Uploading file...');

      const { error: uploadError } = await supabase.storage
        .from('hipaa-evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hipaa-evidence')
        .getPublicUrl(filePath);

      return publicUrl || filePath;
    } catch (err) {
      console.error('File upload error:', err);
      throw err;
    }
  };

  const resetForm = () => {
    setNewBAA({
      vendor: '',
      services_provided: '',
      effective_date: '',
      renewal_date: '',
      auto_renews: false,
      contact_email: '',
      contact_phone: '',
      vendor_contact_name: '',
      notes: '',
      document_url: '',
    });
    setSelectedFile(null);
    setUploadProgress('');
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);

    try {
      let documentUrl = newBAA.document_url;

      // Upload file if selected
      if (selectedFile) {
        setUploadProgress('Uploading document...');
        documentUrl = await uploadFile(selectedFile) || '';
      }

      setUploadProgress('Saving BAA...');

      await createBAA.mutateAsync({
        ...newBAA,
        document_url: documentUrl,
      });

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create BAA:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to create BAA');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const getDaysUntilRenewal = (expirationDate: string) => {
    if (!expirationDate) return 999; // No date means not expiring
    const now = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const expiringSoon = baas.filter((baa: Record<string, unknown>) => {
    const daysUntil = getDaysUntilRenewal(baa.expiration_date as string);
    return daysUntil >= 0 && daysUntil <= 60;
  });

  const expired = baas.filter((baa: Record<string, unknown>) => getDaysUntilRenewal(baa.expiration_date as string) < 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FileCheck className="w-8 h-8 text-indigo-600" />
            <span>Business Associate Agreements</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage BAAs with vendors who handle PHI
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add BAA</span>
        </button>
      </div>

      {/* Alerts */}
      {expiringSoon.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">
              {expiringSoon.length} BAA{expiringSoon.length > 1 ? 's' : ''} expiring within 60 days
            </h3>
            <ul className="mt-2 space-y-1">
              {expiringSoon.slice(0, 3).map((baa: Record<string, unknown>) => (
                <li key={baa.id as string} className="text-sm text-yellow-800">
                  • {baa.vendor_name as string} - {new Date(baa.expiration_date as string).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {expired.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">
              {expired.length} expired BAA{expired.length > 1 ? 's' : ''} require attention
            </h3>
            <ul className="mt-2 space-y-1">
              {expired.map((baa: Record<string, unknown>) => (
                <li key={baa.id as string} className="text-sm text-red-800">
                  • {baa.vendor_name as string} - expired {new Date(baa.expiration_date as string).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total BAAs</p>
          <p className="text-2xl font-bold text-gray-900">{baas.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-800">
            {baas.filter(b => b.status === 'active').length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
          <p className="text-sm text-gray-600">Expiring Soon</p>
          <p className="text-2xl font-bold text-yellow-800">{expiringSoon.length}</p>
        </div>
        <div className="bg-red-50 rounded-lg border-2 border-red-200 p-4">
          <p className="text-sm text-gray-600">Expired</p>
          <p className="text-2xl font-bold text-red-800">{expired.length}</p>
        </div>
      </div>

      {/* BAAs Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Renewal Timeline</span>
        </h2>
        <div className="space-y-3">
          {[...baas]
            .sort((a: Record<string, unknown>, b: Record<string, unknown>) => 
              new Date(a.expiration_date as string || '9999-12-31').getTime() - new Date(b.expiration_date as string || '9999-12-31').getTime()
            )
            .slice(0, 10)
            .map((baa: Record<string, unknown>) => {
              const daysUntil = getDaysUntilRenewal(baa.expiration_date as string);
              const isExpired = daysUntil < 0;
              const isExpiringSoon = daysUntil >= 0 && daysUntil <= 60;

              return (
                <div
                  key={baa.id as string}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isExpired
                      ? 'bg-red-50 border border-red-200'
                      : isExpiringSoon
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{baa.vendor_name as string}</h4>
                    <p className="text-sm text-gray-600">{(baa.notes as string)?.split('\n')[0] || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {baa.expiration_date ? new Date(baa.expiration_date as string).toLocaleDateString() : 'No date'}
                    </p>
                    <p className={`text-xs ${
                      isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {isExpired ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days`}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* BAAs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Effective Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expiration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Document
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {baas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No BAAs found
                  </td>
                </tr>
              ) : (
                baas.map((baa: Record<string, unknown>) => (
                  <tr key={baa.id as string} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{baa.vendor_name as string}</p>
                        {baa.contact_name && (
                          <p className="text-sm text-gray-500">{baa.contact_name as string}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {baa.contact_email && <div>{baa.contact_email as string}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <BAAStatusChip status={baa.status as string} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {baa.effective_date ? new Date(baa.effective_date as string).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {baa.expiration_date ? new Date(baa.expiration_date as string).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {baa.document_url ? (
                        <a
                          href={baa.document_url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">No document</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create BAA Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Business Associate Agreement</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBAA.vendor}
                  onChange={(e) => setNewBAA({ ...newBAA, vendor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Acme Cloud Services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Services Provided
                </label>
                <textarea
                  value={newBAA.services_provided}
                  onChange={(e) => setNewBAA({ ...newBAA, services_provided: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Description of services"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={newBAA.vendor_contact_name}
                    onChange={(e) => setNewBAA({ ...newBAA, vendor_contact_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={newBAA.contact_email}
                    onChange={(e) => setNewBAA({ ...newBAA, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBAA.effective_date}
                    onChange={(e) => setNewBAA({ ...newBAA, effective_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Renewal Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBAA.renewal_date}
                    onChange={(e) => setNewBAA({ ...newBAA, renewal_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto_renews"
                  checked={newBAA.auto_renews}
                  onChange={(e) => setNewBAA({ ...newBAA, auto_renews: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-blue-500"
                />
                <label htmlFor="auto_renews" className="text-sm font-medium text-gray-700">
                  Auto-renews
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newBAA.notes}
                  onChange={(e) => setNewBAA({ ...newBAA, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes"
                />
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BAA Document
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="file"
                    id="baa-file-upload"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept={ALLOWED_FILE_TYPES.join(',')}
                  />
                  
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-3">
                      <FileText className="w-8 h-8 text-indigo-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-2">Drag and drop your BAA document here, or</p>
                      <label
                        htmlFor="baa-file-upload"
                        className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer text-sm"
                      >
                        Browse Files
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, Word documents, or images up to {MAX_FILE_SIZE_MB}MB
                      </p>
                    </>
                  )}
                </div>

                {/* Upload Error */}
                {uploadError && (
                  <div className="mt-2 flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{uploadError}</span>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadProgress && (
                  <div className="mt-2 flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                    <span className="text-sm">{uploadProgress}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBAA.isPending || isUploading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 flex items-center space-x-2"
                >
                  {(createBAA.isPending || isUploading) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>{uploadProgress || 'Adding...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Add BAA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceBAAs;

