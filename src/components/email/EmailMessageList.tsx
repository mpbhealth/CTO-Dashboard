import { useState } from 'react';
import {
  Paperclip,
  Circle,
  Loader2,
  Mail,
  Filter,
  ChevronDown,
} from 'lucide-react';
import type { EmailMessage } from '@/types/email';

interface EmailMessageListProps {
  messages: EmailMessage[];
  selectedMessageId: string | null;
  onSelectMessage: (messageId: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
}

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'has_attachments', label: 'Has Attachments' },
];

export function EmailMessageList({
  messages,
  selectedMessageId,
  onSelectMessage,
  filter,
  onFilterChange,
  hasMore,
  onLoadMore,
  isLoading,
}: EmailMessageListProps) {
  const [showFilters, setShowFilters] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'text-red-500';
      case 'low':
        return 'text-gray-400';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Filter className="w-4 h-4" />
            {filterOptions.find((f) => f.value === filter)?.label || 'All'}
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showFilters && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowFilters(false)}
              />
              <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[150px]">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onFilterChange(option.value);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      filter === option.value
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {messages.length} messages
        </span>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <Mail className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
            <p>No messages found</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <button
                key={message.id}
                onClick={() => onSelectMessage(message.id)}
                className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  selectedMessageId === message.id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                } ${!message.isRead ? 'bg-white dark:bg-gray-900' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Read indicator */}
                  <div className="pt-1">
                    {message.isRead ? (
                      <Circle className="w-2 h-2 text-transparent" />
                    ) : (
                      <Circle className="w-2 h-2 text-blue-500 fill-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Sender and date */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`truncate text-sm ${
                          !message.isRead
                            ? 'font-semibold text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {message.from.name || message.from.email}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {formatDate(message.receivedAt)}
                      </span>
                    </div>

                    {/* Subject */}
                    <div
                      className={`truncate text-sm mb-1 ${
                        !message.isRead
                          ? 'font-medium text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      } ${getImportanceColor(message.importance)}`}
                    >
                      {message.subject || '(No Subject)'}
                    </div>

                    {/* Preview */}
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs text-gray-500 dark:text-gray-400 flex-1">
                        {message.bodyPreview || '(No content)'}
                      </span>
                      
                      {/* Indicators */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {message.hasAttachments && (
                          <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        {message.importance === 'high' && (
                          <span className="text-xs text-red-500 font-medium">!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EmailMessageList;
