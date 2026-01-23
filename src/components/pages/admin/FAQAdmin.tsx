import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
} from 'lucide-react';
import { mpbHealthSupabase, isMpbHealthConfigured } from '../../../lib/mpbHealthSupabase';

interface FAQItem {
  id: string;
  title: string;
  content_html: string;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Demo data
const demoFAQs: FAQItem[] = [
  {
    id: '1',
    title: 'What is health sharing?',
    content_html: '<p>Health sharing is a healthcare cost-sharing arrangement where members voluntarily share medical expenses with other members.</p>',
    category: 'general',
    order_index: 1,
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-11-20T14:30:00Z',
  },
  {
    id: '2',
    title: 'How do I submit a claim?',
    content_html: '<p>To submit a claim, log into your member portal, navigate to the Claims section, and follow the step-by-step submission process.</p>',
    category: 'claims',
    order_index: 2,
    is_active: true,
    created_at: '2024-01-15T10:05:00Z',
    updated_at: '2024-11-20T14:30:00Z',
  },
  {
    id: '3',
    title: 'What is the monthly contribution?',
    content_html: '<p>Monthly contributions vary based on your selected plan and coverage level. Visit our pricing page for detailed information.</p>',
    category: 'pricing',
    order_index: 3,
    is_active: true,
    created_at: '2024-01-15T10:10:00Z',
    updated_at: '2024-11-20T14:30:00Z',
  },
  {
    id: '4',
    title: 'What is covered under the plan?',
    content_html: '<p>Our plans cover a wide range of medical expenses including doctor visits, hospital stays, prescriptions, and more.</p>',
    category: 'coverage',
    order_index: 4,
    is_active: true,
    created_at: '2024-01-15T10:15:00Z',
    updated_at: '2024-11-20T14:30:00Z',
  },
  {
    id: '5',
    title: 'How do I contact support?',
    content_html: '<p>You can reach our support team via phone, email, or through your member portal 24/7.</p>',
    category: 'general',
    order_index: 5,
    is_active: false,
    created_at: '2024-01-15T10:20:00Z',
    updated_at: '2024-11-20T14:30:00Z',
  },
];

const categories = [
  { value: 'general', label: 'General' },
  { value: 'coverage', label: 'Coverage' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'claims', label: 'Claims' },
  { value: 'why-choose-healthsharing', label: 'Why Health Sharing' },
];

export function FAQAdmin() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [_editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content_html: '',
    category: 'general',
  });

  const fetchFaqs = useCallback(async () => {
    setLoading(true);

    if (!isMpbHealthConfigured) {
      let filtered = [...demoFAQs];

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(f =>
          f.title.toLowerCase().includes(search) ||
          f.content_html.toLowerCase().includes(search)
        );
      }

      if (categoryFilter !== 'all') {
        filtered = filtered.filter(f => f.category === categoryFilter);
      }

      setFaqs(filtered.sort((a, b) => a.order_index - b.order_index));
      setLoading(false);
      return;
    }

    try {
      let query = mpbHealthSupabase.from('faq_items').select('*');

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content_html.ilike.%${searchTerm}%`);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query.order('order_index', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqs(demoFAQs);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleToggleActive = (id: string) => {
    setFaqs(prev =>
      prev.map(f => (f.id === id ? { ...f, is_active: !f.is_active } : f))
    );
  };

  const handleMoveUp = (id: string) => {
    const index = faqs.findIndex(f => f.id === id);
    if (index > 0) {
      const newFaqs = [...faqs];
      [newFaqs[index], newFaqs[index - 1]] = [newFaqs[index - 1], newFaqs[index]];
      newFaqs.forEach((f, i) => (f.order_index = i + 1));
      setFaqs(newFaqs);
    }
  };

  const handleMoveDown = (id: string) => {
    const index = faqs.findIndex(f => f.id === id);
    if (index < faqs.length - 1) {
      const newFaqs = [...faqs];
      [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];
      newFaqs.forEach((f, i) => (f.order_index = i + 1));
      setFaqs(newFaqs);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      setFaqs(prev => prev.filter(f => f.id !== id));
    }
  };

  const activeCount = faqs.filter(f => f.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">FAQ Management</h1>
          <p className="text-slate-500 mt-1">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add FAQ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{faqs.length}</p>
              <p className="text-sm text-slate-500">Total FAQs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ToggleRight className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ToggleLeft className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{faqs.length - activeCount}</p>
              <p className="text-sm text-slate-500">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <button
            onClick={fetchFaqs}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FAQ List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
          <p className="text-slate-500 mt-2">Loading FAQs...</p>
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-2">No FAQs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`
                bg-white rounded-xl border border-slate-200 p-5
                ${!faq.is_active ? 'opacity-60' : ''}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Order Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(faq.id)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="text-xs text-slate-400 text-center">{faq.order_index}</span>
                  <button
                    onClick={() => handleMoveDown(faq.id)}
                    disabled={index === faqs.length - 1}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full capitalize">
                      {faq.category}
                    </span>
                    {!faq.is_active && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{faq.title}</h3>
                  <div
                    className="text-sm text-slate-600 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: faq.content_html }}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(faq.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      faq.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}
                    title={faq.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {faq.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setEditingId(faq.id)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add FAQ</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Question
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Enter the question"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Answer (HTML supported)
                </label>
                <textarea
                  rows={6}
                  value={formData.content_html}
                  onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none font-mono text-sm"
                  placeholder="<p>Enter the answer...</p>"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle save
                  setShowAddModal(false);
                  setFormData({ title: '', content_html: '', category: 'general' });
                }}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium inline-flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FAQAdmin;

