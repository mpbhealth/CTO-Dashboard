import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, MotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Building2,
  Monitor,
  Globe,
  Rocket,
  LayoutGrid,
} from 'lucide-react';

interface Dashboard {
  id: string;
  name: string;
  shortName: string;
  path: string;
  icon: React.ElementType;
  gradient: string;
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
    description: 'Executive overview'
  },
  {
    id: 'cto',
    name: 'CTO Dashboard',
    shortName: 'CTO',
    path: '/ctod/home',
    icon: Monitor,
    gradient: 'from-slate-700 to-slate-800',
    description: 'Technical operations'
  },
  {
    id: 'command',
    name: 'Command Center',
    shortName: 'Command',
    path: '/ctod/command-center',
    icon: Rocket,
    gradient: 'from-violet-500 to-cyan-500',
    description: 'Fleet management'
  },
  {
    id: 'admin',
    name: 'Web Control Center',
    shortName: 'Admin',
    path: '/admin',
    icon: Globe,
    gradient: 'from-emerald-500 to-emerald-600',
    description: 'Site administration'
  }
];

interface DockDashboardSwitcherProps {
  mouseX: MotionValue<number>;
}

export function DockDashboardSwitcher({ mouseX }: DockDashboardSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Magnification effect (same as other dock items)
  const distance = useTransform(mouseX, (val) => {
    const bounds = buttonRef.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const baseSize = 48;
  const maxScale = 1.5;
  const magnifyRange = 150;

  const scale = useTransform(distance, [-magnifyRange, 0, magnifyRange], [1, maxScale, 1]);
  const springScale = useSpring(scale, { mass: 0.1, stiffness: 150, damping: 12 });
  const size = useTransform(springScale, (s) => s * baseSize);

  // Determine current dashboard
  const getCurrentDashboard = (): Dashboard => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return dashboards.find(d => d.id === 'admin')!;
    if (path.includes('/command-center')) return dashboards.find(d => d.id === 'command')!;
    if (path.startsWith('/ceod')) return dashboards.find(d => d.id === 'ceo')!;
    return dashboards.find(d => d.id === 'cto')!;
  };

  const currentDashboard = getCurrentDashboard();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard shortcut: Cmd/Ctrl + Shift + D
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSwitch = (dashboard: Dashboard) => {
    setIsOpen(false);
    setTimeout(() => {
      navigate(dashboard.path);
    }, 100);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Dock Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          galaxy-dock-item dock-magnify relative
          ${isOpen ? 'ring-2 ring-primary/50' : ''}
        `}
        style={{
          width: size,
          height: size,
        }}
        whileTap={{ scale: 0.95 }}
        title={`Switch Dashboard (⌘⇧D) - Current: ${currentDashboard.shortName}`}
        aria-label="Switch Dashboard"
        aria-expanded={isOpen}
      >
        <div className={`
          w-6 h-6 rounded-lg flex items-center justify-center
          bg-gradient-to-br ${currentDashboard.gradient}
        `}>
          <LayoutGrid className="w-4 h-4 text-white" />
        </div>

        {/* Current dashboard indicator dot */}
        <motion.span
          className="absolute -bottom-1.5 left-1/2 w-1 h-1 rounded-full bg-primary"
          style={{ x: '-50%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="
              absolute bottom-full left-1/2 -translate-x-1/2 mb-3
              bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl
              rounded-xl shadow-2xl shadow-black/20
              border border-white/30 dark:border-slate-700/50
              overflow-hidden
              min-w-[260px]
            "
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Switch Dashboard
                </span>
                <kbd className="text-[10px] text-slate-400 font-mono bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-sm">
                  ⌘⇧D
                </kbd>
              </div>
            </div>

            {/* Dashboard Options */}
            <div className="p-1.5">
              {dashboards.map((dashboard, index) => {
                const Icon = dashboard.icon;
                const isActive = dashboard.id === currentDashboard.id;

                return (
                  <motion.button
                    key={dashboard.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSwitch(dashboard)}
                    disabled={isActive}
                    className={`
                      w-full flex items-center gap-2.5 p-2 rounded-lg
                      transition-all duration-150 text-left
                      ${isActive
                        ? 'bg-slate-100 dark:bg-slate-700 cursor-default'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 cursor-pointer'
                      }
                    `}
                  >
                    <div className={`
                      w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                      bg-gradient-to-br ${dashboard.gradient}
                      shadow-sm
                      ${isActive ? 'ring-2 ring-offset-1 ring-slate-300 dark:ring-slate-500' : ''}
                    `}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                          {dashboard.name}
                        </p>
                        {isActive && (
                          <span className="px-1 py-0.5 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {dashboard.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DockDashboardSwitcher;
