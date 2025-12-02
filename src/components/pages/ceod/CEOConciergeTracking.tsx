import { useState, useMemo } from 'react';
import { MessageSquare, Download, Filter, Calendar, User, TrendingUp, Clock, CheckCircle, FileSpreadsheet, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { ExportModal } from '../../modals/ExportModal';
import { FileViewerModal } from '../../modals/FileViewerModal';

interface ConciergeInteraction {
  staging_id: string;
  member_id: string | null;
  occurred_at: string | null;
  agent_name: string | null;
  channel: string | null;
  result: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

export function CEOConciergeTracking() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedResult, setSelectedResult] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileData, setFileData] = useState<any[]>([]);

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['concierge_interactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concierge_interactions')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as ConciergeInteraction[];
    },
  });

  const { data: uploadedFiles = [] } = useQuery({
    queryKey: ['department_uploads', 'concierge'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('department_uploads')
        .select('*')
        .in('department', ['concierge', 'concierge-weekly', 'concierge-daily', 'concierge-after-hours'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const handleViewFile = async (file: any) => {
    setSelectedFile(file);

    let tableName = '';
    if (file.department === 'concierge' || file.subdepartment === 'weekly') {
      tableName = 'stg_concierge_weekly_metrics';
    } else if (file.subdepartment === 'daily') {
      tableName = 'stg_concierge_daily_interactions';
    } else if (file.subdepartment === 'after_hours') {
      tableName = 'stg_concierge_after_hours';
    }

    if (tableName) {
      const { data } = await supabase
        .from(tableName)
        .select('*')
        .eq('upload_batch_id', file.batch_id)
        .limit(1000);

      setFileData(data || []);
    }
  };

  const handleDownloadFile = () => {
    if (!fileData || fileData.length === 0) return;

    const headers = Object.keys(fileData[0]);
    const csvContent = [
      headers.join(','),
      ...fileData.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile?.file_name || 'concierge_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredInteractions = useMemo(() => {
    return interactions.filter((interaction) => {
      if (dateFrom && interaction.occurred_at && interaction.occurred_at < dateFrom) return false;
      if (dateTo && interaction.occurred_at && interaction.occurred_at > dateTo) return false;
      if (selectedAgent && interaction.agent_name !== selectedAgent) return false;
      if (selectedChannel && interaction.channel !== selectedChannel) return false;
      if (selectedResult && interaction.result !== selectedResult) return false;
      return true;
    });
  }, [interactions, dateFrom, dateTo, selectedAgent, selectedChannel, selectedResult]);

  const agents = useMemo(
    () => Array.from(new Set(interactions.map((i) => i.agent_name).filter(Boolean))).sort(),
    [interactions]
  );

  const channels = useMemo(
    () => Array.from(new Set(interactions.map((i) => i.channel).filter(Boolean))).sort(),
    [interactions]
  );

  const results = useMemo(
    () => Array.from(new Set(interactions.map((i) => i.result).filter(Boolean))).sort(),
    [interactions]
  );

  const metrics = useMemo(() => {
    const total = filteredInteractions.length;
    const avgDuration =
      filteredInteractions.reduce((sum, i) => sum + (i.duration_minutes || 0), 0) / total || 0;
    const resolved = filteredInteractions.filter((i) =>
      i.result?.toLowerCase().includes('resolved')
    ).length;
    const slaCompliance = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0';

    return {
      total,
      avgDuration: avgDuration.toFixed(1),
      resolved,
      slaCompliance,
    };
  }, [filteredInteractions]);

  const agentLeaderboard = useMemo(() => {
    const agentCounts: Record<string, number> = {};
    filteredInteractions.forEach((i) => {
      if (i.agent_name) {
        agentCounts[i.agent_name] = (agentCounts[i.agent_name] || 0) + 1;
      }
    });
    return Object.entries(agentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [filteredInteractions]);

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3d97]"></div>
        </div>
      
    );
  }

  return (
    
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageSquare className="text-[#1a3d97]" size={32} />
              Concierge Tracking
            </h1>
            <p className="text-gray-600 mt-1">Monitor member touchpoints and agent performance</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download size={18} />
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-[#1a3d97]" size={20} />
              <span className="text-xs font-medium text-gray-500">TOTAL</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
            <div className="text-sm text-gray-500">Touchpoints</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-[#00A896]" size={20} />
              <span className="text-xs font-medium text-gray-500">AVG</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.avgDuration}m</div>
            <div className="text-sm text-gray-500">Duration</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-xs font-medium text-gray-500">RESOLVED</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.resolved}</div>
            <div className="text-sm text-gray-500">Issues Closed</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-indigo-500" size={20} />
              <span className="text-xs font-medium text-gray-500">SLA</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.slaCompliance}%</div>
            <div className="text-sm text-gray-500">Compliance</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={20} className="text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Agent</label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  >
                    <option value="">All Agents</option>
                    {agents.map((agent) => (
                      <option key={agent} value={agent!}>
                        {agent}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  >
                    <option value="">All Channels</option>
                    {channels.map((channel) => (
                      <option key={channel} value={channel!}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Result</label>
                  <select
                    value={selectedResult}
                    onChange={(e) => setSelectedResult(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  >
                    <option value="">All Results</option>
                    {results.map((result) => (
                      <option key={result} value={result!}>
                        {result}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Member ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Agent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Channel
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Result
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInteractions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No interactions found matching the selected filters
                        </td>
                      </tr>
                    ) : (
                      filteredInteractions.map((interaction) => (
                        <tr key={interaction.staging_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {interaction.occurred_at
                              ? new Date(interaction.occurred_at).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {interaction.member_id || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {interaction.agent_name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-500 rounded text-xs">
                              {interaction.channel || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs ${
                                interaction.result?.toLowerCase().includes('resolved')
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {interaction.result || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {interaction.duration_minutes ? `${interaction.duration_minutes}m` : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <User size={20} className="text-[#1a3d97]" />
                <h3 className="text-sm font-semibold text-gray-900">Top Agents</h3>
              </div>
              <div className="w-full space-y-3">
                {agentLeaderboard.map(([agent, count], index) => (
                  <div key={agent} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{agent}</span>
                    </div>
                    <span className="text-sm font-bold text-[#1a3d97]">{count}</span>
                  </div>
                ))}
                {agentLeaderboard.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-[#1a3d97]" />
              Uploaded Files
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file: any) => (
                <div
                  key={file.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#1a3d97] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm truncate" title={file.file_name}>
                        {file.file_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#1a3d97] text-white">
                      {file.subdepartment ? file.subdepartment.replace('_', ' ') : 'Concierge'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <span>{file.row_count || 0} rows</span>
                    <span className={file.status === 'completed' ? 'text-green-600' : 'text-gray-500'}>
                      {file.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewFile(file)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                  >
                    <Eye size={14} />
                    View Data
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      {showExportModal && (
        <ExportModal
          data={filteredInteractions}
          filename="concierge_tracking"
          onClose={() => setShowExportModal(false)}
        />
      )}

      {selectedFile && (
        <FileViewerModal
          file={selectedFile}
          data={fileData}
          onClose={() => {
            setSelectedFile(null);
            setFileData([]);
          }}
          onDownload={handleDownloadFile}
        />
      )}
    </div>
  );
}

