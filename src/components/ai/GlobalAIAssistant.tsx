import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import {
  Sparkles,
  X,
  Minus,
  Send,
  Trash2,
  Loader2,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { useAIAssistant } from '../../providers/AIAssistantProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useAgentChat, ChatEntry } from '../../hooks/useAgentChat';
import { ToolCallVisualization } from './ToolCallVisualization';

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant for the MPB Health dashboard. You help staff with:
- Managing support tickets
- Looking up member information
- Searching the knowledge base
- Answering questions about policies and procedures

Be helpful, concise, and professional. When you need to take actions, explain what you're doing.`;

export function GlobalAIAssistant() {
  const { user, profileReady } = useAuth();
  const {
    isOpen,
    isMinimized,
    messages: _persistedMessages,
    unreadCount,
    toggleAssistant,
    closeAssistant,
    minimizeAssistant,
    restoreAssistant,
    setMessages,
    clearMessages,
    markAsRead,
  } = useAIAssistant();

  const {
    messages: chatMessages,
    isLoading,
    sendMessage,
    clearHistory,
    setSystemPrompt,
  } = useAgentChat({
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    onError: (error) => {
      console.error('AI Assistant error:', error);
    },
  });

  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync chat messages with persisted messages
  useEffect(() => {
    if (chatMessages.length > 0) {
      setMessages(chatMessages);
    }
  }, [chatMessages, setMessages]);

  // Initialize with persisted messages
  useEffect(() => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
  }, [setSystemPrompt]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
      markAsRead();
    }
  }, [isOpen, isMinimized, markAsRead]);

  // Don't render if not authenticated
  if (!profileReady || !user) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    setCommandHistory(prev => [...prev, message]);
    setHistoryIndex(-1);

    await sendMessage(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Command history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  const handleClear = () => {
    clearHistory();
    clearMessages();
  };

  // Minimized pill view
  if (isOpen && isMinimized) {
    return (
      <button
        onClick={restoreAssistant}
        className="fixed bottom-24 right-6 z-[60] flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">AI Assistant</span>
        {unreadCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Closed state - FAB button
  if (!isOpen) {
    return (
      <button
        onClick={toggleAssistant}
        className="fixed bottom-24 right-6 z-[60] flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        title="Open AI Assistant (Ctrl+Shift+A)"
      >
        <Sparkles className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Expanded chat panel
  return (
    <div className="fixed bottom-24 right-6 z-[60] w-[400px] h-[500px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={minimizeAssistant}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={closeAssistant}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
            <Bot className="w-12 h-12 mb-3 text-indigo-400" />
            <p className="font-medium">How can I help you today?</p>
            <p className="text-sm mt-1">
              Ask me about tickets, members, or policies.
            </p>
            <p className="text-xs mt-4 text-slate-400">
              Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">Ctrl+Shift+A</kbd> to toggle
            </p>
          </div>
        ) : (
          chatMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatEntry;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-indigo-600 text-white'
            : isError
            ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
        }`}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            isError ? (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
            ) : (
              <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-500" />
            )
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

            {/* Tool calls visualization */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <ToolCallVisualization
                toolCalls={message.toolCalls}
                toolResults={message.toolResults}
              />
            )}

            <p className={`text-xs mt-1 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
