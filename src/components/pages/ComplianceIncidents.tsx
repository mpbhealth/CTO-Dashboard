import React, { useState } from 'react';
import { Plus, AlertTriangle, Search, Filter } from 'lucide-react';
import { useIncidents, useCreateIncident } from '../../hooks/useComplianceData';
import { SeverityChip, TaskStatusChip } from '../compliance/ComplianceChips';
import type { IncidentSeverity, IncidentFormData } from '../../types/compliance';

const ComplianceIncidents: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all');
  
  const { data: incidents = [], isLoading } = useIncidents();
  const createIncident = useCreateIncident();

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const [newIncident, setNewIncident] = useState<IncidentFormData>({
    title: '',
    description: '',
    severity: 'medium',
    occurred_at: new Date().toISOString().split('T')[0],
    is_breach: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createIncident.mutateAsync(newIncident);
      setShowCreateModal(false);
      setNewIncident({
        title: '',
        description: '',
        severity: 'medium',
        occurred_at: new Date().toISOString().split('T')[0],
        is_breach: false,
      });
    } catch (error) {
      console.error('Failed to create incident:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <span>Incidents & Breaches</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Security incident tracking and breach notification management
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-5 h-5" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as IncidentSeverity | 'all')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Incidents</p>
          <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
        </div>
        <div className="bg-red-50 rounded-lg border-2 border-red-200 p-4">
          <p className="text-sm text-gray-600">Critical</p>
          <p className="text-2xl font-bold text-red-800">
            {incidents.filter(i => i.severity === 'critical').length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
          <p className="text-sm text-gray-600">High</p>
          <p className="text-2xl font-bold text-yellow-800">
            {incidents.filter(i => i.severity === 'high').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-4">
          <p className="text-sm text-gray-600">Breaches</p>
          <p className="text-2xl font-bold text-blue-800">
            {incidents.filter(i => i.is_breach).length}
          </p>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occurred
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breach?
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No incidents found
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{incident.title}</p>
                        <p className="text-sm text-gray-500">{incident.incident_number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {incident.severity && <SeverityChip severity={incident.severity} />}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(incident.occurred_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {incident.is_breach && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Yes
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Report Security Incident</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the incident"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of what happened"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity *
                  </label>
                  <select
                    required
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as IncidentSeverity })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occurred Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newIncident.occurred_at}
                    onChange={(e) => setNewIncident({ ...newIncident, occurred_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_breach"
                  checked={newIncident.is_breach}
                  onChange={(e) => setNewIncident({ ...newIncident, is_breach: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_breach" className="text-sm font-medium text-gray-700">
                  This may be a breach (PHI compromised)
                </label>
              </div>

              {newIncident.is_breach && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Affected Individuals (estimate)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newIncident.affected_individuals_count || ''}
                    onChange={(e) => setNewIncident({ 
                      ...newIncident, 
                      affected_individuals_count: parseInt(e.target.value) || undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Number of individuals affected"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createIncident.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                >
                  {createIncident.isPending ? 'Reporting...' : 'Report Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceIncidents;

