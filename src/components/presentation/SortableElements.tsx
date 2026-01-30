import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  showControls?: boolean;
  className?: string;
}

/**
 * Base sortable wrapper for any item
 */
export function SortableItem({
  id,
  children,
  onEdit,
  onDelete,
  showControls = true,
  className = '',
}: SortableItemProps) {
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
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={`relative group ${className}`}>
      <div className="flex items-center gap-1">
        {showControls && (
          <button
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </button>
        )}
        <div className="flex-1">{children}</div>
        {showControls && (onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-slate-400 hover:text-blue-500 transition-colors"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SortableCardProps {
  id: string;
  icon: ReactNode;
  label: string;
  sublabel?: string;
  color?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditMode?: boolean;
}

/**
 * Sortable card for app cards, service cards, vendor cards
 */
export function SortableCard({
  id,
  icon,
  label,
  sublabel,
  color: _color = 'from-blue-500 to-blue-600',
  onEdit,
  onDelete,
  isEditMode = false,
}: SortableCardProps) {
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
    zIndex: isDragging ? 100 : 1,
  };

  if (!isEditMode) {
    return (
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all`}
        whileHover={{ scale: 1.02 }}
      >
        {icon}
        <div>
          <p className="font-medium text-slate-700 text-xs">{label}</p>
          {sublabel && <p className="text-[10px] text-emerald-600 font-semibold">{sublabel}</p>}
        </div>
      </motion.div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative group">
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border-2 ${
          isDragging ? 'border-blue-400' : 'border-transparent hover:border-blue-200'
        } transition-all`}
        whileHover={{ scale: 1.02 }}
      >
        <button
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded"
        >
          <GripVertical className="w-3 h-3 text-slate-400" />
        </button>
        {icon}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-700 text-xs truncate">{label}</p>
          {sublabel && <p className="text-[10px] text-emerald-600 font-semibold truncate">{sublabel}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-500"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface SortableBadgeProps {
  id: string;
  icon: ReactNode;
  label: string;
  color?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditMode?: boolean;
}

/**
 * Sortable badge for user badges, partner badges
 */
export function SortableBadge({
  id,
  icon,
  label,
  color = 'from-blue-500 to-blue-600',
  onEdit,
  onDelete,
  isEditMode = false,
}: SortableBadgeProps) {
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
    zIndex: isDragging ? 100 : 1,
  };

  if (!isEditMode) {
    return (
      <motion.div
        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}
        whileHover={{ scale: 1.05, y: -2 }}
      >
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </motion.div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative group">
      <motion.div
        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg ring-2 ${
          isDragging ? 'ring-white' : 'ring-transparent group-hover:ring-white/50'
        }`}
        whileHover={{ scale: 1.02 }}
      >
        <button
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-white/20 rounded"
        >
          <GripVertical className="w-3 h-3 text-white/70" />
        </button>
        {icon}
        <span className="font-medium text-sm">{label}</span>
        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-white/20 rounded text-white/70 hover:text-white"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-red-500/50 rounded text-white/70 hover:text-white"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface SortableListItemProps {
  id: string;
  icon: ReactNode;
  text: string;
  status?: 'success' | 'warning' | 'error';
  highlight?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditMode?: boolean;
}

/**
 * Sortable list item for evolution column items
 */
export function SortableListItem({
  id,
  icon,
  text,
  status: _status = 'warning',
  highlight = false,
  onEdit,
  onDelete,
  isEditMode = false,
}: SortableListItemProps) {
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
    zIndex: isDragging ? 100 : 1,
  };

  const bgClass = highlight
    ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300'
    : 'bg-white/60 border border-slate-200';

  if (!isEditMode) {
    return (
      <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${bgClass}`}>
        {icon}
        <span className={`text-xs ${highlight ? 'font-semibold text-emerald-800' : 'text-slate-700'}`}>
          {text}
        </span>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative group">
      <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${bgClass} ring-2 ${
        isDragging ? 'ring-blue-400' : 'ring-transparent group-hover:ring-blue-200'
      }`}>
        <button
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-200 rounded flex-shrink-0"
        >
          <GripVertical className="w-3 h-3 text-slate-400" />
        </button>
        {icon}
        <span className={`text-xs flex-1 ${highlight ? 'font-semibold text-emerald-800' : 'text-slate-700'}`}>
          {text}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-500"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface SortableServiceCardProps {
  id: string;
  icon: ReactNode;
  label: string;
  desc: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditMode?: boolean;
}

/**
 * Sortable service card for platform services
 */
export function SortableServiceCard({
  id,
  icon,
  label,
  desc,
  onEdit,
  onDelete,
  isEditMode = false,
}: SortableServiceCardProps) {
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
    zIndex: isDragging ? 100 : 1,
  };

  if (!isEditMode) {
    return (
      <motion.div
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/10 hover:bg-white/20 transition-all"
        whileHover={{ scale: 1.05 }}
      >
        {icon}
        <div>
          <p className="font-medium text-white text-[10px] leading-tight">{label}</p>
          <p className="text-[9px] text-slate-400">{desc}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative group">
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur border ${
          isDragging ? 'border-cyan-400' : 'border-white/10 group-hover:border-cyan-400/50'
        } transition-all`}
        whileHover={{ scale: 1.02 }}
      >
        <button
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-white/20 rounded"
        >
          <GripVertical className="w-3 h-3 text-slate-400" />
        </button>
        {icon}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-[10px] leading-tight truncate">{label}</p>
          <p className="text-[9px] text-slate-400 truncate">{desc}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-cyan-500/30 rounded text-slate-400 hover:text-cyan-400"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-red-500/30 rounded text-slate-400 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface SortablePlatformNodeProps {
  id: string;
  icon: ReactNode;
  label: string;
  sublabel: string;
  color: string;
  angle: number;
  radius?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditMode?: boolean;
}

/**
 * Sortable platform node for orbital platform nodes
 */
export function SortablePlatformNode({
  id,
  icon,
  label,
  sublabel,
  color,
  angle,
  radius = 320,
  onEdit,
  onDelete,
  isEditMode = false,
}: SortablePlatformNodeProps) {
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
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const angleRad = (angle * Math.PI) / 180;
  const x = radius * Math.cos(angleRad);
  const y = radius * Math.sin(angleRad);

  const positionStyle = {
    left: '50%',
    top: '50%',
    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
  };

  const content = (
    <div className={`relative px-4 py-3 rounded-xl bg-gradient-to-br ${color} shadow-lg border ${
      isEditMode && isDragging ? 'border-white' : 'border-white/20'
    }`}>
      {isEditMode && (
        <button
          {...listeners}
          className="absolute -top-1 -left-1 cursor-grab active:cursor-grabbing p-1 bg-slate-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-3 h-3 text-white" />
        </button>
      )}
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="text-white font-semibold text-xs">{label}</p>
          <p className="text-white/70 text-[10px]">{sublabel}</p>
        </div>
      </div>
      {isEditMode && (
        <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 bg-blue-500 rounded-full text-white hover:bg-blue-600"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (!isEditMode) {
    return (
      <motion.div
        className="absolute group"
        style={positionStyle}
        whileHover={{ scale: 1.15, zIndex: 20 }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...positionStyle, position: 'absolute' }}
      {...attributes}
      className="group"
    >
      {content}
    </div>
  );
}

interface SortablePartnerProps {
  id: string;
  index: number;
  name: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditMode?: boolean;
}

/**
 * Sortable partner badge for external partners list
 */
export function SortablePartner({
  id: _id,
  index,
  name,
  onEdit,
  onDelete,
  isEditMode = false,
}: SortablePartnerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `partner-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  if (!isEditMode) {
    return (
      <motion.div
        className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
        whileHover={{ x: 4 }}
      >
        {name}
      </motion.div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative group">
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border ${
          isDragging ? 'border-blue-400' : 'border-slate-200 group-hover:border-blue-200'
        }`}
      >
        <button
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-200 rounded"
        >
          <GripVertical className="w-3 h-3 text-slate-400" />
        </button>
        <span className="flex-1 text-sm font-medium text-slate-700">{name}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-500"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
