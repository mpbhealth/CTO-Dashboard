import { useState, useCallback, useRef, useEffect } from 'react';
import { RichTextEditor } from './RichTextEditor';
import {
  X,
  Send,
  Paperclip,
  Image as ImageIcon,
  Trash2,
  ChevronDown,
  Minus,
  Maximize2,
  Minimize2,
  Loader2,
  FileSignature,
} from 'lucide-react';
import type { ComposeEmail, EmailRecipient, EmailAttachment, EmailSignature } from '@/types/email';

interface EmailComposeProps {
  initialData?: Partial<ComposeEmail>;
  signatures: EmailSignature[];
  defaultSignature?: EmailSignature;
  onSend: (email: ComposeEmail) => Promise<void>;
  onClose: () => void;
  onUploadAttachment: (file: File) => Promise<EmailAttachment>;
  onUploadImage: (file: File) => Promise<string>;
  isSending?: boolean;
  replyingTo?: { subject: string; from: EmailRecipient };
}

export function EmailCompose({
  initialData,
  signatures,
  defaultSignature,
  onSend,
  onClose,
  onUploadAttachment,
  onUploadImage,
  isSending,
  replyingTo,
}: EmailComposeProps) {
  // Form state
  const [to, setTo] = useState<EmailRecipient[]>(initialData?.to || []);
  const [cc, setCc] = useState<EmailRecipient[]>(initialData?.cc || []);
  const [bcc, setBcc] = useState<EmailRecipient[]>(initialData?.bcc || []);
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [bodyHtml, setBodyHtml] = useState(initialData?.bodyHtml || '');
  const [attachments, setAttachments] = useState<EmailAttachment[]>(initialData?.attachments || []);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | undefined>(
    defaultSignature?.id
  );
  const [importance, setImportance] = useState<'low' | 'normal' | 'high'>(
    (initialData?.importance as 'low' | 'normal' | 'high') || 'normal'
  );

  // UI state
  const [showCc, setShowCc] = useState(cc.length > 0);
  const [showBcc, setShowBcc] = useState(bcc.length > 0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSignatures, setShowSignatures] = useState(false);

  // Input refs for recipient fields
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse email input (handles "Name <email>" format)
  const parseEmailInput = (input: string): EmailRecipient | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Check for "Name <email>" format
    const match = trimmed.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/);
    if (match) {
      return {
        name: match[1]?.trim() || undefined,
        email: match[2].trim(),
      };
    }

    // Check if it's a valid email
    if (trimmed.includes('@')) {
      return { email: trimmed };
    }

    return null;
  };

  // Handle recipient input
  const handleRecipientKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    recipients: EmailRecipient[],
    setRecipients: (r: EmailRecipient[]) => void
  ) => {
    const input = e.currentTarget;

    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      const recipient = parseEmailInput(input.value);
      if (recipient && !recipients.some((r) => r.email === recipient.email)) {
        setRecipients([...recipients, recipient]);
        input.value = '';
      }
    } else if (e.key === 'Backspace' && !input.value && recipients.length > 0) {
      setRecipients(recipients.slice(0, -1));
    }
  };

  const handleRecipientBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    recipients: EmailRecipient[],
    setRecipients: (r: EmailRecipient[]) => void
  ) => {
    const input = e.currentTarget;
    const recipient = parseEmailInput(input.value);
    if (recipient && !recipients.some((r) => r.email === recipient.email)) {
      setRecipients([...recipients, recipient]);
      input.value = '';
    }
  };

  const removeRecipient = (
    email: string,
    recipients: EmailRecipient[],
    setRecipients: (r: EmailRecipient[]) => void
  ) => {
    setRecipients(recipients.filter((r) => r.email !== email));
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Check size (25MB max)
        if (file.size > 25 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size is 25MB.`);
          continue;
        }

        const attachment = await onUploadAttachment(file);
        setAttachments((prev) => [...prev, attachment]);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadAttachment]);

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  // Insert signature
  const insertSignature = (signature: EmailSignature) => {
    setSelectedSignatureId(signature.id);
    setShowSignatures(false);
  };

  // Handle send
  const handleSend = async () => {
    if (to.length === 0) {
      alert('Please add at least one recipient');
      toInputRef.current?.focus();
      return;
    }

    if (!subject.trim()) {
      const proceed = confirm('Send this email without a subject?');
      if (!proceed) return;
    }

    await onSend({
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject,
      bodyHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
      signatureId: selectedSignatureId,
      importance,
    });
  };

  // Recipient tag component
  const RecipientTag = ({
    recipient,
    onRemove,
  }: {
    recipient: EmailRecipient;
    onRemove: () => void;
  }) => (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full">
      {recipient.name || recipient.email}
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );

  // Window size class
  const windowClass = isMaximized
    ? 'fixed inset-4 z-50'
    : isMinimized
    ? 'fixed bottom-4 right-4 w-80 z-50'
    : 'fixed bottom-4 right-4 w-[600px] max-w-[calc(100vw-2rem)] z-50';

  if (isMinimized) {
    return (
      <div className={`${windowClass} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl`}>
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {subject || 'New Message'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${windowClass} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
        <span className="font-medium text-gray-900 dark:text-white">
          {replyingTo ? `Reply to ${replyingTo.from.name || replyingTo.from.email}` : 'New Message'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        {/* To field */}
        <div className="flex items-start gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          <label className="text-sm text-gray-500 dark:text-gray-400 pt-1.5 w-12">To</label>
          <div className="flex-1 flex flex-wrap items-center gap-1">
            {to.map((r) => (
              <RecipientTag
                key={r.email}
                recipient={r}
                onRemove={() => removeRecipient(r.email, to, setTo)}
              />
            ))}
            <input
              ref={toInputRef}
              type="text"
              placeholder={to.length === 0 ? 'Recipients' : ''}
              onKeyDown={(e) => handleRecipientKeyDown(e, to, setTo)}
              onBlur={(e) => handleRecipientBlur(e, to, setTo)}
              className="flex-1 min-w-[150px] py-1 bg-transparent outline-none text-sm"
            />
          </div>
          <button
            onClick={() => {
              setShowCc(!showCc);
              setShowBcc(!showBcc);
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cc/Bcc
          </button>
        </div>

        {/* Cc field */}
        {showCc && (
          <div className="flex items-start gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <label className="text-sm text-gray-500 dark:text-gray-400 pt-1.5 w-12">Cc</label>
            <div className="flex-1 flex flex-wrap items-center gap-1">
              {cc.map((r) => (
                <RecipientTag
                  key={r.email}
                  recipient={r}
                  onRemove={() => removeRecipient(r.email, cc, setCc)}
                />
              ))}
              <input
                ref={ccInputRef}
                type="text"
                onKeyDown={(e) => handleRecipientKeyDown(e, cc, setCc)}
                onBlur={(e) => handleRecipientBlur(e, cc, setCc)}
                className="flex-1 min-w-[150px] py-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Bcc field */}
        {showBcc && (
          <div className="flex items-start gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <label className="text-sm text-gray-500 dark:text-gray-400 pt-1.5 w-12">Bcc</label>
            <div className="flex-1 flex flex-wrap items-center gap-1">
              {bcc.map((r) => (
                <RecipientTag
                  key={r.email}
                  recipient={r}
                  onRemove={() => removeRecipient(r.email, bcc, setBcc)}
                />
              ))}
              <input
                ref={bccInputRef}
                type="text"
                onKeyDown={(e) => handleRecipientKeyDown(e, bcc, setBcc)}
                onBlur={(e) => handleRecipientBlur(e, bcc, setBcc)}
                className="flex-1 min-w-[150px] py-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Subject field */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          <label className="text-sm text-gray-500 dark:text-gray-400 w-12">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 py-1 bg-transparent outline-none text-sm"
          />
        </div>

        {/* Body editor */}
        <div className="p-4">
          <RichTextEditor
            content={bodyHtml}
            onChange={setBodyHtml}
            onImageUpload={onUploadImage}
            placeholder="Write your message..."
            minHeight={isMaximized ? '300px' : '150px'}
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="px-4 pb-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-xs font-medium text-gray-500 mb-2">
                Attachments ({attachments.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"
                  >
                    <Paperclip className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                      {att.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {(att.size / 1024).toFixed(0)}KB
                    </span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="p-0.5 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
        <div className="flex items-center gap-2">
          {/* Attach file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            title="Attach file"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />

          {/* Signature selector */}
          {signatures.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSignatures(!showSignatures)}
                className={`p-2 rounded-lg ${
                  selectedSignatureId
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Insert signature"
              >
                <FileSignature className="w-5 h-5" />
              </button>
              {showSignatures && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSignatures(false)} />
                  <div className="absolute left-0 bottom-full mb-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100 dark:border-gray-700">
                      Select signature
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSignatureId(undefined);
                        setShowSignatures(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        !selectedSignatureId ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      No signature
                    </button>
                    {signatures.map((sig) => (
                      <button
                        key={sig.id}
                        onClick={() => insertSignature(sig)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedSignatureId === sig.id
                            ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {sig.name}
                        {sig.is_default && (
                          <span className="ml-2 text-xs text-gray-400">(default)</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isSending || to.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default EmailCompose;
