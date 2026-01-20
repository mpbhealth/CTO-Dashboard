/**
 * AI Agent API Client
 * Communicates with the AI agent backend for chat completions
 */

// Types for chat messages and responses
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  name: string;
  result: unknown;
  success: boolean;
}

export interface ChatResponse {
  message: ChatMessage;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  finish_reason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}

export interface AgentApiError {
  error: string;
  code?: string;
  status?: number;
}

// Get the API URL from environment variable, defaulting to localhost
const getAgentApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_AGENT_API_URL;
  return envUrl || 'http://localhost:3001';
};

/**
 * Send a message to the AI agent backend
 * @param messages - Array of chat messages
 * @param accessToken - Supabase access token for authentication
 * @returns ChatResponse from the agent
 */
export async function sendAgentMessage(
  messages: ChatMessage[],
  accessToken: string
): Promise<ChatResponse> {
  const apiUrl = getAgentApiUrl();

  const response = await fetch(`${apiUrl}/api/agent/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AgentApiClientError(
      errorData.error || `API request failed with status ${response.status}`,
      response.status,
      errorData.code
    );
  }

  const data = await response.json();
  return data as ChatResponse;
}

/**
 * Check if the agent API is available
 * @returns boolean indicating if the API is reachable
 */
export async function checkAgentApiHealth(): Promise<boolean> {
  const apiUrl = getAgentApiUrl();

  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Custom error class for agent API errors
 */
export class AgentApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AgentApiClientError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Get available tools from the agent API
 * @param accessToken - Supabase access token for authentication
 * @returns Array of available tool names
 */
export async function getAvailableTools(accessToken: string): Promise<string[]> {
  const apiUrl = getAgentApiUrl();

  try {
    const response = await fetch(`${apiUrl}/api/agent/tools`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.tools || [];
  } catch {
    return [];
  }
}
