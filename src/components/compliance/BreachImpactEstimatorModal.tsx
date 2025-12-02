import React, { useState } from 'react';
import { X, AlertCircle, Users, Clock, FileText, Mail } from 'lucide-react';

interface BreachImpactEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationRequirement {
  recipient: string;
  required: boolean;
  deadline: string;
  method: string;
}

export const BreachImpactEstimatorModal: React.FC<BreachImpactEstimatorModalProps> = ({ isOpen, onClose }) => {
  const [individualsAffected, setIndividualsAffected] = useState<number>(0);
  const [breachType, setBreachType] = useState<string>('unauthorized-access');
  const [phiTypes, setPhiTypes] = useState<string[]>([]);
  const [sameState, setSameState] = useState<boolean>(false);
  const [discoveryDate, setDiscoveryDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const togglePHIType = (type: string) => {
    setPhiTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const calculateDeadline = (daysToAdd: number): string => {
    const discovery = new Date(discoveryDate);
    const deadline = new Date(discovery);
    deadline.setDate(deadline.getDate() + daysToAdd);
    return deadline.toLocaleDateString();
  };

  const notifications: NotificationRequirement[] = [
    {
      recipient: 'Affected Individuals',
      required: individualsAffected > 0,
      deadline: calculateDeadline(60),
      method: individualsAffected >= 10 ? 'Written notice (mail or email)' : 'Written or phone'
    },
    {
      recipient: 'HHS Secretary',
      required: individualsAffected >= 500,
      deadline: calculateDeadline(60),
      method: 'HHS Breach Portal (online)'
    },
    {
      recipient: 'HHS Secretary (Annual)',
      required: individualsAffected > 0 && individualsAffected < 500,
      deadline: 'Within 60 days after year-end',
      method: 'Annual report to HHS'
    },
    {
      recipient: 'Media',
      required: individualsAffected >= 500 && sameState,
      deadline: calculateDeadline(60),
      method: 'Prominent media outlet in affected state'
    },
  ];

  const getSeverityLevel = (): { level: string; color: string; description: string } => {
    if (individualsAffected >= 500) {
      return {
        level: 'Major Breach',
        color: 'red',
        description: 'Significant regulatory scrutiny expected. Immediate action required.'
      };
    } else if (individualsAffected >= 100) {
      return {
        level: 'Moderate Breach',
        color: 'orange',
        description: 'Reportable breach. Careful documentation required.'
      };
    } else if (individualsAffected >= 10) {
      return {
        level: 'Minor Breach',
        color: 'yellow',
        description: 'Still reportable. Follow standard notification procedures.'
      };
    } else if (individualsAffected > 0) {
      return {
        level: 'Small Breach',
        color: 'blue',
        description: 'Annual reporting to HHS. Document in breach log.'
      };
    } else {
      return {
        level: 'No Impact',
        color: 'gray',
        description: 'Enter the number of affected individuals to calculate impact.'
      };
    }
  };

  const severity = getSeverityLevel();

  const estimatedCosts = {
    legal: individualsAffected >= 500 ? '$50,000 - $150,000' : individualsAffected >= 100 ? '$20,000 - $50,000' : '$5,000 - $20,000',
    notification: individualsAffected * 5, // $5 per individual for mailing
    creditMonitoring: individualsAffected >= 500 ? individualsAffected * 200 : 0, // $200/person for 2 years
    regulatory: individualsAffected >= 500 ? '$100,000 - $1,500,000' : individualsAffected >= 100 ? '$25,000 - $100,000' : '$0 - $25,000',
  };

  const totalEstimatedCost = 
    estimatedCosts.notification + 
    estimatedCosts.creditMonitoring + 
    50000; // Base legal/regulatory minimum

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Breach Impact Estimator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close breach impact estimator"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Individuals Affected *
              </label>
              <input
                type="number"
                min="0"
                value={individualsAffected || ''}
                onChange={(e) => setIndividualsAffected(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discovery Date
              </label>
              <input
                type="date"
                value={discoveryDate}
                onChange={(e) => setDiscoveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Breach Type
              </label>
              <select
                value={breachType}
                onChange={(e) => setBreachType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="unauthorized-access">Unauthorized Access/Disclosure</option>
                <option value="theft">Theft</option>
                <option value="loss">Loss</option>
                <option value="hacking">Hacking/IT Incident</option>
                <option value="improper-disposal">Improper Disposal</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  checked={sameState}
                  onChange={(e) => setSameState(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span>All affected in same state/jurisdiction?</span>
              </label>
            </div>
          </div>

          {/* PHI Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Types of PHI Involved (Select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                'Names', 'SSN', 'Date of Birth', 'Address', 'Phone Number',
                'Email', 'Medical Record Number', 'Health Plan ID', 'Account Number',
                'Diagnosis', 'Treatment Info', 'Financial Info', 'Biometric Data'
              ].map((type) => (
                <label key={type} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={phiTypes.includes(type)}
                    onChange={() => togglePHIType(type)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Severity Assessment */}
          {individualsAffected > 0 && (
            <div className={`bg-${severity.color}-50 border-2 border-${severity.color}-200 rounded-lg p-4`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600">Breach Classification</p>
                  <p className={`text-2xl font-bold text-${severity.color}-800`}>
                    {severity.level}
                  </p>
                </div>
                <Users className={`w-8 h-8 text-${severity.color}-600`} />
              </div>
              <p className="text-sm text-gray-700">{severity.description}</p>
            </div>
          )}

          {/* Notification Requirements */}
          {individualsAffected > 0 && (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <span>Required Notifications</span>
              </h3>
              <div className="space-y-3">
                {notifications.filter(n => n.required).map((notification, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3 bg-indigo-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{notification.recipient}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Deadline: <strong>{notification.deadline}</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Method: {notification.method}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Estimate */}
          {individualsAffected > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estimated Cost Impact
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Legal/Consulting:</span>
                  <span className="font-medium">{estimatedCosts.legal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Notification Costs:</span>
                  <span className="font-medium">${estimatedCosts.notification.toLocaleString()}</span>
                </div>
                {estimatedCosts.creditMonitoring > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Credit Monitoring (2 years):</span>
                    <span className="font-medium">${estimatedCosts.creditMonitoring.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-700">Potential Regulatory Fines:</span>
                  <span className="font-medium">{estimatedCosts.regulatory}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-yellow-300">
                  <span className="font-semibold text-gray-900">Total Estimated Range:</span>
                  <span className="font-bold text-orange-800">
                    ${totalEstimatedCost.toLocaleString()} - ${(totalEstimatedCost * 3).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                * Estimates are approximate and based on industry averages. Actual costs may vary significantly.
              </p>
            </div>
          )}

          {/* Action Checklist */}
          {individualsAffected > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Immediate Action Checklist
              </h3>
              <div className="space-y-2 text-sm">
                <label className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1 rounded border-gray-300 text-indigo-600" />
                  <span>Contain the breach and prevent further unauthorized access</span>
                </label>
                <label className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1 rounded border-gray-300 text-indigo-600" />
                  <span>Begin investigation and document all findings</span>
                </label>
                <label className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1 rounded border-gray-300 text-indigo-600" />
                  <span>Notify Privacy Officer and executive leadership</span>
                </label>
                <label className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1 rounded border-gray-300 text-indigo-600" />
                  <span>Consult legal counsel and breach coach</span>
                </label>
                <label className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1 rounded border-gray-300 text-indigo-600" />
                  <span>Draft notification letters for affected individuals</span>
                </label>
                <label className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1 rounded border-gray-300 text-indigo-600" />
                  <span>Prepare HHS breach notification submission</span>
                </label>
                {individualsAffected >= 500 && (
                  <label className="flex items-start space-x-2">
                    <input type="checkbox" className="mt-1 rounded border-gray-300 text-indigo-600" />
                    <span>Prepare media notice for prominent outlets</span>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // In a real app, this would create an incident record
              if (individualsAffected > 0) {
                alert(`Breach impact calculated: ${individualsAffected} individuals affected. Recommended: Create incident report immediately.`);
              }
            }}
            disabled={individualsAffected === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300"
          >
            Create Incident Report
          </button>
        </div>
      </div>
    </div>
  );
};

