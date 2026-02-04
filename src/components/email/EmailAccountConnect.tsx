import { useState } from 'react';
import {
  Mail,
  Plus,
  Trash2,
  Star,
  StarOff,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import type { EmailAccount, EmailProvider } from '@/types/email';

interface EmailAccountConnectProps {
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  onConnect: (provider: EmailProvider) => Promise<void>;
  onDisconnect: (accountId: string) => Promise<void>;
  onSetDefault: (accountId: string) => Promise<void>;
  connectingProvider: EmailProvider | null;
  isDisconnecting?: boolean;
}

export function EmailAccountConnect({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onConnect,
  onDisconnect,
  onSetDefault,
  connectingProvider,
  isDisconnecting,
}: EmailAccountConnectProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [actionAccountId, setActionAccountId] = useState<string | null>(null);

  const handleConnect = async (provider: EmailProvider) => {
    setShowAddMenu(false);
    try {
      await onConnect(provider);
    } catch (e) {
      console.error('Failed to connect:', e);
      alert(e instanceof Error ? e.message : 'Failed to connect account');
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (confirm('Are you sure you want to disconnect this email account?')) {
      setActionAccountId(accountId);
      try {
        await onDisconnect(accountId);
      } finally {
        setActionAccountId(null);
      }
    }
  };

  const getProviderIcon = (provider: EmailProvider) => {
    if (provider === 'outlook') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7v10l10 5 10-5V7L12 2z"
            fill="#0078D4"
          />
          <path
            d="M12 2L2 7v10l10 5V2z"
            fill="#0364B8"
          />
          <ellipse cx="8" cy="12" rx="4" ry="5" fill="white" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z"
          fill="#EA4335"
        />
        <path
          d="M22 6l-10 7L2 6"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    );
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      {/* Account selector */}
      <div className="space-y-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              selectedAccountId === account.id
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
            }`}
            onClick={() => onSelectAccount(account.id)}
          >
            {getProviderIcon(account.provider)}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white truncate">
                  {account.email_address}
                </span>
                {account.is_default && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="capitalize">{account.provider}</span>
                {account.sync_error && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    Sync error
                  </span>
                )}
                {account.last_sync_at && !account.sync_error && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-3 h-3" />
                    Synced
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {!account.is_default && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetDefault(account.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
                  title="Set as default"
                >
                  <StarOff className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisconnect(account.id);
                }}
                disabled={isDisconnecting && actionAccountId === account.id}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                title="Disconnect"
              >
                {isDisconnecting && actionAccountId === account.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {accounts.length === 0 && (
          <div className="text-center py-6">
            <Mail className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No email accounts connected
            </p>
          </div>
        )}

        {/* Add account button */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            disabled={!!connectingProvider}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            {connectingProvider ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting {connectingProvider}...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Email Account
              </>
            )}
          </button>

          {/* Add menu */}
          {showAddMenu && !connectingProvider && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => handleConnect('outlook')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {getProviderIcon('outlook')}
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Microsoft Outlook
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Connect Outlook, Office 365, or Hotmail
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleConnect('gmail')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
                >
                  {getProviderIcon('gmail')}
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Gmail
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Connect Google Workspace or Gmail
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailAccountConnect;
