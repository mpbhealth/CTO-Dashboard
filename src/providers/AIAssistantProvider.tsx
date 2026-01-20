import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { ChatEntry } from '../hooks/useAgentChat';

interface AIAssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatEntry[];
  unreadCount: number;
}

interface AIAssistantContextType extends AIAssistantState {
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  minimizeAssistant: () => void;
  restoreAssistant: () => void;
  addMessage: (message: ChatEntry) => void;
  setMessages: (messages: ChatEntry[]) => void;
  clearMessages: () => void;
  markAsRead: () => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'mpb_ai_assistant_state';

interface SerializedState {
  messages: Array<{
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: string;
    isError?: boolean;
  }>;
}

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load messages from session storage on mount
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedState) {
        const parsed: SerializedState = JSON.parse(savedState);
        if (parsed.messages && Array.isArray(parsed.messages)) {
          const restoredMessages: ChatEntry[] = parsed.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(restoredMessages);
        }
      }
    } catch (error) {
      console.error('Failed to restore AI assistant state:', error);
    }
  }, []);

  // Save messages to session storage when they change
  useEffect(() => {
    try {
      const stateToSave: SerializedState = {
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
          isError: msg.isError,
        })),
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save AI assistant state:', error);
    }
  }, [messages]);

  // Keyboard shortcut: Cmd/Ctrl + Shift + A
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'a') {
        event.preventDefault();
        setIsOpen(prev => !prev);
        setIsMinimized(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openAssistant = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        setIsMinimized(false);
        setUnreadCount(0);
      }
      return !prev;
    });
  }, []);

  const minimizeAssistant = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const restoreAssistant = useCallback(() => {
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  const addMessage = useCallback((message: ChatEntry) => {
    setMessages(prev => [...prev, message]);

    // Increment unread count if minimized or closed and message is from assistant
    if (message.role === 'assistant') {
      setUnreadCount(prev => (isMinimized || !isOpen) ? prev + 1 : prev);
    }
  }, [isMinimized, isOpen]);

  const updateMessages = useCallback((newMessages: ChatEntry[]) => {
    setMessages(newMessages);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear AI assistant state:', error);
    }
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const value = useMemo(() => ({
    isOpen,
    isMinimized,
    messages,
    unreadCount,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    minimizeAssistant,
    restoreAssistant,
    addMessage,
    setMessages: updateMessages,
    clearMessages,
    markAsRead,
  }), [
    isOpen,
    isMinimized,
    messages,
    unreadCount,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    minimizeAssistant,
    restoreAssistant,
    addMessage,
    updateMessages,
    clearMessages,
    markAsRead,
  ]);

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant(): AIAssistantContextType {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
}
