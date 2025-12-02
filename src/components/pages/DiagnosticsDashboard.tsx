import { useState, useEffect } from 'react';
import { WhiteScreenDiagnostics, DiagnosticResult } from '../../lib/whiteScreenDiagnostics';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Trash2, LogOut } from 'lucide-react';

export default function DiagnosticsDashboard() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const diagnosticResults = await WhiteScreenDiagnostics.runFullDiagnostics();
      setResults(diagnosticResults);
      setLastRun(new Date());
      WhiteScreenDiagnostics.printDiagnosticReport(diagnosticResults);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    const styles = {
      pass: 'bg-green-100 text-green-800 border-green-200',
      fail: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return styles[status];
  };

  const totalChecks = results.reduce((sum, r) => sum + r.checks.length, 0);
  const passedChecks = results.flatMap(r => r.checks).filter(c => c.status === 'pass').length;
  const failedChecks = results.flatMap(r => r.checks).filter(c => c.status === 'fail').length;
  const warningChecks = results.flatMap(r => r.checks).filter(c => c.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                System Diagnostics
              </h1>
              <p className="text-slate-600">
                Comprehensive health check for the MPB Health Dashboard
              </p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Running...' : 'Run Diagnostics'}</span>
            </button>
          </div>

          {lastRun && (
            <p className="text-sm text-slate-500">
              Last run: {lastRun.toLocaleString()}
            </p>
          )}
        </div>

        {totalChecks > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="text-sm font-medium text-slate-600 mb-1">Total Checks</div>
              <div className="text-3xl font-bold text-slate-900">{totalChecks}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
              <div className="text-sm font-medium text-green-600 mb-1">Passed</div>
              <div className="text-3xl font-bold text-green-700">{passedChecks}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-6">
              <div className="text-sm font-medium text-yellow-600 mb-1">Warnings</div>
              <div className="text-3xl font-bold text-yellow-700">{warningChecks}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <div className="text-sm font-medium text-red-600 mb-1">Failed</div>
              <div className="text-3xl font-bold text-red-700">{failedChecks}</div>
            </div>
          </div>
        )}

        {failedChecks > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Critical Issues Detected</h3>
                <p className="text-sm text-red-700 mb-3">
                  {failedChecks} check(s) failed. These issues may be preventing the application from loading correctly.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => WhiteScreenDiagnostics.clearAllCaches()}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Caches</span>
                  </button>
                  <button
                    onClick={() => WhiteScreenDiagnostics.clearAuthCache()}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Clear Auth Cache</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {results.map((result, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  {result.category}
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {result.checks.map((check, checkIdx) => (
                  <div key={checkIdx} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getStatusIcon(check.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-slate-900">{check.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(check.status)}`}>
                              {check.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{check.message}</p>
                          {check.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                                Show details
                              </summary>
                              <pre className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-700 overflow-auto">
                                {check.details}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Running diagnostics...</p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Diagnostic Tools Available</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>Open your browser console (F12) to access these commands:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li><code className="bg-blue-100 px-2 py-1 rounded">diagnoseWhiteScreen()</code> - Run full diagnostics</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">clearAllCaches()</code> - Clear all caches and reload</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">clearAuthCache()</code> - Clear authentication cache only</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
