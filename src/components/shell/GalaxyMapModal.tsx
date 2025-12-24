'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Pin,
  PinOff,
  ExternalLink,
  LayoutDashboard,
  Terminal,
  Orbit,
  Ticket,
  BarChart3,
  ShieldCheck,
  Settings,
  Briefcase,
  Users,
  TrendingUp,
  FileText,
  Cog,
} from 'lucide-react';
import { useApps } from '@/hooks/useApps';
import { usePinnedApps } from '@/hooks/usePinnedApps';

interface GalaxyMapModalProps {
  onClose: () => void;
}

/**
 * Icon mapping for apps
 */
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Terminal,
  Orbit,
  Ticket,
  BarChart3,
  ShieldCheck,
  Settings,
  Briefcase,
  Users,
  TrendingUp,
  FileText,
  Cog,
};

/**
 * Category colors for visual distinction
 */
const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  Executive: {
    bg: 'from-indigo-500/20 to-purple-500/20',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
  },
  Operations: {
    bg: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
  Analytics: {
    bg: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  Compliance: {
    bg: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
  System: {
    bg: 'from-slate-500/20 to-gray-500/20',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
  },
};

/**
 * GalaxyMapModal - Universe map showing all available apps
 * 
 * Features:
 * - Apps grouped by category ("galaxies")
 * - Search and filter
 * - Pin/Unpin apps to dock
 * - Visual distinction for app categories
 * - Animated planet/orbit styling
 */
export function GalaxyMapModal({ onClose }: GalaxyMapModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { apps, isLoading } = useApps();
  const { pinnedApps, pinApp, unpinApp } = usePinnedApps();

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(apps.map((app) => app.category));
    return Array.from(cats).sort();
  }, [apps]);

  // Filter apps based on search and category
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesQuery =
        !query.trim() ||
        app.name.toLowerCase().includes(query.toLowerCase()) ||
        app.description?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !selectedCategory || app.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [apps, query, selectedCategory]);

  // Group apps by category
  const groupedApps = useMemo(() => {
    const groups: Record<string, typeof apps> = {};
    filteredApps.forEach((app) => {
      if (!groups[app.category]) {
        groups[app.category] = [];
      }
      groups[app.category].push(app);
    });
    return groups;
  }, [filteredApps]);

  // Check if app is pinned
  const isPinned = (appKey: string) => {
    return pinnedApps.some((p) => p.key === appKey);
  };

  // Handle app navigation
  const handleAppClick = (app: typeof apps[0]) => {
    onClose();
    if (app.kind === 'external') {
      window.open(app.href, '_blank');
    } else {
      router.push(app.href);
    }
  };

  // Handle pin toggle
  const handlePinToggle = async (e: React.MouseEvent, appId: string, appKey: string) => {
    e.stopPropagation();
    if (isPinned(appKey)) {
      await unpinApp(appId);
    } else {
      await pinApp(appId);
    }
  };

  return (
    <AnimatePresence>
      <div className="galaxy-map" onClick={onClose}>
        <motion.div
          className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                Galaxy Map
              </h2>
              <p className="text-sm text-slate-400">Navigate your app universe</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search apps..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 outline-none focus:border-primary/50"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap
                    transition-colors
                    ${!selectedCategory ? 'bg-primary text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}
                  `}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap
                      transition-colors
                      ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-slate-400">Loading apps...</p>
              </div>
            ) : Object.keys(groupedApps).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No apps found matching your search.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedApps).map(([category, categoryApps]) => {
                  const colors = categoryColors[category] || categoryColors.System;
                  return (
                    <motion.div
                      key={category}
                      className={`galaxy-category bg-gradient-to-br ${colors.bg} ${colors.border}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Category Header */}
                      <h3 className={`text-lg font-bold ${colors.text} mb-4`}>{category}</h3>

                      {/* Apps Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryApps.map((app, idx) => {
                          const Icon = iconMap[app.icon] || LayoutDashboard;
                          const pinned = isPinned(app.key);

                          return (
                            <motion.div
                              key={app.key}
                              className="galaxy-app-card group"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => handleAppClick(app)}
                            >
                              <div className="flex items-start gap-3">
                                {/* App Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
                                  <Icon className={`w-6 h-6 ${colors.text}`} />
                                </div>

                                {/* App Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-white truncate">{app.name}</h4>
                                    {app.kind === 'external' && (
                                      <ExternalLink className="w-3 h-3 text-slate-500" />
                                    )}
                                  </div>
                                  {app.description && (
                                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                                      {app.description}
                                    </p>
                                  )}
                                </div>

                                {/* Pin Button */}
                                <button
                                  onClick={(e) => handlePinToggle(e, app.id, app.key)}
                                  className={`
                                    p-2 rounded-lg opacity-0 group-hover:opacity-100
                                    transition-all duration-200
                                    ${pinned ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-400'}
                                  `}
                                  title={pinned ? 'Unpin from dock' : 'Pin to dock'}
                                >
                                  {pinned ? (
                                    <PinOff className="w-4 h-4" />
                                  ) : (
                                    <Pin className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

