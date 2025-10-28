import { useState } from 'react';
import { FileText, Download, Plus, Calendar, Users } from 'lucide-react';
import { CEODashboardLayout } from '../../layouts/CEODashboardLayout';

export function CEOBoardPacket() {
  const [packets] = useState([
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
    { name: 'Quarterly Board Meeting', sections: 8, icon: Calendar },
    { name: 'Special Meeting', sections: 5, icon: Users },
    { name: 'Annual Review', sections: 12, icon: FileText },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-100 text-yellow-700';
      case 'In Review': return 'bg-pink-100 text-pink-700';
      case 'Published': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Board Packet Builder</h1>
            <p className="text-gray-600 mt-1">Create comprehensive board meeting materials</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-md">
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
          <div className="space-y-4">
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
                  <p className="text-sm text-gray-500">{template.sections} sections included</p>
                  <button className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shadow-md">
                    Use Template
                  </button>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
