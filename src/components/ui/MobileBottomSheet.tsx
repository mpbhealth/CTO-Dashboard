import { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  showHandle?: boolean;
  maxHeight?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  showHandle = true,
  maxHeight = 'lg',
  showCloseButton = true,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  // Height mapping
  const heightClasses = {
    sm: 'max-h-[40vh]',
    md: 'max-h-[60vh]',
    lg: 'max-h-[80vh]',
    xl: 'max-h-[90vh]',
    full: 'max-h-screen',
  };

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Touch handlers for drag-to-dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;
    // Only allow dragging down (positive values)
    if (diff > 0) {
      setDragOffset(diff);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const diff = touchCurrentY.current - touchStartY.current;
    // If dragged more than 100px down, close the sheet
    if (diff > 100) {
      onClose();
    }
    setDragOffset(0);
  }, [isDragging, onClose]);

  if (!isOpen) return null;

  const sheetTransform = isDragging 
    ? `translateY(${dragOffset}px)` 
    : 'translateY(0)';

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Desktop Modal - Centered */}
      <div className="hidden md:flex items-center justify-center min-h-screen p-4">
        <div 
          className={`
            relative bg-white rounded-2xl shadow-2xl 
            w-full max-w-lg ${heightClasses[maxHeight]}
            overflow-hidden animate-scale-in
          `}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="
                    p-2 rounded-lg text-gray-400 
                    hover:text-gray-600 hover:bg-gray-100
                    transition-colors touch-manipulation
                    min-h-[40px] min-w-[40px]
                    flex items-center justify-center
                  "
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div 
        ref={sheetRef}
        className={`
          md:hidden fixed inset-x-0 bottom-0
          bg-white rounded-t-3xl shadow-bottom-sheet
          ${heightClasses[maxHeight]}
          overflow-hidden
          transition-transform duration-300 ease-out
          will-change-transform
        `}
        style={{ 
          transform: sheetTransform,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag Handle */}
        {showHandle && (
          <div 
            className="pt-3 pb-2 cursor-grab active:cursor-grabbing touch-manipulation"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="text-base font-semibold text-gray-900 truncate">{title}</h2>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  p-2.5 rounded-xl text-gray-400 
                  hover:text-gray-600 hover:bg-gray-100
                  active:bg-gray-200
                  transition-colors touch-manipulation
                  min-h-[44px] min-w-[44px]
                  flex items-center justify-center
                  flex-shrink-0 ml-2
                "
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div 
          className="overflow-y-auto overscroll-contain flex-1"
          style={{ maxHeight: 'calc(100% - 80px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Export a simpler modal wrapper for non-bottom-sheet modals
export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}) {
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        className={`
          relative bg-white rounded-2xl shadow-2xl 
          w-full ${widthClasses[maxWidth]}
          max-h-[90vh] overflow-hidden
          animate-scale-in
        `}
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="
                p-2 rounded-lg text-gray-400 
                hover:text-gray-600 hover:bg-gray-100
                active:bg-gray-200
                transition-colors touch-manipulation
                min-h-[40px] min-w-[40px]
                flex items-center justify-center
                flex-shrink-0 ml-2
              "
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}




