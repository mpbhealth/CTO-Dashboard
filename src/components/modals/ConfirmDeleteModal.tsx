import { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  itemName: string;
  itemType: 'employee' | 'department' | 'item';
  warningMessage?: string;
}

export default function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  itemName,
  itemType,
  warningMessage
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Error deleting:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError(null);
    onClose();
  };

  const requiresConfirmation = itemType === 'department';
  const isConfirmDisabled = requiresConfirmation && confirmText.toLowerCase() !== 'delete';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                <p className="text-sm text-red-600 font-medium">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-slate-700 mb-2">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-900">"{itemName}"</span>?
              </p>
              
              {warningMessage && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mt-3">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  {warningMessage}
                </p>
              )}

              {itemType === 'department' && (
                <p className="text-sm text-slate-500 mt-3">
                  Deleting this department may affect employees assigned to it.
                </p>
              )}
            </div>

            {requiresConfirmation && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Type <span className="font-bold text-red-600">delete</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  placeholder="Type 'delete' to confirm"
                  autoComplete="off"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 p-6 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all font-medium border border-slate-200"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting || isConfirmDisabled}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

