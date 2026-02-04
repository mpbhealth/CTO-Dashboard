import { useState } from 'react';
import { SignatureEditor } from './SignatureEditor';
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Copy,
  MoreVertical,
} from 'lucide-react';
import type { EmailSignature } from '@/types/email';

interface SignatureManagerProps {
  signatures: EmailSignature[];
  onSave: (signature: Partial<EmailSignature>) => Promise<void>;
  onDelete: (signatureId: string) => Promise<void>;
  onSetDefault: (signatureId: string) => Promise<void>;
  onImageUpload: (file: File) => Promise<string>;
  isLoading?: boolean;
}

export function SignatureManager({
  signatures,
  onSave,
  onDelete,
  onSetDefault,
  onImageUpload,
  isLoading = false,
}: SignatureManagerProps) {
  const [editingSignature, setEditingSignature] = useState<EmailSignature | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = async (signatureData: Partial<EmailSignature>) => {
    await onSave(signatureData);
    setEditingSignature(null);
    setIsCreating(false);
  };

  const handleDelete = async (signatureId: string) => {
    if (confirm('Are you sure you want to delete this signature?')) {
      setDeletingId(signatureId);
      try {
        await onDelete(signatureId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDuplicate = async (signature: EmailSignature) => {
    await onSave({
      name: `${signature.name} (Copy)`,
      html_content: signature.html_content,
      logo_url: signature.logo_url,
      logo_width: signature.logo_width,
      include_social_links: signature.include_social_links,
      social_links: signature.social_links,
      is_default: false,
    });
    setActiveMenu(null);
  };

  // If editing or creating, show the editor
  if (editingSignature || isCreating) {
    return (
      <SignatureEditor
        signature={editingSignature || undefined}
        onSave={handleSave}
        onCancel={() => {
          setEditingSignature(null);
          setIsCreating(false);
        }}
        onImageUpload={onImageUpload}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Email Signatures
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage your email signatures with custom logos and formatting.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          New Signature
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && signatures.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Edit2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No signatures yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first email signature to make your emails look professional.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Create Signature
          </button>
        </div>
      )}

      {/* Signature list */}
      {!isLoading && signatures.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {signatures.map((signature) => (
            <div
              key={signature.id}
              className="relative border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden group"
            >
              {/* Default badge */}
              {signature.is_default && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                  <Star className="w-3 h-3 fill-current" />
                  Default
                </div>
              )}

              {/* Preview */}
              <div className="p-4 h-40 overflow-hidden border-b border-gray-100 dark:border-gray-700">
                {signature.logo_url && (
                  <img
                    src={signature.logo_url}
                    alt="Logo"
                    style={{ width: Math.min(signature.logo_width || 150, 120) }}
                    className="mb-2"
                  />
                )}
                <div
                  dangerouslySetInnerHTML={{ __html: signature.html_content }}
                  className="prose prose-sm dark:prose-invert max-w-none text-xs opacity-75"
                  style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}
                />
              </div>

              {/* Info and actions */}
              <div className="p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {signature.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {new Date(signature.updated_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingSignature(signature)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* More options menu */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === signature.id ? null : signature.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenu === signature.id && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveMenu(null)}
                        />
                        
                        {/* Menu */}
                        <div className="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                          {!signature.is_default && (
                            <button
                              onClick={() => {
                                onSetDefault(signature.id);
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Star className="w-4 h-4" />
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDuplicate(signature)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(signature.id);
                              setActiveMenu(null);
                            }}
                            disabled={deletingId === signature.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            {deletingId === signature.id ? (
                              <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SignatureManager;
