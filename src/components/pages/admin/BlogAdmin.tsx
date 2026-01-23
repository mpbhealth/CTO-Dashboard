import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Clock,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Image,
  MoreHorizontal,
} from 'lucide-react';
import { mpbHealthSupabase, isMpbHealthConfigured } from '../../../lib/mpbHealthSupabase';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  featured_image_url: string | null;
  author_name: string;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700' },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700' },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-600' },
};

// Demo data
const demoArticles: Article[] = [
  {
    id: '1',
    title: 'Understanding Health Sharing Programs',
    slug: 'understanding-health-sharing-programs',
    excerpt: 'Learn the basics of health sharing and how it differs from traditional insurance.',
    category: 'Education',
    status: 'published',
    featured_image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400',
    author_name: 'Dr. Sarah Miller',
    view_count: 1247,
    published_at: '2024-11-15T10:00:00Z',
    created_at: '2024-11-10T14:30:00Z',
    updated_at: '2024-11-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'New Member Guide: Getting Started',
    slug: 'new-member-guide',
    excerpt: 'Everything new members need to know about their health sharing membership.',
    category: 'Guides',
    status: 'published',
    featured_image_url: 'https://images.unsplash.com/photo-1516841273335-e39b37888115?w=400',
    author_name: 'MPB Health Team',
    view_count: 856,
    published_at: '2024-11-20T09:00:00Z',
    created_at: '2024-11-18T11:00:00Z',
    updated_at: '2024-11-20T09:00:00Z',
  },
  {
    id: '3',
    title: 'Winter Health Tips for Families',
    slug: 'winter-health-tips-families',
    excerpt: 'Stay healthy this winter with these practical tips for the whole family.',
    category: 'Health Tips',
    status: 'draft',
    featured_image_url: null,
    author_name: 'Dr. Michael Chen',
    view_count: 0,
    published_at: null,
    created_at: '2024-12-02T16:45:00Z',
    updated_at: '2024-12-04T10:30:00Z',
  },
  {
    id: '4',
    title: 'How to Submit a Claim',
    slug: 'how-to-submit-claim',
    excerpt: 'Step-by-step guide to submitting your health sharing claims.',
    category: 'Guides',
    status: 'published',
    featured_image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    author_name: 'MPB Health Team',
    view_count: 2134,
    published_at: '2024-10-25T08:00:00Z',
    created_at: '2024-10-20T12:00:00Z',
    updated_at: '2024-10-25T08:00:00Z',
  },
  {
    id: '5',
    title: 'Preventive Care Benefits Explained',
    slug: 'preventive-care-benefits',
    excerpt: 'Understanding your preventive care benefits and how to use them.',
    category: 'Education',
    status: 'draft',
    featured_image_url: null,
    author_name: 'Dr. Sarah Miller',
    view_count: 0,
    published_at: null,
    created_at: '2024-12-04T09:15:00Z',
    updated_at: '2024-12-04T09:15:00Z',
  },
];

export function BlogAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchArticles = useCallback(async () => {
    setLoading(true);

    if (!isMpbHealthConfigured) {
      let filtered = [...demoArticles];

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(a =>
          a.title.toLowerCase().includes(search) ||
          a.category.toLowerCase().includes(search) ||
          a.author_name.toLowerCase().includes(search)
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(a => a.status === statusFilter);
      }

      setTotalCount(filtered.length);
      const start = (currentPage - 1) * pageSize;
      setArticles(filtered.slice(start, start + pageSize));
      setLoading(false);
      return;
    }

    try {
      let query = mpbHealthSupabase
        .from('blog_articles')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;

      setArticles(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles(demoArticles);
      setTotalCount(demoArticles.length);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const publishedCount = demoArticles.filter(a => a.status === 'published').length;
  const draftCount = demoArticles.filter(a => a.status === 'draft').length;
  const totalViews = demoArticles.reduce((sum, a) => sum + a.view_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Management</h1>
          <p className="text-slate-500 mt-1">Create and manage blog articles</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-sm">
          <Plus className="w-5 h-5" />
          New Article
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{demoArticles.length}</p>
              <p className="text-sm text-slate-500">Total Articles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{publishedCount}</p>
              <p className="text-sm text-slate-500">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{draftCount}</p>
              <p className="text-sm text-slate-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalViews.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Views</p>
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
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={fetchArticles}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
          <p className="text-slate-500 mt-2">Loading articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-2">No articles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => {
            const status = statusConfig[article.status];

            return (
              <div
                key={article.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="aspect-video bg-slate-100 relative">
                  {article.featured_image_url ? (
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <span className={`
                    absolute top-3 left-3 px-2 py-1 text-xs font-semibold rounded-full
                    ${status.color}
                  `}>
                    {status.label}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full">{article.category}</span>
                    <span>•</span>
                    <span>{article.view_count.toLocaleString()} views</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>By {article.author_name}</span>
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="View">
                    <Eye className="w-4 h-4 text-slate-600" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Edit">
                    <Edit className="w-4 h-4 text-slate-600" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="More">
                    <MoreHorizontal className="w-4 h-4 text-slate-600" />
                  </button>
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
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} articles
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
    </div>
  );
}

export default BlogAdmin;

