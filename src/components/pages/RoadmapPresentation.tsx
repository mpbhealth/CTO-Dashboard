import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Presentation, 
  Download, 
  Eye, 
  Edit, 
  Play, 
  Share2, 
  Save, 
  RotateCcw, 
  Plus,
  Trash2,
  Settings,
  Palette,
  Layout,
  Image,
  Type,
  Square,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  X
} from 'lucide-react';
import { useRoadmapItems } from '../../hooks/useSupabaseData';
import { 
  generatePresentationData, 
  exportToPowerPoint, 
  GraphicsUtils 
} from '../../utils/presentationUtils';
import { 
  advisorKpis,
  topAdvisors,
  salesTrends,
  planBreakdown,
  advisorSkills,
  performanceMetrics,
  kpiMetrics,
  mrrData,
  memberEngagementKPIs,
  dailyLoginsData,
  retentionKPIs,
  retentionTimeline,
  uptimeKPIs,
  systemComponents
} from '../../data/consolidatedMockData';

interface PresentationSlide {
  id: string;
  title: string;
  layout: 'title' | 'content' | 'two-column' | 'image-content' | 'chart' | 'timeline' | 'custom';
  content: any;
  graphics: any[];
  background: {
    type: 'solid' | 'gradient' | 'image';
    value: string;
    opacity?: number;
  };
  notes?: string;
  animations?: string[];
}

interface PresentationConfig {
  title: string;
  author: string;
  slides: PresentationSlide[];
  theme: 'corporate' | 'modern' | 'minimal' | 'dark' | 'creative' | 'tech';
  metadata: {
    totalSlides: number;
    estimatedDuration: number;
    lastModified: string;
  };
}

