import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApps } from '@/hooks/useApps';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { useQuickActions, executeQuickAction } from '@/hooks/useQuickActions';

interface SearchResult {
  id: string;
  type: 'app' | 'external' | 'action';
  title: string;
  description?: string;
  icon: string;
  href?: string;
  action?: () => void;
}

interface DockSearchBarProps {
  onClose?: () => void;
}

/**
 * DockSearchBar - Spotlight-style inline search for the command dock
 * 
 * Features:
 * - Click to expand from icon to full search bar
 * - Fuzzy search across apps, external links, and quick actions
 * - Keyboard navigation (up/down/enter/escape)
 * - Animated expand/collapse transitions
 */
export function DockSearchBar({ onClose }: DockSearchBarProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { apps } = useApps();
  const { externalLinks } = useExternalLinks();
  const { quickActions } = useQuickActions();

  // Build unified search results
  const allResults = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];

    // Add apps
    apps.forEach((app) => {
      results.push({
        id: `app-${app.id}`,
        type: 'app',
        title: app.name,
        description: app.description || undefined,
        icon: app.icon,
        href: app.href,
      });
    });

    // Add external links
    externalLinks.forEach((link) => {
      results.push({
        id: `external-${link.id}`,
        type: 'external',
        title: link.name,
        description: link.url,
        icon: link.icon,
        action: () => window.open(link.url, '_blank', 'noopener,noreferrer'),
      });
    });

    // Add quick actions
    quickActions.forEach((action) => {
      results.push({
        id: `action-${action.id}`,
        type: 'action',
        title: action.label,
        description: action.description || undefined,
        icon: action.icon,
        action: () => executeQuickAction(action),
      });
    });

    return results;
  }, [apps, externalLinks, quickActions]);

  // Filter results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) return allResults.slice(0, 8);

    const lowerQuery = query.toLowerCase();
    return allResults
      .filter((result) => {
        const titleMatch = result.title.toLowerCase().includes(lowerQuery);
        const descMatch = result.description?.toLowerCase().includes(lowerQuery);
        return titleMatch || descMatch;
      })
      .slice(0, 8);
  }, [allResults, query]);

  // Handle expand
  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Handle collapse
  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    setQuery('');
    setSelectedIndex(0);
    onClose?.();
  }, [onClose]);

  // Handle result selection
  const handleSelect = useCallback((result: SearchResult) => {
    if (result.href) {
      navigate(result.href);
    } else if (result.action) {
      result.action();
    }
    handleCollapse();
  }, [navigate, handleCollapse]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleCollapse();
        break;
    }
  }, [filteredResults, selectedIndex, handleSelect, handleCollapse]);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCollapse();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, handleCollapse]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <div ref={containerRef} className="relative">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Collapsed state - just the search icon
          <motion.button
            key="collapsed"
            className="dock-search-trigger"
            onClick={handleExpand}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Search (⌘/)"
          >
            <Search className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </motion.button>
        ) : (
          // Expanded state - full search bar with results
          <motion.div
            key="expanded"
            className="dock-search-expanded"
            initial={{ width: 48, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 48, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Search input */}
            <div className="dock-search-input-wrapper">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search apps, links, actions..."
                className="dock-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button
                className="dock-search-close"
                onClick={handleCollapse}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search results dropdown */}
            {filteredResults.length > 0 && (
              <motion.div
                className="dock-search-results"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {filteredResults.map((result, index) => (
                  <button
                    key={result.id}
                    className={`dock-search-result ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="dock-search-result-icon">
                      {result.type === 'external' && (
                        <ExternalLinkIcon className="w-4 h-4" />
                      )}
                      {result.type !== 'external' && (
                        <span className="text-xs font-medium">
                          {result.type === 'app' ? 'A' : 'Q'}
                        </span>
                      )}
                    </div>
                    <div className="dock-search-result-content">
                      <span className="dock-search-result-title">{result.title}</span>
                      {result.description && (
                        <span className="dock-search-result-desc">{result.description}</span>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <ArrowRight className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}

            {/* No results */}
            {query && filteredResults.length === 0 && (
              <motion.div
                className="dock-search-no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No results for "{query}"
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

