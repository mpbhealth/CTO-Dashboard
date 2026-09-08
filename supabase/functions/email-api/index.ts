import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';
import { decryptToken } from '../_shared/crypto.ts';
import { requireCaller } from '../_shared/caller.ts';

// Types

interface EmailAttachment {
  name: string;
  contentType: string;
  contentBytes?: string;
  size?: number;
  id?: string;
}

interface EmailAccount {
  id: string;
  user_id: string;
  owner_user_id: string;
  provider: 'outlook' | 'gmail';
  email_address: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at: string;
  refreshing_token?: boolean;
}

interface EmailFolder {
  id: string;
  name: string;
  displayName: string;
  type: string;
  unreadCount: number;
  totalCount: number;
}

interface EmailMessage {
  id: string;
  provider: string;
  messageId: string;
  conversationId?: string;
  subject: string;
  bodyPreview: string;
  bodyHtml?: string;
  bodyText?: string;
  from: { email: string; name?: string };
  to: { email: string; name?: string }[];
  cc: { email: string; name?: string }[];
  bcc: { email: string; name?: string }[];
  isRead: boolean;
  isDraft: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  importance: string;
  receivedAt: string;
  sentAt?: string;
  folderId: string;
  webLink?: string;
  threadId?: string;
}

interface Attachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
  contentId?: string;
  isInline: boolean;
}

/** Microsoft Graph API response types */
interface MicrosoftEmailAddress {
  address: string;
  name?: string;
}

interface MicrosoftRecipient {
  emailAddress: MicrosoftEmailAddress;
}

interface MicrosoftFolder {
  id: string;
  displayName: string;
  unreadItemCount: number;
  totalItemCount: number;
}

interface MicrosoftMessageBody {
  contentType: string;
  content: string;
}

interface MicrosoftMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  body?: MicrosoftMessageBody;
  from?: { emailAddress: MicrosoftEmailAddress };
  toRecipients?: MicrosoftRecipient[];
  ccRecipients?: MicrosoftRecipient[];
  bccRecipients?: MicrosoftRecipient[];
  receivedDateTime: string;
  sentDateTime?: string;
  isRead: boolean;
  isDraft: boolean;
  hasAttachments: boolean;
  importance: string;
  conversationId?: string;
  webLink?: string;
  parentFolderId?: string;
  attachments?: MicrosoftAttachment[];
}

interface MicrosoftAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
  contentId?: string;
  isInline?: boolean;
}

interface MicrosoftSendMailPayload {
  subject: string;
  body: { contentType: string; content: string };
  toRecipients: MicrosoftRecipient[];
  importance: string;
  ccRecipients?: MicrosoftRecipient[];
  bccRecipients?: MicrosoftRecipient[];
  attachments?: {
    '@odata.type': string;
    name: string;
    contentType: string;
    contentBytes: string;
  }[];
}

/** Gmail API response types */
interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePartBody {
  attachmentId?: string;
  size?: number;
  data?: string;
}

