import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEmailAccounts } from './useEmailAccounts';
import { useEmailSignature } from './useEmailSignature';
import type {
  EmailMessage,
  EmailFolder,
  ComposeEmail,
  EmailAttachment,
} from '@/types/email';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface UseEmailSuiteOptions {
  userId?: string;
}

async function callEmailApi(
  accountId: string,
  action: string,
  payload: Record<string, unknown> = {}
) {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/email-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.session.access_token}`,
    },
    body: JSON.stringify({
      action,
      accountId,
      ...payload,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data;
}

export function useEmailSuite(options: UseEmailSuiteOptions = {}) {
  const { userId } = options;
  const queryClient = useQueryClient();

  // Email accounts
  const {
    accounts,
    defaultAccount,
    isLoading: isLoadingAccounts,
    connectAccount,
    disconnectAccount,
    setDefaultAccount,
    connectingProvider,
  } = useEmailAccounts({ userId });

  // Signatures
  const {
    signatures,
    defaultSignature,
    saveSignature,
    deleteSignature,
    setDefaultSignature,
    uploadImage: uploadSignatureImage,
    generateSignatureHtml,
    isLoading: isLoadingSignatures,
  } = useEmailSignature({ userId });

  // Selected state
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Compose state
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState<Partial<ComposeEmail>>({});
  const [replyToMessage, setReplyToMessage] = useState<EmailMessage | null>(null);

  // Set default account when loaded
  useEffect(() => {
    if (defaultAccount && !selectedAccountId) {
      setSelectedAccountId(defaultAccount.id);
    }
  }, [defaultAccount, selectedAccountId]);

  // Active account
  const activeAccountId = selectedAccountId || defaultAccount?.id;
  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  // Fetch folders
  const {
    data: folders = [],
    isLoading: isLoadingFolders,
    refetch: refetchFolders,
  } = useQuery<EmailFolder[]>({
    queryKey: ['emailFolders', activeAccountId],
    queryFn: async () => {
      if (!activeAccountId) return [];
      return callEmailApi(activeAccountId, 'listFolders');
    },
    enabled: !!activeAccountId,
    staleTime: 5 * 60 * 1000,
  });

  // Set default folder (inbox) when folders load
  useEffect(() => {
    if (folders.length > 0 && !selectedFolderId) {
      const inbox = folders.find((f) => f.type === 'inbox');
      if (inbox) {
        setSelectedFolderId(inbox.id);
      }
    }
  }, [folders, selectedFolderId]);

  // Fetch messages
  const [messagesPage, setMessagesPage] = useState(0);
  const [messagesFilter, setMessagesFilter] = useState<string>('all');

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['emailMessages', activeAccountId, selectedFolderId, messagesPage, messagesFilter],
    queryFn: async () => {
      if (!activeAccountId || !selectedFolderId) return { messages: [], nextLink: null };

      return callEmailApi(activeAccountId, 'listMessages', {
        folderId: selectedFolderId,
        limit: 25,
        skip: messagesPage * 25,
        filter: messagesFilter !== 'all' ? messagesFilter : undefined,
      });
    },
    enabled: !!activeAccountId && !!selectedFolderId,
    staleTime: 60 * 1000, // 1 minute
  });

  const messages = messagesData?.messages || [];
  const hasMoreMessages = !!messagesData?.nextLink;

  // Fetch single message
  const {
    data: currentMessage,
    isLoading: isLoadingMessage,
    refetch: refetchMessage,
  } = useQuery<EmailMessage | null>({
    queryKey: ['emailMessage', activeAccountId, selectedMessageId],
    queryFn: async () => {
      if (!activeAccountId || !selectedMessageId) return null;
      return callEmailApi(activeAccountId, 'getMessage', { messageId: selectedMessageId });
    },
    enabled: !!activeAccountId && !!selectedMessageId,
  });

  // Mark message as read when viewing
  useEffect(() => {
    if (currentMessage && !currentMessage.isRead && activeAccountId) {
      callEmailApi(activeAccountId, 'markAsRead', {
        messageId: currentMessage.id,
        isRead: true,
      }).then(() => {
        // Refresh message list to update read status
        queryClient.invalidateQueries({
          queryKey: ['emailMessages', activeAccountId, selectedFolderId],
        });
      });
    }
  }, [currentMessage, activeAccountId, selectedFolderId, queryClient]);

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (email: ComposeEmail) => {
      if (!activeAccountId) throw new Error('No account selected');

      // Add signature if specified
      let bodyHtml = email.bodyHtml;
      if (email.signatureId) {
        const sig = signatures.find((s) => s.id === email.signatureId);
        if (sig) {
          const sigHtml = generateSignatureHtml(sig);
          bodyHtml += `<br/><br/>--<br/>${sigHtml}`;
        }
      }

      await callEmailApi(activeAccountId, 'sendMessage', {
        message: {
          to: email.to,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          bodyHtml,
          importance: email.importance,
          attachments: email.attachments?.map((att) => ({
            name: att.name,
            contentType: att.mimeType,
            contentBytes: att.url, // This would need to be the base64 content
          })),
        },
      });
    },
    onSuccess: () => {
      setIsComposing(false);
      setComposeData({});
      setReplyToMessage(null);
      // Refresh sent folder
      queryClient.invalidateQueries({ queryKey: ['emailMessages'] });
    },
  });

  // Reply mutation
  const _replyMutation = useMutation({
    mutationFn: async ({
      messageId,
      bodyHtml,
      replyAll = false,
    }: {
      messageId: string;
      bodyHtml: string;
      replyAll?: boolean;
    }) => {
      if (!activeAccountId) throw new Error('No account selected');
      await callEmailApi(activeAccountId, 'replyMessage', {
        messageId,
        bodyHtml,
        replyAll,
      });
    },
    onSuccess: () => {
      setIsComposing(false);
      setComposeData({});
      setReplyToMessage(null);
      queryClient.invalidateQueries({ queryKey: ['emailMessages'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!activeAccountId) throw new Error('No account selected');
      await callEmailApi(activeAccountId, 'deleteMessage', { messageId });
    },
    onSuccess: () => {
      setSelectedMessageId(null);
      queryClient.invalidateQueries({ queryKey: ['emailMessages', activeAccountId] });
    },
  });

  // Move mutation
  const moveMutation = useMutation({
    mutationFn: async ({
      messageId,
      destinationFolderId,
    }: {
      messageId: string;
      destinationFolderId: string;
    }) => {
      if (!activeAccountId) throw new Error('No account selected');
      await callEmailApi(activeAccountId, 'moveMessage', {
        messageId,
        destinationFolderId,
        sourceFolderId: selectedFolderId,
      });
    },
    onSuccess: () => {
      setSelectedMessageId(null);
      queryClient.invalidateQueries({ queryKey: ['emailMessages', activeAccountId] });
    },
  });

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<EmailMessage[]>([]);

  const search = useCallback(async (query: string) => {
    if (!activeAccountId || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await callEmailApi(activeAccountId, 'searchMessages', {
        query: query.trim(),
        limit: 50,
      });
      setSearchResults(results || []);
    } catch (e) {
      console.error('Search failed:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [activeAccountId]);

  // Compose helpers
  const openCompose = useCallback((data?: Partial<ComposeEmail>) => {
    setComposeData(data || {});
    setReplyToMessage(null);
    setIsComposing(true);
  }, []);

  const openReply = useCallback((message: EmailMessage, replyAll = false) => {
    setReplyToMessage(message);
    setComposeData({
      to: replyAll ? [...message.to, message.from] : [message.from],
      cc: replyAll ? message.cc : undefined,
      subject: message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`,
      replyTo: message.id,
      replyType: replyAll ? 'reply_all' : 'reply',
    });
    setIsComposing(true);
  }, []);

  const openForward = useCallback((message: EmailMessage) => {
    setReplyToMessage(message);
    setComposeData({
      subject: message.subject.startsWith('Fwd:') ? message.subject : `Fwd: ${message.subject}`,
      bodyHtml: `<br/><br/>---------- Forwarded message ----------<br/>${message.bodyHtml || message.bodyPreview}`,
      replyTo: message.id,
      replyType: 'forward',
    });
    setIsComposing(true);
  }, []);

  const closeCompose = useCallback(() => {
    setIsComposing(false);
    setComposeData({});
    setReplyToMessage(null);
  }, []);

  // Sync
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await refetchFolders();
      await refetchMessages();
    } finally {
      setIsSyncing(false);
    }
  }, [refetchFolders, refetchMessages]);

  // Upload attachment
  const uploadAttachment = async (file: File): Promise<EmailAttachment> => {
    if (!userId) throw new Error('User ID is required');

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const path = `attachments/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('email-assets')
      .upload(path, file, {
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('email-assets')
      .getPublicUrl(path);

    return {
      id: path,
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      mimeType: file.type,
    };
  };

  return {
    // Accounts
    accounts,
    activeAccount,
    selectedAccountId,
    setSelectedAccountId,
    isLoadingAccounts,
    connectAccount,
    disconnectAccount,
    setDefaultAccount,
    connectingProvider,

    // Folders
    folders,
    selectedFolderId,
    setSelectedFolderId,
    isLoadingFolders,

    // Messages
    messages,
    hasMoreMessages,
    selectedMessageId,
    setSelectedMessageId,
    messagesFilter,
    setMessagesFilter,
    loadMoreMessages: () => setMessagesPage((p) => p + 1),
    isLoadingMessages,

    // Current message
    currentMessage,
    isLoadingMessage,

    // Compose
    isComposing,
    composeData,
    setComposeData,
    replyToMessage,
    openCompose,
    openReply,
    openForward,
    closeCompose,
    sendEmail: sendEmailMutation.mutateAsync,
    isSending: sendEmailMutation.isPending,

    // Actions
    deleteMessage: deleteMutation.mutateAsync,
    moveMessage: moveMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isMoving: moveMutation.isPending,

    // Search
    searchQuery,
    setSearchQuery,
    search,
    searchResults,
    isSearching,

    // Signatures
    signatures,
    defaultSignature,
    saveSignature,
    deleteSignature,
    setDefaultSignature,
    uploadSignatureImage,
    generateSignatureHtml,
    isLoadingSignatures,

    // Attachments
    uploadAttachment,

    // Sync
    sync,
    isSyncing,

    // Refresh
    refetchFolders,
    refetchMessages,
    refetchMessage,
  };
}

export default useEmailSuite;
