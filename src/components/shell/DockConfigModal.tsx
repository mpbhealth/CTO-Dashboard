import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  GripVertical, 
  ExternalLink as ExternalLinkIcon,
  Zap,
  Globe,
  Link,
  Settings,
  Save
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useExternalLinks, ExternalLinkInput } from '@/hooks/useExternalLinks';
import { useQuickActions, QuickActionInput } from '@/hooks/useQuickActions';
import type { ExternalLink } from '@/hooks/useExternalLinks';
import type { QuickAction } from '@/hooks/useQuickActions';

interface DockConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'external' | 'actions';

/**
 * Common icon options for selection
 */
const iconOptions = [
  'Globe', 'Link', 'ExternalLink', 'Github', 'Gitlab', 'Twitter', 'Linkedin',
  'Database', 'Server', 'Cloud', 'Code', 'Terminal', 'Cpu', 'Monitor',
  'Folder', 'File', 'FileText', 'Image', 'Video', 'Music',
  'ShoppingCart', 'CreditCard', 'DollarSign', 'TrendingUp', 'BarChart',
  'Users', 'User', 'Mail', 'MessageSquare', 'Phone', 'Calendar',
  'Clock', 'Bell', 'Settings', 'Zap', 'Star', 'Heart', 'Bookmark',
  'RefreshCw', 'Play', 'Pause', 'Square', 'Check', 'X',
];

/**
 * Sortable item wrapper for drag-and-drop
 */
function SortableItem({ 
  id, 
  children 
}: { 
  id: string; 
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-2">
        <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </button>
        {children}
      </div>
    </div>
  );
}

/**
 * Form for adding/editing external links
 */
function ExternalLinkForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: ExternalLink;
  onSubmit: (data: ExternalLinkInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [icon, setIcon] = useState(initialData?.icon || 'Globe');
  const [description, setDescription] = useState(initialData?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    onSubmit({
      name: name.trim(),
      url: url.trim(),
      icon,
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Icon
          </label>
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {iconOptions.map((iconName) => (
              <option key={iconName} value={iconName}>{iconName}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          URL *
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {initialData ? 'Update' : 'Add'} Link
        </button>
      </div>
    </form>
  );
}

/**
 * Form for adding/editing quick actions
 */
function QuickActionForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: QuickAction;
  onSubmit: (data: QuickActionInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [label, setLabel] = useState(initialData?.label || '');
  const [icon, setIcon] = useState(initialData?.icon || 'Zap');
  const [actionType, setActionType] = useState(initialData?.action_type || 'url');
  const [actionUrl, setActionUrl] = useState(
    (initialData?.action_data as { url?: string })?.url || ''
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || 'primary');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !label.trim()) return;

    let actionData: Record<string, unknown> = {};
    if (actionType === 'url') {
      actionData = { url: actionUrl };
    } else if (actionType === 'internal') {
      actionData = { action: 'refresh' };
    }

    onSubmit({
      name: name.trim(),
      label: label.trim(),
      icon,
      action_type: actionType as 'url' | 'webhook' | 'command' | 'internal',
      action_data: actionData as QuickActionInput['action_data'],
      description: description.trim() || undefined,
      color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="deploy"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Label *
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Deploy"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Icon
          </label>
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {iconOptions.map((iconName) => (
              <option key={iconName} value={iconName}>{iconName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Type
          </label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="url">Open URL</option>
            <option value="internal">Internal Action</option>
            <option value="webhook">Webhook</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Color
          </label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="danger">Danger</option>
          </select>
        </div>
      </div>

      {actionType === 'url' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            URL
          </label>
          <input
            type="url"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            placeholder="https://example.com/deploy"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deploy to production..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {initialData ? 'Update' : 'Add'} Action
        </button>
      </div>
    </form>
  );
}

/**
 * DockConfigModal - Configuration modal for the command dock
 * 
 * Features:
 * - Add/edit/delete external links
 * - Add/edit/delete quick actions
 * - Drag-and-drop reordering
 * - Tab-based organization
 */
export function DockConfigModal({ isOpen, onClose }: DockConfigModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('external');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ExternalLink | QuickAction | null>(null);

  const {
    externalLinks,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
    isDeleting: isDeletingLink,
  } = useExternalLinks();

  const {
    quickActions,
    addAction,
    updateAction,
    deleteAction,
    reorderActions,
    isDeleting: isDeletingAction,
  } = useQuickActions();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      if (activeTab === 'external') {
        const oldIndex = externalLinks.findIndex((l) => l.id === active.id);
        const newIndex = externalLinks.findIndex((l) => l.id === over.id);
        const newOrder = arrayMove(externalLinks, oldIndex, newIndex);
        await reorderLinks(newOrder.map((l) => l.id));
      } else {
        const oldIndex = quickActions.findIndex((a) => a.id === active.id);
        const newIndex = quickActions.findIndex((a) => a.id === over.id);
        const newOrder = arrayMove(quickActions, oldIndex, newIndex);
        await reorderActions(newOrder.map((a) => a.id));
      }
    }
  };

  const handleAddLink = async (data: ExternalLinkInput) => {
    await addLink(data);
    setShowForm(false);
  };

  const handleUpdateLink = async (data: ExternalLinkInput) => {
    if (editingItem) {
      await updateLink(editingItem.id, data);
      setEditingItem(null);
      setShowForm(false);
    }
  };

  const handleAddAction = async (data: QuickActionInput) => {
    await addAction(data);
    setShowForm(false);
  };

  const handleUpdateAction = async (data: QuickActionInput) => {
    if (editingItem) {
      await updateAction(editingItem.id, data);
      setEditingItem(null);
      setShowForm(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (confirm('Are you sure you want to delete this link?')) {
      await deleteLink(id);
    }
  };

  const handleDeleteAction = async (id: string) => {
    if (confirm('Are you sure you want to delete this action?')) {
      await deleteAction(id);
    }
  };

  const handleEdit = (item: ExternalLink | QuickAction) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="dock-config-overlay" onClick={onClose}>
        <motion.div
          className="dock-config-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Configure Command Dock
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'external'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              onClick={() => {
                setActiveTab('external');
                setShowForm(false);
                setEditingItem(null);
              }}
            >
              <ExternalLinkIcon className="w-4 h-4" />
              External Links
              <span className="px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded-full">
                {externalLinks.length}
              </span>
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'actions'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              onClick={() => {
                setActiveTab('actions');
                setShowForm(false);
                setEditingItem(null);
              }}
            >
              <Zap className="w-4 h-4" />
              Quick Actions
              <span className="px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded-full">
                {quickActions.length}
              </span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {/* Add button */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full mb-4 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add {activeTab === 'external' ? 'External Link' : 'Quick Action'}
              </button>
            )}

            {/* Add/Edit form */}
            {showForm && (
              <div className="mb-4">
                {activeTab === 'external' ? (
                  <ExternalLinkForm
                    initialData={editingItem as ExternalLink | undefined}
                    onSubmit={editingItem ? handleUpdateLink : handleAddLink}
                    onCancel={handleCancelForm}
                  />
                ) : (
                  <QuickActionForm
                    initialData={editingItem as QuickAction | undefined}
                    onSubmit={editingItem ? handleUpdateAction : handleAddAction}
                    onCancel={handleCancelForm}
                  />
                )}
              </div>
            )}

            {/* Items list with drag-and-drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeTab === 'external' ? externalLinks.map((l) => l.id) : quickActions.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {activeTab === 'external' && externalLinks.map((link) => (
                    <SortableItem key={link.id} id={link.id}>
                      <div className="flex-1 flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{link.name}</div>
                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{link.url}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(link)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-primary"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            disabled={isDeletingLink}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-slate-500 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}

                  {activeTab === 'actions' && quickActions.map((action) => (
                    <SortableItem key={action.id} id={action.id}>
                      <div className="flex-1 flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            action.color === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                            action.color === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' :
                            action.color === 'danger' ? 'bg-red-100 dark:bg-red-900/30' :
                            'bg-primary/10'
                          }`}>
                            <Zap className={`w-4 h-4 ${
                              action.color === 'success' ? 'text-emerald-600' :
                              action.color === 'warning' ? 'text-amber-600' :
                              action.color === 'danger' ? 'text-red-600' :
                              'text-primary'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{action.label}</div>
                            <div className="text-xs text-slate-500">{action.action_type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(action)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-primary"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAction(action.id)}
                            disabled={isDeletingAction}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-slate-500 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Empty state */}
            {((activeTab === 'external' && externalLinks.length === 0) ||
              (activeTab === 'actions' && quickActions.length === 0)) && !showForm && (
              <div className="text-center py-8 text-slate-500">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {activeTab === 'external' ? (
                    <Link className="w-6 h-6 text-slate-400" />
                  ) : (
                    <Zap className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <p>No {activeTab === 'external' ? 'external links' : 'quick actions'} yet.</p>
                <p className="text-sm">Click the button above to add one.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


