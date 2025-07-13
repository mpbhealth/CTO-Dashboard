import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Presentation, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  Move, 
  Eye, 
  EyeOff, 
  Settings, 
  Palette, 
  Type, 
  Image, 
  BarChart3, 
  Calendar, 
  Users, 
  TrendingUp, 
  Award, 
  Server, 
  Activity, 
  Building2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Save,
  Upload,
  Grid3X3,
  Layers,
  MousePointer,
  Square,
  Circle,
  Triangle,
  Diamond,
  Star,
  Hexagon,
  ArrowRight,
  Zap,
  Target,
  Heart,
  Shield,
  Database,
  Cpu,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Folder,
  Search,
  Filter,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  Lock,
  Unlock,
  Maximize,
  Minimize,
  MoreHorizontal,
  Edit3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Edit
} from 'lucide-react';
import { useRoadmapItems } from '../../hooks/useSupabaseData';
import { generatePresentationData, exportToPowerPoint, GraphicsUtils, type GraphicElement, type PresentationSlide } from '../../utils/presentationUtils';
import { exportPresentationToPowerPoint } from '../../utils/powerPointExport';

// Import mock data for other dashboards
import { advisorKpis, topAdvisors, salesTrends } from '../../data/mockAdvisorPerformance';
import { kpiMetrics, mrrData } from '../../data/mockAnalytics';
import { memberEngagementKPIs, dailyLoginsData } from '../../data/mockMemberEngagement';
import { retentionKPIs, retentionTimeline } from '../../data/mockRetention';
import { uptimeKPIs, systemComponents } from '../../data/mockUptime';

// Data source definitions
const DATA_SOURCES = {
  roadmap: {
    name: 'Technology Roadmap',
    icon: Calendar,
    color: '#3B82F6',
    description: 'Strategic technology initiatives and timeline',
    fields: ['title', 'quarter', 'status', 'priority', 'owner', 'department', 'description']
  },
  analytics: {
    name: 'Analytics Dashboard',
    icon: BarChart3,
    color: '#10B981',
    description: 'Business metrics and performance data',
    fields: ['revenue', 'users', 'conversion', 'growth']
  },
  advisorPerformance: {
    name: 'Advisor Performance',
    icon: Award,
    color: '#F59E0B',
    description: 'Sales advisor metrics and performance',
    fields: ['sales', 'deals', 'conversion', 'commission']
  },
  memberEngagement: {
    name: 'Member Engagement',
    icon: Users,
    color: '#8B5CF6',
    description: 'Member activity and engagement metrics',
    fields: ['logins', 'sessions', 'features', 'retention']
  },
  memberRetention: {
    name: 'Member Retention',
    icon: TrendingUp,
    color: '#EF4444',
    description: 'Member retention and churn analysis',
    fields: ['retention', 'churn', 'cohorts', 'reasons']
  },
  systemUptime: {
    name: 'System Uptime',
    icon: Activity,
    color: '#06B6D4',
    description: 'System health and uptime metrics',
    fields: ['uptime', 'incidents', 'response', 'components']
  },
  techStack: {
    name: 'Technology Stack',
    icon: Server,
    color: '#84CC16',
    description: 'Technology inventory and status',
    fields: ['technologies', 'versions', 'status', 'owners']
  },
  projects: {
    name: 'Active Projects',
    icon: Building2,
    color: '#F97316',
    description: 'Project progress and team assignments',
    fields: ['projects', 'progress', 'teams', 'status']
  }
};

// Enhanced slide templates with data source integration
const SLIDE_TEMPLATES = {
  title: {
    name: 'Title Slide',
    icon: Type,
    layout: 'title',
    description: 'Main presentation title and subtitle',
    defaultContent: {
      title: 'Presentation Title',
      subtitle: 'Subtitle and Date'
    }
  },
  overview: {
    name: 'Overview',
    icon: Grid3X3,
    layout: 'content',
    description: 'Executive summary with key metrics',
    supportedSources: ['roadmap', 'analytics', 'projects'],
    defaultContent: {
      title: 'Executive Overview',
      bullets: ['Key metric 1', 'Key metric 2', 'Key metric 3']
    }
  },
  metrics: {
    name: 'Key Metrics',
    icon: BarChart3,
    layout: 'chart',
    description: 'Data visualization and charts',
    supportedSources: ['analytics', 'advisorPerformance', 'memberEngagement', 'memberRetention'],
    defaultContent: {
      title: 'Key Performance Metrics',
      chartType: 'bar'
    }
  },
  timeline: {
    name: 'Timeline',
    icon: Calendar,
    layout: 'timeline',
    description: 'Project timeline and milestones',
    supportedSources: ['roadmap', 'projects'],
    defaultContent: {
      title: 'Project Timeline',
      timelineItems: []
    }
  },
  comparison: {
    name: 'Two Column',
    icon: Layers,
    layout: 'two-column',
    description: 'Side-by-side comparison',
    supportedSources: ['all'],
    defaultContent: {
      title: 'Comparison Analysis',
      leftColumn: ['Item 1', 'Item 2'],
      rightColumn: ['Item A', 'Item B']
    }
  },
  team: {
    name: 'Team & Resources',
    icon: Users,
    layout: 'content',
    description: 'Team structure and resource allocation',
    supportedSources: ['projects', 'roadmap'],
    defaultContent: {
      title: 'Team & Resources',
      bullets: ['Team structure', 'Resource allocation', 'Key responsibilities']
    }
  },
  status: {
    name: 'Status Update',
    icon: Activity,
    layout: 'content',
    description: 'Current status and progress',
    supportedSources: ['projects', 'roadmap', 'systemUptime'],
    defaultContent: {
      title: 'Current Status',
      bullets: ['Progress update', 'Key achievements', 'Next steps']
    }
  },
  nextSteps: {
    name: 'Next Steps',
    icon: Target,
    layout: 'content',
    description: 'Action items and future plans',
    supportedSources: ['roadmap', 'projects'],
    defaultContent: {
      title: 'Next Steps & Actions',
      bullets: ['Action item 1', 'Action item 2', 'Action item 3']
    }
  },
  blank: {
    name: 'Blank Slide',
    icon: Square,
    layout: 'custom',
    description: 'Empty slide for custom content',
    supportedSources: ['custom'],
    defaultContent: {
      title: 'Custom Slide'
    }
  }
};