interface GmailMessagePart {
  mimeType: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

/** Union type for all possible action results */
type EmailActionResult =
  | EmailFolder[]
  | { messages: EmailMessage[]; nextLink?: string }
  | { messages: EmailMessage[]; nextPageToken?: string }
  | EmailMessage
  | EmailMessage[]
  | Attachment
  | { success: boolean };

async function mapAccount(row: Record<string, unknown>): Promise<EmailAccount> {
  return {
    id: String(row.id),
    user_id: String(row.owner_user_id),
    owner_user_id: String(row.owner_user_id),
    provider: row.provider as 'outlook' | 'gmail',
    email_address: String(row.email_address),
    access_token: row.encrypted_access_token ? await decryptToken(String(row.encrypted_access_token)) : '',
    refresh_token: row.encrypted_refresh_token ? await decryptToken(String(row.encrypted_refresh_token)) : undefined,
    token_expires_at: String(row.token_expires_at || ''),
    refreshing_token: Boolean(row.refreshing_token),
  };
}

async function getValidAccessToken(
  supabaseClient: SupabaseClient,
  accountId: string,
  ownerUserId: string,
): Promise<{ token: string; account: EmailAccount }> {
  const { data: account, error } = await supabaseClient
    .from('mail_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('owner_user_id', ownerUserId)
    .single();

  if (error || !account) {
    throw new Error('Account not found');
  }

  const expiresAt = new Date(account.token_expires_at);
  const needsRefresh = expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (needsRefresh && account.encrypted_refresh_token) {
    if (account.refreshing_token) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const { data: retryAccount } = await supabaseClient
        .from('mail_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('owner_user_id', ownerUserId)
        .single();
      if (retryAccount && !retryAccount.refreshing_token) {
        const mapped = await mapAccount(retryAccount);
        return { token: mapped.access_token, account: mapped };
      }
    }

    await supabaseClient
      .from('mail_accounts')
      .update({ refreshing_token: true })
      .eq('id', accountId);

    try {
      const oauthUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/email-oauth`;
      const response = await fetch(oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          action: 'refresh',
          accountId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
    } finally {
      await supabaseClient
        .from('mail_accounts')
        .update({ refreshing_token: false })
        .eq('id', accountId);
    }

    const { data: updatedAccount } = await supabaseClient
      .from('mail_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('owner_user_id', ownerUserId)
      .single();

    const mapped = await mapAccount(updatedAccount);
    return { token: mapped.access_token, account: mapped };
  }

  const mapped = await mapAccount(account);
  return { token: mapped.access_token, account: mapped };
}

// ============ OUTLOOK PROVIDER ============

async function outlookListFolders(accessToken: string): Promise<EmailFolder[]> {
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/mailFolders?$top=50',
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list folders: ${response.status}`);
  }

  const data = await response.json();
  
  const folderTypeMap: Record<string, string> = {
    'inbox': 'inbox',
    'sentitems': 'sent',
    'drafts': 'drafts',
    'deleteditems': 'trash',
    'junkemail': 'spam',
    'archive': 'archive',
  };

  return (data.value || []).map((folder: MicrosoftFolder) => ({
    id: folder.id,
    name: folder.displayName.toLowerCase().replace(/\s+/g, ''),
    displayName: folder.displayName,
    type: folderTypeMap[folder.displayName.toLowerCase().replace(/\s+/g, '')] || 'custom',
    unreadCount: folder.unreadItemCount || 0,
    totalCount: folder.totalItemCount || 0,
  }));
}

async function outlookListMessages(
  accessToken: string,
  folderId: string,
  options: { limit?: number; skip?: number; filter?: string; includeBody?: boolean }
): Promise<{ messages: EmailMessage[]; nextLink?: string }> {
  const { limit = 25, skip = 0, filter, includeBody = false } = options;

  let url = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages`;
  url += `?$top=${limit}&$skip=${skip}&$orderby=receivedDateTime desc`;
  url += `&$select=id,subject,bodyPreview,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,sentDateTime,isRead,isDraft,hasAttachments,importance,conversationId,webLink`;

  if (includeBody) {
    url += ',body';
  }

  if (filter === 'unread') {
    url += '&$filter=isRead eq false';
  } else if (filter === 'has_attachments') {
    url += '&$filter=hasAttachments eq true';
  }

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to list messages: ${response.status}`);
  }

  const data = await response.json();

