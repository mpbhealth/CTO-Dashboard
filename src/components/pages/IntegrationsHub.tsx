import { useState, useEffect } from 'react';
import { Settings, Database, Webhook, Server, BarChart3, Activity, Zap, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface IntegrationSecret {
  id: string;
  service: string;
  key_name: string;
  key_value: string;
  is_active: boolean;
  created_at: string;
}

interface WebhookConfig {
  id: string;
  event: string;
  target_url: string;
  secret_token: string;
  headers: Record<string, string>;
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
}

interface SFTPConfig {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  password: string;
  folder_path: string;
  direction: 'import' | 'export';
  schedule: string;
  is_active: boolean;
  last_sync: string | null;
}

interface MarketingIntegration {
  id: string;
  google_analytics_key: string | null;
  google_analytics_view_id: string | null;
  facebook_pixel_id: string | null;
  gtm_container_id: string | null;
  woocommerce_key: string | null;
  woocommerce_secret: string | null;
  is_active: boolean;
}

interface MondayConfig {
  id: string;
  client_id: string;
  client_secret: string;
  signing_secret: string;
  app_id: string;
  access_token: string | null;
  refresh_token: string | null;
  workspace_id: string | null;
  is_active: boolean;
  last_sync: string | null;
}

interface SyncLog {
  id: string;
  service: string;
  operation: string;
  status: 'success' | 'failed' | 'in_progress';
  message: string | null;
  details: Record<string, unknown>;
  duration_ms: number | null;
  records_processed: number;
  timestamp: string;
}

export default function IntegrationsHub() {
  const [activeTab, setActiveTab] = useState('credentials');
  const [secrets, setSecrets] = useState<IntegrationSecret[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [sftpConfigs, setSftpConfigs] = useState<SFTPConfig[]>([]);
  const [marketingIntegrations, setMarketingIntegrations] = useState<MarketingIntegration[]>([]);
  const [mondayConfig, setMondayConfig] = useState<MondayConfig | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingSecret, setIsAddingSecret] = useState(false);
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [isAddingSFTP, setIsAddingSFTP] = useState(false);
  const [isAddingMonday, setIsAddingMonday] = useState(false);
  const [editingSecretId, setEditingSecretId] = useState<string | null>(null);
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [editingSFTPId, setEditingSFTPId] = useState<string | null>(null);

  // Form states
  const [secretForm, setSecretForm] = useState({
    service: '',
    key_name: '',
    key_value: ''
  });

  const [webhookForm, setWebhookForm] = useState({
    event: '',
    target_url: '',
    secret_token: '',
    headers: '{}',
    retry_count: 3,
    timeout_seconds: 30
  });

  const [sftpForm, setSftpForm] = useState({
    name: '',
    hostname: '',
    port: 22,
    username: '',
    password: '',
    folder_path: '/',
    direction: 'import' as 'import' | 'export',
    schedule: '0 0 * * *'
  });

  const [mondayForm, setMondayForm] = useState({
    client_id: '',
    client_secret: '',
    signing_secret: '',
    app_id: ''
  });

  const [marketingForm, setMarketingForm] = useState({
    google_analytics_key: '',
    google_analytics_view_id: '',
    facebook_pixel_id: '',
    gtm_container_id: '',
    woocommerce_key: '',
    woocommerce_secret: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secretsRes, webhooksRes, sftpRes, marketingRes, mondayRes, logsRes] = await Promise.all([
        supabase.from('integrations_secrets').select('*').order('created_at', { ascending: false }),
        supabase.from('webhooks_config').select('*').order('created_at', { ascending: false }),
        supabase.from('sftp_configs').select('*').order('created_at', { ascending: false }),
        supabase.from('marketing_integrations').select('*').order('created_at', { ascending: false }),
        supabase.from('monday_config').select('*').order('created_at', { ascending: false }).limit(1),
        supabase.from('sync_logs').select('*').order('timestamp', { ascending: false }).limit(50)
      ]);

      if (secretsRes.data) setSecrets(secretsRes.data);
      if (webhooksRes.data) setWebhooks(webhooksRes.data);
      if (sftpRes.data) setSftpConfigs(sftpRes.data);
      if (marketingRes.data) setMarketingIntegrations(marketingRes.data);
      if (mondayRes.data && mondayRes.data.length > 0) setMondayConfig(mondayRes.data[0]);
      if (logsRes.data) setSyncLogs(logsRes.data as SyncLog[]);
    } catch (error) {
      console.error('Error fetching integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('integrations_secrets')
        .insert([secretForm])
        .select()
        .single();

      if (error) throw error;

      setSecrets([data, ...secrets]);
      setSecretForm({ service: '', key_name: '', key_value: '' });
      setIsAddingSecret(false);
    } catch (error) {
      console.error('Error adding secret:', error);
    }
  };

  const handleUpdateSecret = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('integrations_secrets')
        .update(secretForm)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSecrets(secrets.map(s => s.id === id ? data : s));
      setSecretForm({ service: '', key_name: '', key_value: '' });
      setEditingSecretId(null);
    } catch (error) {
      console.error('Error updating secret:', error);
    }
  };

  const handleDeleteSecret = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    
    try {
      const { error } = await supabase
        .from('integrations_secrets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSecrets(secrets.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting secret:', error);
    }
  };

  const startEditingSecret = (secret: IntegrationSecret) => {
    setSecretForm({
      service: secret.service,
      key_name: secret.key_name,
      key_value: secret.key_value
    });
    setEditingSecretId(secret.id);
  };

  const toggleSecretActive = async (id: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('integrations_secrets')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSecrets(secrets.map(s => s.id === id ? data : s));
    } catch (error) {
      console.error('Error toggling secret status:', error);
    }
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const webhookData = {
        ...webhookForm,
        headers: JSON.parse(webhookForm.headers)
      };

      const { data, error } = await supabase
        .from('webhooks_config')
        .insert([webhookData])
        .select()
        .single();

      if (error) throw error;

      setWebhooks([data, ...webhooks]);
      setWebhookForm({
        event: '',
        target_url: '',
        secret_token: '',
        headers: '{}',
        retry_count: 3,
        timeout_seconds: 30
      });
      setIsAddingWebhook(false);
    } catch (error) {
      console.error('Error adding webhook:', error);
    }
  };

  const handleUpdateWebhook = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const webhookData = {
        ...webhookForm,
        headers: JSON.parse(webhookForm.headers)
      };

      const { data, error } = await supabase
        .from('webhooks_config')
        .update(webhookData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setWebhooks(webhooks.map(w => w.id === id ? data : w));
      setWebhookForm({
        event: '',
        target_url: '',
        secret_token: '',
        headers: '{}',
        retry_count: 3,
        timeout_seconds: 30
      });
      setEditingWebhookId(null);
    } catch (error) {
      console.error('Error updating webhook:', error);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
      const { error } = await supabase
        .from('webhooks_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWebhooks(webhooks.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  const startEditingWebhook = (webhook: WebhookConfig) => {
    setWebhookForm({
      event: webhook.event,
      target_url: webhook.target_url,
      secret_token: webhook.secret_token,
      headers: JSON.stringify(webhook.headers),
      retry_count: webhook.retry_count,
      timeout_seconds: webhook.timeout_seconds
    });
    setEditingWebhookId(webhook.id);
  };

  const toggleWebhookActive = async (id: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('webhooks_config')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setWebhooks(webhooks.map(w => w.id === id ? data : w));
    } catch (error) {
      console.error('Error toggling webhook status:', error);
    }
  };

  const handleAddSFTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('sftp_configs')
        .insert([sftpForm])
        .select()
        .single();

      if (error) throw error;

      setSftpConfigs([data, ...sftpConfigs]);
      setSftpForm({
        name: '',
        hostname: '',
        port: 22,
        username: '',
        password: '',
        folder_path: '/',
        direction: 'import',
        schedule: '0 0 * * *'
      });
      setIsAddingSFTP(false);
    } catch (error) {
      console.error('Error adding SFTP config:', error);
    }
  };

  const handleUpdateSFTP = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('sftp_configs')
        .update(sftpForm)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSftpConfigs(sftpConfigs.map(s => s.id === id ? data : s));
      setSftpForm({
        name: '',
        hostname: '',
        port: 22,
        username: '',
        password: '',
        folder_path: '/',
        direction: 'import',
        schedule: '0 0 * * *'
      });
      setEditingSFTPId(null);
    } catch (error) {
      console.error('Error updating SFTP config:', error);
    }
  };

  const handleDeleteSFTP = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SFTP configuration?')) return;
    
    try {
      const { error } = await supabase
        .from('sftp_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSftpConfigs(sftpConfigs.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting SFTP config:', error);
    }
  };

  const startEditingSFTP = (config: SFTPConfig) => {
    setSftpForm({
      name: config.name,
      hostname: config.hostname,
      port: config.port,
      username: config.username,
      password: config.password,
      folder_path: config.folder_path,
      direction: config.direction,
      schedule: config.schedule
    });
    setEditingSFTPId(config.id);
  };

  const toggleSFTPActive = async (id: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('sftp_configs')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSftpConfigs(sftpConfigs.map(s => s.id === id ? data : s));
    } catch (error) {
      console.error('Error toggling SFTP status:', error);
    }
  };

  const handleAddMondayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('monday_config')
        .insert([mondayForm])
        .select()
        .single();

      if (error) throw error;

      setMondayConfig(data);
      setMondayForm({
        client_id: '',
        client_secret: '',
        signing_secret: '',
        app_id: ''
      });
      setIsAddingMonday(false);
    } catch (error) {
      console.error('Error adding Monday config:', error);
    }
  };

  const handleSaveMarketing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (marketingIntegrations.length > 0) {
        const { error } = await supabase
          .from('marketing_integrations')
          .update(marketingForm)
          .eq('id', marketingIntegrations[0].id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('marketing_integrations')
          .insert([marketingForm])
          .select()
          .single();

        if (error) throw error;
        setMarketingIntegrations([data]);
      }

      fetchData();
    } catch (error) {
      console.error('Error saving marketing integration:', error);
    }
  };

  const tabs = [
    { id: 'credentials', label: 'API Credentials', icon: Settings },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'sftp', label: 'SFTP/FTP', icon: Server },
    { id: 'monday', label: 'Monday.com', icon: Zap },
    { id: 'marketing', label: 'Marketing', icon: BarChart3 },
    { id: 'logs', label: 'Sync Logs', icon: Activity }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Integrations Hub</h1>
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">Manage all integrations</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {/* API Credentials Tab */}
        {activeTab === 'credentials' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">API Credentials</h2>
              <button
                onClick={() => setIsAddingSecret(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add Credential
              </button>
            </div>

            {isAddingSecret && (
              <form onSubmit={handleAddSecret} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                    <input
                      type="text"
                      value={secretForm.service}
                      onChange={(e) => setSecretForm({ ...secretForm, service: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                    <input
                      type="text"
                      value={secretForm.key_name}
                      onChange={(e) => setSecretForm({ ...secretForm, key_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Value</label>
                    <input
                      type="password"
                      value={secretForm.key_value}
                      onChange={(e) => setSecretForm({ ...secretForm, key_value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingSecret(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {secrets.map((secret) => (
                <div key={secret.id}>
                  {editingSecretId === secret.id ? (
                    <form onSubmit={(e) => handleUpdateSecret(secret.id, e)} className="p-4 border border-indigo-300 rounded-lg bg-indigo-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                          <input
                            type="text"
                            value={secretForm.service}
                            onChange={(e) => setSecretForm({ ...secretForm, service: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                          <input
                            type="text"
                            value={secretForm.key_name}
                            onChange={(e) => setSecretForm({ ...secretForm, key_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Key Value</label>
                          <input
                            type="password"
                            value={secretForm.key_value}
                            onChange={(e) => setSecretForm({ ...secretForm, key_value: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSecretId(null);
                            setSecretForm({ service: '', key_name: '', key_value: '' });
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                          Update
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{secret.service}</h3>
                        <p className="text-sm text-gray-500">{secret.key_name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleSecretActive(secret.id, secret.is_active)}
                          className={`px-2 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                            secret.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title={secret.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {secret.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => startEditingSecret(secret)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit credential"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSecret(secret.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete credential"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Webhook Configuration</h2>
              <button
                onClick={() => setIsAddingWebhook(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add Webhook
              </button>
            </div>

            {isAddingWebhook && (
              <form onSubmit={handleAddWebhook} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                    <input
                      type="text"
                      value={webhookForm.event}
                      onChange={(e) => setWebhookForm({ ...webhookForm, event: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                    <input
                      type="url"
                      value={webhookForm.target_url}
                      onChange={(e) => setWebhookForm({ ...webhookForm, target_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secret Token</label>
                    <input
                      type="password"
                      value={webhookForm.secret_token}
                      onChange={(e) => setWebhookForm({ ...webhookForm, secret_token: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Headers (JSON)</label>
                    <input
                      type="text"
                      value={webhookForm.headers}
                      onChange={(e) => setWebhookForm({ ...webhookForm, headers: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="{}"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingWebhook(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id}>
                  {editingWebhookId === webhook.id ? (
                    <form onSubmit={(e) => handleUpdateWebhook(webhook.id, e)} className="p-4 border border-indigo-300 rounded-lg bg-indigo-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                          <input
                            type="text"
                            value={webhookForm.event}
                            onChange={(e) => setWebhookForm({ ...webhookForm, event: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                          <input
                            type="url"
                            value={webhookForm.target_url}
                            onChange={(e) => setWebhookForm({ ...webhookForm, target_url: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Secret Token</label>
                          <input
                            type="password"
                            value={webhookForm.secret_token}
                            onChange={(e) => setWebhookForm({ ...webhookForm, secret_token: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Headers (JSON)</label>
                          <input
                            type="text"
                            value={webhookForm.headers}
                            onChange={(e) => setWebhookForm({ ...webhookForm, headers: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="{}"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWebhookId(null);
                            setWebhookForm({
                              event: '',
                              target_url: '',
                              secret_token: '',
                              headers: '{}',
                              retry_count: 3,
                              timeout_seconds: 30
                            });
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                          Update
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{webhook.event}</h3>
                        <p className="text-sm text-gray-500">{webhook.target_url}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleWebhookActive(webhook.id, webhook.is_active)}
                          className={`px-2 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                            webhook.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title={webhook.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => startEditingWebhook(webhook)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit webhook"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete webhook"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SFTP Tab */}
        {activeTab === 'sftp' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">SFTP/FTP Configuration</h2>
              <button
                onClick={() => setIsAddingSFTP(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add SFTP Config
              </button>
            </div>

            {isAddingSFTP && (
              <form onSubmit={handleAddSFTP} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={sftpForm.name}
                      onChange={(e) => setSftpForm({ ...sftpForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
                    <input
                      type="text"
                      value={sftpForm.hostname}
                      onChange={(e) => setSftpForm({ ...sftpForm, hostname: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={sftpForm.username}
                      onChange={(e) => setSftpForm({ ...sftpForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={sftpForm.password}
                      onChange={(e) => setSftpForm({ ...sftpForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                    <select
                      value={sftpForm.direction}
                      onChange={(e) => setSftpForm({ ...sftpForm, direction: e.target.value as 'import' | 'export' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="import">Import</option>
                      <option value="export">Export</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Cron)</label>
                    <input
                      type="text"
                      value={sftpForm.schedule}
                      onChange={(e) => setSftpForm({ ...sftpForm, schedule: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0 0 * * *"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingSFTP(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {sftpConfigs.map((config) => (
                <div key={config.id}>
                  {editingSFTPId === config.id ? (
                    <form onSubmit={(e) => handleUpdateSFTP(config.id, e)} className="p-4 border border-indigo-300 rounded-lg bg-indigo-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={sftpForm.name}
                            onChange={(e) => setSftpForm({ ...sftpForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
                          <input
                            type="text"
                            value={sftpForm.hostname}
                            onChange={(e) => setSftpForm({ ...sftpForm, hostname: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                          <input
                            type="text"
                            value={sftpForm.username}
                            onChange={(e) => setSftpForm({ ...sftpForm, username: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                          <input
                            type="password"
                            value={sftpForm.password}
                            onChange={(e) => setSftpForm({ ...sftpForm, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                          <select
                            value={sftpForm.direction}
                            onChange={(e) => setSftpForm({ ...sftpForm, direction: e.target.value as 'import' | 'export' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="import">Import</option>
                            <option value="export">Export</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Cron)</label>
                          <input
                            type="text"
                            value={sftpForm.schedule}
                            onChange={(e) => setSftpForm({ ...sftpForm, schedule: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0 0 * * *"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSFTPId(null);
                            setSftpForm({
                              name: '',
                              hostname: '',
                              port: 22,
                              username: '',
                              password: '',
                              folder_path: '/',
                              direction: 'import',
                              schedule: '0 0 * * *'
                            });
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                          Update
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{config.name}</h3>
                        <p className="text-sm text-gray-500">{config.hostname}:{config.port} ({config.direction})</p>
                        <p className="text-xs text-gray-400">Schedule: {config.schedule}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleSFTPActive(config.id, config.is_active)}
                          className={`px-2 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                            config.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title={config.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {config.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => startEditingSFTP(config)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit SFTP config"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSFTP(config.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete SFTP config"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monday.com Tab */}
        {activeTab === 'monday' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Monday.com Integration</h2>
              {!mondayConfig && (
                <button
                  onClick={() => setIsAddingMonday(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Configure Monday.com
                </button>
              )}
            </div>

            {isAddingMonday && (
              <form onSubmit={handleAddMondayConfig} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                    <input
                      type="text"
                      value={mondayForm.client_id}
                      onChange={(e) => setMondayForm({ ...mondayForm, client_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={mondayForm.client_secret}
                      onChange={(e) => setMondayForm({ ...mondayForm, client_secret: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Signing Secret</label>
                    <input
                      type="password"
                      value={mondayForm.signing_secret}
                      onChange={(e) => setMondayForm({ ...mondayForm, signing_secret: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
                    <input
                      type="text"
                      value={mondayForm.app_id}
                      onChange={(e) => setMondayForm({ ...mondayForm, app_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingMonday(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            )}

            {mondayConfig && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Monday.com Configuration</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    mondayConfig.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {mondayConfig.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">App ID:</span>
                    <span className="ml-2 font-mono">{mondayConfig.app_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Workspace ID:</span>
                    <span className="ml-2 font-mono">{mondayConfig.workspace_id || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Sync:</span>
                    <span className="ml-2">{mondayConfig.last_sync ? new Date(mondayConfig.last_sync).toLocaleString() : 'Never'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2">{mondayConfig.access_token ? 'Authenticated' : 'Not authenticated'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marketing Tab */}
        {activeTab === 'marketing' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Marketing Integrations</h2>
            
            <form onSubmit={handleSaveMarketing} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics Key</label>
                  <input
                    type="text"
                    value={marketingForm.google_analytics_key}
                    onChange={(e) => setMarketingForm({ ...marketingForm, google_analytics_key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GA View ID</label>
                  <input
                    type="text"
                    value={marketingForm.google_analytics_view_id}
                    onChange={(e) => setMarketingForm({ ...marketingForm, google_analytics_view_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={marketingForm.facebook_pixel_id}
                    onChange={(e) => setMarketingForm({ ...marketingForm, facebook_pixel_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GTM Container ID</label>
                  <input
                    type="text"
                    value={marketingForm.gtm_container_id}
                    onChange={(e) => setMarketingForm({ ...marketingForm, gtm_container_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WooCommerce Key</label>
                  <input
                    type="text"
                    value={marketingForm.woocommerce_key}
                    onChange={(e) => setMarketingForm({ ...marketingForm, woocommerce_key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WooCommerce Secret</label>
                  <input
                    type="password"
                    value={marketingForm.woocommerce_secret}
                    onChange={(e) => setMarketingForm({ ...marketingForm, woocommerce_secret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Save Marketing Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sync Logs Tab */}
        {activeTab === 'logs' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Sync Logs</h2>
            
            <div className="space-y-4">
              {syncLogs.map((log) => (
                <div key={log.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{log.service}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">{log.operation}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        log.status === 'success' ? 'bg-green-100 text-green-800' :
                        log.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {log.message && (
                    <p className="text-sm text-gray-600 mb-2">{log.message}</p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Records: {log.records_processed}</span>
                    {log.duration_ms && <span>Duration: {log.duration_ms}ms</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}