export default function RoadmapPresentation() {
  const { data: roadmapItems, loading, error } = useRoadmapItems();
  const [presentation, setPresentation] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showElementPanel, setShowElementPanel] = useState(false);
  const [showDataSourcePanel, setShowDataSourcePanel] = useState(false);
  const [showSlideTemplates, setShowSlideTemplates] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('roadmap');
  const [theme, setTheme] = useState('corporate');
  const slideRef = useRef<HTMLDivElement>(null);

  // Enhanced themes with more options
  const themes = {
    corporate: {
      name: 'Corporate',
      primary: '#3B82F6',
      secondary: '#1E40AF',
      accent: '#10B981',
      background: 'from-blue-50 to-indigo-50',
      text: '#1F2937'
    },
    modern: {
      name: 'Modern',
      primary: '#6366F1',
      secondary: '#4F46E5',
      accent: '#8B5CF6',
      background: 'from-purple-50 to-pink-50',
      text: '#1F2937'
    },
    minimal: {
      name: 'Minimal',
      primary: '#1F2937',
      secondary: '#374151',
      accent: '#6B7280',
      background: 'from-gray-50 to-slate-50',
      text: '#1F2937'
    },
    dark: {
      name: 'Dark',
      primary: '#111827',
      secondary: '#1F2937',
      accent: '#10B981',
      background: 'from-gray-900 to-slate-900',
      text: '#FFFFFF'
    },
    creative: {
      name: 'Creative',
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      accent: '#EC4899',
      background: 'from-purple-50 to-pink-50',
      text: '#1F2937'
    },
    tech: {
      name: 'Tech',
      primary: '#10B981',
      secondary: '#059669',
      accent: '#3B82F6',
      background: 'from-emerald-50 to-cyan-50',
      text: '#1F2937'
    }
  };

  // Initialize presentation
  useEffect(() => {
    if (roadmapItems && roadmapItems.length > 0) {
      const generatedPresentation = generatePresentationData(roadmapItems);
      setPresentation({
        title: 'MPB Health Technology Roadmap',
        author: 'Vinnie R. Tannous, CTO',
        theme: theme,
        slides: generatedPresentation.slides,
        metadata: generatedPresentation.metadata
      });
    }
  }, [roadmapItems, theme]);

  // Get data for selected source
  const getDataForSource = (source: string) => {
    switch (source) {
      case 'roadmap':
        return roadmapItems || [];
      case 'analytics':
        return { kpis: kpiMetrics, revenue: mrrData };
      case 'advisorPerformance':
        return { kpis: advisorKpis, advisors: topAdvisors, trends: salesTrends };
      case 'memberEngagement':
        return { kpis: memberEngagementKPIs, logins: dailyLoginsData };
      case 'memberRetention':
        return { kpis: retentionKPIs, timeline: retentionTimeline };
      case 'systemUptime':
        return { kpis: uptimeKPIs, components: systemComponents };
      default:
        return [];
    }
  };

  // Generate content based on data source
  const generateContentFromDataSource = (source: string, template: string) => {
    const data = getDataForSource(source);
    const sourceConfig = DATA_SOURCES[source];
    
    switch (template) {
      case 'overview':
        if (source === 'roadmap' && Array.isArray(data)) {
          return {
            title: `${sourceConfig.name} Overview`,
            bullets: [
              `${data.length} strategic initiatives planned`,
              `${data.filter(item => item.priority === 'High').length} high-priority projects`,
              `${data.filter(item => item.status === 'In Progress').length} projects in active development`,
              `${Array.from(new Set(data.map(item => item.department))).length} departments involved`,
              `Spanning ${Array.from(new Set(data.map(item => item.quarter))).length} quarters`
            ]
          };
        } else if (source === 'analytics' && data.kpis) {
          return {
            title: `${sourceConfig.name} Overview`,
            bullets: data.kpis.map(kpi => `${kpi.title}: ${kpi.value} (${kpi.change})`)
          };
        }
        break;
      
      case 'metrics':
        if (data.kpis) {
          return {
            title: `${sourceConfig.name} Metrics`,
            chartType: 'bar',
            chartData: data.kpis.map(kpi => ({
              name: kpi.title,
              value: parseFloat(kpi.value.replace(/[^0-9.-]/g, '')) || 0,
              change: kpi.change
            }))
          };
        }
        break;
      
      case 'timeline':
        if (source === 'roadmap' && Array.isArray(data)) {
          const quarters = Array.from(new Set(data.map(item => item.quarter))).sort();
          return {
            title: `${sourceConfig.name} Timeline`,
            timelineItems: quarters.map(quarter => {
              const quarterItems = data.filter(item => item.quarter === quarter);
              return {
                quarter,
                title: `${quarterItems.length} initiatives`,
                description: quarterItems.slice(0, 2).map(item => item.title).join(', ')
              };
            })
          };
        }
        break;
    }
    
    return SLIDE_TEMPLATES[template].defaultContent;
  };

  // Add new slide
  const addSlide = (templateKey: string, dataSource?: string) => {
    if (!presentation) return;
    
    const template = SLIDE_TEMPLATES[templateKey];
    const content = dataSource 
      ? generateContentFromDataSource(dataSource, templateKey)
      : template.defaultContent;
    
    const newSlide: PresentationSlide = {
      id: `slide-${Date.now()}`,
      title: content.title || template.name,
      layout: template.layout,
      content,
      graphics: GraphicsUtils.generateDefaultGraphics(template.layout, theme),
      background: { type: 'gradient', value: themes[theme].background },
      notes: `Generated from ${dataSource ? DATA_SOURCES[dataSource].name : 'template'}`
    };
    
    const updatedSlides = [...presentation.slides];
    updatedSlides.splice(currentSlideIndex + 1, 0, newSlide);
    
    setPresentation({
      ...presentation,
      slides: updatedSlides
    });
    
    setCurrentSlideIndex(currentSlideIndex + 1);
    setShowSlideTemplates(false);
    setShowDataSourcePanel(false);
  };

  // Delete slide
  const deleteSlide = (index: number) => {
    if (!presentation || presentation.slides.length <= 1) return;
    
    const updatedSlides = presentation.slides.filter((_, i) => i !== index);
    setPresentation({
      ...presentation,
      slides: updatedSlides
    });
    
    if (currentSlideIndex >= updatedSlides.length) {
      setCurrentSlideIndex(updatedSlides.length - 1);
    } else if (currentSlideIndex > index) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  // Duplicate slide
  const duplicateSlide = (index: number) => {
    if (!presentation) return;
    
    const slideToClone = presentation.slides[index];
    const duplicatedSlide = {
      ...slideToClone,
      id: `slide-${Date.now()}`,
      title: `${slideToClone.title} (Copy)`,
      graphics: slideToClone.graphics.map(graphic => ({
        ...graphic,
        id: `${graphic.id}-copy-${Date.now()}`
      }))
    };
    
    const updatedSlides = [...presentation.slides];
    updatedSlides.splice(index + 1, 0, duplicatedSlide);
    
    setPresentation({
      ...presentation,
      slides: updatedSlides
    });
    
    setCurrentSlideIndex(index + 1);
  };

  // Move slide
  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (!presentation) return;
    
    const updatedSlides = [...presentation.slides];
    const [movedSlide] = updatedSlides.splice(fromIndex, 1);
    updatedSlides.splice(toIndex, 0, movedSlide);
    
    setPresentation({
      ...presentation,
      slides: updatedSlides
    });
    
    setCurrentSlideIndex(toIndex);
  };

  // Handle element drag
  const handleElementDrag = (elementId: string, newPosition: { x: number; y: number }) => {
    if (!presentation) return;
    
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedGraphics = currentSlide.graphics.map(graphic => 
      graphic.id === elementId 
        ? { ...graphic, position: { ...graphic.position, ...newPosition } }
        : graphic
    );
    
    const updatedSlides = [...presentation.slides];
    updatedSlides[currentSlideIndex] = {
      ...currentSlide,
      graphics: updatedGraphics
    };
    
    setPresentation({
      ...presentation,
      slides: updatedSlides
    });
  };

  // Add graphic element
  const addGraphicElement = (type: string, subtype?: string) => {
    if (!presentation) return;
    
    const currentSlide = presentation.slides[currentSlideIndex];
    const newElement: GraphicElement = {
      id: `element-${Date.now()}`,
      type: type as any,
      position: { x: 20, y: 30, width: 20, height: 15 },
      content: type === 'icon' ? { icon: subtype || 'star' } : 
                type === 'shape' ? { shape: subtype || 'rectangle' } :
                type === 'text' ? { text: 'New Text' } :
                type === 'image' ? { url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400' } :
                {},
      style: {
        backgroundColor: themes[theme].primary,
        borderColor: themes[theme].secondary,
        borderWidth: 2,
        borderRadius: 8,
        opacity: 0.8,
        color: themes[theme].text
      },
      animation: { type: 'fadeIn', duration: 500, delay: 0 }
    };
    
    const updatedSlides = [...presentation.slides];
    updatedSlides[currentSlideIndex] = {
      ...currentSlide,
      graphics: [...currentSlide.graphics, newElement]
    };
    
    setPresentation({
      ...presentation,
      slides: updatedSlides
    });
    
    setSelectedElement(newElement.id);
  };

  // Delete graphic element
  const deleteGraphicElement = (elementId: string) => {
    if (!presentation) return;
    
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedGraphics = currentSlide.graphics.filter(graphic => graphic.id !== elementId);
    
    const updatedSlides = [...presentation.slides];
    updatedSlides[currentSlideIndex] = {
      ...currentSlide,
      graphics: updatedGraphics
    };
    
    setPresentation({
      ...presentation,
      slides: updatedSlides
    });
    
    setSelectedElement(null);
  };

  // Update element style
  const updateElementStyle = (elementId: string, styleUpdates: any) => {
    if (!presentation) return;
    
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedGraphics = currentSlide.graphics.map(graphic => 
      graphic.id === elementId 
        ? { ...graphic, style: { ...graphic.style, ...styleUpdates } }
        : graphic
    );
    
    const updatedSlides = [...presentation.slides];
    updatedSlides[currentSlideIndex] = {
      ...currentSlide,
      graphics: updatedGraphics
    };
    
    setPresentation({
      ...presentation,
      slides: updatedSlides
    });
  };

  // Update slide content
  const updateSlideContent = (updates: any) => {
    if (!presentation) return;
    
    const currentSlide = presentation.slides[currentSlideIndex];
    const updatedSlides = [...presentation.slides];
    updatedSlides[currentSlideIndex] = {
      ...currentSlide,
      content: { ...currentSlide.content, ...updates }
    };
    
    setPresentation({
      ...presentation,
      slides: updatedSlides
    });
  };

  // Export presentation
  const handleExport = async () => {
    if (!presentation) return;
    
    try {
      await exportPresentationToPowerPoint(presentation);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Render slide content with proper margins
  const renderSlideContent = (slide: PresentationSlide) => {
    const currentTheme = themes[theme];
    
    return (
      <div className="relative w-full h-full overflow-hidden">
        {/* Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${slide.background?.value || currentTheme.background}`} />
        
        {/* Content based on layout with proper margins */}
        <div className="relative z-10 h-full">
          {slide.layout === 'title' && (
            <div className="flex flex-col items-center justify-center h-full text-center px-16 py-12">
              <h1 className="text-5xl font-bold mb-8 leading-tight" style={{ color: currentTheme.primary }}>
                {slide.content.title}
              </h1>
              {slide.content.subtitle && (
                <p className="text-xl leading-relaxed" style={{ color: currentTheme.text }}>
                  {slide.content.subtitle}
                </p>
              )}
            </div>
          )}
          
          {slide.layout === 'content' && (
            <div className="h-full px-16 py-12">
              <h2 className="text-3xl font-bold mb-10 leading-tight" style={{ color: currentTheme.primary }}>
                {slide.content.title}
              </h2>
              {slide.content.bullets && (
                <ul className="space-y-6 text-lg leading-relaxed" style={{ color: currentTheme.text }}>
                  {slide.content.bullets.map((bullet: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="w-3 h-3 rounded-full mt-2 mr-6 flex-shrink-0" 
                            style={{ backgroundColor: currentTheme.accent }} />
                      <span className="flex-1">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {slide.layout === 'two-column' && (
            <div className="h-full px-16 py-12">
              <h2 className="text-3xl font-bold mb-10 leading-tight" style={{ color: currentTheme.primary }}>
                {slide.content.title}
              </h2>
              <div className="grid grid-cols-2 gap-16 h-4/5">
                <div>
                  {slide.content.leftColumn && (
                    <ul className="space-y-4 text-base leading-relaxed" style={{ color: currentTheme.text }}>
                      {slide.content.leftColumn.map((item: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 rounded-full mt-2 mr-4 flex-shrink-0" 
                                style={{ backgroundColor: currentTheme.accent }} />
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  {slide.content.rightColumn && (
                    <ul className="space-y-4 text-base leading-relaxed" style={{ color: currentTheme.text }}>
                      {slide.content.rightColumn.map((item: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 rounded-full mt-2 mr-4 flex-shrink-0" 
                                style={{ backgroundColor: currentTheme.accent }} />
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {slide.layout === 'timeline' && (
            <div className="h-full px-16 py-12">
              <h2 className="text-3xl font-bold mb-10 leading-tight" style={{ color: currentTheme.primary }}>
                {slide.content.title}
              </h2>
              <div className="space-y-8">
                {slide.content.timelineItems?.map((item: any, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="flex flex-col items-center mr-8">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: currentTheme.accent }} />
                      {index < slide.content.timelineItems.length - 1 && (
                        <div className="w-0.5 h-16 mt-3" style={{ backgroundColor: currentTheme.accent, opacity: 0.3 }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2" style={{ color: currentTheme.primary }}>
                        {item.quarter}
                      </h3>
                      <p className="text-lg mb-2" style={{ color: currentTheme.text }}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-base leading-relaxed" style={{ color: currentTheme.text, opacity: 0.7 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.layout === 'custom' && (
            <div className="h-full px-16 py-12">
              <h2 className="text-3xl font-bold mb-10 leading-tight" style={{ color: currentTheme.primary }}>
                {slide.content.title}
              </h2>
              <div className="text-center text-lg" style={{ color: currentTheme.text, opacity: 0.6 }}>
                Custom content area - Add elements using the Elements panel
              </div>
            </div>
          )}
        </div>
        
        {/* Graphics Elements */}
        {slide.graphics?.map((graphic) => (
          <GraphicElement
            key={graphic.id}
            graphic={graphic}
            isSelected={selectedElement === graphic.id}
            onSelect={setSelectedElement}
            onDrag={handleElementDrag}
            onDelete={deleteGraphicElement}
            theme={currentTheme}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading presentation data</p>
          <p className="text-slate-600">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  const currentSlide = presentation.slides[currentSlideIndex];

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Presentation className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-semibold text-slate-900">{presentation.title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">
                Slide {currentSlideIndex + 1} of {presentation.slides.length}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Theme Selector */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.entries(themes).map(([key, themeData]) => (
                <option key={key} value={key}>{themeData.name}</option>
              ))}
            </select>
            
            {/* Add Slide */}
            <button
              onClick={() => setShowSlideTemplates(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Slide</span>
            </button>
            
            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Slide Thumbnails */}
        {!isFullscreen && (
          <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Slides</h3>
              <div className="space-y-2">
                {presentation.slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                      index === currentSlideIndex
                        ? 'bg-indigo-50 border-2 border-indigo-200'
                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    <div className="aspect-video bg-white rounded border border-slate-200 mb-2 overflow-hidden">
                      <div className="w-full h-full transform scale-[0.15] origin-top-left">
                        <div style={{ width: '800px', height: '600px' }}>
                          {renderSlideContent(slide)}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate">
                      {slide.title}
                    </p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateSlide(index);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {presentation.slides.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSlide(index);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Slide Area */}
        <div className="flex-1 flex flex-col">
          {/* Slide Navigation */}
          <div className="bg-white border-b border-slate-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                  className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentSlideIndex(Math.min(presentation.slides.length - 1, currentSlideIndex + 1))}
                  disabled={currentSlideIndex === presentation.slides.length - 1}
                  className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowContentEditor(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Content</span>
                </button>
                
                <button
                  onClick={() => setShowElementPanel(!showElementPanel)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    showElementPanel ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Elements</span>
                </button>
                
                <button
                  onClick={() => setShowDataSourcePanel(!showDataSourcePanel)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    showDataSourcePanel ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Data</span>
                </button>

                {selectedElement && (
                  <button
                    onClick={() => setShowStylePanel(!showStylePanel)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      showStylePanel ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Palette className="w-4 h-4" />
                    <span>Style</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Slide Canvas */}
          <div className="flex-1 p-6 bg-slate-100">
            <div 
              ref={slideRef}
              className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
              style={{ 
                width: isFullscreen ? '100vw' : '800px', 
                height: isFullscreen ? '100vh' : '600px',
                aspectRatio: '4/3'
              }}
            >
              {renderSlideContent(currentSlide)}
            </div>
          </div>
        </div>

        {/* Side Panels */}
        <AnimatePresence>
          {(showElementPanel || showDataSourcePanel || showStylePanel) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border-l border-slate-200 overflow-hidden"
            >
              {showElementPanel && <ElementPanel onAddElement={addGraphicElement} theme={themes[theme]} />}
              {showDataSourcePanel && (
                <DataSourcePanel 
                  selectedSource={selectedDataSource}
                  onSourceChange={setSelectedDataSource}
                  onGenerateSlide={(template) => addSlide(template, selectedDataSource)}
                />
              )}
              {showStylePanel && selectedElement && (
                <StylePanel 
                  elementId={selectedElement}
                  currentSlide={currentSlide}
                  onUpdateStyle={updateElementStyle}
                  theme={themes[theme]}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Editor Modal */}
      <AnimatePresence>
        {showContentEditor && (
          <ContentEditorModal
            slide={currentSlide}
            onClose={() => setShowContentEditor(false)}
            onUpdate={updateSlideContent}
          />
        )}
      </AnimatePresence>

      {/* Slide Templates Modal */}
      <AnimatePresence>
        {showSlideTemplates && (
          <SlideTemplatesModal
            onClose={() => setShowSlideTemplates(false)}
            onSelectTemplate={(template) => {
              setShowSlideTemplates(false);
              setShowDataSourcePanel(true);
              // Store selected template for data source selection
              (window as any).selectedTemplate = template;
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Content Editor Modal Component
function ContentEditorModal({ 
  slide, 
  onClose, 
  onUpdate 
}: { 
  slide: PresentationSlide; 
  onClose: () => void; 
  onUpdate: (updates: any) => void;
}) {
  const [content, setContent] = useState(slide.content);

  const handleSave = () => {
    onUpdate(content);
    onClose();
  };

  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...(content.bullets || [])];
    newBullets[index] = value;
    setContent({ ...content, bullets: newBullets });
  };

  const addBullet = () => {
    const newBullets = [...(content.bullets || []), ''];
    setContent({ ...content, bullets: newBullets });
  };

  const removeBullet = (index: number) => {
    const newBullets = (content.bullets || []).filter((_, i) => i !== index);
    setContent({ ...content, bullets: newBullets });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Edit Slide Content</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={content.title || ''}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Slide title"
            />
          </div>

          {/* Subtitle (for title slides) */}
          {slide.layout === 'title' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
              <input
                type="text"
                value={content.subtitle || ''}
                onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Slide subtitle"
              />
            </div>
          )}

          {/* Bullets (for content slides) */}
          {(slide.layout === 'content' || slide.layout === 'custom') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Bullet Points</label>
                <button
                  onClick={addBullet}
                  className="flex items-center space-x-1 px-2 py-1 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-2">
                {(content.bullets || []).map((bullet, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => handleBulletChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={`Bullet point ${index + 1}`}
                    />
                    <button
                      onClick={() => removeBullet(index)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two Column Content */}
          {slide.layout === 'two-column' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Left Column</label>
                <textarea
                  value={(content.leftColumn || []).join('\n')}
                  onChange={(e) => setContent({ 
                    ...content, 
                    leftColumn: e.target.value.split('\n').filter(line => line.trim()) 
                  })}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter items, one per line"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Right Column</label>
                <textarea
                  value={(content.rightColumn || []).join('\n')}
                  onChange={(e) => setContent({ 
                    ...content, 
                    rightColumn: e.target.value.split('\n').filter(line => line.trim()) 
                  })}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter items, one per line"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Style Panel Component
function StylePanel({ 
  elementId, 
  currentSlide, 
  onUpdateStyle, 
  theme 
}: { 
  elementId: string; 
  currentSlide: PresentationSlide; 
  onUpdateStyle: (id: string, updates: any) => void;
  theme: any;
}) {
  const element = currentSlide.graphics.find(g => g.id === elementId);
  if (!element) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Element Style</h3>
        <p className="text-sm text-slate-600 mt-1">Customize the selected element</p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Background Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
          <input
            type="color"
            value={element.style.backgroundColor || theme.primary}
            onChange={(e) => onUpdateStyle(elementId, { backgroundColor: e.target.value })}
            className="w-full h-10 rounded border border-slate-300"
          />
        </div>

        {/* Border Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Border Color</label>
          <input
            type="color"
            value={element.style.borderColor || theme.secondary}
            onChange={(e) => onUpdateStyle(elementId, { borderColor: e.target.value })}
            className="w-full h-10 rounded border border-slate-300"
          />
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Opacity ({Math.round((element.style.opacity || 1) * 100)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={element.style.opacity || 1}
            onChange={(e) => onUpdateStyle(elementId, { opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Border Width */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Border Width ({element.style.borderWidth || 0}px)
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={element.style.borderWidth || 0}
            onChange={(e) => onUpdateStyle(elementId, { borderWidth: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Border Radius */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Border Radius ({element.style.borderRadius || 0}px)
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={element.style.borderRadius || 0}
            onChange={(e) => onUpdateStyle(elementId, { borderRadius: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Rotation ({element.style.rotation || 0}°)
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={element.style.rotation || 0}
            onChange={(e) => onUpdateStyle(elementId, { rotation: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Position and Size */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-700">Position & Size</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-600 mb-1">X (%)</label>
              <input
                type="number"
                value={Math.round(element.position.x)}
                onChange={(e) => {
                  const currentSlide = { graphics: [element] };
                  const updatedGraphics = currentSlide.graphics.map(g => 
                    g.id === elementId 
                      ? { ...g, position: { ...g.position, x: parseInt(e.target.value) || 0 } }
                      : g
                  );
                  // This would need to be handled by the parent component
                }}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Y (%)</label>
              <input
                type="number"
                value={Math.round(element.position.y)}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Width (%)</label>
              <input
                type="number"
                value={Math.round(element.position.width)}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Height (%)</label>
              <input
                type="number"
                value={Math.round(element.position.height)}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Element Panel Component
function ElementPanel({ onAddElement, theme }: { onAddElement: (type: string, subtype?: string) => void; theme: any }) {
  const [activeCategory, setActiveCategory] = useState('shapes');

  const categories = {
    shapes: {
      name: 'Shapes',
      icon: Square,
      items: [
        { name: 'Rectangle', icon: Square, type: 'shape', subtype: 'rectangle' },
        { name: 'Circle', icon: Circle, type: 'shape', subtype: 'circle' },
        { name: 'Triangle', icon: Triangle, type: 'shape', subtype: 'triangle' },
        { name: 'Diamond', icon: Diamond, type: 'shape', subtype: 'diamond' },
        { name: 'Star', icon: Star, type: 'shape', subtype: 'star' },
        { name: 'Hexagon', icon: Hexagon, type: 'shape', subtype: 'hexagon' },
        { name: 'Arrow', icon: ArrowRight, type: 'shape', subtype: 'arrow' }
      ]
    },
    icons: {
      name: 'Icons',
      icon: Zap,
      items: [
        { name: 'Target', icon: Target, type: 'icon', subtype: 'target' },
        { name: 'Users', icon: Users, type: 'icon', subtype: 'users' },
        { name: 'Chart', icon: BarChart3, type: 'icon', subtype: 'chart' },
        { name: 'Calendar', icon: Calendar, type: 'icon', subtype: 'calendar' },
        { name: 'Heart', icon: Heart, type: 'icon', subtype: 'heart' },
        { name: 'Shield', icon: Shield, type: 'icon', subtype: 'shield' },
        { name: 'Database', icon: Database, type: 'icon', subtype: 'database' },
        { name: 'CPU', icon: Cpu, type: 'icon', subtype: 'cpu' },
        { name: 'Globe', icon: Globe, type: 'icon', subtype: 'globe' },
        { name: 'Mail', icon: Mail, type: 'icon', subtype: 'mail' },
        { name: 'Phone', icon: Phone, type: 'icon', subtype: 'phone' },
        { name: 'Message', icon: MessageCircle, type: 'icon', subtype: 'message' },
        { name: 'File', icon: FileText, type: 'icon', subtype: 'file' },
        { name: 'Folder', icon: Folder, type: 'icon', subtype: 'folder' },
        { name: 'Search', icon: Search, type: 'icon', subtype: 'search' },
        { name: 'Filter', icon: Filter, type: 'icon', subtype: 'filter' },
        { name: 'Refresh', icon: RefreshCw, type: 'icon', subtype: 'refresh' },
        { name: 'Check', icon: Check, type: 'icon', subtype: 'check' },
        { name: 'X', icon: X, type: 'icon', subtype: 'x' },
        { name: 'Alert', icon: AlertCircle, type: 'icon', subtype: 'alert' },
        { name: 'Info', icon: Info, type: 'icon', subtype: 'info' },
        { name: 'Help', icon: HelpCircle, type: 'icon', subtype: 'help' },
        { name: 'Lock', icon: Lock, type: 'icon', subtype: 'lock' },
        { name: 'Unlock', icon: Unlock, type: 'icon', subtype: 'unlock' }
      ]
    },
    text: {
      name: 'Text',
      icon: Type,
      items: [
        { name: 'Text Box', icon: Type, type: 'text', subtype: 'text' },
        { name: 'Heading', icon: Type, type: 'text', subtype: 'heading' },
        { name: 'Subtitle', icon: Type, type: 'text', subtype: 'subtitle' }
      ]
    },
    images: {
      name: 'Images',
      icon: Image,
      items: [
        { name: 'Stock Photo', icon: Image, type: 'image', subtype: 'stock' },
        { name: 'Placeholder', icon: Image, type: 'image', subtype: 'placeholder' }
      ]
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Add Elements</h3>
      </div>
      
      {/* Category Tabs */}
      <div className="flex border-b border-slate-200">
        {Object.entries(categories).map(([key, category]) => {
          const Icon = category.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex-1 flex items-center justify-center space-x-1 py-3 text-sm font-medium transition-colors ${
                activeCategory === key
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{category.name}</span>
            </button>
          );
        })}
      </div>
      
      {/* Elements Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {categories[activeCategory].items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => onAddElement(item.type, item.subtype)}
                className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
              >
                <Icon className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 mb-2" />
                <span className="text-xs font-medium text-slate-700 group-hover:text-indigo-700">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Data Source Panel Component
function DataSourcePanel({ 
  selectedSource, 
  onSourceChange, 
  onGenerateSlide 
}: { 
  selectedSource: string; 
  onSourceChange: (source: string) => void;
  onGenerateSlide: (template: string) => void;
}) {
  const selectedTemplate = (window as any).selectedTemplate;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Data Sources</h3>
        <p className="text-sm text-slate-600 mt-1">Choose data to populate your slide</p>
      </div>
      
      {/* Data Sources */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {Object.entries(DATA_SOURCES).map(([key, source]) => {
            const Icon = source.icon;
            return (
              <button
                key={key}
                onClick={() => onSourceChange(key)}
                className={`w-full flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
                  selectedSource === key
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${source.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: source.color }} />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium text-slate-900">{source.name}</h4>
                  <p className="text-sm text-slate-600 mt-1">{source.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {source.fields.slice(0, 3).map((field) => (
                      <span key={field} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                        {field}
                      </span>
                    ))}
                    {source.fields.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                        +{source.fields.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {selectedTemplate && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={() => onGenerateSlide(selectedTemplate)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Slide with {DATA_SOURCES[selectedSource].name}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Slide Templates Modal Component
function SlideTemplatesModal({ 
  onClose, 
  onSelectTemplate 
}: { 
  onClose: () => void; 
  onSelectTemplate: (template: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Choose Slide Template</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(SLIDE_TEMPLATES).map(([key, template]) => {
              const Icon = template.icon;
              return (
                <button
                  key={key}
                  onClick={() => onSelectTemplate(key)}
                  className="flex flex-col items-center p-6 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                >
                  <div className="w-16 h-16 bg-slate-100 group-hover:bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-slate-600 group-hover:text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-slate-600 text-center">{template.description}</p>
                  {template.supportedSources && (
                    <div className="mt-3 flex flex-wrap gap-1 justify-center">
                      {template.supportedSources.slice(0, 3).map((source) => (
                        <span key={source} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                          {DATA_SOURCES[source]?.name || source}
                        </span>
                      ))}
                      {template.supportedSources.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                          +{template.supportedSources.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Graphic Element Component
function GraphicElement({ 
  graphic, 
  isSelected, 
  onSelect, 
  onDrag, 
  onDelete, 
  theme 
}: {
  graphic: GraphicElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDrag: (id: string, position: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
  theme: any;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(graphic.id);
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (graphic.position.x * 8), // Convert percentage to pixels
      y: e.clientY - (graphic.position.y * 6)
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(95, (e.clientX - dragStart.x) / 8)); // Convert to percentage
    const newY = Math.max(0, Math.min(90, (e.clientY - dragStart.y) / 6));
    
    onDrag(graphic.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const renderGraphicContent = () => {
    switch (graphic.type) {
      case 'icon':
        const iconName = graphic.content.icon;
        const IconComponent = {
          target: Target, users: Users, chart: BarChart3, calendar: Calendar,
          heart: Heart, shield: Shield, database: Database, cpu: Cpu,
          globe: Globe, mail: Mail, phone: Phone, message: MessageCircle,
          file: FileText, folder: Folder, search: Search, filter: Filter,
          refresh: RefreshCw, check: Check, x: X, alert: AlertCircle,
          info: Info, help: HelpCircle, lock: Lock, unlock: Unlock,
          star: Star
        }[iconName] || Star;
        return <IconComponent className="w-full h-full" style={{ color: graphic.style.color }} />;
      
      case 'shape':
        const shapeType = graphic.content.shape;
        const shapeStyle = {
          backgroundColor: graphic.style.backgroundColor,
          borderColor: graphic.style.borderColor,
          borderWidth: graphic.style.borderWidth,
          borderRadius: graphic.style.borderRadius,
          opacity: graphic.style.opacity
        };
        
        if (shapeType === 'circle') {
          return <div className="w-full h-full rounded-full border" style={shapeStyle} />;
        } else if (shapeType === 'triangle') {
          return (
            <div 
              className="w-0 h-0 border-l-[50px] border-r-[50px] border-b-[100px] border-l-transparent border-r-transparent"
              style={{ borderBottomColor: graphic.style.backgroundColor }}
            />
          );
        } else {
          return <div className="w-full h-full border" style={shapeStyle} />;
        }
      
      case 'text':
        return (
          <div 
            className="w-full h-full flex items-center justify-center text-center"
            style={{
              color: graphic.style.color,
              fontSize: graphic.style.fontSize,
              fontWeight: graphic.style.fontWeight,
              fontFamily: graphic.style.fontFamily
            }}
          >
            {graphic.content.text || 'Text'}
          </div>
        );
      
      case 'image':
        return (
          <img 
            src={graphic.content.url} 
            alt="Graphic" 
            className="w-full h-full object-cover"
            style={{ borderRadius: graphic.style.borderRadius }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
      style={{
        left: `${graphic.position.x}%`,
        top: `${graphic.position.y}%`,
        width: `${graphic.position.width}%`,
        height: `${graphic.position.height}%`,
        transform: `rotate(${graphic.style.rotation || 0}deg)`,
        opacity: graphic.style.opacity || 1,
        zIndex: isSelected ? 10 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      {renderGraphicContent()}
      
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(graphic.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}