  const messages: EmailMessage[] = (data.value || []).map((msg: MicrosoftMessage) => ({
    id: msg.id,
    provider: 'outlook',
    messageId: msg.id,
    conversationId: msg.conversationId,
    subject: msg.subject || '(No Subject)',
    bodyPreview: msg.bodyPreview || '',
    bodyHtml: msg.body?.contentType === 'html' ? msg.body.content : undefined,
    bodyText: msg.body?.contentType === 'text' ? msg.body.content : undefined,
    from: {
      email: msg.from?.emailAddress?.address || '',
      name: msg.from?.emailAddress?.name,
    },
    to: (msg.toRecipients || []).map((r: MicrosoftRecipient) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    cc: (msg.ccRecipients || []).map((r: MicrosoftRecipient) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    bcc: (msg.bccRecipients || []).map((r: MicrosoftRecipient) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    isRead: msg.isRead || false,
    isDraft: msg.isDraft || false,
    hasAttachments: msg.hasAttachments || false,
    importance: msg.importance || 'normal',
    receivedAt: msg.receivedDateTime,
    sentAt: msg.sentDateTime,
    folderId: folderId,
    webLink: msg.webLink,
  }));

  return {
    messages,
    nextLink: data['@odata.nextLink'],
  };
}

async function outlookGetMessage(accessToken: string, messageId: string): Promise<EmailMessage> {
  const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$expand=attachments`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get message: ${response.status}`);
  }

  const msg = await response.json();

  return {
    id: msg.id,
    provider: 'outlook',
    messageId: msg.id,
    conversationId: msg.conversationId,
    subject: msg.subject || '(No Subject)',
    bodyPreview: msg.bodyPreview || '',
    bodyHtml: msg.body?.contentType === 'html' ? msg.body.content : undefined,
    bodyText: msg.body?.contentType === 'text' ? msg.body.content : undefined,
    from: {
      email: msg.from?.emailAddress?.address || '',
      name: msg.from?.emailAddress?.name,
    },
    to: (msg.toRecipients || []).map((r: MicrosoftRecipient) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    cc: (msg.ccRecipients || []).map((r: MicrosoftRecipient) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    bcc: (msg.bccRecipients || []).map((r: MicrosoftRecipient) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    isRead: msg.isRead || false,
    isDraft: msg.isDraft || false,
    hasAttachments: msg.hasAttachments || false,
    attachments: (msg.attachments || []).map((att: MicrosoftAttachment) => ({
      id: att.id,
      name: att.name,
      contentType: att.contentType,
      size: att.size,
      isInline: att.isInline || false,
      contentId: att.contentId,
    })),
    importance: msg.importance || 'normal',
    receivedAt: msg.receivedDateTime,
    sentAt: msg.sentDateTime,
    folderId: msg.parentFolderId,
    webLink: msg.webLink,
  };
}

async function outlookSendMessage(
  accessToken: string,
  message: {
    to: { email: string; name?: string }[];
    cc?: { email: string; name?: string }[];
    bcc?: { email: string; name?: string }[];
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    importance?: string;
    attachments?: { name: string; contentType: string; contentBytes: string }[];
  }
): Promise<void> {
  const emailMessage: MicrosoftSendMailPayload = {
    subject: message.subject,
    body: {
      contentType: 'html',
      content: message.bodyHtml,
    },
    toRecipients: message.to.map((r) => ({
      emailAddress: { address: r.email, name: r.name },
    })),
    importance: message.importance || 'normal',
  };

  if (message.cc && message.cc.length > 0) {
    emailMessage.ccRecipients = message.cc.map((r) => ({
      emailAddress: { address: r.email, name: r.name },
    }));
  }

  if (message.bcc && message.bcc.length > 0) {
    emailMessage.bccRecipients = message.bcc.map((r) => ({
      emailAddress: { address: r.email, name: r.name },
    }));
  }

  if (message.attachments && message.attachments.length > 0) {
    emailMessage.attachments = message.attachments.map((att) => ({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: att.name,
      contentType: att.contentType,
      contentBytes: att.contentBytes,
    }));
  }

  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: emailMessage }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
  }
}

async function outlookReplyMessage(
  accessToken: string,
  messageId: string,
  reply: {
    bodyHtml: string;
    replyAll?: boolean;
  }
): Promise<void> {
  const action = reply.replyAll ? 'replyAll' : 'reply';
  const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}/${action}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment: reply.bodyHtml,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reply: ${response.status}`);
  }
}

async function outlookDeleteMessage(accessToken: string, messageId: string): Promise<void> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete message: ${response.status}`);
  }
}

async function outlookMoveMessage(
  accessToken: string,
  messageId: string,
  destinationFolderId: string
): Promise<void> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}/move`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ destinationId: destinationFolderId }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to move message: ${response.status}`);
  }
}

async function outlookMarkAsRead(accessToken: string, messageId: string, isRead: boolean): Promise<void> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isRead }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update read status: ${response.status}`);
  }
}

async function outlookSearchMessages(
  accessToken: string,
  query: string,
  options: { limit?: number }
): Promise<EmailMessage[]> {
  const { limit = 25 } = options;
  const url = `https://graph.microsoft.com/v1.0/me/messages?$search="${encodeURIComponent(query)}"&$top=${limit}&$orderby=receivedDateTime desc`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to search messages: ${response.status}`);
  }

  const data = await response.json();

  return (data.value || []).map((msg: MicrosoftMessage) => ({
    id: msg.id,
    provider: 'outlook',
    messageId: msg.id,
    subject: msg.subject || '(No Subject)',
    bodyPreview: msg.bodyPreview || '',
    from: {
      email: msg.from?.emailAddress?.address || '',
      name: msg.from?.emailAddress?.name,
    },
    to: (msg.toRecipients || []).map((r: MicrosoftRecipient) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    cc: [],
    bcc: [],
    isRead: msg.isRead || false,
    isDraft: msg.isDraft || false,
    hasAttachments: msg.hasAttachments || false,
    importance: msg.importance || 'normal',
    receivedAt: msg.receivedDateTime,
    folderId: msg.parentFolderId,
  }));
}

