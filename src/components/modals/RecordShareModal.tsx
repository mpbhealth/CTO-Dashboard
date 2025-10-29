import { useState } from 'react';
import { X, Share2, Lock, Globe, Users, Check, Trash2 } from 'lucide-react';
import { useRecordShares, useShareRecord, useUnshareRecord, useUpdateRecordVisibility } from '../../hooks/useRecords';
import { useAuth } from '../../contexts/AuthContext';

interface RecordShareModalProps {
  recordId: string;
  recordTitle: string;
  currentVisibility: 'private' | 'org' | 'shared';
  onClose: () => void;
}

export function RecordShareModal({ recordId, recordTitle, currentVisibility, onClose }: RecordShareModalProps) {
  const { profile } = useAuth();
  const [shareType, setShareType] = useState<'role' | 'user'>('role');
  const [targetRole, setTargetRole] = useState<'ceo' | 'cto'>('cto');
  const [canEdit, setCanEdit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: shares = [], isLoading: sharesLoading } = useRecordShares(recordId);
  const shareRecord = useShareRecord();
  const unshareRecord = useUnshareRecord();
  const updateVisibility = useUpdateRecordVisibility();

  const handleShare = async () => {
    try {
      if (shareType === 'role') {
        await shareRecord.mutateAsync({
          record_id: recordId,
          target_role: targetRole,
          can_edit: canEdit,
        });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error sharing record:', error);
      alert('Failed to share record. Please try again.');
    }
  };

  const handleUnshare = async (shareId: string) => {
    if (!confirm('Remove this share access?')) return;

    try {
      await unshareRecord.mutateAsync({ shareId, recordId });
    } catch (error) {
      console.error('Error unsharing record:', error);
      alert('Failed to remove access. Please try again.');
    }
  };

  const handleVisibilityChange = async (newVisibility: 'private' | 'org' | 'shared') => {
    try {
      await updateVisibility.mutateAsync({ recordId, visibility: newVisibility });
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Failed to update visibility. Please try again.');
    }
  };

  const isCEO = profile?.role === 'ceo' || profile?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Share & Permissions</h2>
              <p className="text-sm text-gray-500 truncate max-w-md">{recordTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Shared successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Visibility Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleVisibilityChange('private')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentVisibility === 'private'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Lock className={`w-5 h-5 mx-auto mb-2 ${
                  currentVisibility === 'private' ? 'text-pink-600' : 'text-gray-400'
                }`} />
                <div className="text-sm font-medium text-gray-900">Private</div>
                <div className="text-xs text-gray-500 mt-1">Only you</div>
              </button>

              <button
                onClick={() => handleVisibilityChange('org')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentVisibility === 'org'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Globe className={`w-5 h-5 mx-auto mb-2 ${
                  currentVisibility === 'org' ? 'text-pink-600' : 'text-gray-400'
                }`} />
                <div className="text-sm font-medium text-gray-900">Organization</div>
                <div className="text-xs text-gray-500 mt-1">All members</div>
              </button>

              <button
                onClick={() => handleVisibilityChange('shared')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentVisibility === 'shared'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className={`w-5 h-5 mx-auto mb-2 ${
                  currentVisibility === 'shared' ? 'text-pink-600' : 'text-gray-400'
                }`} />
                <div className="text-sm font-medium text-gray-900">Shared</div>
                <div className="text-xs text-gray-500 mt-1">Specific access</div>
              </button>
            </div>
          </div>

          {currentVisibility === 'shared' && (
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Add Share Access
              </label>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <select
                    value={shareType}
                    onChange={(e) => setShareType(e.target.value as 'role' | 'user')}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="role">Share with Role</option>
                    <option value="user">Share with User</option>
                  </select>
                </div>

                {shareType === 'role' && (
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as 'ceo' | 'cto')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {isCEO ? (
                      <>
                        <option value="cto">CTO / Technology Team</option>
                        <option value="staff">Staff Members</option>
                      </>
                    ) : (
                      <>
                        <option value="ceo">CEO / Executive Team</option>
                        <option value="staff">Staff Members</option>
                      </>
                    )}
                  </select>
                )}

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={canEdit}
                    onChange={(e) => setCanEdit(e.target.checked)}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">
                    Allow editing (not just viewing)
                  </span>
                </label>

                <button
                  onClick={handleShare}
                  disabled={shareRecord.isPending}
                  className="w-full bg-gradient-to-r from-pink-600 to-pink-700 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {shareRecord.isPending ? 'Sharing...' : 'Add Access'}
                </button>
              </div>
            </div>
          )}

          {currentVisibility === 'shared' && (
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Current Access ({shares.length})
              </label>

              {sharesLoading ? (
                <div className="text-center py-4 text-gray-500">Loading shares...</div>
              ) : shares.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No shares yet. Add access above to share this record.
                </div>
              ) : (
                <div className="space-y-2">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {share.target_role ? share.target_role.substring(0, 2).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {share.target_role ? (
                              `${share.target_role.toUpperCase()} Role`
                            ) : (
                              share.profiles?.display_name || share.profiles?.email || 'User'
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {share.can_edit ? 'Can edit' : 'View only'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnshare(share.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
