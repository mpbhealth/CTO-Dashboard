import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { useAIAgents } from '../../hooks/useSupabaseData';
import { useAgentChat, ChatEntry } from '../../hooks/useAgentChat';
import { ToolCallVisualization } from '../ai/ToolCallVisualization';
import {
  Bot,
  Edit,
  Play,
  Pause,
  Settings,
  Database,
  Terminal,
  Send,
  Loader2,
  Trash2,
  ChevronRight,
  AlertCircle,
  User,
} from 'lucide-react';

interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: string;
  environment: string;
  prompt: string;
  dataset_refs: string[];
  last_updated: string;
}

export default function AIAgents() {
  const { data: aiAgents, loading, error } = useAIAgents();
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading data: {error}</p>
          <p className="text-slate-600">Please make sure you're connected to Supabase.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    return status === 'Live' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800';
  };

  const getStatusIcon = (status: string) => {
    return status === 'Live' ?
      <Play className="w-4 h-4 text-emerald-600" /> :
      <Pause className="w-4 h-4 text-slate-600" />;
  };

  const handleRunAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setShowTerminal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AI Agent Management</h1>
        <p className="text-slate-600 mt-2">Manage AI agents, prompts, and dataset connections across MPB Health</p>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Agents</p>
              <p className="text-2xl font-bold text-slate-900">{(aiAgents as AIAgent[]).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Live Agents</p>
              <p className="text-2xl font-bold text-slate-900">
                {(aiAgents as AIAgent[]).filter(agent => agent.status === 'Live').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Datasets</p>
              <p className="text-2xl font-bold text-slate-900">
                {Array.from(new Set((aiAgents as AIAgent[]).flatMap(agent => agent.dataset_refs || []))).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Environments</p>
              <p className="text-2xl font-bold text-slate-900">
                {Array.from(new Set((aiAgents as AIAgent[]).map(agent => agent.environment))).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Modal */}
      {showTerminal && selectedAgent && (
        <AgentTerminal
          agent={selectedAgent}
          onClose={() => {
            setShowTerminal(false);
            setSelectedAgent(null);
          }}
        />
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(aiAgents as AIAgent[]).map((agent) => (
          <div key={agent.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{agent.name}</h3>
                  <p className="text-slate-600">{agent.role}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(agent.status)}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </span>
              </div>
            </div>

            {/* Environment and Last Updated */}
            <div className="flex items-center justify-between mb-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">Environment:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  agent.environment === 'Production' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {agent.environment}
                </span>
              </div>
              <span className="text-slate-600">
                Updated: {new Date(agent.last_updated).toLocaleDateString()}
              </span>
            </div>

            {/* Prompt Preview */}
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Current Prompt:</p>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600 line-clamp-3">
                  {agent.prompt}
                </p>
              </div>
            </div>

            {/* Dataset References */}
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Connected Datasets:</p>
              <div className="flex flex-wrap gap-2">
                {(agent.dataset_refs || []).map((dataset, index) => (
                  <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                    {dataset}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                className="flex items-center space-x-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                onClick={() => setEditingAgent(editingAgent === agent.id ? null : agent.id)}
                title="Edit agent prompt"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit Prompt</span>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  className="flex items-center space-x-1 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  onClick={() => handleRunAgent(agent)}
                  title="Test agent in terminal"
                >
                  <Terminal className="w-4 h-4" />
                  <span className="text-sm">Run</span>
                </button>
                {agent.status === 'Live' ? (
                  <button className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Pause agent">
                    <Pause className="w-4 h-4" />
                    <span className="text-sm">Pause</span>
                  </button>
                ) : (
                  <button className="flex items-center space-x-1 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Deploy agent">
                    <Play className="w-4 h-4" />
                    <span className="text-sm">Deploy</span>
                  </button>
                )}
                <button
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Agent settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Prompt Editor */}
            {editingAgent === agent.id && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Agent Prompt
                    </label>
                    <textarea
                      className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500 text-sm"
                      defaultValue={agent.prompt}
                    />
                  </div>
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                      onClick={() => setEditingAgent(null)}
                    >
                      Cancel
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface AgentTerminalProps {
  agent: AIAgent;
  onClose: () => void;
}

function AgentTerminal({ agent, onClose }: AgentTerminalProps) {
  const {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
    setSystemPrompt,
  } = useAgentChat({
    systemPrompt: agent.prompt,
  });

  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSystemPrompt(agent.prompt);
  }, [agent.prompt, setSystemPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <button
                onClick={onClose}
                className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                title="Close"
              />
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal className="w-4 h-4" />
              <span className="font-mono text-sm">{agent.name} Terminal</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearHistory}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-3">
          {/* Welcome Message */}
          <div className="text-emerald-400">
            <p>Connected to {agent.name}</p>
            <p className="text-slate-500">Role: {agent.role}</p>
            <p className="text-slate-500">Environment: {agent.environment}</p>
            <p className="text-slate-500 mt-2">Type your message and press Enter to interact with the agent.</p>
            <p className="text-slate-500">Press Escape to close. Use Up/Down arrows for command history.</p>
            <div className="border-t border-slate-700 mt-3" />
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <TerminalMessage key={message.id} message={message} />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Terminal Input */}
        <form onSubmit={handleSubmit} className="px-4 py-3 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none font-mono"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-1.5 text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TerminalMessageProps {
  message: ChatEntry;
}

function TerminalMessage({ message }: TerminalMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className="space-y-1">
      {/* Message header */}
      <div className="flex items-center gap-2">
        {isUser ? (
          <>
            <User className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400 text-xs">you</span>
          </>
        ) : isError ? (
          <>
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span className="text-red-400 text-xs">error</span>
          </>
        ) : (
          <>
            <Bot className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 text-xs">assistant</span>
          </>
        )}
        <span className="text-slate-600 text-xs">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Message content */}
      <div className={`pl-5 ${isError ? 'text-red-300' : 'text-slate-300'}`}>
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2">
            <ToolCallVisualization
              toolCalls={message.toolCalls}
              toolResults={message.toolResults}
            />
          </div>
        )}
      </div>
    </div>
  );
}
