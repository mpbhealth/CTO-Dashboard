import { useState } from 'react';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  Archive,
  MoreVertical,
  Paperclip,
  Download,
  ExternalLink,
  Loader2,
  Star,
  Flag,
} from 'lucide-react';
import type { EmailMessage, EmailFolder } from '@/types/email';

interface EmailViewerProps {
  message: EmailMessage | null;
  folders: EmailFolder[];
  onBack: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onDelete: () => void;
  onMove: (folderId: string) => void;
  isLoading?: boolean;
  isDeleting?: boolean;
}

export function EmailViewer({
  message,
  folders,
  onBack,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onMove,
  isLoading,
  isDeleting,
}: EmailViewerProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-lg">Select an email to view</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRecipients = (recipients: { email: string; name?: string }[]) => {
    return recipients.map((r) => r.name || r.email).join(', ');
  };

  // Sanitize HTML content
  const sanitizedBody = message.bodyHtml
    ? DOMPurify.sanitize(message.bodyHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'div', 'span', 'a', 'img', 'b', 'strong', 'i', 'em', 'u',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr',
          'td', 'th', 'thead', 'tbody', 'blockquote', 'pre', 'code', 'hr',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'width', 'height'],
        ALLOW_DATA_ATTR: false,
      })
    : message.bodyText || message.bodyPreview;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header / Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={onReply}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title="Reply"
        >
          <Reply className="w-4 h-4" />
          <span className="hidden sm:inline">Reply</span>
        </button>
        <button
          onClick={onReplyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title="Reply All"
        >
          <ReplyAll className="w-4 h-4" />
          <span className="hidden sm:inline">Reply All</span>
        </button>
        <button
          onClick={onForward}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title="Forward"
        >
          <Forward className="w-4 h-4" />
          <span className="hidden sm:inline">Forward</span>
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Move dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Move to"
          >
            <Archive className="w-4 h-4" />
          </button>
          {showMoveMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMoveMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      onMove(folder.id);
                      setShowMoveMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {folder.displayName}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
          title="Delete"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMoreMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                {message.webLink && (
                  <a
                    href={message.webLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in {message.provider === 'outlook' ? 'Outlook' : 'Gmail'}
                  </a>
                )}
                <button
                  onClick={() => {
                    window.print();
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Print
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Subject */}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {message.subject || '(No Subject)'}
          </h1>

          {/* Sender info */}
          <div className="flex items-start gap-4 mb-6">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
              {(message.from.name || message.from.email).charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-white">
                  {message.from.name || message.from.email}
                </span>
                {message.importance === 'high' && (
                  <span className="px-1.5 py-0.5 text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 rounded">
                    Important
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {message.from.email}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                To: {formatRecipients(message.to)}
                {message.cc.length > 0 && (
                  <span className="ml-2">Cc: {formatRecipients(message.cc)}</span>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
              {formatDate(message.receivedAt)}
            </div>
          </div>

          {/* Attachments */}
          {message.hasAttachments && message.attachments && message.attachments.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Paperclip className="w-4 h-4" />
                {message.attachments.length} Attachment{message.attachments.length !== 1 ? 's' : ''}
              </div>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                      {attachment.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {(attachment.size / 1024).toFixed(0)} KB
                    </span>
                    <button className="p-1 text-gray-400 hover:text-blue-600">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email body */}
          <div
            className="prose prose-sm dark:prose-invert max-w-none email-body"
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        </div>
      </div>

      {/* Styles for email body */}
      <style>{`
        .email-body img {
          max-width: 100%;
          height: auto;
        }
        .email-body a {
          color: #2563eb;
          text-decoration: underline;
        }
        .email-body blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          margin-left: 0;
          color: #6b7280;
        }
        .email-body table {
          border-collapse: collapse;
          width: 100%;
        }
        .email-body td, .email-body th {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default EmailViewer;
