import { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle, AlertTriangle, XCircle, Clock, 
  Plus, Edit2, Trash2, Eye, RefreshCw, TrendingUp, AlertCircle,
  Calendar, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface APIStatus {
  id: string;
  name: string;
  url: string;
  description?: string;
  status: 'Healthy' | 'Warning' | 'Down';
  last_checked: string;
  response_time: number;
  uptime?: number;
  endpoint_count?: number;
  is_active: boolean;
}

interface Incident {
  id: string;
  api_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  started_at: string;
  resolved_at?: string;
  impact?: string;
  resolution_notes?: string;
}

export default function APIStatus() {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApi, setSelectedApi] = useState<APIStatus | null>(null);
  const [isAddingApi, setIsAddingApi] = useState(false);
  const [isAddingIncident, setIsAddingIncident] = useState(false);
  const [editingApiId, setEditingApiId] = useState<string | null>(null);
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);

  const [apiForm, setApiForm] = useState({
    name: '',
    url: '',
    description: '',
    status: 'Healthy' as 'Healthy' | 'Warning' | 'Down',
    response_time: 0,
    uptime: 99.9,
    endpoint_count: 0
  });

  const [incidentForm, setIncidentForm] = useState({
    api_id: '',
    title: '',
    description: '',
    severity: 'warning' as 'critical' | 'warning' | 'info',
    status: 'investigating' as 'investigating' | 'identified' | 'monitoring' | 'resolved',
    impact: '',
    resolution_notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apisRes, incidentsRes] = await Promise.all([
        supabase.from('api_statuses').select('*').order('created_at', { ascending: false }),
        supabase.from('api_incidents').select('*').order('started_at', { ascending: false }).limit(20)
      ]);

      if (apisRes.data) setApiStatuses(apisRes.data);
      if (incidentsRes.data) setIncidents(incidentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('api_statuses')
        .insert([{ ...apiForm, last_checked: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      setApiStatuses([data, ...apiStatuses]);
      setApiForm({
        name: '',
        url: '',
        description: '',
        status: 'Healthy',
        response_time: 0,
        uptime: 99.9,
        endpoint_count: 0
      });
      setIsAddingApi(false);
    } catch (error) {
      console.error('Error adding API:', error);
      alert('Failed to add API. Please try again.');
    }
  };

  const handleUpdateApi = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('api_statuses')
        .update(apiForm)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setApiStatuses(apiStatuses.map(api => api.id === id ? data : api));
      setApiForm({
        name: '',
        url: '',
        description: '',
        status: 'Healthy',
        response_time: 0,
        uptime: 99.9,
        endpoint_count: 0
      });
      setEditingApiId(null);
    } catch (error) {
      console.error('Error updating API:', error);
      alert('Failed to update API. Please try again.');
    }
  };

  const handleDeleteApi = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API? All associated incidents will also be deleted.')) return;

    try {
      const { error } = await supabase
        .from('api_statuses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApiStatuses(apiStatuses.filter(api => api.id !== id));
      setIncidents(incidents.filter(inc => inc.api_id !== id));
    } catch (error) {
      console.error('Error deleting API:', error);
      alert('Failed to delete API. Please try again.');
    }
  };

  const startEditingApi = (api: APIStatus) => {
    setApiForm({
      name: api.name,
      url: api.url,
      description: api.description || '',
      status: api.status,
      response_time: api.response_time,
      uptime: api.uptime || 99.9,
      endpoint_count: api.endpoint_count || 0
    });
    setEditingApiId(api.id);
  };

  const toggleApiActive = async (id: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('api_statuses')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setApiStatuses(apiStatuses.map(api => api.id === id ? data : api));
    } catch (error) {
      console.error('Error toggling API status:', error);
    }
  };

  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('api_incidents')
        .insert([{ ...incidentForm, started_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      setIncidents([data, ...incidents]);
      setIncidentForm({
        api_id: '',
        title: '',
        description: '',
        severity: 'warning',
        status: 'investigating',
        impact: '',
        resolution_notes: ''
      });
      setIsAddingIncident(false);
    } catch (error) {
      console.error('Error adding incident:', error);
      alert('Failed to add incident. Please try again.');
    }
  };

  const handleUpdateIncident = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updateData: any = { ...incidentForm };
      
      // If status is being changed to resolved, set resolved_at
      if (incidentForm.status === 'resolved' && !incidents.find(i => i.id === id)?.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('api_incidents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setIncidents(incidents.map(inc => inc.id === id ? data : inc));
      setIncidentForm({
        api_id: '',
        title: '',
        description: '',
        severity: 'warning',
        status: 'investigating',
        impact: '',
        resolution_notes: ''
      });
      setEditingIncidentId(null);
    } catch (error) {
      console.error('Error updating incident:', error);
      alert('Failed to update incident. Please try again.');
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;

    try {
      const { error } = await supabase
        .from('api_incidents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIncidents(incidents.filter(inc => inc.id !== id));
    } catch (error) {
      console.error('Error deleting incident:', error);
      alert('Failed to delete incident. Please try again.');
    }
  };

  const startEditingIncident = (incident: Incident) => {
    setIncidentForm({
      api_id: incident.api_id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      impact: incident.impact || '',
      resolution_notes: incident.resolution_notes || ''
    });
    setEditingIncidentId(incident.id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Healthy':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'Warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'Down':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-100 text-emerald-800';
      case 'Warning':
        return 'bg-amber-100 text-amber-800';
      case 'Down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime === 0) return 'text-red-600';
    if (responseTime > 1000) return 'text-amber-600';
    if (responseTime > 500) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800';
      case 'monitoring':
        return 'bg-blue-100 text-blue-800';
      case 'identified':
        return 'bg-amber-100 text-amber-800';
      case 'investigating':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const healthyCount = apiStatuses.filter(api => api.status === 'Healthy' && api.is_active).length;
  const warningCount = apiStatuses.filter(api => api.status === 'Warning' && api.is_active).length;
  const downCount = apiStatuses.filter(api => api.status === 'Down' && api.is_active).length;
  const avgResponseTime = apiStatuses.length > 0 
    ? Math.round(apiStatuses.filter(api => api.is_active).reduce((sum, api) => sum + api.response_time, 0) / apiStatuses.filter(api => api.is_active).length) 
    : 0;
  const avgUptime = apiStatuses.length > 0
    ? (apiStatuses.filter(api => api.is_active).reduce((sum, api) => sum + (api.uptime || 0), 0) / apiStatuses.filter(api => api.is_active).length).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">API Status Dashboard</h1>
          <p className="text-slate-600 mt-2">Monitor the health and performance of all MPB Health APIs</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsAddingApi(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add API</span>
          </button>
          <button
            onClick={() => setIsAddingIncident(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Add API Form - PART 1 */}
      {isAddingApi && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New API</h3>
          <form onSubmit={handleAddApi} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Name *</label>
                <input
                  type="text"
                  value={apiForm.name}
                  onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="MPB Core API"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL *</label>
                <input
                  type="url"
                  value={apiForm.url}
                  onChange={(e) => setApiForm({ ...apiForm, url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="https://api.mpbhealth.com/v1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={apiForm.description}
                  onChange={(e) => setApiForm({ ...apiForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Brief description of the API"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={apiForm.status}
                  onChange={(e) => setApiForm({ ...apiForm, status: e.target.value as 'Healthy' | 'Warning' | 'Down' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Warning">Warning</option>
                  <option value="Down">Down</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Response Time (ms)</label>
                <input
                  type="number"
                  value={apiForm.response_time}
                  onChange={(e) => setApiForm({ ...apiForm, response_time: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="142"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Uptime (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={apiForm.uptime}
                  onChange={(e) => setApiForm({ ...apiForm, uptime: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="99.9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endpoint Count</label>
                <input
                  type="number"
                  value={apiForm.endpoint_count}
                  onChange={(e) => setApiForm({ ...apiForm, endpoint_count: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="24"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingApi(false);
                  setApiForm({
                    name: '',
                    url: '',
                    description: '',
                    status: 'Healthy',
                    response_time: 0,
                    uptime: 99.9,
                    endpoint_count: 0
                  });
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add API
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rest of the component will be in the next message due to length */}
      
      {/* API Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Healthy</p>
              <p className="text-2xl font-bold text-slate-900">{healthyCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Warning</p>
              <p className="text-2xl font-bold text-slate-900">{warningCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Down</p>
              <p className="text-2xl font-bold text-slate-900">{downCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Response</p>
              <p className="text-2xl font-bold text-slate-900">{avgResponseTime}ms</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Uptime</p>
              <p className="text-2xl font-bold text-slate-900">{avgUptime}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
