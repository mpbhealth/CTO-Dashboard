import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  
  // Touch drag state for mobile bottom sheet
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Touch handlers for mobile drag-to-dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;
    if (diff > 0) setDragOffset(diff);
  }, [isDragging, isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (touchCurrentY.current - touchStartY.current > 100) {
      onClose();
    }
    setDragOffset(0);
  }, [isDragging, onClose]);

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

  const visibilityOptions: Array<{ value: Visibility; label: string; icon: typeof Lock; description: string }> = [
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

  const sheetTransform = isDragging && isMobile 
    ? `translateY(${dragOffset}px)` 
    : 'translateY(0)';

  // Modal content - shared between desktop and mobile
  const ModalContent = () => (
    <>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
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
                      className={`
                        flex items-start gap-3 p-3 sm:p-4 
                        border rounded-xl cursor-pointer 
                        transition-all duration-200
                        touch-manipulation active:scale-[0.99]
                        ${selectedVisibility === option.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={selectedVisibility === option.value}
                        onChange={(e) => setSelectedVisibility(e.target.value as Visibility)}
                        className="mt-1 w-4 h-4 text-indigo-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className="text-gray-600 flex-shrink-0" />
                          <span className="font-medium text-gray-900 text-sm sm:text-base">
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {selectedVisibility !== resource.visibility && (
                <button
                  onClick={handleUpdateVisibility}
                  disabled={updateVisibility.isPending}
                  className="
                    mt-4 w-full sm:w-auto px-4 py-3 sm:py-2.5
                    bg-indigo-600 text-white rounded-xl 
                    hover:bg-indigo-700 active:bg-indigo-800
                    active:scale-[0.98]
                    transition-all duration-200 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    font-medium text-sm
                    min-h-[44px]
                    touch-manipulation
                  "
                >
                  {updateVisibility.isPending ? 'Updating...' : 'Update Visibility'}
                </button>
              )}
            </div>

            <div className="border-t pt-5 sm:pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Grant Specific Access
              </label>
              <form onSubmit={handleGrantAccess} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newGranteeEmail}
                    onChange={(e) => setNewGranteeEmail(e.target.value)}
                    placeholder="Enter user ID or email"
                    className="
                      flex-1 px-4 py-3 
                      border border-gray-300 rounded-xl 
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      text-base
                      min-h-[48px]
                    "
                  />
                  <button
                    type="submit"
                    disabled={!newGranteeEmail.trim() || grantAccess.isPending}
                    className="
                      px-6 py-3 
                      bg-green-600 text-white rounded-xl 
                      hover:bg-green-700 active:bg-green-800
                      active:scale-[0.98]
                      transition-all duration-200 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      font-medium text-sm
                      min-h-[48px]
                      touch-manipulation
                      whitespace-nowrap
                    "
                  >
                    {grantAccess.isPending ? 'Adding...' : 'Add'}
                  </button>
                </div>
                <label className="flex items-center gap-3 text-sm py-1 touch-manipulation">
                  <input
                    type="checkbox"
                    checked={grantWrite}
                    onChange={(e) => setGrantWrite(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-gray-700">Grant write permission</span>
                </label>
              </form>
            </div>
          </>
        )}

        <div className={`${isOwner ? 'border-t pt-5 sm:pt-6' : ''}`}>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Current Access</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 text-sm">You (Owner)</p>
                <p className="text-xs text-gray-500">Full access</p>
              </div>
            </div>
            {acl.map((grant) => (
              <div
                key={grant.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {grant.grantee_profile_id}
                  </p>
                  <p className="text-xs text-gray-500">
                    {grant.can_write ? 'Read & Write' : 'Read only'}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRevokeAccess(grant.grantee_profile_id)}
                    disabled={revokeAccess.isPending}
                    className="
                      text-red-600 hover:text-red-700 
                      text-sm font-medium 
                      px-3 py-2 rounded-lg
                      hover:bg-red-50 active:bg-red-100
                      transition-colors
                      touch-manipulation
                      min-h-[40px]
                      flex-shrink-0
                    "
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

      {/* Footer */}
      <div 
        className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-4 border-t"
        style={{ paddingBottom: isMobile ? 'max(1rem, env(safe-area-inset-bottom))' : undefined }}
      >
        <button
          onClick={onClose}
          className="
            w-full px-4 py-3 
            bg-gray-200 text-gray-700 rounded-xl 
            hover:bg-gray-300 active:bg-gray-400
            active:scale-[0.98]
            transition-all duration-200 
            font-medium text-sm
            min-h-[48px]
            touch-manipulation
          "
        >
          Close
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Desktop Modal */}
      <div className="hidden md:flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <Users className="text-indigo-600" size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">Share Settings</h2>
                <p className="text-sm text-gray-500 truncate">{resource.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="
                p-2 rounded-lg text-gray-400 
                hover:text-gray-600 hover:bg-gray-100
                transition-colors
                min-h-[40px] min-w-[40px]
                flex items-center justify-center
              "
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <ModalContent />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div
        ref={sheetRef}
        className="
          md:hidden fixed inset-x-0 bottom-0
          bg-white rounded-t-3xl shadow-bottom-sheet
          max-h-[85vh] overflow-hidden
          transition-transform duration-300 ease-out
          will-change-transform
        "
        style={{ transform: sheetTransform }}
      >
        {/* Drag Handle */}
        <div 
          className="pt-3 pb-2 cursor-grab active:cursor-grabbing touch-manipulation"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
              <Users className="text-indigo-600" size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">Share Settings</h2>
              <p className="text-xs text-gray-500 truncate">{resource.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="
              p-2.5 rounded-xl text-gray-400 
              hover:text-gray-600 hover:bg-gray-100
              active:bg-gray-200
              transition-colors touch-manipulation
              min-h-[44px] min-w-[44px]
              flex items-center justify-center
              flex-shrink-0
            "
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          <ModalContent />
        </div>
      </div>
    </div>
  );
}