async function outlookGetAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<Attachment> {
  const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments/${attachmentId}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get attachment: ${response.status}`);
  }

  const att = await response.json();

  return {
    id: att.id,
    name: att.name,
    contentType: att.contentType,
    size: att.size,
    contentBytes: att.contentBytes,
    contentId: att.contentId,
    isInline: att.isInline || false,
  };
}

// ============ GMAIL PROVIDER ============

async function gmailListFolders(accessToken: string): Promise<EmailFolder[]> {
  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/labels',
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list labels: ${response.status}`);
  }

  const data = await response.json();

  const systemLabels = ['INBOX', 'SENT', 'DRAFT', 'TRASH', 'SPAM', 'STARRED', 'IMPORTANT'];
  const folderTypeMap: Record<string, string> = {
    'INBOX': 'inbox',
    'SENT': 'sent',
    'DRAFT': 'drafts',
    'TRASH': 'trash',
    'SPAM': 'spam',
  };

  const folders: EmailFolder[] = [];

  for (const label of data.labels || []) {
    // Get label details for counts
    const detailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/labels/${label.id}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    let unreadCount = 0;
    let totalCount = 0;

    if (detailResponse.ok) {
      const detail = await detailResponse.json();
      unreadCount = detail.messagesUnread || 0;
      totalCount = detail.messagesTotal || 0;
    }

    folders.push({
      id: label.id,
      name: label.name.toLowerCase(),
      displayName: label.name,
      type: folderTypeMap[label.id] || 'custom',
      unreadCount,
      totalCount,
    });
  }

  // Sort to put system labels first
  folders.sort((a, b) => {
    const aSystem = systemLabels.includes(a.id);
    const bSystem = systemLabels.includes(b.id);
    if (aSystem && !bSystem) return -1;
    if (!aSystem && bSystem) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return folders;
}

async function gmailListMessages(
  accessToken: string,
  labelId: string,
  options: { limit?: number; pageToken?: string; filter?: string }
): Promise<{ messages: EmailMessage[]; nextPageToken?: string }> {
  const { limit = 25, pageToken, filter } = options;

  let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}&labelIds=${labelId}`;

  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  if (filter === 'unread') {
    url += '&q=is:unread';
  } else if (filter === 'has_attachments') {
    url += '&q=has:attachment';
  }

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to list messages: ${response.status}`);
  }

  const data = await response.json();

  if (!data.messages || data.messages.length === 0) {
    return { messages: [], nextPageToken: undefined };
  }

  // Fetch full message details for each message
  const messages: EmailMessage[] = [];

  for (const msg of data.messages.slice(0, limit)) {
    try {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Date`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      if (msgResponse.ok) {
        const msgData = await msgResponse.json();
        const headers = msgData.payload?.headers || [];

        const getHeader = (name: string) =>
          headers.find((h: GmailHeader) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const parseRecipients = (value: string): { email: string; name?: string }[] => {
          if (!value) return [];
          return value.split(',').map((r) => {
            const match = r.match(/(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?/);
            if (match) {
              return { name: match[1]?.trim(), email: match[2].trim() };
            }
            return { email: r.trim() };
          });
        };

        messages.push({
          id: msgData.id,
          provider: 'gmail',
          messageId: msgData.id,
          threadId: msgData.threadId,
          subject: getHeader('Subject') || '(No Subject)',
          bodyPreview: msgData.snippet || '',
          from: parseRecipients(getHeader('From'))[0] || { email: '' },
          to: parseRecipients(getHeader('To')),
          cc: parseRecipients(getHeader('Cc')),
          bcc: [],
          isRead: !msgData.labelIds?.includes('UNREAD'),
          isDraft: msgData.labelIds?.includes('DRAFT') || false,
          hasAttachments: msgData.payload?.parts?.some((p: GmailMessagePart) => p.filename && p.filename.length > 0) || false,
          importance: 'normal',
          receivedAt: new Date(parseInt(msgData.internalDate)).toISOString(),
          folderId: labelId,
        });
      }
    } catch (e) {
      console.error('Error fetching message details:', e);
    }
  }

  return {
    messages,
    nextPageToken: data.nextPageToken,
  };
}

async function gmailGetMessage(accessToken: string, messageId: string): Promise<EmailMessage> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get message: ${response.status}`);
  }

  const msgData = await response.json();
  const headers = msgData.payload?.headers || [];

  const getHeader = (name: string) =>
    headers.find((h: GmailHeader) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const parseRecipients = (value: string): { email: string; name?: string }[] => {
    if (!value) return [];
    return value.split(',').map((r) => {
      const match = r.match(/(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?/);
      if (match) {
        return { name: match[1]?.trim(), email: match[2].trim() };
      }
      return { email: r.trim() };
    });
  };

  // Extract body
  let bodyHtml = '';
  let bodyText = '';

  const extractBody = (part: GmailMessagePart): void => {
    if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (part.parts) {
      part.parts.forEach(extractBody);
    }
  };

  if (msgData.payload) {
    extractBody(msgData.payload);
  }

  // Extract attachments
  const attachments: EmailAttachment[] = [];
  const extractAttachments = (part: GmailMessagePart): void => {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        name: part.filename,
        contentType: part.mimeType,
        size: part.body.size || 0,
      });
    }
    if (part.parts) {
      part.parts.forEach(extractAttachments);
    }
  };

  if (msgData.payload) {
    extractAttachments(msgData.payload);
  }

  return {
    id: msgData.id,
    provider: 'gmail',
    messageId: msgData.id,
    threadId: msgData.threadId,
    subject: getHeader('Subject') || '(No Subject)',
    bodyPreview: msgData.snippet || '',
    bodyHtml: bodyHtml || undefined,
    bodyText: bodyText || undefined,
    from: parseRecipients(getHeader('From'))[0] || { email: '' },
    to: parseRecipients(getHeader('To')),
    cc: parseRecipients(getHeader('Cc')),
    bcc: [],
    isRead: !msgData.labelIds?.includes('UNREAD'),
    isDraft: msgData.labelIds?.includes('DRAFT') || false,
    hasAttachments: attachments.length > 0,
    attachments,
    importance: 'normal',
    receivedAt: new Date(parseInt(msgData.internalDate)).toISOString(),
    folderId: msgData.labelIds?.[0] || 'INBOX',
  };
}

