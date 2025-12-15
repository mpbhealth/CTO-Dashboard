import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ChevronDown, 
  Building2, 
  Monitor, 
  Globe,
  Check
} from 'lucide-react';

interface Dashboard {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

const dashboards: Dashboard[] = [
  {
    id: 'ceo',
    name: 'CEO Dashboard',
    description: 'Executive overview & business metrics',
    path: '/ceod/home',
    icon: Building2,
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'cto',
    name: 'CTO Dashboard',
    description: 'Technical operations & development',
    path: '/ctod/home',
    icon: Monitor,
    color: 'text-slate-700',
    gradient: 'from-slate-700 to-slate-800'
  },
  {
    id: 'admin',
    name: 'Web Control Center',
    description: 'Site management & administration',
    path: '/admin',
    icon: Globe,
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-emerald-600'
  }
];

interface DashboardSwitcherProps {
  variant?: 'dropdown' | 'compact';
  className?: string;
}

export function DashboardSwitcher({ variant = 'dropdown', className = '' }: DashboardSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine current dashboard based on route
  const getCurrentDashboard = (): Dashboard => {
    const path = location.pathname;
    if (path.startsWith('/admin')) {
      return dashboards.find(d => d.id === 'admin')!;
    }
    if (path.startsWith('/ceod')) {
      return dashboards.find(d => d.id === 'ceo')!;
    }
    if (path.startsWith('/ctod')) {
      return dashboards.find(d => d.id === 'cto')!;
    }
    return dashboards[0];
  };

  const currentDashboard = getCurrentDashboard();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
      // Cmd/Ctrl + Shift + D to toggle switcher
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'd') {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSwitch = (dashboard: Dashboard) => {
    setIsOpen(false);
    navigate(dashboard.path);
  };

  const CurrentIcon = currentDashboard.icon;

  if (variant === 'compact') {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            p-2 rounded-lg transition-all duration-200
            bg-gradient-to-r ${currentDashboard.gradient}
            text-white shadow-md hover:shadow-lg
            active:scale-95 touch-manipulation
          `}
          title="Switch Dashboard (⌘⇧D)"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2">
              {dashboards.map((dashboard) => {
                const Icon = dashboard.icon;
                const isActive = dashboard.id === currentDashboard.id;
                
                return (
                  <button
                    key={dashboard.id}
                    onClick={() => handleSwitch(dashboard)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg
                      transition-all duration-200 text-left
                      ${isActive 
                        ? 'bg-slate-100' 
                        : 'hover:bg-slate-50 active:bg-slate-100'
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      bg-gradient-to-br ${dashboard.gradient} text-white
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{dashboard.name}</p>
                      <p className="text-xs text-slate-500 truncate">{dashboard.description}</p>
                    </div>
                    {isActive && (
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl
          bg-white/10 hover:bg-white/20
          transition-all duration-200
          active:scale-[0.98] touch-manipulation
          w-full text-left
        `}
      >
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          bg-white/20 backdrop-blur-sm
        `}>
          <CurrentIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white leading-tight">{currentDashboard.name}</p>
          <p className="text-xs text-white/70">Switch dashboard</p>
        </div>
        <ChevronDown className={`
          w-4 h-4 text-white/70 transition-transform duration-200 flex-shrink-0
          ${isOpen ? 'rotate-180' : ''}
        `} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-2 space-y-1">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Switch Dashboard
              </p>
              <p className="text-xs text-slate-400 mt-0.5">⌘⇧D for keyboard shortcut</p>
            </div>
            
            {dashboards.map((dashboard) => {
              const Icon = dashboard.icon;
              const isActive = dashboard.id === currentDashboard.id;
              
              return (
                <button
                  key={dashboard.id}
                  onClick={() => handleSwitch(dashboard)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg
                    transition-all duration-200 text-left
                    ${isActive 
                      ? 'bg-slate-100 ring-2 ring-slate-200' 
                      : 'hover:bg-slate-50 active:bg-slate-100'
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    bg-gradient-to-br ${dashboard.gradient} text-white
                    shadow-md
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{dashboard.name}</p>
                    <p className="text-xs text-slate-500 truncate">{dashboard.description}</p>
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-emerald-600 font-medium">Active</span>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Floating version for header/toolbar use
export function FloatingDashboardSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCurrentDashboard = (): Dashboard => {
    const path = location.pathname;
    if (path.startsWith('/admin')) {
      return dashboards.find(d => d.id === 'admin')!;
    }
    if (path.startsWith('/ceod')) {
      return dashboards.find(d => d.id === 'ceo')!;
    }
    if (path.startsWith('/ctod')) {
      return dashboards.find(d => d.id === 'cto')!;
    }
    return dashboards[0];
  };

  const currentDashboard = getCurrentDashboard();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (dashboard: Dashboard) => {
    setIsOpen(false);
    navigate(dashboard.path);
  };

  const CurrentIcon = currentDashboard.icon;

  return (
    <div ref={dropdownRef} className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-2xl
          bg-gradient-to-r ${currentDashboard.gradient}
          text-white shadow-xl hover:shadow-2xl
          transition-all duration-300 ease-out
          active:scale-95 touch-manipulation
          hover:scale-105
        `}
        title="Switch Dashboard (⌘⇧D)"
      >
        <CurrentIcon className="w-5 h-5" />
        <span className="font-medium text-sm hidden sm:inline">{currentDashboard.name}</span>
        <ChevronDown className={`
          w-4 h-4 transition-transform duration-200
          ${isOpen ? 'rotate-180' : ''}
        `} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-700">Switch Dashboard</p>
            <p className="text-xs text-slate-500 mt-0.5">Press ⌘⇧D for quick switch</p>
          </div>
          
          <div className="p-2">
            {dashboards.map((dashboard) => {
              const Icon = dashboard.icon;
              const isActive = dashboard.id === currentDashboard.id;
              
              return (
                <button
                  key={dashboard.id}
                  onClick={() => handleSwitch(dashboard)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl
                    transition-all duration-200 text-left
                    ${isActive 
                      ? 'bg-gradient-to-r from-slate-100 to-slate-50 ring-2 ring-slate-200' 
                      : 'hover:bg-slate-50 active:bg-slate-100'
                    }
                  `}
                >
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    bg-gradient-to-br ${dashboard.gradient} text-white
                    shadow-lg
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 truncate">{dashboard.name}</p>
                      {isActive && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{dashboard.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardSwitcher;

