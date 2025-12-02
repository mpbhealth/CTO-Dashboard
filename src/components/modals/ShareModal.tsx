import { useState } from 'react';
import { X, Users, Lock, Share2, Globe } from 'lucide-react';
import {
  useUpdateVisibility,
  useGrantAccess,
  useRevokeAccess,
  useResourceACL,
  useCurrentProfile,
} from '../../hooks/useDualDashboard';
import type { Resource, Visibility } from '../../lib/dualDashboard';

interface ShareModalProps {
  resource: Resource;
  onClose: () => void;
}

export function ShareModal({ resource, onClose }: ShareModalProps) {
  const { data: profile } = useCurrentProfile();
  const { data: acl = [] } = useResourceACL(resource.id);
  const updateVisibility = useUpdateVisibility();
  const grantAccess = useGrantAccess();
  const revokeAccess = useRevokeAccess();

  const [selectedVisibility, setSelectedVisibility] = useState<Visibility>(resource.visibility);
  const [newGranteeEmail, setNewGranteeEmail] = useState('');
  const [grantWrite, setGrantWrite] = useState(false);

  const handleUpdateVisibility = async () => {
    if (selectedVisibility !== resource.visibility) {
      await updateVisibility.mutateAsync({
        resourceId: resource.id,
        visibility: selectedVisibility,
      });
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGranteeEmail.trim()) return;

    await grantAccess.mutateAsync({
      resourceId: resource.id,
      granteeProfileId: newGranteeEmail,
      canRead: true,
      canWrite: grantWrite,
    });

    setNewGranteeEmail('');
    setGrantWrite(false);
  };

  const handleRevokeAccess = async (granteeId: string) => {
    await revokeAccess.mutateAsync({
      resourceId: resource.id,
      granteeProfileId: granteeId,
    });
  };

  const visibilityOptions: Array<{ value: Visibility; label: string; icon: any; description: string }> = [
    {
      value: 'private',
      label: 'Private',
      icon: Lock,
      description: 'Only you can access',
    },
    {
      value: 'shared_to_cto',
      label: 'Share with CTO',
      icon: Share2,
      description: 'CTO and admins can view',
    },
    {
      value: 'shared_to_ceo',
      label: 'Share with CEO',
      icon: Share2,
      description: 'CEO and admins can view',
    },
    {
      value: 'org_public',
      label: 'Organization',
      icon: Globe,
      description: 'All organization members can view',
    },
  ];

  const isOwner = profile?.user_id === resource.created_by;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-indigo-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Share Settings</h2>
              <p className="text-sm text-gray-500">{resource.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isOwner && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Visibility Level
                </label>
                <div className="space-y-2">
                  {visibilityOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <label
                        key={option.value}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedVisibility === option.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          value={option.value}
                          checked={selectedVisibility === option.value}
                          onChange={(e) => setSelectedVisibility(e.target.value as Visibility)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Icon size={16} className="text-gray-600" />
                            <span className="font-medium text-gray-900">{option.label}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {selectedVisibility !== resource.visibility && (
                  <button
                    onClick={handleUpdateVisibility}
                    disabled={updateVisibility.isPending}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {updateVisibility.isPending ? 'Updating...' : 'Update Visibility'}
                  </button>
                )}
              </div>

              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Grant Specific Access
                </label>
                <form onSubmit={handleGrantAccess} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGranteeEmail}
                      onChange={(e) => setNewGranteeEmail(e.target.value)}
                      placeholder="Enter user ID or email"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newGranteeEmail.trim() || grantAccess.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {grantAccess.isPending ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={grantWrite}
                      onChange={(e) => setGrantWrite(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-gray-700">Grant write permission</span>
                  </label>
                </form>
              </div>
            </>
          )}

          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Access</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">You (Owner)</p>
                  <p className="text-sm text-gray-500">Full access</p>
                </div>
              </div>
              {acl.map((grant) => (
                <div
                  key={grant.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{grant.grantee_profile_id}</p>
                    <p className="text-sm text-gray-500">
                      {grant.can_write ? 'Read & Write' : 'Read only'}
                    </p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRevokeAccess(grant.grantee_profile_id)}
                      disabled={revokeAccess.isPending}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {acl.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No additional access grants
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