async function gmailSendMessage(
  accessToken: string,
  message: {
    to: { email: string; name?: string }[];
    cc?: { email: string; name?: string }[];
    bcc?: { email: string; name?: string }[];
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    attachments?: { name: string; contentType: string; contentBytes: string }[];
  }
): Promise<void> {
  // Build MIME message
  const boundary = `boundary_${Date.now()}`;
  
  const formatRecipient = (r: { email: string; name?: string }) =>
    r.name ? `"${r.name}" <${r.email}>` : r.email;

  let mimeMessage = '';
  mimeMessage += `To: ${message.to.map(formatRecipient).join(', ')}\r\n`;
  
  if (message.cc && message.cc.length > 0) {
    mimeMessage += `Cc: ${message.cc.map(formatRecipient).join(', ')}\r\n`;
  }
  
  if (message.bcc && message.bcc.length > 0) {
    mimeMessage += `Bcc: ${message.bcc.map(formatRecipient).join(', ')}\r\n`;
  }
  
  mimeMessage += `Subject: ${message.subject}\r\n`;
  mimeMessage += 'MIME-Version: 1.0\r\n';

  if (message.attachments && message.attachments.length > 0) {
    mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += 'Content-Type: text/html; charset=utf-8\r\n\r\n';
    mimeMessage += message.bodyHtml + '\r\n';

    for (const att of message.attachments) {
      mimeMessage += `--${boundary}\r\n`;
      mimeMessage += `Content-Type: ${att.contentType}; name="${att.name}"\r\n`;
      mimeMessage += `Content-Disposition: attachment; filename="${att.name}"\r\n`;
      mimeMessage += 'Content-Transfer-Encoding: base64\r\n\r\n';
      mimeMessage += att.contentBytes + '\r\n';
    }

    mimeMessage += `--${boundary}--`;
  } else {
    mimeMessage += 'Content-Type: text/html; charset=utf-8\r\n\r\n';
    mimeMessage += message.bodyHtml;
  }

  // Encode to base64url
  const encodedMessage = btoa(mimeMessage)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
  }
}

