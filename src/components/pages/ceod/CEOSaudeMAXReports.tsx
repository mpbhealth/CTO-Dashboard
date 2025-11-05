import { useState, useMemo } from 'react';
import { Headphones, Download, Filter, TrendingUp, Users, Award, Target, Calendar, FileSpreadsheet, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { ExportModal } from '../../modals/ExportModal';
import { FileViewerModal } from '../../modals/FileViewerModal';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SaudeMAXRecord {
  id: string;
  enrollment_date: string;
  member_id: string | null;
  program_type: string | null;
  status: string | null;
  engagement_score: number | null;
  satisfaction_score: number | null;
  health_improvement: number | null;
}

export function CEOSaudeMAXReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileData, setFileData] = useState<any[]>([]);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['saudemax_data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saudemax_data')
        .select('*')
        .order('enrollment_date', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('SaudeMAX data fetch error:', error);
        return [];
      }
      return data as SaudeMAXRecord[];
    },
  });

  const { data: uploadedFiles = [] } = useQuery({
    queryKey: ['department_uploads', 'saudemax'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('department_uploads')
        .select('*')
        .eq('department', 'saudemax')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const handleViewFile = async (file: any) => {
    setSelectedFile(file);

    const { data } = await supabase
      .from('saudemax_data')
      .select('*')
      .limit(1000);

    setFileData(data || []);
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
    a.download = selectedFile?.file_name || 'saudemax_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (dateFrom && record.enrollment_date && record.enrollment_date < dateFrom) return false;
      if (dateTo && record.enrollment_date && record.enrollment_date > dateTo) return false;
      if (selectedProgram && record.program_type !== selectedProgram) return false;
      if (selectedStatus && record.status !== selectedStatus) return false;
      return true;
    });
  }, [records, dateFrom, dateTo, selectedProgram, selectedStatus]);

  const programs = useMemo(
    () => Array.from(new Set(records.map((r) => r.program_type).filter(Boolean))).sort(),
    [records]
  );

  const statuses = useMemo(
    () => Array.from(new Set(records.map((r) => r.status).filter(Boolean))).sort(),
    [records]
  );

  const metrics = useMemo(() => {
    const activeMembers = filteredRecords.filter((r) => r.status?.toLowerCase() === 'active').length;
    const avgEngagement = filteredRecords.reduce((sum, r) => sum + (r.engagement_score || 0), 0) / filteredRecords.length || 0;
    const avgSatisfaction = filteredRecords.reduce((sum, r) => sum + (r.satisfaction_score || 0), 0) / filteredRecords.length || 0;
    const avgHealthImprovement = filteredRecords.reduce((sum, r) => sum + (r.health_improvement || 0), 0) / filteredRecords.length || 0;

    return {
      totalMembers: filteredRecords.length,
      activeMembers,
      avgEngagement: avgEngagement.toFixed(1),
      avgSatisfaction: avgSatisfaction.toFixed(1),
      avgHealthImprovement: avgHealthImprovement.toFixed(1),
    };
  }, [filteredRecords]);

  const enrollmentTrend = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    filteredRecords.forEach((record) => {
      if (!record.enrollment_date) return;
      const date = new Date(record.enrollment_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });
    return Object.entries(monthlyData)
      .sort(([a], [b]) => (a || '').localeCompare(b || ''))
      .slice(-12)
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count,
      }));
  }, [filteredRecords]);

  const programDistribution = useMemo(() => {
    const programCounts: Record<string, number> = {};
    filteredRecords.forEach((record) => {
      const program = record.program_type || 'Unknown';
      programCounts[program] = (programCounts[program] || 0) + 1;
    });
    return Object.entries(programCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a855f7]"></div>
        </div>
      );
  }

  return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Headphones className="text-[#a855f7]" size={32} />
              SaudeMAX Member Analytics
            </h1>
            <p className="text-gray-600 mt-1">Monitor member engagement and program outcomes</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#a855f7] to-[#c084fc] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download size={18} />
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-[#a855f7]" size={20} />
              <span className="text-xs font-medium text-gray-500">TOTAL</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.totalMembers}</div>
            <div className="text-sm text-gray-500">Total Members</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className="text-xs font-medium text-gray-500">ACTIVE</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.activeMembers}</div>
            <div className="text-sm text-gray-500">Active Members</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="text-pink-600" size={20} />
              <span className="text-xs font-medium text-gray-500">ENGAGEMENT</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.avgEngagement}</div>
            <div className="text-sm text-gray-500">Avg Score</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="text-yellow-600" size={20} />
              <span className="text-xs font-medium text-gray-500">SATISFACTION</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.avgSatisfaction}</div>
            <div className="text-sm text-gray-500">Avg Rating</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className="text-xs font-medium text-gray-500">HEALTH</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.avgHealthImprovement}%</div>
            <div className="text-sm text-gray-500">Improvement</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a855f7] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a855f7] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Program Type</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a855f7] focus:border-transparent"
              >
                <option value="">All Programs</option>
                {programs.map((program) => (
                  <option key={program} value={program!}>
                    {program}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a855f7] focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status!}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Enrollment Trend (12 Months)
            </h2>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[300px]">
                <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} name="New Enrollments" />
              </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={20} />
              Program Distribution
            </h2>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[300px]">
                <ResponsiveContainer width="100%" height={300}>
              <BarChart data={programDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#a855f7" name="Members" />
              </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Member Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Enrollment Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Member ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Engagement</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Satisfaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No SaudeMAX records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.slice(0, 50).map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.enrollment_date ? new Date(record.enrollment_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.member_id || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.program_type || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            record.status?.toLowerCase() === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {record.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#a855f7]">
                        {record.engagement_score || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-yellow-600">
                        {record.satisfaction_score || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-[#a855f7]" />
              Uploaded Files
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file: any) => (
                <div
                  key={file.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#a855f7] transition-colors"
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
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      SaudeMAX
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
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-[#a855f7] to-[#c084fc] text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
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
            data={filteredRecords}
            filename="saudemax_reports"
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

