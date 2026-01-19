import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Key,
  Building2,
  Shield,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface OutlookSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OutlookCredentials {
  tenant_id: string;
  client_id: string;
  client_secret: string;
}

export default function OutlookSetupModal({ isOpen, onClose, onSuccess }: OutlookSetupModalProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState<'intro' | 'credentials' | 'testing' | 'success'>('intro');
  const [credentials, setCredentials] = useState<OutlookCredentials>({
    tenant_id: '',
    client_id: '',
    client_secret: '',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_testResult, setTestResult] = useState<'pending' | 'success' | 'error'>('pending');

  // All executive and admin roles can configure Outlook
  const isAdmin = ['admin', 'cto', 'ceo', 'cfo', 'cmo'].includes(profile?.role || '');

  const handleTestConnection = async () => {
    if (!credentials.tenant_id || !credentials.client_id || !credentials.client_secret) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('testing');
    setTestResult('pending');

    try {
      // First, save the credentials to the database
      const { error: saveError } = await supabase
        .from('outlook_config')
        .upsert({
          tenant_id: credentials.tenant_id,
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id',
        });

      if (saveError) {
        throw new Error(`Failed to save credentials: ${saveError.message}`);
      }

      // Test the connection by fetching events
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-calendar`;
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + 7);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'getEvents',
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.demo) {
        throw new Error('Connection test failed - still returning demo data');
      }

      setTestResult('success');
      setStep('success');
    } catch (err) {
      console.error('Outlook connection test failed:', err);
      setError(err instanceof Error ? err.message : 'Connection test failed');
      setTestResult('error');
      setStep('credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  const _copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-sky-600 to-blue-700 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Connect Outlook Calendar</h2>
                  <p className="text-sky-100 text-sm">Sync your Microsoft 365 calendar</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isAdmin && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium">Admin Access Required</p>
                    <p className="text-amber-700 text-sm mt-1">
                      Only administrators can configure Outlook integration. Please contact your IT administrator.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 'intro' && isAdmin && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-sky-600" />
                    <span>Before You Begin</span>
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    To connect Outlook, you'll need to register an application in Microsoft Azure AD.
                    This requires admin access to your organization's Microsoft 365 tenant.
                  </p>
                  <ol className="space-y-3 text-sm text-slate-700">
                    <li className="flex items-start space-x-2">
                      <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-xs">1</span>
                      <span>Go to <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">Azure Portal → App Registrations</a></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-xs">2</span>
                      <span>Create a new registration with <strong>Calendars.Read</strong> and <strong>Calendars.ReadWrite</strong> permissions</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-xs">3</span>
                      <span>Generate a client secret and note down the credentials</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Required Permissions</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white rounded-lg px-3 py-2 text-blue-800 font-mono text-xs">
                      Calendars.Read
                    </div>
                    <div className="bg-white rounded-lg px-3 py-2 text-blue-800 font-mono text-xs">
                      Calendars.ReadWrite
                    </div>
                  </div>
                </div>

                <a
                  href="https://learn.microsoft.com/en-us/graph/auth-register-app-v2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-sky-600 hover:text-sky-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Microsoft's documentation</span>
                </a>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep('credentials')}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
                  >
                    I Have My Credentials
                  </button>
                </div>
              </div>
            )}

            {step === 'credentials' && isAdmin && (
              <div className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-medium">Connection Failed</p>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Tenant ID (Directory ID)
                  </label>
                  <input
                    type="text"
                    value={credentials.tenant_id}
                    onChange={e => setCredentials(prev => ({ ...prev, tenant_id: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">Found in Azure Portal → Azure Active Directory → Overview</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Key className="w-4 h-4 inline mr-2" />
                    Client ID (Application ID)
                  </label>
                  <input
                    type="text"
                    value={credentials.client_id}
                    onChange={e => setCredentials(prev => ({ ...prev, client_id: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">Found in Azure Portal → App Registrations → Your App → Overview</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Client Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={credentials.client_secret}
                      onChange={e => setCredentials(prev => ({ ...prev, client_secret: e.target.value }))}
                      placeholder="Your client secret value"
                      className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Found in Azure Portal → App Registrations → Your App → Certificates & Secrets</p>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <button
                    onClick={() => setStep('intro')}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleTestConnection}
                    disabled={isLoading || !credentials.tenant_id || !credentials.client_id || !credentials.client_secret}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <span>Test & Save Connection</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 'testing' && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-sky-100 rounded-full animate-ping opacity-25" />
                  <div className="relative w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Testing Connection</h3>
                <p className="text-slate-600">Connecting to Microsoft Graph API...</p>
              </div>
            )}

            {step === 'success' && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Connection Successful!</h3>
                <p className="text-slate-600 mb-6">
                  Your Outlook calendar is now connected. Events will sync automatically.
                </p>
                <button
                  onClick={handleComplete}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Start Using Calendar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

