import { useState } from 'react';
import { FileText, Download, Plus, Calendar, Users, X } from 'lucide-react';
import { CEODashboardLayout } from '../../layouts/CEODashboardLayout';

interface BoardPacket {
  id: string;
  title: string;
  date: string;
  status: string;
  sections: string[];
  lastModified: string;
}

export function CEOBoardPacket() {
  const [showNewPacketModal, setShowNewPacketModal] = useState(false);
  const [newPacketTitle, setNewPacketTitle] = useState('');
  const [newPacketDate, setNewPacketDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [packets, setPackets] = useState<BoardPacket[]>([
    {
      id: '1',
      title: 'Q4 2025 Board Meeting',
      date: '2025-12-15',
      status: 'Draft',
      sections: ['Financial Summary', 'Key Metrics', 'Strategic Initiatives', 'Risk Analysis'],
      lastModified: '2025-10-24',
    },
    {
      id: '2',
      title: 'Q3 2025 Board Meeting',
      date: '2025-09-20',
      status: 'Published',
      sections: ['Financial Summary', 'Operations Update', 'Growth Metrics'],
      lastModified: '2025-09-15',
    },
    {
      id: '3',
      title: 'Special Board Meeting - Strategic Review',
      date: '2025-08-10',
      status: 'Published',
      sections: ['Market Analysis', '5-Year Plan', 'Investment Opportunities'],
      lastModified: '2025-08-05',
    },
  ]);

  const [templates] = useState([
    {
      name: 'Quarterly Board Meeting',
      sections: ['Executive Summary', 'Financial Summary', 'Key Metrics', 'Strategic Initiatives', 'Risk Analysis', 'Q&A', 'Action Items', 'Next Steps'],
      icon: Calendar
    },
    {
      name: 'Special Meeting',
      sections: ['Meeting Purpose', 'Background', 'Key Discussion Points', 'Action Items', 'Next Steps'],
      icon: Users
    },
    {
      name: 'Annual Review',
      sections: ['Year in Review', 'Financial Performance', 'Key Achievements', 'Market Position', 'Strategic Goals', 'Risk Assessment', 'Budget Overview', 'Organizational Updates', 'Technology Roadmap', 'Compliance Update', 'Q&A', 'Looking Ahead'],
      icon: FileText
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-100 text-yellow-700';
      case 'In Review': return 'bg-pink-100 text-pink-700';
      case 'Published': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCreatePacket = () => {
    if (!newPacketTitle || !newPacketDate) {
      alert('Please fill in all required fields');
      return;
    }

    const template = templates.find(t => t.name === selectedTemplate);
    const sections = template?.sections || ['Executive Summary', 'Financial Summary', 'Key Metrics', 'Action Items'];

    const newPacket: BoardPacket = {
      id: String(packets.length + 1),
      title: newPacketTitle,
      date: newPacketDate,
      status: 'Draft',
      sections: sections,
      lastModified: new Date().toISOString().split('T')[0],
    };

    setPackets([newPacket, ...packets]);
    setShowNewPacketModal(false);
    setNewPacketTitle('');
    setNewPacketDate('');
    setSelectedTemplate('');
  };

  const handleUseTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    setShowNewPacketModal(true);
  };

  return (
    <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Board Packet Builder</h1>
            <p className="text-gray-600 mt-1">Create comprehensive board meeting materials</p>
          </div>
          <button
            onClick={() => setShowNewPacketModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-md"
          >
            <Plus size={18} />
            New Packet
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-2">
              <FileText size={18} className="text-pink-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{packets.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Packets</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-2">
              <Calendar size={18} className="text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{packets.filter(p => p.status === 'Draft').length}</div>
            <div className="text-sm text-gray-500 mt-1">In Progress</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-2">
              <Download size={18} className="text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{packets.filter(p => p.status === 'Published').length}</div>
            <div className="text-sm text-gray-500 mt-1">Published</div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Board Packets</h2>
          <div className="w-full space-y-4">
            {packets.map((packet) => (
              <div key={packet.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{packet.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {packet.date}
                      </div>
                      <span>Last modified: {packet.lastModified}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(packet.status)}`}>
                    {packet.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {packet.sections.map((section) => (
                    <span key={section} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                      {section}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    Edit
                  </button>
                  <button className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    <Download size={16} />
                    Export PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <div key={template.name} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <Icon size={32} className="text-pink-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.sections.length} sections included</p>
                  <button
                    onClick={() => handleUseTemplate(template.name)}
                    className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shadow-md"
                  >
                    Use Template
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {showNewPacketModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Board Packet</h2>
                <button
                  onClick={() => {
                    setShowNewPacketModal(false);
                    setNewPacketTitle('');
                    setNewPacketDate('');
                    setSelectedTemplate('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Packet Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPacketTitle}
                    onChange={(e) => setNewPacketTitle(e.target.value)}
                    placeholder="e.g., Q1 2026 Board Meeting"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newPacketDate}
                    onChange={(e) => setNewPacketDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  >
                    <option value="">Custom (No Template)</option>
                    {templates.map((template) => (
                      <option key={template.name} value={template.name}>
                        {template.name} ({template.sections.length} sections)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Included Sections:</p>
                    <div className="flex flex-wrap gap-2">
                      {templates
                        .find(t => t.name === selectedTemplate)
                        ?.sections.map((section) => (
                          <span key={section} className="px-2 py-1 bg-white rounded text-xs text-gray-700 border">
                            {section}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewPacketModal(false);
                    setNewPacketTitle('');
                    setNewPacketDate('');
                    setSelectedTemplate('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePacket}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-md"
                >
                  Create Packet
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
