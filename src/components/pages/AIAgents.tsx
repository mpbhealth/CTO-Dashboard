import { useState } from 'react';
import { useAIAgents } from '../../hooks/useSupabaseData';
import { Bot, Edit, Play, Pause, Settings, Database } from 'lucide-react';

export default function AIAgents() {
  const { data: aiAgents, loading, error } = useAIAgents();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  
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
              <p className="text-2xl font-bold text-slate-900">{aiAgents.length}</p>
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
                {aiAgents.filter(agent => agent.status === 'Live').length}
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
                {Array.from(new Set(aiAgents.flatMap(agent => agent.dataset_refs))).length}
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
                {Array.from(new Set(aiAgents.map(agent => agent.environment))).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {aiAgents.map((agent) => (
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
                {agent.dataset_refs.map((dataset, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {dataset}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button 
                className="flex items-center space-x-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                title="Edit agent prompt"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit Prompt</span>
              </button>
              <div className="flex items-center space-x-2">
                {agent.status === 'Live' ? (
                  <button className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    title="Pause agent"
                    <Pause className="w-4 h-4" />
                    <span className="text-sm">Pause</span>
                  </button>
                ) : (
                  <button className="flex items-center space-x-1 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                    title="Deploy agent"
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
            {selectedAgent === agent.id && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Agent Prompt
                    </label>
                    <textarea
                      className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      defaultValue={agent.prompt}
                    />
                  </div>
                  <div className="flex items-center justify-end space-x-3">
                    <button className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors">
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
