import React, { useState } from 'react';
import { Plus, Activity, Calendar, FileText, Download } from 'lucide-react';
import { useAudits } from '../../hooks/useComplianceData';
import { AuditStatusChip } from '../compliance/ComplianceChips';
import type { AuditKind } from '../../types/compliance';

const ComplianceAudits: React.FC = () => {
  const [kindFilter, setKindFilter] = useState<AuditKind | 'all'>('all');
  const { data: audits = [], isLoading } = useAudits();

  const filteredAudits = audits.filter(audit => 
    kindFilter === 'all' || audit.kind === kindFilter
  );

  const auditsByKind = {
    internal: audits.filter(a => a.kind === 'internal').length,
    external: audits.filter(a => a.kind === 'external').length,
    vulnerability: audits.filter(a => a.kind === 'vulnerability').length,
    penetration: audits.filter(a => a.kind === 'penetration').length,
    'risk-assessment': audits.filter(a => a.kind === 'risk-assessment').length,
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
            <Activity className="w-8 h-8 text-teal-600" />
            <span>Audits & Monitoring</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Track internal audits, external assessments, and security testing
          </p>
        </div>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          <span>Schedule Audit</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Audit Types</option>
          <option value="internal">Internal Audits</option>
          <option value="external">External Audits</option>
          <option value="vulnerability">Vulnerability Assessments</option>
          <option value="penetration">Penetration Tests</option>
          <option value="risk-assessment">Risk Assessments</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-4">
          <p className="text-sm text-gray-600">Internal</p>
          <p className="text-2xl font-bold text-blue-800">{auditsByKind.internal}</p>
        </div>
        <div className="bg-purple-50 rounded-lg border-2 border-purple-200 p-4">
          <p className="text-sm text-gray-600">External</p>
          <p className="text-2xl font-bold text-purple-800">{auditsByKind.external}</p>
        </div>
        <div className="bg-orange-50 rounded-lg border-2 border-orange-200 p-4">
          <p className="text-sm text-gray-600">Vulnerability</p>
          <p className="text-2xl font-bold text-orange-800">{auditsByKind.vulnerability}</p>
        </div>
        <div className="bg-red-50 rounded-lg border-2 border-red-200 p-4">
          <p className="text-sm text-gray-600">Pen Test</p>
          <p className="text-2xl font-bold text-red-800">{auditsByKind.penetration}</p>
        </div>
        <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
          <p className="text-sm text-gray-600">Risk Assessment</p>
          <p className="text-2xl font-bold text-green-800">{auditsByKind['risk-assessment']}</p>
        </div>
      </div>

      {/* Audits Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Timeline</h2>
        
        {filteredAudits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No audits found</p>
            <p className="text-sm">Schedule your first audit to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAudits.map((audit) => (
              <div
                key={audit.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{audit.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        audit.kind === 'internal' ? 'bg-blue-100 text-blue-800' :
                        audit.kind === 'external' ? 'bg-purple-100 text-purple-800' :
                        audit.kind === 'vulnerability' ? 'bg-orange-100 text-orange-800' :
                        audit.kind === 'penetration' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {audit.kind}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{audit.description}</p>
                  </div>
                  <AuditStatusChip status={audit.status} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Auditor</p>
                    <p className="font-medium text-gray-900">
                      {audit.auditor_name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Organization</p>
                    <p className="font-medium text-gray-900">
                      {audit.auditor_org || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Period</p>
                    <p className="font-medium text-gray-900">
                      {audit.period_start && audit.period_end
                        ? `${new Date(audit.period_start).toLocaleDateString()} - ${new Date(audit.period_end).toLocaleDateString()}`
                        : 'Not scheduled'
                      }
                    </p>
                  </div>
                  <div>
                    {audit.report_url && (
                      <a
                        href={audit.report_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-teal-600 hover:text-teal-700"
                      >
                        <Download className="w-4 h-4" />
                        <span>Report</span>
                      </a>
                    )}
                  </div>
                </div>

                {audit.findings_summary && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">Findings Summary</p>
                    <p className="text-sm text-gray-700">{audit.findings_summary}</p>
                  </div>
                )}

                {audit.cap_md && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-800 mb-1 font-medium">Corrective Action Plan</p>
                    <p className="text-sm text-gray-700">{audit.cap_md.substring(0, 200)}...</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Schedule Guidance */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg border-2 border-teal-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          <span>Recommended Audit Schedule</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-teal-200">
            <h3 className="font-medium text-gray-900 mb-2">Annual Requirements</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✓ Internal HIPAA compliance audit</li>
              <li>✓ Risk assessment and analysis</li>
              <li>✓ Security policy review</li>
              <li>✓ Training effectiveness review</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-teal-200">
            <h3 className="font-medium text-gray-900 mb-2">Quarterly Tasks</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✓ Vulnerability assessment</li>
              <li>✓ Access control review</li>
              <li>✓ Audit log review</li>
              <li>✓ Incident response drill</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceAudits;

