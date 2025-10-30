import { useState, useMemo } from 'react';
import { CTODashboardLayout } from '../../layouts/CTODashboardLayout';
import { Activity, Download, TrendingDown, AlertTriangle, Users, DollarSign } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { ExportModal } from '../../modals/ExportModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Cancellation {
  staging_id: string;
  cancel_date: string | null;
  member_id: string | null;
  reason: string | null;
  agent: string | null;
  save_attempted: boolean;
  save_successful: boolean;
  mrr_lost: number;
}

export function CTOOperations() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const { data: cancellations = [], isLoading } = useQuery({
    queryKey: ['plan_cancellations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_cancellations')
        .select('*')
        .order('cancel_date', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as Cancellation[];
    },
  });

  const filteredCancellations = useMemo(() => {
    return cancellations.filter((cancellation) => {
      if (dateFrom && cancellation.cancel_date && cancellation.cancel_date < dateFrom) return false;
      if (dateTo && cancellation.cancel_date && cancellation.cancel_date > dateTo) return false;
      if (selectedReason && cancellation.reason !== selectedReason) return false;
      return true;
    });
  }, [cancellations, dateFrom, dateTo, selectedReason]);

  const reasons = useMemo(
    () => Array.from(new Set(cancellations.map((c) => c.reason).filter(Boolean))).sort(),
    [cancellations]
  );

  const metrics = useMemo(() => {
    const totalCancellations = filteredCancellations.length;
    const saveAttempted = filteredCancellations.filter((c) => c.save_attempted).length;
    const saveSuccessful = filteredCancellations.filter((c) => c.save_successful).length;
    const totalMrrLost = filteredCancellations.reduce((sum, c) => sum + c.mrr_lost, 0);
    const saveRate = saveAttempted > 0 ? ((saveSuccessful / saveAttempted) * 100).toFixed(1) : '0';

    return {
      totalCancellations,
      saveAttempted,
      saveSuccessful,
      saveRate,
      totalMrrLost,
    };
  }, [filteredCancellations]);

  const reasonBreakdown = useMemo(() => {
    const reasonCounts: Record<string, number> = {};
    filteredCancellations.forEach((c) => {
      const reason = c.reason || 'Unknown';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    return Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [filteredCancellations]);

  const trendData = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    filteredCancellations.forEach((c) => {
      if (c.cancel_date) {
        const date = new Date(c.cancel_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    });
    return Object.entries(monthCounts)
      .sort(([a], [b]) => (a || '').localeCompare(b || ''))
      .slice(-6)
      .map(([month, count]) => ({ month, count }));
  }, [filteredCancellations]);

  if (isLoading) {
    return (
      <CTODashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        </div>
      </CTODashboardLayout>
    );
  }

  return (
    <CTODashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="text-pink-600" size={32} />
              Operations & Churn Analytics
            </h1>
            <p className="text-gray-600 mt-1">Technical view of cancellations and operational metrics</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download size={18} />
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="text-red-600" size={20} />
              <span className="text-xs font-medium text-gray-500">TOTAL</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.totalCancellations}</div>
            <div className="text-sm text-gray-500">Cancellations</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-orange-600" size={20} />
              <span className="text-xs font-medium text-gray-500">MRR LOST</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${(metrics.totalMrrLost / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-500">Revenue Impact</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-pink-600" size={20} />
              <span className="text-xs font-medium text-gray-500">SAVES</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.saveSuccessful}</div>
            <div className="text-sm text-gray-500">Retained</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-yellow-600" size={20} />
              <span className="text-xs font-medium text-gray-500">ATTEMPTS</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.saveAttempted}</div>
            <div className="text-sm text-gray-500">Save Efforts</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="text-green-600" size={20} />
              <span className="text-xs font-medium text-gray-500">SAVE RATE</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.saveRate}%</div>
            <div className="text-sm text-gray-500">Win-back Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  >
                    <option value="">All Reasons</option>
                    {reasons.map((reason) => (
                      <option key={reason} value={reason!}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Churn Trend (Last 6 Months)</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Agent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Save</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">MRR Lost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCancellations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No cancellations found
                        </td>
                      </tr>
                    ) : (
                      filteredCancellations.slice(0, 50).map((cancellation) => (
                        <tr key={cancellation.staging_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {cancellation.cancel_date
                              ? new Date(cancellation.cancel_date).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {cancellation.member_id || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cancellation.reason || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cancellation.agent || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            {cancellation.save_successful ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                Success
                              </span>
                            ) : cancellation.save_attempted ? (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                                Attempted
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-red-600">
                            ${(cancellation.mrr_lost || 0).toFixed(0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Cancellation Reasons</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reasonBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0284c7" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-lg p-6 text-white">
              <h3 className="font-semibold text-lg mb-2">Shared Data Access</h3>
              <p className="text-pink-100 text-sm mb-4">
                This operations data is shared with the CEO dashboard for cross-functional collaboration.
              </p>
              <div className="flex items-center gap-2 text-sm text-pink-50">
                <Activity size={16} />
                <span>Real-time sync enabled</span>
              </div>
            </div>
          </div>
        </div>

        {showExportModal && (
          <ExportModal
            data={filteredCancellations}
            filename="operations_cancellations_cto"
            onClose={() => setShowExportModal(false)}
          />
        )}
      </div>
    </CTODashboardLayout>
  );
}
