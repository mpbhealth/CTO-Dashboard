import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Link2, 
  Plus, 
  Search, 
  X, 
  RefreshCw, 
  FileText, 
  Workflow, 
  Database, 
  Monitor, 
  Settings, 
  Shield, 
  CloudLightning, 
  Layers, 
  Pencil, 
  Trash2, 
  ExternalLink,
  Tag,
  Clock,
  Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AddQuickLinkModal from '../modals/AddQuickLinkModal';
import EditQuickLinkModal from '../modals/EditQuickLinkModal';

interface QuickLink {
  id: string;
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
  category: string | null;
  click_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'category' | 'clicks' | 'date';

export default function QuickLinks() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<QuickLink | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  // Derive categories from current links (this updates automatically when links change)
  const categories = Array.from(new Set(links.map(link => link.category).filter(Boolean) as string[]));

  // Derive filtered links from current state
  const filteredLinks = links.filter(link => {
    const matchesSearch = searchTerm === '' || 
      link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (link.url.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || link.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort filtered links
  const sortedFilteredLinks = [...filteredLinks].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      case 'clicks':
        return (b.click_count || 0) - (a.click_count || 0);
      case 'date':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });
  // Fetch quick links on component mount
  useEffect(() => {
    fetchQuickLinks();

    // Cleanup function to prevent state updates after unmount
    return () => {
      setIsMounted(false);
    };
  }, []);

  const fetchQuickLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quick_links')
        .select('*');

      if (error) throw error;

      if (isMounted) {
        setLinks(data || []);
      }
    } catch (err) {
      if (isMounted) {
        console.error('Error fetching quick links:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const handleDeleteLink = async (link: QuickLink) => {
    if (window.confirm(`Are you sure you want to delete "${link.name}"? This action cannot be undone.`)) {
      setDeletingId(link.id);
      try {
        const { error } = await supabase
          .from('quick_links')
          .delete()
          .eq('id', link.id);

        if (error) throw error;
        
        if (isMounted) {
          // Remove the deleted link from the state
          setLinks(links.filter(l => l.id !== link.id));
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error deleting quick link:', err);
          alert('Failed to delete quick link. Please try again.');
        }
      } finally {
        if (isMounted) {
          setDeletingId(null);
        }
      }
    }
  };

  const handleEditLink = (link: QuickLink) => {
    setSelectedLink(link);
    setIsEditModalOpen(true);
  };

  const handleLinkClick = async (linkId: string, url: string) => {
    // Open the link in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Increment click count
    try {
      const { error } = await supabase
        .from('quick_links')
        .update({ click_count: links.find(l => l.id === linkId)?.click_count! + 1 })
        .eq('id', linkId);

      if (error) throw error;
      
      // Update the link in state to reflect new click count
        setLinks(links.map(link => 
          link.id === linkId 
            ? { ...link, click_count: link.click_count + 1 } 
            : link
        ));
    } catch (err) {
      console.error('Error updating click count:', err);
    }
  };

  const handleAddSuccess = (newLink: QuickLink) => {
    if (isMounted) {
      setLinks([newLink, ...links]);
      setIsAddModalOpen(false);
    }
  };

  const handleEditSuccess = (updatedLink: QuickLink) => {
    if (isMounted) {
      setLinks(links.map(link => link.id === updatedLink.id ? updatedLink : link));
      setIsEditModalOpen(false);
      setSelectedLink(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
  };

  // Default icon mapping based on category
  const getCategoryIcon = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'development':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'analytics':
        return <Workflow className="w-6 h-6 text-emerald-600" />;
      case 'database':
        return <Database className="w-6 h-6 text-amber-600" />;
      case 'infrastructure':
        return <Monitor className="w-6 h-6 text-purple-600" />;
      case 'tools':
        return <Settings className="w-6 h-6 text-slate-600" />;
      case 'security':
        return <Shield className="w-6 h-6 text-red-600" />;
      case 'cloud':
        return <CloudLightning className="w-6 h-6 text-cyan-600" />;
      default:
        return <Layers className="w-6 h-6 text-indigo-600" />;
    }
  };

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredLinks.map((link) => (
        <motion.div
          key={link.id}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                {link.icon ? (
                  <span className="text-2xl">{link.icon}</span> // Simplified for demo
                ) : (
                  getCategoryIcon(link.category)
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 line-clamp-1">{link.name}</h3>
                <span className="text-xs text-slate-500">
                  {link.category || 'Uncategorized'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleEditLink(link)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit link"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteLink(link)}
                disabled={deletingId === link.id}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete link"
              >
                {deletingId === link.id ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {link.description && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{link.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Eye className="w-3 h-3" />
              <span>{link.click_count || 0} views</span>
            </div>
            <button
              onClick={() => handleLinkClick(link.id, link.url)}
              className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-sm"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // Render list view
  const renderListView = () => (
    <div className="space-y-3">
      {filteredLinks.map((link) => (
        <motion.div
          key={link.id}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {link.icon ? (
                  <span className="text-xl">{link.icon}</span>
                ) : (
                  getCategoryIcon(link.category)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <h3 className="font-semibold text-slate-900 truncate">{link.name}</h3>
                  <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                    {link.category || 'Uncategorized'}
                  </span>
                </div>
                {link.description && (
                  <p className="text-sm text-slate-600 truncate">{link.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Eye className="w-3 h-3" />
                <span>{link.click_count || 0}</span>
              </div>
              <button
                onClick={() => handleLinkClick(link.id, link.url)}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
              >
                Open
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => handleEditLink(link)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  title="Edit link"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteLink(link)}
                  disabled={deletingId === link.id}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Delete link"
                >
                  {deletingId === link.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">QuickLinks Directory</h1>
          <p className="text-slate-600 mt-2">Manage and access frequently used software and services</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add QuickLink</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Link2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Links</p>
              <p className="text-2xl font-bold text-slate-900">{links.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Tag className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Categories</p>
              <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Clicks</p>
              <p className="text-2xl font-bold text-slate-900">
                {links.reduce((sum, link) => sum + (link.click_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Recently Added</p>
              <p className="text-2xl font-bold text-slate-900">
                {links.filter(link => {
                  const date = new Date(link.created_at);
                  const now = new Date();
                  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays < 7;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, description, or URL..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            {/* Sort By */}
            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
              <option value="clicks">Sort by Most Used</option>
              <option value="date">Sort by Date Added</option>
            </select>
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  viewMode === 'grid' ? 'bg-white shadow text-slate-800' : 'text-slate-600'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-600'
                }`}
              >
                List
              </button>
            </div>
            
            {/* Clear Filters */}
            {(selectedCategory !== 'All' || searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Links Display */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
              <p className="text-slate-600">Loading quick links...</p>
            </div>
          </div>
        ) : filteredLinks.length > 0 ? (
          viewMode === 'grid' ? renderGridView() : renderListView()
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <Link2 className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No quick links found</h3>
            {searchTerm || selectedCategory !== 'All' ? (
              <p className="text-slate-600 mb-4">Try adjusting your search or filters</p>
            ) : (
              <p className="text-slate-600 mb-4">Get started by adding your first quick link</p>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Quick Link</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedFilteredLinks.map((link) => (
              <motion.div
                key={link.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      {link.icon ? (
                        <span className="text-2xl">{link.icon}</span>
                      ) : (
                        getCategoryIcon(link.category)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{link.name}</h3>
                      <span className="text-xs text-slate-500">
                        {link.category || 'Uncategorized'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditLink(link)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit link"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link)}
                      disabled={deletingId === link.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete link"
                    >
                      {deletingId === link.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
      </div>

      {/* Add Quick Link Modal */}
      <AddQuickLinkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        existingCategories={categories}
      />

      {/* Edit Quick Link Modal */}
      {selectedLink && (
        <EditQuickLinkModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedLink(null);
          }}
          onSuccess={handleEditSuccess}
          link={selectedLink}
          existingCategories={categories}
        />
      )}
    </div>
  );
}