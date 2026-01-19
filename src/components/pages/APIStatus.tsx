import { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, Clock, Plus, Edit2, Trash2, Eye, RefreshCw, TrendingUp, AlertCircle, Calendar, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface APIStatus {
  id: string; name: string; url: string; description?: string;
  status: 'Healthy' | 'Warning' | 'Down'; last_checked: string; response_time: number;
  uptime?: number; endpoint_count?: number; is_active: boolean;
}

interface Incident {
  id: string; api_id: string; title: string; description: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  started_at: string; resolved_at?: string; impact?: string; resolution_notes?: string;
}

export default function APIStatus() {
  const [apis, setApis] = useState<APIStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApi, setSelectedApi] = useState<APIStatus | null>(null);
  const [showAddApi, setShowAddApi] = useState(false);
  const [showAddIncident, setShowAddIncident] = useState(false);
  const [editApiId, setEditApiId] = useState<string | null>(null);
  const [editIncidentId, setEditIncidentId] = useState<string | null>(null);

  const [apiForm, setApiForm] = useState({ name: '', url: '', description: '', status: 'Healthy' as const, response_time: 0, uptime: 99.9, endpoint_count: 0 });
  const [incidentForm, setIncidentForm] = useState({ api_id: '', title: '', description: '', severity: 'warning' as const, status: 'investigating' as const, impact: '', resolution_notes: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apisRes, incidentsRes] = await Promise.all([
        supabase.from('api_statuses').select('*').order('created_at', { ascending: false }),
        supabase.from('api_incidents').select('*').order('started_at', { ascending: false }).limit(20)
      ]);
      if (apisRes.data) setApis(apisRes.data);
      if (incidentsRes.data) setIncidents(incidentsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('api_statuses').insert([{ ...apiForm, last_checked: new Date().toISOString() }]).select().single();
      if (error) throw error;
      setApis([data, ...apis]);
      setApiForm({ name: '', url: '', description: '', status: 'Healthy', response_time: 0, uptime: 99.9, endpoint_count: 0 });
      setShowAddApi(false);
    } catch {
      alert('Failed to add API');
    }
  };

  const handleUpdateApi = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('api_statuses').update(apiForm).eq('id', id).select().single();
      if (error) throw error;
      setApis(apis.map(a => a.id === id ? data : a));
      setApiForm({ name: '', url: '', description: '', status: 'Healthy', response_time: 0, uptime: 99.9, endpoint_count: 0 });
      setEditApiId(null);
    } catch {
      alert('Failed to update API');
    }
  };

  const handleDeleteApi = async (id: string) => {
    if (!confirm('Delete this API?')) return;
    try {
      await supabase.from('api_statuses').delete().eq('id', id);
      setApis(apis.filter(a => a.id !== id));
      setIncidents(incidents.filter(i => i.api_id !== id));
    } catch {
      alert('Failed to delete API');
    }
  };

  const toggleApiActive = async (id: string, currentStatus: boolean) => {
    try {
      const { data } = await supabase.from('api_statuses').update({ is_active: !currentStatus }).eq('id', id).select().single();
      if (data) setApis(apis.map(a => a.id === id ? data : a));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('api_incidents').insert([{ ...incidentForm, started_at: new Date().toISOString() }]).select().single();
      if (error) throw error;
      setIncidents([data, ...incidents]);
      setIncidentForm({ api_id: '', title: '', description: '', severity: 'warning', status: 'investigating', impact: '', resolution_notes: '' });
      setShowAddIncident(false);
    } catch {
      alert('Failed to add incident');
    }
  };

  const handleUpdateIncident = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updateData: typeof incidentForm & { resolved_at?: string } = { ...incidentForm };
      if (incidentForm.status === 'resolved' && !incidents.find(i => i.id === id)?.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
      const { data, error } = await supabase.from('api_incidents').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      setIncidents(incidents.map(i => i.id === id ? data : i));
      setIncidentForm({ api_id: '', title: '', description: '', severity: 'warning', status: 'investigating', impact: '', resolution_notes: '' });
      setEditIncidentId(null);
    } catch {
      alert('Failed to update incident');
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm('Delete this incident?')) return;
    try {
      await supabase.from('api_incidents').delete().eq('id', id);
      setIncidents(incidents.filter(i => i.id !== id));
    } catch {
      alert('Failed to delete incident');
    }
  };

  const getStatusIcon = (status: string) => {
    const icons = { 'Healthy': <CheckCircle className="w-5 h-5 text-emerald-600" />, 'Warning': <AlertTriangle className="w-5 h-5 text-amber-600" />, 'Down': <XCircle className="w-5 h-5 text-red-600" /> };
    return icons[status as keyof typeof icons] || <Activity className="w-5 h-5 text-slate-600" />;
  };

  const getStatusColor = (status: string) => {
    const colors = { 'Healthy': 'bg-emerald-100 text-emerald-800', 'Warning': 'bg-amber-100 text-amber-800', 'Down': 'bg-red-100 text-red-800' };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  const getResponseTimeColor = (rt: number) => rt === 0 ? 'text-red-600' : rt > 1000 ? 'text-amber-600' : rt > 500 ? 'text-amber-600' : 'text-emerald-600';

  const getSeverityColor = (s: string) => {
    const colors = { 'critical': 'bg-red-100 text-red-800', 'warning': 'bg-amber-100 text-amber-800', 'info': 'bg-indigo-100 text-indigo-800' };
    return colors[s as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  const getIncidentStatusColor = (s: string) => {
    const colors = { 'resolved': 'bg-emerald-100 text-emerald-800', 'monitoring': 'bg-indigo-100 text-indigo-800', 'identified': 'bg-amber-100 text-amber-800', 'investigating': 'bg-orange-100 text-orange-800' };
    return colors[s as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const activeApis = apis.filter(a => a.is_active);
  const stats = {
    healthy: activeApis.filter(a => a.status === 'Healthy').length,
    warning: activeApis.filter(a => a.status === 'Warning').length,
    down: activeApis.filter(a => a.status === 'Down').length,
    avgResponse: activeApis.length > 0 ? Math.round(activeApis.reduce((sum, a) => sum + a.response_time, 0) / activeApis.length) : 0,
    avgUptime: activeApis.length > 0 ? (activeApis.reduce((sum, a) => sum + (a.uptime || 0), 0) / activeApis.length).toFixed(2) : '0.00'
  };

  const ApiForm = ({ onSubmit, isEdit = false }: { onSubmit: (e: React.FormEvent) => void; isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">API Name *</label>
          <input type="text" value={apiForm.name} onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required placeholder="MPB Core API" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">URL *</label>
          <input type="url" value={apiForm.url} onChange={(e) => setApiForm({ ...apiForm, url: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required placeholder="https://api.example.com" /></div>
        <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={apiForm.description} onChange={(e) => setApiForm({ ...apiForm, description: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select value={apiForm.status} onChange={(e) => setApiForm({ ...apiForm, status: e.target.value as 'Healthy' | 'Warning' | 'Down' })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Healthy">Healthy</option><option value="Warning">Warning</option><option value="Down">Down</option></select></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Response Time (ms)</label>
          <input type="number" value={apiForm.response_time} onChange={(e) => setApiForm({ ...apiForm, response_time: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Uptime (%)</label>
          <input type="number" step="0.01" value={apiForm.uptime} onChange={(e) => setApiForm({ ...apiForm, uptime: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Endpoints</label>
          <input type="number" value={apiForm.endpoint_count} onChange={(e) => setApiForm({ ...apiForm, endpoint_count: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={() => { isEdit ? setEditApiId(null) : setShowAddApi(false); setApiForm({ name: '', url: '', description: '', status: 'Healthy', response_time: 0, uptime: 99.9, endpoint_count: 0 }); }} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{isEdit ? 'Update' : 'Add API'}</button>
      </div>
    </form>
  );

  const IncidentForm = ({ onSubmit, isEdit = false }: { onSubmit: (e: React.FormEvent) => void; isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Affected API *</label>
          <select value={incidentForm.api_id} onChange={(e) => setIncidentForm({ ...incidentForm, api_id: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value="">Select API</option>{apis.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Severity *</label>
          <select value={incidentForm.severity} onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value as 'critical' | 'warning' | 'info' })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option></select></div>
        <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input type="text" value={incidentForm.title} onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
        <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
          <textarea value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} required /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select value={incidentForm.status} onChange={(e) => setIncidentForm({ ...incidentForm, status: e.target.value as 'investigating' | 'identified' | 'monitoring' | 'resolved' })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="investigating">Investigating</option><option value="identified">Identified</option><option value="monitoring">Monitoring</option><option value="resolved">Resolved</option></select></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Impact</label>
          <input type="text" value={incidentForm.impact} onChange={(e) => setIncidentForm({ ...incidentForm, impact: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        {incidentForm.status === 'resolved' && <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Resolution Notes</label>
          <textarea value={incidentForm.resolution_notes} onChange={(e) => setIncidentForm({ ...incidentForm, resolution_notes: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>}
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={() => { isEdit ? setEditIncidentId(null) : setShowAddIncident(false); setIncidentForm({ api_id: '', title: '', description: '', severity: 'warning', status: 'investigating', impact: '', resolution_notes: '' }); }} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">{isEdit ? 'Update' : 'Report'}</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-slate-900">API Status Dashboard</h1>
          <p className="text-slate-600 mt-2">Monitor the health and performance of all MPB Health APIs</p></div>
        <div className="flex space-x-3">
          <button onClick={fetchData} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"><RefreshCw className="h-4 w-4" /><span>Refresh</span></button>
          <button onClick={() => setShowAddApi(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"><Plus className="h-4 w-4" /><span>Add API</span></button>
          <button onClick={() => setShowAddIncident(true)} className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"><AlertCircle className="h-4 w-4" /><span>Report Incident</span></button>
        </div>
      </div>

      {showAddApi && <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><h3 className="text-lg font-semibold text-slate-900 mb-4">Add New API</h3><ApiForm onSubmit={handleAddApi} /></div>}
      {showAddIncident && <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200"><h3 className="text-lg font-semibold text-slate-900 mb-4">Report New Incident</h3><IncidentForm onSubmit={handleAddIncident} /></div>}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { icon: CheckCircle, color: 'emerald', label: 'Healthy', value: stats.healthy },
          { icon: AlertTriangle, color: 'amber', label: 'Warning', value: stats.warning },
          { icon: XCircle, color: 'red', label: 'Down', value: stats.down },
          { icon: Clock, color: 'indigo', label: 'Avg Response', value: `${stats.avgResponse}ms` },
          { icon: TrendingUp, color: 'green', label: 'Avg Uptime', value: `${stats.avgUptime}%` }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div><p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {apis.map(api => (
          <div key={api.id}>
            {editApiId === api.id ? (
              <div className="bg-indigo-50 p-6 rounded-xl shadow-sm border border-indigo-300"><h3 className="text-lg font-semibold text-slate-900 mb-4">Edit API</h3>
                <ApiForm onSubmit={(e) => handleUpdateApi(api.id, e)} isEdit /></div>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">{getStatusIcon(api.status)}
                    <div><h3 className="text-xl font-semibold text-slate-900">{api.name}</h3>
                      <p className="text-slate-600 text-sm">{api.url}</p>
                      {api.description && <p className="text-slate-500 text-xs mt-1">{api.description}</p>}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => toggleApiActive(api.id, api.is_active)} className={`px-2 py-1 text-xs rounded-full transition-colors ${api.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>{api.is_active ? 'Active' : 'Inactive'}</button>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(api.status)}`}>{api.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-50 p-4 rounded-lg"><p className="text-sm font-medium text-slate-600 mb-1">Response</p>
                    <p className={`text-xl font-bold ${getResponseTimeColor(api.response_time)}`}>{api.response_time === 0 ? 'N/A' : `${api.response_time}ms`}</p></div>
                  <div className="bg-slate-50 p-4 rounded-lg"><p className="text-sm font-medium text-slate-600 mb-1">Uptime</p>
                    <p className="text-xl font-bold text-emerald-600">{api.uptime || 0}%</p></div>
                  <div className="bg-slate-50 p-4 rounded-lg"><p className="text-sm font-medium text-slate-600 mb-1">Endpoints</p>
                    <p className="text-xl font-bold text-slate-900">{api.endpoint_count || 0}</p></div>
                </div>
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-slate-600"><Calendar className="h-4 w-4" />
                    <span>Last: {new Date(api.last_checked).toLocaleString()}</span></div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setSelectedApi(api)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-md" title="View"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => { setApiForm({ name: api.name, url: api.url, description: api.description || '', status: api.status, response_time: api.response_time, uptime: api.uptime || 99.9, endpoint_count: api.endpoint_count || 0 }); setEditApiId(api.id); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md" title="Edit"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteApi(api.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200"><h2 className="text-xl font-semibold text-slate-900">Recent Incidents</h2>
          <p className="text-slate-600 mt-1">Latest API incidents and resolutions</p></div>
        <div className="p-6">
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-slate-500"><Info className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>No incidents reported</p></div>
          ) : (
            <div className="space-y-4">
              {incidents.map(inc => {
                const api = apis.find(a => a.id === inc.api_id);
                return (
                  <div key={inc.id}>
                    {editIncidentId === inc.id ? (
                      <div className="p-4 border-2 border-indigo-300 rounded-lg bg-indigo-50"><h4 className="font-medium text-slate-900 mb-3">Edit Incident</h4>
                        <IncidentForm onSubmit={(e) => handleUpdateIncident(inc.id, e)} isEdit /></div>
                    ) : (
                      <div className="flex items-start space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <div className={`w-3 h-3 rounded-full mt-2 ${inc.severity === 'critical' ? 'bg-red-500' : inc.severity === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div><h3 className="font-medium text-slate-900">{inc.title}</h3>
                              <p className="text-sm text-slate-600">{api?.name || 'Unknown API'}</p></div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(inc.severity)}`}>{inc.severity}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getIncidentStatusColor(inc.status)}`}>{inc.status}</span>
                              <span className="text-sm text-slate-600">{new Date(inc.started_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{inc.description}</p>
                          {inc.resolution_notes && <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                            <p className="text-sm text-emerald-800"><strong>Resolution:</strong> {inc.resolution_notes}</p></div>}
                        </div>
                        <div className="flex space-x-1">
                          <button onClick={() => { setIncidentForm({ api_id: inc.api_id, title: inc.title, description: inc.description, severity: inc.severity, status: inc.status, impact: inc.impact || '', resolution_notes: inc.resolution_notes || '' }); setEditIncidentId(inc.id); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteIncident(inc.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedApi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedApi(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div><h2 className="text-2xl font-bold text-slate-900">{selectedApi.name}</h2><p className="text-slate-600">{selectedApi.url}</p></div>
              <button onClick={() => setSelectedApi(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-6 w-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><h3 className="font-semibold text-slate-900 mb-2">Description</h3><p className="text-slate-600">{selectedApi.description || 'No description available'}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm font-medium text-slate-600">Status</p>
                  <div className="flex items-center space-x-2 mt-1">{getStatusIcon(selectedApi.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApi.status)}`}>{selectedApi.status}</span></div></div>
                <div><p className="text-sm font-medium text-slate-600">Response Time</p>
                  <p className={`text-lg font-bold mt-1 ${getResponseTimeColor(selectedApi.response_time)}`}>{selectedApi.response_time === 0 ? 'N/A' : `${selectedApi.response_time}ms`}</p></div>
                <div><p className="text-sm font-medium text-slate-600">Uptime</p><p className="text-lg font-bold text-emerald-600 mt-1">{selectedApi.uptime || 0}%</p></div>
                <div><p className="text-sm font-medium text-slate-600">Endpoints</p><p className="text-lg font-bold text-slate-900 mt-1">{selectedApi.endpoint_count || 0}</p></div>
              </div>
              <div><h3 className="font-semibold text-slate-900 mb-2">Recent Incidents</h3>
                <div className="space-y-2">
                  {incidents.filter(i => i.api_id === selectedApi.id).length === 0 ? (
                    <p className="text-slate-500 text-sm">No incidents recorded</p>
                  ) : (
                    incidents.filter(i => i.api_id === selectedApi.id).slice(0, 5).map(inc => (
                      <div key={inc.id} className="p-3 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-1"><p className="font-medium text-slate-900 text-sm">{inc.title}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getIncidentStatusColor(inc.status)}`}>{inc.status}</span></div>
                        <p className="text-xs text-slate-600">{new Date(inc.started_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
