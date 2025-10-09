import React, { useState } from 'react';
import { X, AlertTriangle, TrendingUp, Shield } from 'lucide-react';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RiskAssessment {
  likelihood: number;
  impact: number;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  color: string;
  recommendations: string[];
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [likelihood, setLikelihood] = useState<number>(3);
  const [impact, setImpact] = useState<number>(3);
  const [riskName, setRiskName] = useState('');

  if (!isOpen) return null;

  const calculateRisk = (): RiskAssessment => {
    const riskScore = likelihood * impact;
    
    let riskLevel: RiskAssessment['riskLevel'];
    let color: string;
    let recommendations: string[];

    if (riskScore >= 20) {
      riskLevel = 'Critical';
      color = 'red';
      recommendations = [
        'Immediate action required',
        'Escalate to executive leadership',
        'Implement emergency mitigation plan',
        'Daily monitoring and reporting',
        'Consider suspending affected operations',
      ];
    } else if (riskScore >= 12) {
      riskLevel = 'High';
      color = 'orange';
      recommendations = [
        'Urgent attention needed',
        'Develop mitigation plan within 7 days',
        'Assign dedicated risk owner',
        'Weekly status updates required',
        'Allocate budget for remediation',
      ];
    } else if (riskScore >= 6) {
      riskLevel = 'Medium';
      color = 'yellow';
      recommendations = [
        'Schedule mitigation within 30 days',
        'Regular monitoring required',
        'Document risk acceptance if no action taken',
        'Review quarterly',
        'Include in risk register',
      ];
    } else {
      riskLevel = 'Low';
      color = 'green';
      recommendations = [
        'Monitor periodically',
        'Document in risk register',
        'Review annually',
        'Standard controls sufficient',
        'No immediate action required',
      ];
    }

    return { likelihood, impact, riskScore, riskLevel, color, recommendations };
  };

  const assessment = calculateRisk();

  const likelihoodLabels = ['Very Rare', 'Rare', 'Possible', 'Likely', 'Almost Certain'];
  const impactLabels = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">HIPAA Risk Calculator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Risk Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Name (Optional)
            </label>
            <input
              type="text"
              value={riskName}
              onChange={(e) => setRiskName(e.target.value)}
              placeholder="e.g., Unencrypted PHI on laptop"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Likelihood Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Likelihood: {likelihood} - {likelihoodLabels[likelihood - 1]}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={likelihood}
              onChange={(e) => setLikelihood(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Very Rare</span>
              <span>Almost Certain</span>
            </div>
          </div>

          {/* Impact Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Impact: {impact} - {impactLabels[impact - 1]}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={impact}
              onChange={(e) => setImpact(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Insignificant</span>
              <span>Catastrophic</span>
            </div>
          </div>

          {/* Risk Matrix Visualization */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Risk Matrix</h3>
            <div className="grid grid-cols-6 gap-1 text-xs">
              {/* Header Row */}
              <div></div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`impact-${i}`} className="text-center font-medium text-gray-600 pb-1">
                  {i}
                </div>
              ))}
              
              {/* Matrix Rows */}
              {[5, 4, 3, 2, 1].map((l) => (
                <React.Fragment key={`likelihood-${l}`}>
                  <div className="flex items-center justify-center font-medium text-gray-600">
                    {l}
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const score = l * i;
                    const isSelected = l === likelihood && i === impact;
                    const cellColor = 
                      score >= 20 ? 'bg-red-500' :
                      score >= 12 ? 'bg-orange-500' :
                      score >= 6 ? 'bg-yellow-500' :
                      'bg-green-500';
                    
                    return (
                      <div
                        key={`cell-${l}-${i}`}
                        className={`h-10 flex items-center justify-center rounded ${cellColor} ${
                          isSelected ? 'ring-4 ring-purple-600' : ''
                        }`}
                      >
                        <span className="text-white font-bold">{score}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
              
              {/* Labels */}
              <div className="col-span-1 text-right pr-2 mt-2 text-gray-600">
                <div className="text-xs font-medium">Likelihood →</div>
              </div>
              <div className="col-span-5 text-center mt-2 text-gray-600">
                <div className="text-xs font-medium">Impact →</div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className={`bg-${assessment.color}-50 border-2 border-${assessment.color}-200 rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className={`w-8 h-8 text-${assessment.color}-600`} />
                <div>
                  <p className="text-sm text-gray-600">Risk Score</p>
                  <p className={`text-3xl font-bold text-${assessment.color}-800`}>
                    {assessment.riskScore}
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 bg-${assessment.color}-200 rounded-lg`}>
                <p className={`text-lg font-bold text-${assessment.color}-900`}>
                  {assessment.riskLevel} Risk
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Recommended Actions:</span>
              </p>
              <ul className="space-y-1 ml-6">
                {assessment.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk Level Guide */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Risk Level Guide</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span><strong>Low (1-5):</strong> Monitor periodically</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span><strong>Medium (6-11):</strong> Schedule mitigation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span><strong>High (12-19):</strong> Urgent action needed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span><strong>Critical (20-25):</strong> Immediate response</span>
              </div>
            </div>
          </div>
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
              // In a real app, this would save to the risks table
              alert(`Risk "${riskName || 'Unnamed Risk'}" calculated with score ${assessment.riskScore} (${assessment.riskLevel})`);
              onClose();
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save to Risk Register
          </button>
        </div>
      </div>
    </div>
  );
};