async function gmailDeleteMessage(accessToken: string, messageId: string): Promise<void> {
  // Move to trash instead of permanent delete
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete message: ${response.status}`);
  }
}

async function gmailMoveMessage(
  accessToken: string,
  messageId: string,
  addLabelIds: string[],
  removeLabelIds: string[]
): Promise<void> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to move message: ${response.status}`);
  }
}

async function gmailMarkAsRead(accessToken: string, messageId: string, isRead: boolean): Promise<void> {
  const body = isRead
    ? { removeLabelIds: ['UNREAD'] }
    : { addLabelIds: ['UNREAD'] };

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update read status: ${response.status}`);
  }
}

async function gmailSearchMessages(
  accessToken: string,
  query: string,
  options: { limit?: number }
): Promise<EmailMessage[]> {
  const { limit = 25 } = options;
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to search messages: ${response.status}`);
  }

  const data = await response.json();

  if (!data.messages) {
    return [];
  }

  // Fetch details for search results
  const messages: EmailMessage[] = [];
  for (const msg of data.messages.slice(0, limit)) {
    try {
      const fullMsg = await gmailGetMessage(accessToken, msg.id);
      messages.push(fullMsg);
    } catch (e) {
      console.error('Error fetching search result:', e);
    }
  }

  return messages;
}

