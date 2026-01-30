import { useState, useEffect } from 'react';
import { useEmailSuite } from '@/hooks/useEmailSuite';
import { EmailAccountConnect } from './EmailAccountConnect';
import { EmailFolderList } from './EmailFolderList';
import { EmailMessageList } from './EmailMessageList';
import { EmailViewer } from './EmailViewer';
import { EmailCompose } from './EmailCompose';
import { SignatureManager } from './SignatureManager';
import {
  Mail,
  Search,
  RefreshCw,
  PenSquare,
  Settings,
  X,
  Loader2,
  Menu,
  FileSignature,
  ChevronLeft,
} from 'lucide-react';

interface EmailSuiteProps {
  userId: string;
  className?: string;
}

type ActiveTab = 'inbox' | 'signatures';

export function EmailSuite({ userId, className = '' }: EmailSuiteProps) {
  const {
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
    loadMoreMessages,
    isLoadingMessages,

    // Current message
    currentMessage,
    isLoadingMessage,

    // Compose
    isComposing,
    composeData,
    openCompose,
    openReply,
    openForward,
    closeCompose,
    sendEmail,
    isSending,

    // Actions
    deleteMessage,
    moveMessage,
    isDeleting,

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
    isLoadingSignatures,

    // Attachments
    uploadAttachment,

    // Sync
    sync,
    isSyncing,
  } = useEmailSuite({ userId });

  const [activeTab, setActiveTab] = useState<ActiveTab>('inbox');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search(searchQuery);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    search('');
  };

  // Handle message selection for mobile
  const handleSelectMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
    // On mobile, hide sidebar when viewing message
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  // Handle back navigation on mobile
  const handleBack = () => {
    if (selectedMessageId) {
      setSelectedMessageId(null);
    }
    setShowSidebar(true);
  };

  // No accounts connected
  if (!isLoadingAccounts && accounts.length === 0) {
    return (
      <div className={`h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Email
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
            Connect your Outlook or Gmail account to send and receive emails directly from the dashboard.
          </p>
          <EmailAccountConnect
            accounts={[]}
            selectedAccountId={null}
            onSelectAccount={() => {}}
            onConnect={connectAccount}
            onDisconnect={disconnectAccount}
            onSetDefault={setDefaultAccount}
            connectingProvider={connectingProvider}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Mobile menu button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'inbox'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Mail className="w-4 h-4 inline-block mr-2" />
            Inbox
          </button>
          <button
            onClick={() => setActiveTab('signatures')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'signatures'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FileSignature className="w-4 h-4 inline-block mr-2" />
            Signatures
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'inbox' && (
            <>
              {/* Search */}
              {showSearch ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search emails..."
                    className="w-48 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    autoFocus
                  />
                  {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearch(false);
                      clearSearch();
                    }}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Sync */}
              <button
                onClick={sync}
                disabled={isSyncing}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>

              {/* Compose */}
              <button
                onClick={() => openCompose()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                <PenSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Compose</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      {activeTab === 'inbox' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Folders and Accounts */}
          <div
            className={`
              w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800 flex-shrink-0
              ${showSidebar ? '' : 'hidden lg:flex'}
              ${showMobileMenu ? 'absolute inset-y-0 left-0 z-40' : ''}
            `}
          >
            {/* Account selector */}
            <EmailAccountConnect
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelectAccount={setSelectedAccountId}
              onConnect={connectAccount}
              onDisconnect={disconnectAccount}
              onSetDefault={setDefaultAccount}
              connectingProvider={connectingProvider}
              isDisconnecting={false}
            />

            {/* Folders */}
            <div className="flex-1 overflow-y-auto">
              <EmailFolderList
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelectFolder={(folderId) => {
                  setSelectedFolderId(folderId);
                  clearSearch();
                }}
                isLoading={isLoadingFolders}
              />
            </div>
          </div>

          {/* Mobile menu backdrop */}
          {showMobileMenu && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
          )}

          {/* Message list */}
          <div
            className={`
              w-80 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-hidden
              ${!showSidebar && !selectedMessageId ? 'flex-1' : ''}
              ${selectedMessageId ? 'hidden lg:block' : ''}
            `}
          >
            {searchQuery && searchResults.length >= 0 ? (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isSearching ? 'Searching...' : `${searchResults.length} results for "${searchQuery}"`}
                  </span>
                  <button
                    onClick={clearSearch}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                </div>
                <EmailMessageList
                  messages={searchResults}
                  selectedMessageId={selectedMessageId}
                  onSelectMessage={handleSelectMessage}
                  filter="all"
                  onFilterChange={() => {}}
                  hasMore={false}
                  onLoadMore={() => {}}
                  isLoading={isSearching}
                />
              </div>
            ) : (
              <EmailMessageList
                messages={messages}
                selectedMessageId={selectedMessageId}
                onSelectMessage={handleSelectMessage}
                filter={messagesFilter}
                onFilterChange={setMessagesFilter}
                hasMore={hasMoreMessages}
                onLoadMore={loadMoreMessages}
                isLoading={isLoadingMessages}
              />
            )}
          </div>

          {/* Message viewer */}
          <div
            className={`
              flex-1 min-w-0 overflow-hidden
              ${!selectedMessageId ? 'hidden lg:block' : ''}
            `}
          >
            {/* Mobile back button */}
            {selectedMessageId && (
              <button
                onClick={handleBack}
                className="lg:hidden flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to messages
              </button>
            )}
            <EmailViewer
              message={currentMessage}
              folders={folders}
              onBack={handleBack}
              onReply={() => currentMessage && openReply(currentMessage)}
              onReplyAll={() => currentMessage && openReply(currentMessage, true)}
              onForward={() => currentMessage && openForward(currentMessage)}
              onDelete={async () => {
                if (currentMessage) {
                  await deleteMessage(currentMessage.id);
                }
              }}
              onMove={(folderId) => {
                if (currentMessage) {
                  moveMessage({ messageId: currentMessage.id, destinationFolderId: folderId });
                }
              }}
              isLoading={isLoadingMessage}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      ) : (
        /* Signatures tab */
        <div className="flex-1 overflow-y-auto">
          <SignatureManager
            signatures={signatures}
            onSave={saveSignature}
            onDelete={deleteSignature}
            onSetDefault={setDefaultSignature}
            onImageUpload={uploadSignatureImage}
            isLoading={isLoadingSignatures}
          />
        </div>
      )}

      {/* Compose modal */}
      {isComposing && (
        <EmailCompose
          initialData={composeData}
          signatures={signatures}
          defaultSignature={defaultSignature}
          onSend={sendEmail}
          onClose={closeCompose}
          onUploadAttachment={uploadAttachment}
          onUploadImage={uploadSignatureImage}
          isSending={isSending}
        />
      )}
    </div>
  );
}

export default EmailSuite;
