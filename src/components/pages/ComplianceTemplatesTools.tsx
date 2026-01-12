import React, { useState } from 'react';
import { FileText, Download, Upload, Wrench, Copy, CheckCircle2 } from 'lucide-react';
import { EvidenceUploader } from '../compliance/EvidenceUploader';
import { RiskCalculatorModal } from '../compliance/RiskCalculatorModal';
import { BreachImpactEstimatorModal } from '../compliance/BreachImpactEstimatorModal';
import { ComplianceChecklistModal } from '../compliance/ComplianceChecklistModal';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'Policy' | 'Form' | 'Letter' | 'Checklist' | 'Report';
  icon: any;
}

const ComplianceTemplatesTools: React.FC = () => {
  const [showUploader, setShowUploader] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRiskCalculator, setShowRiskCalculator] = useState(false);
  const [showBreachEstimator, setShowBreachEstimator] = useState(false);
  const [showComplianceChecklist, setShowComplianceChecklist] = useState(false);

  const templates: Template[] = [
    {
      id: '1',
      name: 'Privacy Officer Designation Letter',
      description: 'Formal designation of HIPAA Privacy Officer',
      category: 'Letter',
      icon: FileText,
    },
    {
      id: '2',
      name: 'Security Officer Designation Letter',
      description: 'Formal designation of HIPAA Security Officer',
      category: 'Letter',
      icon: FileText,
    },
    {
      id: '3',
      name: 'Notice of Privacy Practices',
      description: 'Template for patient-facing privacy notice',
      category: 'Policy',
      icon: FileText,
    },
    {
      id: '4',
      name: 'Business Associate Agreement',
      description: 'Standard BAA template for vendors',
      category: 'Policy',
      icon: FileText,
    },
    {
      id: '5',
      name: 'Breach Notification Letter - Individual',
      description: 'Template for notifying affected individuals',
      category: 'Letter',
      icon: FileText,
    },
    {
      id: '6',
      name: 'Breach Notification - HHS',
      description: 'Template for HHS breach reporting',
      category: 'Form',
      icon: FileText,
    },
    {
      id: '7',
      name: 'Security Incident Report Form',
      description: 'Form for reporting security incidents',
      category: 'Form',
      icon: FileText,
    },
    {
      id: '8',
      name: 'Risk Assessment Worksheet',
      description: 'Structured template for risk analysis',
      category: 'Form',
      icon: FileText,
    },
    {
      id: '9',
      name: 'Training Sign-In Sheet',
      description: 'Attendance tracking for in-person training',
      category: 'Form',
      icon: FileText,
    },
    {
      id: '10',
      name: 'Access Control Audit Checklist',
      description: 'Quarterly access review checklist',
      category: 'Checklist',
      icon: CheckCircle2,
    },
    {
      id: '11',
      name: 'Annual HIPAA Self-Audit Tool',
      description: 'Comprehensive compliance assessment',
      category: 'Checklist',
      icon: CheckCircle2,
    },
    {
      id: '12',
      name: 'Incident Response Plan',
      description: 'Step-by-step incident response procedures',
      category: 'Policy',
      icon: FileText,
    },
  ];

  const handleCopyTemplate = (templateId: string) => {
    // In a real app, this would clone the template to the user's documents
    setCopiedId(templateId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Policy':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Form':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Letter':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Checklist':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Report':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Wrench className="w-8 h-8 text-orange-600" />
            <span>Templates & Tools</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Document templates, forms, and compliance tools
          </p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Evidence</span>
        </button>
      </div>

      {/* Evidence Uploader */}
      {showUploader && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Evidence</h2>
          <EvidenceUploader
            category="templates-tools"
            onUploadComplete={(evidence) => {
              alert(`Evidence uploaded successfully: ${evidence.title}`);
              setShowUploader(false);
            }}
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['Policy', 'Form', 'Letter', 'Checklist', 'Report'].map((category) => {
          const count = templates.filter(t => t.category === category).length;
          return (
            <div key={category} className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <p className="text-sm text-gray-600">{category}s</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Templates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCopyTemplate(template.id)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                  >
                    {copiedId === template.id ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Use Template</span>
                      </>
                    )}
                  </button>
                  <button
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compliance Tools */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Wrench className="w-5 h-5 text-orange-600" />
          <span>Compliance Tools</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h3 className="font-medium text-gray-900 mb-2">Risk Calculator</h3>
            <p className="text-sm text-gray-600 mb-3">
              Calculate risk scores based on likelihood and impact
            </p>
            <button 
              onClick={() => setShowRiskCalculator(true)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Launch Tool →
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h3 className="font-medium text-gray-900 mb-2">Breach Impact Estimator</h3>
            <p className="text-sm text-gray-600 mb-3">
              Estimate potential impact and notification requirements
            </p>
            <button 
              onClick={() => setShowBreachEstimator(true)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Launch Tool →
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h3 className="font-medium text-gray-900 mb-2">Compliance Checklist</h3>
            <p className="text-sm text-gray-600 mb-3">
              Interactive checklist for HIPAA compliance verification
            </p>
            <button 
              onClick={() => setShowComplianceChecklist(true)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Launch Tool →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Reference Guide */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Reference</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Breach Notification Timelines</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Individual notice: Within 60 days of discovery</li>
              <li>• HHS reporting (500+): Within 60 days</li>
              <li>• HHS reporting (&lt;500): Annual report</li>
              <li>• Media notice: For breaches affecting 500+ in same state/jurisdiction</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Key HIPAA Contacts</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• HHS OCR Portal: https://ocrportal.hhs.gov</li>
              <li>• OCR Hotline: 1-800-368-1019</li>
              <li>• HIPAA Resources: hhs.gov/hipaa</li>
              <li>• Breach Reporting: HHSBreachPortal</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tool Modals */}
      <RiskCalculatorModal 
        isOpen={showRiskCalculator} 
        onClose={() => setShowRiskCalculator(false)} 
      />
      
      <BreachImpactEstimatorModal 
        isOpen={showBreachEstimator} 
        onClose={() => setShowBreachEstimator(false)} 
      />
      
      <ComplianceChecklistModal 
        isOpen={showComplianceChecklist} 
        onClose={() => setShowComplianceChecklist(false)} 
      />
    </div>
  );
};

export default ComplianceTemplatesTools;

