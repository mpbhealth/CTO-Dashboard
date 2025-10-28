import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { loadComplianceMetrics } from '@/lib/data/ceo/loaders';

export function CompliancePanel() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['ceo', 'compliance-metrics'],
    queryFn: loadComplianceMetrics,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Pulse</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">Unable to load compliance metrics.</p>
        </div>
      </div>
    );
  }

  const getComplianceColor = (score: number) => {
    if (score >= 95) return 'green';
    if (score >= 85) return 'blue';
    if (score >= 75) return 'yellow';
    return 'red';
  };

  const complianceColor = getComplianceColor(metrics.complianceScore);
  const colorClasses = {
    green: 'from-green-500 to-green-600 text-green-600',
    blue: 'from-blue-500 to-blue-600 text-pink-600',
    yellow: 'from-yellow-500 to-yellow-600 text-yellow-600',
    red: 'from-red-500 to-red-600 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#1a3d97]" />
          Compliance Pulse
        </h3>
        <span className="text-xs text-gray-500">HIPAA Status</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 flex items-center justify-center">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(metrics.complianceScore / 100) * 351.86} 351.86`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={colorClasses[complianceColor].split(' ')[0]} />
                  <stop offset="100%" className={colorClasses[complianceColor].split(' ')[0]} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-3xl font-bold ${colorClasses[complianceColor].split(' ')[1]}`}>
                {metrics.complianceScore}
              </span>
              <span className="text-xs text-gray-500">Score</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-pink-600" />
              <span className="text-sm font-medium text-pink-900">HIPAA Audits</span>
            </div>
            <span className="text-lg font-bold text-pink-900">{metrics.hipaaAuditCount}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Unresolved Findings</span>
            </div>
            <span className="text-lg font-bold text-amber-900">{metrics.unresolvedFindings}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Last Backup</span>
            </div>
            <span className="text-sm font-semibold text-green-900">
              {new Date(metrics.lastBackupVerification).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Next Audit Scheduled</span>
          <span className="text-sm font-semibold text-gray-900">
            {new Date(metrics.nextAuditDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {metrics.unresolvedFindings > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Action Required</p>
              <p className="text-xs text-amber-700 mt-1">
                {metrics.unresolvedFindings} compliance finding{metrics.unresolvedFindings !== 1 ? 's' : ''} need
                immediate attention
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
