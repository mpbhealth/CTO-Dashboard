import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  Rocket,
  ExternalLink,
  Trash2,
  Edit3,
  X,
  Save,
  Globe,
  Server,
  BarChart3,
  Code,
  Megaphone,
  Settings,
  DollarSign,
  GripVertical,
  Sparkles,
  Filter,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useExternalLinks, ExternalLinkInput, ExternalLink as ExternalLinkType, DashboardContext } from '@/hooks/useExternalLinks';
import {
  getThumbnailUrl,
  getFallbackThumbnail,
  getCategoryColors,
  getCategoryGradient,
  COMMAND_CENTER_CATEGORIES,
} from '@/lib/thumbnails';

/**
 * Icon mapping for categories
 */
const categoryIcons: Record<string, React.ElementType> = {
  infrastructure: Server,
  analytics: BarChart3,
  development: Code,
  marketing: Megaphone,
  operations: Settings,
  finance: DollarSign,
  general: Globe,
};

/**
 * Icon mapping for link icons
 */
const iconMap: Record<string, React.ElementType> = {
  Globe,
  Server,
  BarChart3,
  Code,
  Megaphone,
  Settings,
  DollarSign,
  ExternalLink,
  Rocket,
};

interface AssetCardProps {
  link: ExternalLinkType;
  onEdit: (link: ExternalLinkType) => void;
  onDelete: (id: string) => void;
}

/**
 * Sortable Asset Card with thumbnail preview
 */
function SortableAssetCard({ link, onEdit, onDelete }: AssetCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const thumbnailUrl = getThumbnailUrl(link.url, link.thumbnail_url);
  const fallbackUrl = getFallbackThumbnail(link.url);
  const colors = getCategoryColors(link.category);
  const gradient = getCategoryGradient(link.category);
  const Icon = iconMap[link.icon] || Globe;

  const handleClick = useCallback(() => {
    if (!isDragging) {
      window.open(link.url, link.open_in_new_tab ? '_blank' : '_self', 'noopener,noreferrer');
    }
  }, [link.url, link.open_in_new_tab, isDragging]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        group relative rounded-2xl overflow-hidden
        bg-gradient-to-br ${gradient}
        border ${colors.border}
        backdrop-blur-sm
        transition-all duration-300
        hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]
        hover:border-violet-400/50
        hover:scale-[1.02]
        cursor-pointer
        ${isDragging ? 'opacity-50 scale-105 z-50' : ''}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={handleClick}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-white/70" />
      </button>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(link);
          }}
          className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm hover:bg-white/20 transition-colors"
        >
          <Edit3 className="w-4 h-4 text-white/70" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(link.id);
          }}
          className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm hover:bg-red-500/50 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Thumbnail Section */}
      <div className="relative h-36 overflow-hidden bg-slate-900/50">
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
        )}
        
        {/* Thumbnail image */}
        {!imageError ? (
          <img
            src={thumbnailUrl}
            alt={link.name}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          /* Fallback: Gradient + Favicon */
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <img
              src={fallbackUrl}
              alt={link.name}
              className="w-16 h-16 rounded-xl shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Power-up glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-violet-500/10 animate-pulse" />
        </div>
      </div>

      {/* Info Section - Glassmorphism overlay */}
      <div className="p-4 bg-black/40 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate text-sm">
              {link.name}
            </h3>
            {link.description && (
              <p className="text-white/60 text-xs truncate mt-0.5">
                {link.description}
              </p>
            )}
          </div>
          <ExternalLink className="w-4 h-4 text-white/40 flex-shrink-0 group-hover:text-white/70 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Add/Edit Asset Modal
 */
interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExternalLinkInput) => Promise<void>;
  initialData?: ExternalLinkType;
  dashboardContext: DashboardContext;
}

