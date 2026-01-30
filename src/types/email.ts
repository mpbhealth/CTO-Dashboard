// Email Suite Types

// Provider types
export type EmailProvider = 'outlook' | 'gmail';

// Email account connected via OAuth
export interface EmailAccount {
  id: string;
  user_id: string;
  provider: EmailProvider;
  email_address: string;
  display_name?: string;
  is_default: boolean;
  is_active: boolean;
  last_sync_at?: string;
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

// Email signature
export interface EmailSignature {
  id: string;
  user_id: string;
  name: string;
  html_content: string;
  plain_text_content?: string;
  logo_url?: string;
  logo_width?: number;
  logo_height?: number;
  include_social_links: boolean;
  social_links: SocialLinks;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
}

// Email draft
export interface EmailDraft {
  id: string;
  user_id: string;
  account_id?: string;
  to_recipients: EmailRecipient[];
  cc_recipients: EmailRecipient[];
  bcc_recipients: EmailRecipient[];
  subject: string;
  body_html: string;
  body_plain: string;
  signature_id?: string;
  attachments: EmailAttachment[];
  in_reply_to?: string;
  reply_type?: 'reply' | 'reply_all' | 'forward';
  original_message_id?: string;
  created_at: string;
  updated_at: string;
}

// Recipient object
export interface EmailRecipient {
  email: string;
  name?: string;
}

// Attachment metadata
export interface EmailAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  contentId?: string; // For inline images
  isInline?: boolean;
}

// Email folder/label
export interface EmailFolder {
  id: string;
  name: string;
  displayName: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
  unreadCount: number;
  totalCount: number;
  parentId?: string;
  children?: EmailFolder[];
}

// Email message (from provider)
export interface EmailMessage {
  id: string;
  provider: EmailProvider;
  messageId: string; // Provider's message ID
  conversationId?: string;
  subject: string;
  bodyPreview: string;
  bodyHtml?: string;
  bodyText?: string;
  from: EmailRecipient;
  to: EmailRecipient[];
  cc: EmailRecipient[];
  bcc: EmailRecipient[];
  replyTo?: EmailRecipient[];
  isRead: boolean;
  isDraft: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  importance: 'low' | 'normal' | 'high';
  receivedAt: string;
  sentAt?: string;
  folderId: string;
  folderName?: string;
  labels?: string[]; // Gmail labels
  webLink?: string; // Link to open in web client
  // Thread info for Gmail
  threadId?: string;
}

// Message list response with pagination
export interface EmailMessageList {
  messages: EmailMessage[];
  nextPageToken?: string;
  totalCount?: number;
  hasMore: boolean;
}

// Compose email payload
export interface ComposeEmail {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  attachments?: EmailAttachment[];
  signatureId?: string;
  importance?: 'low' | 'normal' | 'high';
  replyTo?: string; // Message ID to reply to
  replyType?: 'reply' | 'reply_all' | 'forward';
  saveDraft?: boolean;
}

// Search options
export interface EmailSearchOptions {
  query: string;
  folder?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  pageToken?: string;
}

// List messages options
export interface ListMessagesOptions {
  folderId?: string;
  limit?: number;
  pageToken?: string;
  includeBody?: boolean;
  filter?: 'all' | 'unread' | 'read' | 'flagged' | 'has_attachments';
  orderBy?: 'receivedAt' | 'sentAt';
  orderDir?: 'asc' | 'desc';
}

// OAuth state for connecting accounts
export interface OAuthState {
  provider: EmailProvider;
  userId: string;
  redirectUri: string;
  timestamp: number;
  nonce: string;
}

// OAuth callback result
export interface OAuthCallbackResult {
  success: boolean;
  account?: EmailAccount;
  error?: string;
  errorDescription?: string;
}

// Token refresh result
export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  expiresAt?: string;
  error?: string;
}

// Email API action types
export type EmailApiAction =
  | 'listFolders'
  | 'listMessages'
  | 'getMessage'
  | 'sendMessage'
  | 'replyMessage'
  | 'forwardMessage'
  | 'deleteMessage'
  | 'moveMessage'
  | 'markAsRead'
  | 'markAsUnread'
  | 'searchMessages'
  | 'getAttachment';

// Email API request
export interface EmailApiRequest {
  action: EmailApiAction;
  accountId: string;
  payload?: Record<string, unknown>;
}

// Email API response
export interface EmailApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// Sent email log entry
export interface EmailSentLog {
  id: string;
  user_id: string;
  account_id: string;
  provider_message_id?: string;
  to_recipients: EmailRecipient[];
  cc_recipients: EmailRecipient[];
  bcc_recipients: EmailRecipient[];
  subject: string;
  has_attachments: boolean;
  attachment_count: number;
  sent_at: string;
  status: 'sent' | 'failed' | 'queued';
  error_message?: string;
}

// UI State types
export interface EmailSuiteState {
  // Accounts
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  isLoadingAccounts: boolean;
  
  // Folders
  folders: EmailFolder[];
  selectedFolderId: string | null;
  isLoadingFolders: boolean;
  
  // Messages
  messages: EmailMessage[];
  selectedMessageId: string | null;
  isLoadingMessages: boolean;
  messagesNextPage: string | null;
  
  // Current message detail
  currentMessage: EmailMessage | null;
  isLoadingMessage: boolean;
  
  // Compose
  isComposing: boolean;
  draftId: string | null;
  composeData: Partial<ComposeEmail>;
  isSending: boolean;
  
  // Search
  searchQuery: string;
  searchResults: EmailMessage[];
  isSearching: boolean;
  
  // Signatures
  signatures: EmailSignature[];
  selectedSignatureId: string | null;
  
  // Sync
  isSyncing: boolean;
  lastSyncAt: string | null;
}

// Provider configuration (for OAuth setup)
export interface ProviderConfig {
  outlook: {
    clientId: string;
    tenantId: string;
    redirectUri: string;
    scopes: string[];
  };
  gmail: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
}

// Default folder IDs by provider
export const DEFAULT_FOLDER_IDS = {
  outlook: {
    inbox: 'inbox',
    sent: 'sentitems',
    drafts: 'drafts',
    trash: 'deleteditems',
    spam: 'junkemail',
    archive: 'archive',
  },
  gmail: {
    inbox: 'INBOX',
    sent: 'SENT',
    drafts: 'DRAFT',
    trash: 'TRASH',
    spam: 'SPAM',
    archive: 'ARCHIVE',
  },
} as const;
