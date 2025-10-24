import { useState } from 'react';
import { Calendar, Plus, Filter } from 'lucide-react';
import { CEODashboardLayout } from '../../layouts/CEODashboardLayout';

export function CEOContentCalendar() {
  const [contentItems] = useState([
    { id: '1', date: '2025-10-25', type: 'Blog Post', title: 'Healthcare Navigation Tips', status: 'Published', assignee: 'Sarah K.' },
    { id: '2', date: '2025-10-26', type: 'Email', title: 'Weekly Newsletter', status: 'Scheduled', assignee: 'Mike R.' },
    { id: '3', date: '2025-10-27', type: 'Social Media', title: 'Member Success Story', status: 'Draft', assignee: 'Jessica L.' },
    { id: '4', date: '2025-10-28', type: 'Landing Page', title: 'Partner Program Launch', status: 'In Review', assignee: 'David M.' },
    { id: '5', date: '2025-10-29', type: 'Video', title: 'Product Feature Demo', status: 'Production', assignee: 'Emma T.' },
    { id: '6', date: '2025-10-30', type: 'Webinar', title: 'Healthcare Compliance 101', status: 'Scheduled', assignee: 'Tom W.' },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-700';
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      case 'Draft': return 'bg-gray-100 text-gray-700';
      case 'In Review': return 'bg-yellow-100 text-yellow-700';
      case 'Production': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <CEODashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
            <p className="text-gray-600 mt-1">Schedule and manage content across all channels</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              <Filter size={18} />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              <Plus size={18} />
              Add Content
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Published', 'Scheduled', 'In Review', 'Draft'].map((status) => {
            const count = contentItems.filter(item => item.status === status).length;
            return (
              <div key={status} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="text-sm text-gray-500">{status}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{count}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.type}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.assignee}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CEODashboardLayout>
  );
}