function AssetModal({ isOpen, onClose, onSave, initialData, dashboardContext }: AssetModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'general');
  const [icon, setIcon] = useState(initialData?.icon || 'Globe');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        dashboard_context: dashboardContext,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">
                {initialData ? 'Edit Digital Asset' : 'Add Digital Asset'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Website"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  URL *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                >
                  {COMMAND_CENTER_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Icon
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                >
                  {Object.keys(iconMap).map((iconName) => (
                    <option key={iconName} value={iconName}>
                      {iconName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Custom Thumbnail URL (optional)
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/screenshot.png"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty to auto-generate from website
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim() || !url.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : initialData ? 'Update' : 'Add Asset'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Command Center - Starship Fleet of Digital Assets
 */
export function CommandCenter() {
  const location = useLocation();
  const dashboardContext: DashboardContext = location.pathname.startsWith('/ceod') ? 'ceo' : 'cto';
  
  const {
    externalLinks,
    isLoading,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
  } = useExternalLinks(dashboardContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ExternalLinkType | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter links by search and category
  const filteredLinks = useMemo(() => {
    return externalLinks.filter((link) => {
      const matchesSearch = !searchQuery || 
        link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.url.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || link.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [externalLinks, searchQuery, selectedCategory]);

  // Group links by category
  const linksByCategory = useMemo(() => {
    const grouped: Record<string, ExternalLinkType[]> = {};
    filteredLinks.forEach((link) => {
      const cat = link.category || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(link);
    });
    return grouped;
  }, [filteredLinks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = externalLinks.findIndex((l) => l.id === active.id);
      const newIndex = externalLinks.findIndex((l) => l.id === over.id);
      const newOrder = arrayMove(externalLinks, oldIndex, newIndex);
      await reorderLinks(newOrder.map((l) => l.id));
    }
  };

  const handleAddClick = () => {
    setEditingLink(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (link: ExternalLinkType) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Are you sure you want to remove this digital asset?')) {
      await deleteLink(id);
    }
  };

  const handleSave = async (data: ExternalLinkInput) => {
    if (editingLink) {
      await updateLink(editingLink.id, data);
    } else {
      await addLink(data);
    }
  };

  return (
    <div className="w-full h-full">
      {/* Dark themed container with rounded corners */}
      <div className="bg-slate-950 rounded-2xl relative overflow-hidden min-h-[calc(100vh-120px)]">
        {/* Animated Star Field Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
          {/* Nebula gradients */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-900/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Star particles */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(2px 2px at 20px 30px, white, transparent),
                             radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
                             radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.6), transparent),
                             radial-gradient(2px 2px at 130px 80px, white, transparent),
                             radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.7), transparent)`,
            backgroundSize: '200px 200px',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 shadow-lg shadow-violet-500/25">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                  Command Center
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </h1>
                <p className="text-slate-400 text-sm md:text-base">
                  Your starship fleet of digital assets • {dashboardContext.toUpperCase()} Dashboard
                </p>
              </div>
            </div>

            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
            >
              <Plus className="w-5 h-5" />
              Add Asset
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-6 flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search digital assets..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                  !selectedCategory
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {COMMAND_CENTER_CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat.id] || Globe;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      selectedCategory === cat.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 flex items-center justify-center">
              <Rocket className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery || selectedCategory ? 'No assets found' : 'Launch your fleet'}
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {searchQuery || selectedCategory
                ? 'Try adjusting your search or filters'
                : 'Add your first digital asset to build your command center. These are websites and tools you use daily.'}
            </p>
            {!searchQuery && !selectedCategory && (
              <button
                onClick={handleAddClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Your First Asset
              </button>
            )}
          </motion.div>
        ) : selectedCategory ? (
          /* Single category view */
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredLinks.map((l) => l.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredLinks.map((link) => (
                    <SortableAssetCard
                      key={link.id}
                      link={link}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          /* Grouped by category view */
          <div className="space-y-8">
            {Object.entries(linksByCategory).map(([category, links]) => {
              const CategoryIcon = categoryIcons[category] || Globe;
              const colors = getCategoryColors(category);
              const categoryLabel = COMMAND_CENTER_CATEGORIES.find(c => c.id === category)?.label || category;

              return (
                <motion.section
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl ${colors.bg}`}>
                      <CategoryIcon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <h2 className="text-lg font-semibold text-white">{categoryLabel}</h2>
                    <span className="text-sm text-slate-500">({links.length})</span>
                    <div className={`flex-1 h-px ${colors.border} ml-2`} />
                  </div>

                  {/* Category Grid */}
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={links.map((l) => l.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                          {links.map((link) => (
                            <SortableAssetCard
                              key={link.id}
                              link={link}
                              onEdit={handleEditClick}
                              onDelete={handleDeleteClick}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </SortableContext>
                  </DndContext>
                </motion.section>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AssetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSave}
        initialData={editingLink || undefined}
        dashboardContext={dashboardContext}
      />
    </div>
  );
}

export default CommandCenter;

