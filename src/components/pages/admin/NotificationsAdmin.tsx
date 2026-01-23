import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Bell,
  Send,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
  AlertTriangle,
  Megaphone,
  X,
  Save,
} from 'lucide-react';
import { mpbHealthSupabase, isMpbHealthConfigured } from '../../../lib/mpbHealthSupabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: 'info' | 'warning' | 'alert' | 'success' | 'announcement';
  channel: string;
  audience: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduled_for: string | null;
  sent_at: string | null;
  read_count: number;
  created_at: string;
}

const typeConfig = {
  info: { label: 'Info', color: 'bg-blue-100 text-blue-700', icon: Info },
  warning: { label: 'Warning', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  alert: { label: 'Alert', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  success: { label: 'Success', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  announcement: { label: 'Announcement', color: 'bg-purple-100 text-purple-700', icon: Megaphone },
};

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  scheduled: { label: 'Scheduled', color: 'bg-amber-100 text-amber-700' },
  sent: { label: 'Sent', color: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
};

// Demo data
const demoNotifications: Notification[] = [
  {
    id: '1',
    title: 'System Maintenance Notice',
    message: 'Our systems will undergo scheduled maintenance on December 10th from 2-4 AM EST.',
    notification_type: 'warning',
    channel: 'in_app',
    audience: 'all_members',
    status: 'sent',
    scheduled_for: null,
    sent_at: '2024-12-03T10:00:00Z',
    read_count: 856,
    created_at: '2024-12-02T14:30:00Z',
  },
  {
    id: '2',
    title: 'New Feature: Mobile App',
    message: 'Download our new mobile app for iOS and Android for easier claim submissions!',
    notification_type: 'announcement',
    channel: 'email',
    audience: 'all_members',
    status: 'scheduled',
    scheduled_for: '2024-12-06T09:00:00Z',
    sent_at: null,
    read_count: 0,
    created_at: '2024-12-04T11:00:00Z',
  },
  {
    id: '3',
    title: 'Claim Approved',
    message: 'Your recent claim has been approved and payment is being processed.',
    notification_type: 'success',
    channel: 'in_app',
    audience: 'specific',
    status: 'sent',
    scheduled_for: null,
    sent_at: '2024-12-04T15:30:00Z',
    read_count: 1,
    created_at: '2024-12-04T15:30:00Z',
  },
  {
    id: '4',
    title: 'Holiday Hours',
    message: 'Our support team will have limited availability during the holiday season.',
    notification_type: 'info',
    channel: 'in_app',
    audience: 'all_members',
    status: 'draft',
    scheduled_for: null,
    sent_at: null,
    read_count: 0,
    created_at: '2024-12-04T09:15:00Z',
  },
  {
    id: '5',
    title: 'Action Required: Document Upload',
    message: 'Please upload the required documents to complete your enrollment.',
    notification_type: 'alert',
    channel: 'email',
    audience: 'pending_members',
    status: 'sent',
    scheduled_for: null,
    sent_at: '2024-12-01T08:00:00Z',
    read_count: 23,
    created_at: '2024-12-01T07:45:00Z',
  },
];

export function NotificationsAdmin() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notification_type: 'info' as Notification['notification_type'],
    channel: 'in_app',
    audience: 'all_members',
  });
  const pageSize = 10;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    if (!isMpbHealthConfigured) {
      let filtered = [...demoNotifications];

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(n =>
          n.title.toLowerCase().includes(search) ||
          n.message.toLowerCase().includes(search)
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(n => n.status === statusFilter);
      }

      if (typeFilter !== 'all') {
        filtered = filtered.filter(n => n.notification_type === typeFilter);
      }

      setTotalCount(filtered.length);
      const start = (currentPage - 1) * pageSize;
      setNotifications(filtered.slice(start, start + pageSize));
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('system_notifications')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('notification_type', typeFilter);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;

      setNotifications(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(demoNotifications);
      setTotalCount(demoNotifications.length);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter, currentPage]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Stats
  const draftCount = demoNotifications.filter(n => n.status === 'draft').length;
  const scheduledCount = demoNotifications.filter(n => n.status === 'scheduled').length;
  const sentCount = demoNotifications.filter(n => n.status === 'sent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Send and manage system notifications</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create Notification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{demoNotifications.length}</p>
              <p className="text-sm text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Edit className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{draftCount}</p>
              <p className="text-sm text-slate-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{scheduledCount}</p>
              <p className="text-sm text-slate-500">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Send className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{sentCount}</p>
              <p className="text-sm text-slate-500">Sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="alert">Alert</option>
              <option value="success">Success</option>
              <option value="announcement">Announcement</option>
            </select>

            <button
              onClick={fetchNotifications}
              className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
          <p className="text-slate-500 mt-2">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-2">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const type = typeConfig[notification.notification_type];
            const status = statusConfig[notification.status];
            const TypeIcon = type.icon;

            return (
              <div
                key={notification.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl ${type.color.replace('text-', 'bg-').replace('700', '100')}`}>
                    <TypeIcon className={`w-6 h-6 ${type.color.split(' ')[1]}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${type.color}`}>
                        {type.label}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">
                        {notification.channel.replace('_', ' ')} • {notification.audience.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{notification.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{notification.message}</p>
                    
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {notification.sent_at && (
                        <span className="flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" />
                          Sent {new Date(notification.sent_at).toLocaleDateString()}
                        </span>
                      )}
                      {notification.scheduled_for && !notification.sent_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Scheduled for {new Date(notification.scheduled_for).toLocaleDateString()}
                        </span>
                      )}
                      {notification.read_count > 0 && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {notification.read_count} reads
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {notification.status === 'draft' && (
                      <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm">
                        <Send className="w-4 h-4" />
                        Send Now
                      </button>
                    )}
                    <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Edit">
                      <Edit className="w-4 h-4 text-slate-600" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-6 py-4">
          <p className="text-sm text-slate-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Create Notification</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Notification title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                  placeholder="Notification message"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    value={formData.notification_type}
                    onChange={(e) => setFormData({ ...formData, notification_type: e.target.value as Notification['notification_type'] })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="alert">Alert</option>
                    <option value="success">Success</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                  >
                    <option value="in_app">In-App</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Audience</label>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                >
                  <option value="all_members">All Members</option>
                  <option value="active_members">Active Members</option>
                  <option value="pending_members">Pending Members</option>
                  <option value="advisors">Advisors</option>
                  <option value="staff">Staff</option>
                  <option value="specific">Specific Users</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ title: '', message: '', notification_type: 'info', channel: 'in_app', audience: 'all_members' });
                }}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium inline-flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ title: '', message: '', notification_type: 'info', channel: 'in_app', audience: 'all_members' });
                }}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium inline-flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsAdmin;

