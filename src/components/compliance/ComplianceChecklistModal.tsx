import React, { useState } from 'react';
import { X, CheckCircle2, Circle, AlertTriangle, Download } from 'lucide-react';

interface ComplianceChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  description: string;
  regulation: string;
}

export const ComplianceChecklistModal: React.FC<ComplianceChecklistModalProps> = ({ isOpen, onClose }) => {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['privacy-rule']));

  if (!isOpen) return null;

  const checklistItems: ChecklistItem[] = [
    // Privacy Rule
    { id: 'pr-1', category: 'Privacy Rule', item: 'Privacy Officer Designated', description: 'Organization has designated a Privacy Officer responsible for HIPAA compliance', regulation: '§164.530(a)(1)' },
    { id: 'pr-2', category: 'Privacy Rule', item: 'Notice of Privacy Practices', description: 'Written notice provided to individuals about PHI uses and disclosures', regulation: '§164.520' },
    { id: 'pr-3', category: 'Privacy Rule', item: 'Individual Rights Process', description: 'Procedures for access, amendment, accounting, and restriction requests', regulation: '§164.524-528' },
    { id: 'pr-4', category: 'Privacy Rule', item: 'Minimum Necessary Standard', description: 'Policies limit PHI use/disclosure to minimum necessary', regulation: '§164.502(b)' },
    { id: 'pr-5', category: 'Privacy Rule', item: 'Business Associate Agreements', description: 'Written BAAs with all vendors accessing PHI', regulation: '§164.504(e)' },
    
    // Security Rule
    { id: 'sr-1', category: 'Security Rule', item: 'Security Officer Designated', description: 'Organization has designated a Security Officer', regulation: '§164.308(a)(2)' },
    { id: 'sr-2', category: 'Security Rule', item: 'Risk Assessment Completed', description: 'Comprehensive risk analysis documented', regulation: '§164.308(a)(1)(ii)(A)' },
    { id: 'sr-3', category: 'Security Rule', item: 'Access Controls Implemented', description: 'Unique user IDs, emergency access, automatic logoff, encryption', regulation: '§164.312(a)(1)' },
    { id: 'sr-4', category: 'Security Rule', item: 'Audit Controls Active', description: 'Systems record and examine ePHI activity', regulation: '§164.312(b)' },
    { id: 'sr-5', category: 'Security Rule', item: 'Transmission Security', description: 'ePHI encrypted during transmission (TLS 1.2+)', regulation: '§164.312(e)(1)' },
    { id: 'sr-6', category: 'Security Rule', item: 'Workforce Training', description: 'Security awareness training for all workforce members', regulation: '§164.308(a)(5)' },
    
    // Breach Notification
    { id: 'bn-1', category: 'Breach Notification', item: 'Breach Response Plan', description: 'Written incident response and breach notification procedures', regulation: '§164.404' },
    { id: 'bn-2', category: 'Breach Notification', item: 'Breach Log Maintained', description: 'Documentation of all breaches affecting <500 individuals', regulation: '§164.408' },
    { id: 'bn-3', category: 'Breach Notification', item: 'Individual Notification Process', description: 'Procedures for notifying affected individuals within 60 days', regulation: '§164.404(b)' },
    { id: 'bn-4', category: 'Breach Notification', item: 'HHS Reporting Process', description: 'Process for reporting breaches to HHS Secretary', regulation: '§164.408' },
    
    // Policies & Procedures
    { id: 'pp-1', category: 'Policies & Procedures', item: 'Privacy Policies Documented', description: 'Written privacy policies and procedures in place', regulation: '§164.530(i)' },
    { id: 'pp-2', category: 'Policies & Procedures', item: 'Security Policies Documented', description: 'Written security policies and procedures in place', regulation: '§164.316(a)' },
    { id: 'pp-3', category: 'Policies & Procedures', item: 'Sanctions Policy', description: 'Policy for disciplinary action against workforce violations', regulation: '§164.530(e)' },
    { id: 'pp-4', category: 'Policies & Procedures', item: 'Policy Review Schedule', description: 'Policies reviewed and updated at least annually', regulation: '§164.316(b)(2)' },
    
    // Training & Awareness
    { id: 'ta-1', category: 'Training & Awareness', item: 'Initial Training Completed', description: 'All workforce members trained upon hire', regulation: '§164.530(b)' },
    { id: 'ta-2', category: 'Training & Awareness', item: 'Annual Training Program', description: 'Recurring HIPAA training conducted annually', regulation: '§164.530(b)' },
    { id: 'ta-3', category: 'Training & Awareness', item: 'Training Documentation', description: 'Records of all training attendance maintained', regulation: '§164.530(b)(2)' },
    { id: 'ta-4', category: 'Training & Awareness', item: 'Policy Change Training', description: 'Training provided when policies materially change', regulation: '§164.530(b)(1)' },
    
    // Physical Safeguards
    { id: 'ps-1', category: 'Physical Safeguards', item: 'Facility Access Controls', description: 'Physical access to ePHI systems restricted', regulation: '§164.310(a)(1)' },
    { id: 'ps-2', category: 'Physical Safeguards', item: 'Workstation Security', description: 'Policies for physical safeguards for workstations', regulation: '§164.310(c)' },
    { id: 'ps-3', category: 'Physical Safeguards', item: 'Device & Media Controls', description: 'Procedures for disposal and reuse of devices/media', regulation: '§164.310(d)(1)' },
    
    // Administrative
    { id: 'ad-1', category: 'Administrative', item: 'Contingency Plan', description: 'Disaster recovery and emergency mode operation plan', regulation: '§164.308(a)(7)' },
    { id: 'ad-2', category: 'Administrative', item: 'Evaluation Process', description: 'Periodic technical and non-technical evaluation', regulation: '§164.308(a)(8)' },
    { id: 'ad-3', category: 'Administrative', item: 'Mitigation Procedures', description: 'Process to mitigate harmful effects of violations', regulation: '§164.530(f)' },
  ];

  const categories = Array.from(new Set(checklistItems.map(item => item.category)));

  const toggleItem = (id: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getCategoryStats = (category: string) => {
    const items = checklistItems.filter(item => item.category === category);
    const completed = items.filter(item => completedItems.has(item.id)).length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const overallStats = {
    completed: completedItems.size,
    total: checklistItems.length,
    percentage: Math.round((completedItems.size / checklistItems.length) * 100),
  };

  const getComplianceLevel = () => {
    if (overallStats.percentage >= 90) return { label: 'Excellent', color: 'green' };
    if (overallStats.percentage >= 75) return { label: 'Good', color: 'blue' };
    if (overallStats.percentage >= 60) return { label: 'Fair', color: 'yellow' };
    if (overallStats.percentage >= 40) return { label: 'Poor', color: 'orange' };
    return { label: 'Critical', color: 'red' };
  };

  const complianceLevel = getComplianceLevel();

  const exportChecklist = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    let csvContent = 'Category,Item,Description,Regulation,Status\n';
    
    checklistItems.forEach(item => {
      const status = completedItems.has(item.id) ? 'Completed' : 'Incomplete';
      csvContent += `"${item.category}","${item.item}","${item.description}","${item.regulation}","${status}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hipaa-compliance-checklist-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">HIPAA Compliance Checklist</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Overall Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Compliance</span>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-bold text-${complianceLevel.color}-800`}>
                  {complianceLevel.label}
                </span>
                <span className="text-sm text-gray-600">
                  {overallStats.completed} / {overallStats.total} ({overallStats.percentage}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`bg-${complianceLevel.color}-600 h-3 rounded-full transition-all duration-300`}
                style={{ width: `${overallStats.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {categories.map((category) => {
              const stats = getCategoryStats(category);
              const isExpanded = expandedCategories.has(category);
              const categoryItems = checklistItems.filter(item => item.category === category);

              return (
                <div key={category} className="border-2 border-gray-200 rounded-lg">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        stats.percentage === 100 ? 'bg-green-100 text-green-800' :
                        stats.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stats.percentage === 100 ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{category}</p>
                        <p className="text-sm text-gray-600">
                          {stats.completed} / {stats.total} items ({stats.percentage}%)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            stats.percentage === 100 ? 'bg-green-600' :
                            stats.percentage >= 50 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                      <span className="text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {categoryItems.map((item) => {
                        const isCompleted = completedItems.has(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              isCompleted 
                                ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => toggleItem(item.id)}
                              className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <p className={`font-medium ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                                  {item.item}
                                </p>
                                <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                                  {item.regulation}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {item.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>Use this checklist for periodic self-assessments and audit preparation.</p>
            <p className="text-xs mt-1">Note: Checklist state is not saved. Export for records.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportChecklist}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