export default function RoadmapPresentation() {
  const { data: roadmapItems, loading, error } = useRoadmapItems();
  const [presentation, setPresentation] = useState<PresentationConfig | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<number>(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'corporate' | 'modern' | 'minimal' | 'dark' | 'creative' | 'tech'>('corporate');
  const [isExporting, setIsExporting] = useState(false);
  const [editingSlide, setEditingSlide] = useState<PresentationSlide | null>(null);

  // Theme configurations
  const themes = {
    corporate: {
      name: 'Corporate Blue',
      primary: '#1E40AF',
      secondary: '#F1F5F9',
      accent: '#3B82F6',
      text: '#1F2937',
      background: 'from-blue-50 to-slate-50'
    },
    modern: {
      name: 'Modern Purple',
      primary: '#4F46E5',
      secondary: '#EDE9FE',
      accent: '#6366F1',
      text: '#1F2937',
      background: 'from-indigo-50 to-purple-50'
    },
    minimal: {
      name: 'Minimal Gray',
      primary: '#1F2937',
      secondary: '#F9FAFB',
      accent: '#6B7280',
      text: '#1F2937',
      background: 'from-white to-slate-50'
    },
    dark: {
      name: 'Dark Mode',
      primary: '#111827',
      secondary: '#1F2937',
      accent: '#10B981',
      text: '#FFFFFF',
      background: 'from-slate-900 to-slate-800'
    },
    creative: {
      name: 'Creative Gradient',
      primary: '#8B5CF6',
      secondary: '#FDF4FF',
      accent: '#EC4899',
      text: '#1F2937',
      background: 'from-purple-50 to-pink-50'
    },
    tech: {
      name: 'Tech Green',
      primary: '#10B981',
      secondary: '#F0FDF4',
      accent: '#3B82F6',
      text: '#1F2937',
      background: 'from-emerald-50 to-blue-50'
    }
  };

  // Generate presentation when roadmap items are loaded
  useEffect(() => {
    if (roadmapItems && roadmapItems.length > 0) {
      generatePresentation();
    }
  }, [roadmapItems, selectedTheme]);

  const generatePresentation = () => {
    const presentationData = generatePresentationData(roadmapItems);
    
    const newPresentation: PresentationConfig = {
      title: 'MPB Health Technology Roadmap',
      author: 'Vinnie R. Tannous, CTO',
      theme: selectedTheme,
      slides: presentationData.slides.map((slide, index) => ({
        ...slide,
        graphics: GraphicsUtils.generateDefaultGraphics(slide.layout, selectedTheme),
        background: {
          type: 'gradient',
          value: themes[selectedTheme].background,
          opacity: 0.05
        }
      })),
      metadata: {
        totalSlides: presentationData.slides.length,
        estimatedDuration: presentationData.slides.length * 2, // 2 minutes per slide
        lastModified: new Date().toISOString()
      }
    };

    setPresentation(newPresentation);
  };

  const handleExportToPowerPoint = async () => {
    if (!presentation) return;
    
    setIsExporting(true);
    try {
      await exportToPowerPoint(presentation);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export presentation. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSlideEdit = (slideIndex: number) => {
    if (presentation && presentation.slides[slideIndex]) {
      setEditingSlide(presentation.slides[slideIndex]);
      setIsEditMode(true);
    }
  };

  const handleSaveSlide = (updatedSlide: PresentationSlide) => {
    if (!presentation) return;
    
    const updatedSlides = [...presentation.slides];
    const slideIndex = updatedSlides.findIndex(s => s.id === updatedSlide.id);
    
    if (slideIndex !== -1) {
      updatedSlides[slideIndex] = updatedSlide;
      setPresentation({
        ...presentation,
        slides: updatedSlides,
        metadata: {
          ...presentation.metadata,
          lastModified: new Date().toISOString()
        }
      });
    }
    
    setIsEditMode(false);
    setEditingSlide(null);
  };

  const handleAddSlide = () => {
    if (!presentation) return;
    
    const newSlide: PresentationSlide = {
      id: `slide-${Date.now()}`,
      title: 'New Slide',
      layout: 'content',
      content: {
        title: 'New Slide Title',
        bullets: ['Point 1', 'Point 2', 'Point 3']
      },
      graphics: GraphicsUtils.generateDefaultGraphics('content', selectedTheme),
      background: {
        type: 'gradient',
        value: themes[selectedTheme].background,
        opacity: 0.05
      }
    };

    setPresentation({
      ...presentation,
      slides: [...presentation.slides, newSlide],
      metadata: {
        ...presentation.metadata,
        totalSlides: presentation.slides.length + 1,
        lastModified: new Date().toISOString()
      }
    });
  };

  const handleDeleteSlide = (slideIndex: number) => {
    if (!presentation || presentation.slides.length <= 1) return;
    
    const updatedSlides = presentation.slides.filter((_, index) => index !== slideIndex);
    
    setPresentation({
      ...presentation,
      slides: updatedSlides,
      metadata: {
        ...presentation.metadata,
        totalSlides: updatedSlides.length,
        lastModified: new Date().toISOString()
      }
    });

    // Adjust selected slide if necessary
    if (selectedSlide >= updatedSlides.length) {
      setSelectedSlide(updatedSlides.length - 1);
    }
  };

  const renderSlidePreview = (slide: PresentationSlide, index: number) => {
    const themeConfig = themes[selectedTheme];
    
    return (
      <motion.div
        key={slide.id}
        layout
        className={`
          relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
          ${selectedSlide === index 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-slate-200 bg-white hover:border-slate-300'
          }
        `}
        onClick={() => setSelectedSlide(index)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        {/* Slide Number */}
        <div className="absolute top-2 left-2 w-6 h-6 bg-slate-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>

        {/* Slide Preview */}
        <div 
          className={`w-full h-24 rounded bg-gradient-to-r ${themeConfig.background} border border-slate-200 p-2 mb-2`}
        >
          <div className="text-xs font-semibold text-slate-800 mb-1" style={{ color: themeConfig.text }}>
            {slide.content.title || slide.title}
          </div>
          <div className="space-y-1">
            {slide.content.bullets && slide.content.bullets.slice(0, 3).map((bullet: string, i: number) => (
              <div key={i} className="text-xs text-slate-600 truncate">• {bullet}</div>
            ))}
          </div>
        </div>

        {/* Slide Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600 capitalize">{slide.layout}</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSlideEdit(index);
              }}
              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSlide(index);
              }}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              disabled={presentation!.slides.length <= 1}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSlideContent = (slide: PresentationSlide) => {
    const themeConfig = themes[selectedTheme];
    
    return (
      <div 
        className={`w-full h-[500px] bg-gradient-to-r ${themeConfig.background} border border-slate-200 rounded-xl p-8 relative overflow-hidden`}
        style={{ backgroundColor: themeConfig.secondary }}
      >
        {/* Graphics Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {slide.graphics.map((graphic, index) => (
            <div
              key={graphic.id || index}
              className="absolute"
              style={{
                left: `${graphic.position.x}%`,
                top: `${graphic.position.y}%`,
                width: `${graphic.position.width}%`,
                height: `${graphic.position.height}%`,
                ...graphic.style
              }}
            >
              {graphic.type === 'shape' && (
                <div 
                  className="w-full h-full"
                  style={{
                    backgroundColor: graphic.style.backgroundColor,
                    borderRadius: graphic.style.borderRadius || 0,
                    opacity: graphic.style.opacity || 1
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content Layer */}
        <div className="relative z-10">
          {slide.layout === 'title' && (
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4" style={{ color: themeConfig.primary }}>
                {slide.content.title}
              </h1>
              {slide.content.subtitle && (
                <p className="text-xl" style={{ color: themeConfig.text }}>
                  {slide.content.subtitle}
                </p>
              )}
            </div>
          )}

          {slide.layout === 'content' && (
            <>
              <h2 className="text-2xl font-bold mb-6" style={{ color: themeConfig.primary }}>
                {slide.content.title}
              </h2>
              {slide.content.bullets && (
                <ul className="space-y-3">
                  {slide.content.bullets.map((bullet: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: themeConfig.accent }}></span>
                      <span style={{ color: themeConfig.text }}>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {slide.layout === 'two-column' && (
            <>
              <h2 className="text-2xl font-bold mb-6" style={{ color: themeConfig.primary }}>
                {slide.content.title}
              </h2>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  {slide.content.leftColumn && slide.content.leftColumn.map((item: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: themeConfig.accent }}></span>
                      <span className="text-sm" style={{ color: themeConfig.text }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div>
                  {slide.content.rightColumn && slide.content.rightColumn.map((item: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: themeConfig.accent }}></span>
                      <span className="text-sm" style={{ color: themeConfig.text }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {slide.layout === 'timeline' && (
            <>
              <h2 className="text-2xl font-bold mb-6" style={{ color: themeConfig.primary }}>
                {slide.content.title}
              </h2>
              <div className="space-y-4">
                {slide.content.timelineItems && slide.content.timelineItems.map((item: any, index: number) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: themeConfig.primary }}
                      ></div>
                      {index < slide.content.timelineItems.length - 1 && (
                        <div 
                          className="w-0.5 h-8 mt-2"
                          style={{ backgroundColor: themeConfig.accent, opacity: 0.5 }}
                        ></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold" style={{ color: themeConfig.primary }}>
                          {item.quarter}
                        </span>
                        <span style={{ color: themeConfig.text }}>{item.title}</span>
                      </div>
                      {item.description && (
                        <p className="text-sm mt-1" style={{ color: themeConfig.text, opacity: 0.8 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading roadmap data: {error}</p>
          <p className="text-slate-600">Please make sure you're connected to Supabase.</p>
        </div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Presentation className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Generating presentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Roadmap Presentation Builder</h1>
          <p className="text-slate-600 mt-2">Create professional presentations from your technology roadmap</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isPreviewMode 
                ? 'bg-slate-600 text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isPreviewMode ? 'Exit Preview' : 'Preview'}</span>
          </button>
          
          <button
            onClick={handleExportToPowerPoint}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export to PowerPoint</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Theme Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Presentation Theme</h3>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <span>{presentation.metadata.totalSlides} slides</span>
            <span>•</span>
            <span>~{presentation.metadata.estimatedDuration} min</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => setSelectedTheme(key as any)}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 text-left
                ${selectedTheme === key 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }
              `}
            >
              <div 
                className="w-full h-8 rounded mb-2"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.accent})` }}
              ></div>
              <div className="text-sm font-medium text-slate-900">{theme.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-4 gap-6">
        {/* Slide Navigation */}
        <div className="col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Slides</h3>
            <button
              onClick={handleAddSlide}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              title="Add new slide"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {presentation.slides.map((slide, index) => renderSlidePreview(slide, index))}
          </div>
        </div>

        {/* Slide Editor/Preview */}
        <div className="col-span-3">
          {isPreviewMode ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  Slide {selectedSlide + 1}: {presentation.slides[selectedSlide]?.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsPreviewMode(false)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {presentation.slides[selectedSlide] && renderSlideContent(presentation.slides[selectedSlide])}
              
              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setSelectedSlide(Math.max(0, selectedSlide - 1))}
                  disabled={selectedSlide === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span>Previous</span>
                </button>
                
                <span className="text-sm text-slate-600">
                  {selectedSlide + 1} of {presentation.slides.length}
                </span>
                
                <button
                  onClick={() => setSelectedSlide(Math.min(presentation.slides.length - 1, selectedSlide + 1))}
                  disabled={selectedSlide === presentation.slides.length - 1}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Presentation Overview</h3>
              
              {/* Analytics Integration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-3">KPI Metrics Available</h4>
                  <div className="space-y-2 text-sm">
                    {kpiMetrics.slice(0, 3).map((kpi, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-slate-600">{kpi.title}:</span>
                        <span className="font-medium text-slate-900">{kpi.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-3">Advisor Performance</h4>
                  <div className="space-y-2 text-sm">
                    {topAdvisors.slice(0, 3).map((advisor, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-slate-600">{advisor.name}:</span>
                        <span className="font-medium text-slate-900">${advisor.sales.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slide Content Preview */}
              {presentation.slides[selectedSlide] && renderSlideContent(presentation.slides[selectedSlide])}
              
              {/* Slide Controls */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSlideEdit(selectedSlide)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Slide</span>
                  </button>
                  
                  <button
                    onClick={() => setIsPreviewMode(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Presentation</span>
                  </button>
                </div>
                
                <div className="text-sm text-slate-600">
                  Last modified: {new Date(presentation.metadata.lastModified).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Edit Modal */}
      {isEditMode && editingSlide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Edit Slide</h2>
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setEditingSlide(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Slide Title
                </label>
                <input
                  type="text"
                  value={editingSlide.content.title || ''}
                  onChange={(e) => setEditingSlide({
                    ...editingSlide,
                    content: { ...editingSlide.content, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {editingSlide.content.bullets && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bullet Points
                  </label>
                  <textarea
                    value={editingSlide.content.bullets.join('\n')}
                    onChange={(e) => setEditingSlide({
                      ...editingSlide,
                      content: { 
                        ...editingSlide.content, 
                        bullets: e.target.value.split('\n').filter(line => line.trim())
                      }
                    })}
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter each bullet point on a new line"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setEditingSlide(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveSlide(editingSlide)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}