async function gmailGetAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<Attachment> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get attachment: ${response.status}`);
  }

  const att = await response.json();

  return {
    id: attachmentId,
    name: '',
    contentType: '',
    size: att.size || 0,
    contentBytes: att.data,
    isInline: false,
  };
}

// ============ MAIN HANDLER ============

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const caller = await requireCaller(req);
    if (!caller.userId && !caller.service) {
      throw new Error('Not authenticated');
    }

    const { action, accountId, ...payload } = body;

    if (!accountId) {
      throw new Error('accountId is required');
    }

    const ownerUserId = caller.userId;
    if (!ownerUserId) {
      throw new Error('Not authenticated');
    }

    const { token: accessToken, account } = await getValidAccessToken(supabaseClient, accountId, ownerUserId);
    const provider = account.provider;

    // Route to provider-specific implementation
    let result: EmailActionResult;

    switch (action) {
      case 'listFolders': {
        result = provider === 'outlook'
          ? await outlookListFolders(accessToken)
          : await gmailListFolders(accessToken);
        break;
      }

      case 'listMessages': {
        const { folderId, limit, skip, pageToken, filter, includeBody } = payload;
        result = provider === 'outlook'
          ? await outlookListMessages(accessToken, folderId, { limit, skip, filter, includeBody })
          : await gmailListMessages(accessToken, folderId, { limit, pageToken, filter });
        break;
      }

      case 'getMessage': {
        const { messageId } = payload;
        result = provider === 'outlook'
          ? await outlookGetMessage(accessToken, messageId)
          : await gmailGetMessage(accessToken, messageId);
        break;
      }

      case 'sendMessage': {
        const { message, idempotencyKey } = payload;
        const key = String(idempotencyKey || crypto.randomUUID());
        const { data: existingIntent } = await supabaseClient
          .from('mail_send_intents')
          .select('id, status, provider_message_id')
          .eq('mail_account_id', accountId)
          .eq('idempotency_key', key)
          .maybeSingle();

        if (existingIntent?.status === 'sent') {
          result = { success: true, duplicate: true, providerMessageId: existingIntent.provider_message_id };
          break;
        }

        if (!existingIntent) {
          const { error: claimError } = await supabaseClient.from('mail_send_intents').insert({
            mail_account_id: accountId,
            owner_user_id: account.owner_user_id,
            idempotency_key: key,
            status: 'claimed',
          });
          if (claimError && claimError.code !== '23505') throw claimError;
          if (claimError?.code === '23505') {
            const { data: raced } = await supabaseClient
              .from('mail_send_intents')
              .select('status, provider_message_id')
              .eq('mail_account_id', accountId)
              .eq('idempotency_key', key)
              .maybeSingle();
            if (raced?.status === 'sent') {
              result = { success: true, duplicate: true, providerMessageId: raced.provider_message_id };
              break;
            }
          }
        }

        try {
          if (provider === 'outlook') {
            await outlookSendMessage(accessToken, message);
          } else {
            await gmailSendMessage(accessToken, message);
          }
          await supabaseClient.from('mail_send_intents').update({
            status: 'sent',
          }).eq('mail_account_id', accountId).eq('idempotency_key', key);

          const { data: localMessage } = await supabaseClient.from('mail_messages').insert({
            mail_account_id: accountId,
            provider_message_id: `local:${key}`,
            direction: 'outbound',
            origin_class: 'human',
            sender_address: account.email_address,
            subject: message.subject,
            send_status: 'sent',
            sent_at: new Date().toISOString(),
          }).select('id').maybeSingle();

          if (localMessage?.id) {
            const recipients = [
              ...(message.to || []).map((r: { email: string; name?: string }, i: number) => ({ type: 'to', r, i })),
              ...(message.cc || []).map((r: { email: string; name?: string }, i: number) => ({ type: 'cc', r, i })),
              ...(message.bcc || []).map((r: { email: string; name?: string }, i: number) => ({ type: 'bcc', r, i })),
            ];
            if (recipients.length) {
              await supabaseClient.from('mail_message_recipients').insert(
                recipients.map((item) => ({
                  mail_message_id: localMessage.id,
                  recipient_type: item.type,
                  email_address: item.r.email,
                  normalized_email: String(item.r.email || '').toLowerCase(),
                  display_name: item.r.name ?? null,
                  position: item.i,
                }))
              );
            }
          }

          await supabaseClient.from('audit_events').insert({
            actor_id: account.owner_user_id,
            action: 'mail.send',
            entity: 'mail_send_intents',
            metadata: { account_id: accountId, has_bcc: Boolean(message.bcc?.length) },
          });
          result = { success: true };
        } catch (sendError) {
          await supabaseClient.from('mail_send_intents').update({
            status: 'failed',
            error: sendError instanceof Error ? sendError.message : 'send failed',
          }).eq('mail_account_id', accountId).eq('idempotency_key', key);
          throw sendError;
        }
        break;
      }

      case 'replyMessage': {
        const { messageId, bodyHtml, replyAll } = payload;
        if (provider === 'outlook') {
          await outlookReplyMessage(accessToken, messageId, { bodyHtml, replyAll });
        } else {
          // For Gmail, we need to construct a reply manually
          const original = await gmailGetMessage(accessToken, messageId);
          await gmailSendMessage(accessToken, {
            to: replyAll ? [...original.to, original.from] : [original.from],
            cc: replyAll ? original.cc : undefined,
            subject: original.subject.startsWith('Re:') ? original.subject : `Re: ${original.subject}`,
            bodyHtml,
          });
        }
        result = { success: true };
        break;
      }

      case 'deleteMessage': {
        const { messageId } = payload;
        provider === 'outlook'
          ? await outlookDeleteMessage(accessToken, messageId)
          : await gmailDeleteMessage(accessToken, messageId);
        result = { success: true };
        break;
      }

      case 'moveMessage': {
        const { messageId, destinationFolderId, sourceFolderId } = payload;
        if (provider === 'outlook') {
          await outlookMoveMessage(accessToken, messageId, destinationFolderId);
        } else {
          await gmailMoveMessage(
            accessToken,
            messageId,
            [destinationFolderId],
            sourceFolderId ? [sourceFolderId] : []
          );
        }
        result = { success: true };
        break;
      }

      case 'markAsRead': {
        const { messageId, isRead } = payload;
        provider === 'outlook'
          ? await outlookMarkAsRead(accessToken, messageId, isRead)
          : await gmailMarkAsRead(accessToken, messageId, isRead);
        result = { success: true };
        break;
      }

      case 'searchMessages': {
        const { query, limit } = payload;
        result = provider === 'outlook'
          ? await outlookSearchMessages(accessToken, query, { limit })
          : await gmailSearchMessages(accessToken, query, { limit });
        break;
      }

      case 'getAttachment': {
        const { messageId, attachmentId } = payload;
        result = provider === 'outlook'
          ? await outlookGetAttachment(accessToken, messageId, attachmentId)
          : await gmailGetAttachment(accessToken, messageId, attachmentId);
        break;
      }

      case 'suggestCrmLinks': {
        const emails = payload.emails || [];
        const crmRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-proxy`, {
          method: 'POST',
          headers: {
            Authorization: req.headers.get('Authorization') || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'matchEmails', emails }),
        });
        result = crmRes.ok ? await crmRes.json() : { candidates: [] };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    await supabaseClient
      .from('mail_accounts')
      .update({ last_sync_at: new Date().toISOString(), last_successful_sync_at: new Date().toISOString(), sync_error: null, status: 'active' })
      .eq('id', accountId);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error in email-api function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
