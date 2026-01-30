import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Types
interface EmailAccount {
  id: string;
  user_id: string;
  provider: 'outlook' | 'gmail';
  email_address: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at: string;
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
  attachments?: any[];
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

// Helper to get valid access token
async function getValidAccessToken(supabaseClient: any, accountId: string): Promise<{ token: string; account: EmailAccount }> {
  const { data: account, error } = await supabaseClient
    .from('user_email_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (error || !account) {
    throw new Error('Account not found');
  }

  // Check if token needs refresh
  const expiresAt = new Date(account.token_expires_at);
  const needsRefresh = expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (needsRefresh && account.refresh_token) {
    // Call the oauth function to refresh
    const oauthUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/email-oauth`;
    const response = await fetch(oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        action: 'refresh',
        accountId: accountId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const result = await response.json();
    
    // Fetch updated account
    const { data: updatedAccount } = await supabaseClient
      .from('user_email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    return { token: updatedAccount.access_token, account: updatedAccount };
  }

  return { token: account.access_token, account };
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

  return (data.value || []).map((folder: any) => ({
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

  const messages: EmailMessage[] = (data.value || []).map((msg: any) => ({
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
    to: (msg.toRecipients || []).map((r: any) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    cc: (msg.ccRecipients || []).map((r: any) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    bcc: (msg.bccRecipients || []).map((r: any) => ({
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
    to: (msg.toRecipients || []).map((r: any) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    cc: (msg.ccRecipients || []).map((r: any) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    bcc: (msg.bccRecipients || []).map((r: any) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    isRead: msg.isRead || false,
    isDraft: msg.isDraft || false,
    hasAttachments: msg.hasAttachments || false,
    attachments: (msg.attachments || []).map((att: any) => ({
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
  const emailMessage: any = {
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

  return (data.value || []).map((msg: any) => ({
    id: msg.id,
    provider: 'outlook',
    messageId: msg.id,
    subject: msg.subject || '(No Subject)',
    bodyPreview: msg.bodyPreview || '',
    from: {
      email: msg.from?.emailAddress?.address || '',
      name: msg.from?.emailAddress?.name,
    },
    to: (msg.toRecipients || []).map((r: any) => ({
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
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

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
          hasAttachments: msgData.payload?.parts?.some((p: any) => p.filename && p.filename.length > 0) || false,
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
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

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

  const extractBody = (part: any): void => {
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
  const attachments: any[] = [];
  const extractAttachments = (part: any): void => {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        name: part.filename,
        contentType: part.mimeType,
        size: part.body.size || 0,
        isInline: (part.headers || []).some((h: any) => 
          h.name.toLowerCase() === 'content-disposition' && h.value.includes('inline')
        ),
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

    const { action, accountId, ...payload } = body;

    if (!accountId) {
      throw new Error('accountId is required');
    }

    // Get valid access token
    const { token: accessToken, account } = await getValidAccessToken(supabaseClient, accountId);
    const provider = account.provider;

    // Route to provider-specific implementation
    let result: any;

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
        const { message } = payload;
        provider === 'outlook'
          ? await outlookSendMessage(accessToken, message)
          : await gmailSendMessage(accessToken, message);
        
        // Log sent email
        await supabaseClient.from('email_sent_log').insert({
          user_id: account.user_id,
          account_id: accountId,
          to_recipients: message.to,
          cc_recipients: message.cc || [],
          bcc_recipients: message.bcc || [],
          subject: message.subject,
          has_attachments: (message.attachments?.length || 0) > 0,
          attachment_count: message.attachments?.length || 0,
          status: 'sent',
        });

        result = { success: true };
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

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Update last sync time
    await supabaseClient
      .from('user_email_accounts')
      .update({ last_sync_at: new Date().toISOString(), sync_error: null })
      .eq('id', accountId);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in email-api function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
