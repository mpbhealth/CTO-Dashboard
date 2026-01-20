import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  sendAgentMessage,
  ChatMessage,
  ChatResponse,
  ToolCall,
  ToolResult,
  AgentApiClientError
} from '../lib/agentApi';

export interface ChatEntry {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  isError?: boolean;
}

export interface UseAgentChatOptions {
  systemPrompt?: string;
  onToolCall?: (toolCall: ToolCall) => void;
  onError?: (error: Error) => void;
}

export interface UseAgentChatReturn {
  messages: ChatEntry[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  setSystemPrompt: (prompt: string) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const systemPromptRef = useRef<string>(options.systemPrompt || '');

  const setSystemPrompt = useCallback((prompt: string) => {
    systemPromptRef.current = prompt;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message to the UI immediately
    const userEntry: ChatEntry = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userEntry]);

    try {
      // Get auth token from Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated. Please sign in to use the AI assistant.');
      }

      // Build messages array for the API
      const apiMessages: ChatMessage[] = [];

      // Add system prompt if available
      if (systemPromptRef.current) {
        apiMessages.push({
          role: 'system',
          content: systemPromptRef.current,
        });
      }

      // Add conversation history (excluding system messages)
      messages.forEach(msg => {
        if (msg.role !== 'system') {
          apiMessages.push({
            role: msg.role,
            content: msg.content,
            tool_calls: msg.toolCalls,
          });
        }
      });

      // Add the new user message
      apiMessages.push({
        role: 'user',
        content: content.trim(),
      });

      // Send to API
      const response: ChatResponse = await sendAgentMessage(
        apiMessages,
        session.access_token
      );

      // Handle tool calls if present
      if (response.tool_calls && response.tool_calls.length > 0) {
        response.tool_calls.forEach(toolCall => {
          options.onToolCall?.(toolCall);
        });
      }

      // Add assistant response
      const assistantEntry: ChatEntry = {
        id: generateId(),
        role: 'assistant',
        content: response.message.content,
        timestamp: new Date(),
        toolCalls: response.tool_calls,
        toolResults: response.tool_results,
      };

      setMessages(prev => [...prev, assistantEntry]);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      options.onError?.(error);

      // Add error message to chat
      const errorEntry: ChatEntry = {
        id: generateId(),
        role: 'assistant',
        content: error instanceof AgentApiClientError
          ? `Error: ${error.message}${error.status === 401 ? ' Please sign in again.' : ''}`
          : `Error: ${error.message}`,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorEntry]);

    } finally {
      setIsLoading(false);
    }
  }, [messages, options]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    setSystemPrompt,
  };
}
