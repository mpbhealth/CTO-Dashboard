import {
  Inbox,
  Send,
  FileText,
  Trash2,
  AlertOctagon,
  Archive,
  Folder,
  ChevronRight,
} from 'lucide-react';
import type { EmailFolder } from '@/types/email';

interface EmailFolderListProps {
  folders: EmailFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  isLoading?: boolean;
}

const folderIcons: Record<string, React.ElementType> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileText,
  trash: Trash2,
  spam: AlertOctagon,
  archive: Archive,
  custom: Folder,
};

export function EmailFolderList({
  folders,
  selectedFolderId,
  onSelectFolder,
  isLoading,
}: EmailFolderListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // Sort folders: system folders first, then custom
  const systemOrder = ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'];
  const sortedFolders = [...folders].sort((a, b) => {
    const aIndex = systemOrder.indexOf(a.type);
    const bIndex = systemOrder.indexOf(b.type);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div className="py-2">
      {sortedFolders.map((folder) => {
        const Icon = folderIcons[folder.type] || Folder;
        const isSelected = selectedFolderId === folder.id;

        return (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              isSelected
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className="flex-1 text-left truncate">{folder.displayName}</span>
            {folder.unreadCount > 0 && (
              <span
                className={`min-w-[20px] px-1.5 py-0.5 text-xs font-medium rounded-full text-center ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {folder.unreadCount > 99 ? '99+' : folder.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default EmailFolderList;
