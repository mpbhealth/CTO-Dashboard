import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Monitor,
  Globe,
  Rocket,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface Dashboard {
  id: string;
  name: string;
  shortName: string;
  path: string;
  icon: React.ElementType;
  gradient: string;
  bgColor: string;
  description: string;
}

const dashboards: Dashboard[] = [
  {
    id: 'ceo',
    name: 'CEO Dashboard',
    shortName: 'CEO',
    path: '/ceod/home',
    icon: Building2,
    gradient: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-500',
    description: 'Executive overview'
  },
  {
    id: 'cto',
    name: 'CTO Dashboard',
    shortName: 'CTO',
    path: '/ctod/home',
    icon: Monitor,
    gradient: 'from-slate-700 to-slate-800',
    bgColor: 'bg-slate-700',
    description: 'Technical operations'
  },
  {
    id: 'command',
    name: 'Command Center',
    shortName: 'Command',
    path: '/ctod/command-center',
    icon: Rocket,
    gradient: 'from-violet-500 to-cyan-500',
    bgColor: 'bg-violet-500',
    description: 'Fleet management'
  },
  {
    id: 'admin',
    name: 'Web Control Center',
    shortName: 'Admin',
    path: '/admin',
    icon: Globe,
    gradient: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-500',
    description: 'Site administration'
  }
];

export function UniversalDashboardSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine current dashboard
  const getCurrentDashboard = (): Dashboard => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return dashboards.find(d => d.id === 'admin')!;
    if (path.includes('/command-center')) return dashboards.find(d => d.id === 'command')!;
    if (path.startsWith('/ceod')) return dashboards.find(d => d.id === 'ceo')!;
    return dashboards.find(d => d.id === 'cto')!;
  };

  const currentDashboard = getCurrentDashboard();
  const CurrentIcon = currentDashboard.icon;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + Shift + D
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setIsExpanded(prev => !prev);
      }
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSwitch = (dashboard: Dashboard) => {
    setIsExpanded(false);
    // Small delay for smooth animation
    setTimeout(() => {
      navigate(dashboard.path);
    }, 150);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]"
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Collapsed: Compact pill showing current dashboard
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsExpanded(true)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full
              bg-white/95 backdrop-blur-xl
              shadow-lg shadow-black/10
              border border-white/20
              hover:shadow-xl hover:scale-105
              active:scale-95
              transition-all duration-200
              cursor-pointer group
            `}
          >
            <div className={`
              w-7 h-7 rounded-full flex items-center justify-center
              bg-gradient-to-br ${currentDashboard.gradient}
              shadow-sm
            `}>
              <CurrentIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {currentDashboard.shortName}
            </span>
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />

            {/* Keyboard hint */}
            <div className="hidden sm:flex items-center gap-1 ml-1 pl-2 border-l border-slate-200">
              <kbd className="text-[10px] text-slate-400 font-mono">⌘⇧D</kbd>
            </div>
          </motion.button>
        ) : (
          // Expanded: Full dashboard selector
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="
              bg-white/95 backdrop-blur-xl
              rounded-2xl shadow-2xl shadow-black/20
              border border-white/30
              overflow-hidden
              min-w-[320px]
            "
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-slate-700">Switch Dashboard</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ESC to close
                </button>
              </div>
            </div>

            {/* Dashboard Options */}
            <div className="p-2">
              {dashboards.map((dashboard, index) => {
                const Icon = dashboard.icon;
                const isActive = dashboard.id === currentDashboard.id;

                return (
                  <motion.button
                    key={dashboard.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSwitch(dashboard)}
                    disabled={isActive}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-xl
                      transition-all duration-200 text-left
                      ${isActive
                        ? 'bg-slate-100 cursor-default'
                        : 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer'
                      }
                    `}
                  >
                    <div className={`
                      w-11 h-11 rounded-xl flex items-center justify-center
                      bg-gradient-to-br ${dashboard.gradient}
                      shadow-md
                      ${isActive ? 'ring-2 ring-offset-2 ring-slate-300' : ''}
                    `}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold truncate ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                          {dashboard.name}
                        </p>
                        {isActive && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{dashboard.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[11px] text-slate-400 text-center">
                Press <kbd className="px-1 py-0.5 bg-white rounded text-slate-500 font-mono shadow-sm">⌘⇧D</kbd> anytime to switch
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UniversalDashboardSwitcher;
