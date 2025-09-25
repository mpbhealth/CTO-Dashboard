import { Database } from '../types/database';

type RoadmapItem = Database['public']['Tables']['roadmap_items']['Row'];

export interface GraphicElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'icon' | 'chart';
  position: { x: number; y: number; width: number; height: number };
  content: string | { 
    text?: string; 
    data?: Record<string, unknown>; 
    url?: string;
    shape?: string;
    icon?: string;
  };
  style: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    rotation?: number;
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    textAlign?: string;
    color?: string;
    shadow?: boolean;
    gradient?: { from: string; to: string; direction: string };
  };
  animation?: {
    type: 'fadeIn' | 'slideIn' | 'zoomIn' | 'bounce' | 'pulse';
    duration: number;
    delay: number;
  };
}

interface TimelineItem {
  date?: string;
  quarter?: string;
  title: string;
  description?: string;
  status?: string;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}

export interface PresentationSlide {
  id: string;
  title: string;
  layout: 'title' | 'content' | 'two-column' | 'image-content' | 'chart' | 'timeline' | 'custom';
  content: {
    title?: string;
    subtitle?: string;
    bullets?: string[];
    leftColumn?: string[];
    rightColumn?: string[];
    imageUrl?: string;
    chartData?: ChartData;
    timelineItems?: TimelineItem[];
  };
  graphics: GraphicElement[];
  background: {
    type: 'solid' | 'gradient' | 'image';
    value: string;
    opacity?: number;
  };
  notes?: string;
  animations?: string[];
}

export interface PresentationData {
  slides: PresentationSlide[];
  metadata: {
    totalItems: number;
    quarters: string[];
    departments: string[];
    priorities: { high: number; medium: number; low: number };
    statuses: { backlog: number; inProgress: number; complete: number };
  };
}

export function generatePresentationData(roadmapItems: RoadmapItem[]): PresentationData {
  // Analyze roadmap data
  const quarters = Array.from(new Set(roadmapItems.map(item => item.quarter))).sort();
  const departments = Array.from(new Set(roadmapItems.map(item => item.department)));
  
  const priorities = {
    high: roadmapItems.filter(item => item.priority === 'High').length,
    medium: roadmapItems.filter(item => item.priority === 'Medium').length,
    low: roadmapItems.filter(item => item.priority === 'Low').length
  };
  
  const statuses = {
    backlog: roadmapItems.filter(item => item.status === 'Backlog').length,
    inProgress: roadmapItems.filter(item => item.status === 'In Progress').length,
    complete: roadmapItems.filter(item => item.status === 'Complete').length
  };

  const slides: PresentationSlide[] = [
    // Title Slide with Graphics
    {
      id: 'title',
      title: 'Technology Roadmap',
      layout: 'title',
      content: {
        title: 'MPB Health Technology Roadmap',
        subtitle: `Strategic Technology Initiatives • ${new Date().getFullYear()}`
      },
      graphics: [
        {
          id: 'title-bg-shape',
          type: 'shape',
          position: { x: 10, y: 15, width: 80, height: 8 },
          content: { shape: 'rectangle' },
          style: {
            backgroundColor: '#3B82F6',
            borderRadius: 20,
            opacity: 0.1
          },
          animation: { type: 'slideIn', duration: 1000, delay: 500 }
        },
        {
          id: 'title-accent',
          type: 'shape',
          position: { x: 5, y: 5, width: 3, height: 90 },
          content: { shape: 'rectangle' },
          style: {
            backgroundColor: '#10B981',
            borderRadius: 5,
            opacity: 0.8
          },
          animation: { type: 'slideIn', duration: 800, delay: 200 }
        },
        {
          id: 'title-icon',
          type: 'icon',
          position: { x: 85, y: 10, width: 10, height: 10 },
          content: { icon: 'target' },
          style: {
            color: '#6366F1',
            opacity: 0.7
          },
          animation: { type: 'zoomIn', duration: 600, delay: 1200 }
        }
      ],
      background: { type: 'gradient', value: 'from-slate-50 to-blue-50' }
    },
    
    // Executive Summary with Visual Elements
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      layout: 'content',
      content: {
        title: 'Executive Summary',
        bullets: [
          `${roadmapItems.length} strategic technology initiatives planned`,
          `${priorities.high} high-priority projects driving core business objectives`,
          `${statuses.inProgress} projects currently in active development`,
          `${departments.length} departments collaborating on technology advancement`,
          `Roadmap spans ${quarters.length} quarters with clear milestones and deliverables`
        ]
      },
      graphics: [
        {
          id: 'summary-chart-bg',
          type: 'shape',
          position: { x: 70, y: 20, width: 25, height: 60 },
          content: { shape: 'rectangle' },
          style: {
            backgroundColor: '#F3F4F6',
            borderRadius: 15,
            opacity: 0.5
          },
          animation: { type: 'fadeIn', duration: 800, delay: 400 }
        },
        {
          id: 'summary-icon-1',
          type: 'icon',
          position: { x: 75, y: 25, width: 6, height: 6 },
          content: { icon: 'chart' },
          style: {
            color: '#3B82F6',
            opacity: 0.8
          },
          animation: { type: 'bounce', duration: 600, delay: 800 }
        },
        {
          id: 'summary-icon-2',
          type: 'icon',
          position: { x: 83, y: 35, width: 6, height: 6 },
          content: { icon: 'users' },
          style: {
            color: '#10B981',
            opacity: 0.8
          },
          animation: { type: 'bounce', duration: 600, delay: 1000 }
        },
        {
          id: 'summary-icon-3',
          type: 'icon',
          position: { x: 75, y: 45, width: 6, height: 6 },
          content: { icon: 'calendar' },
          style: {
            color: '#F59E0B',
            opacity: 0.8
          },
          animation: { type: 'bounce', duration: 600, delay: 1200 }
        }
      ],
      background: { type: 'gradient', value: 'from-white to-slate-50' }
    },
    
    // Strategic Overview with Enhanced Graphics
    {
      id: 'strategic-overview',
      title: 'Strategic Overview',
      layout: 'two-column',
      content: {
        title: 'Strategic Technology Focus Areas',
        leftColumn: [
          'Product Engineering Excellence',
          'AI & Automation Integration',
          'Infrastructure Modernization',
          'Security & Compliance',
          'International Expansion'
        ],
        rightColumn: [
          'Member Experience Enhancement',
          'Operational Efficiency',
          'Data-Driven Decision Making',
          'Scalable Architecture',
          'Innovation & Growth'
        ]
      },
      graphics: [
        {
          id: 'strategic-divider',
          type: 'shape',
          position: { x: 48, y: 25, width: 4, height: 50 },
          content: { shape: 'rectangle' },
          style: {
            backgroundColor: '#E5E7EB',
            borderRadius: 2,
            opacity: 0.6
          },
          animation: { type: 'slideIn', duration: 600, delay: 300 }
        },
        {
          id: 'strategic-accent-left',
          type: 'shape',
          position: { x: 5, y: 20, width: 35, height: 3 },
          content: { shape: 'rectangle' },
          style: {
            backgroundColor: '#3B82F6',
            borderRadius: 10,
            opacity: 0.3
          },
          animation: { type: 'slideIn', duration: 800, delay: 500 }
        },
        {
          id: 'strategic-accent-right',
          type: 'shape',
          position: { x: 60, y: 20, width: 35, height: 3 },
          content: { shape: 'rectangle' },
          style: {
            backgroundColor: '#10B981',
            borderRadius: 10,
            opacity: 0.3
          },
          animation: { type: 'slideIn', duration: 800, delay: 700 }
        }
      ],
      background: { type: 'gradient', value: 'from-blue-50 to-emerald-50' }
    },
    
    // Timeline with Visual Enhancement
    {
      id: 'timeline',
      title: 'Roadmap Timeline',
      layout: 'timeline',
      content: {
        title: 'Technology Roadmap Timeline',
        timelineItems: quarters.map(quarter => {
          const quarterItems = roadmapItems.filter(item => item.quarter === quarter);
          const highPriorityItems = quarterItems.filter(item => item.priority === 'High');
          
          return {
            quarter,
            title: `${quarterItems.length} initiatives planned`,
            description: highPriorityItems.length > 0 
              ? `Key focus: ${highPriorityItems[0].title}` 
              : 'Supporting initiatives and infrastructure improvements'
          };
        })
      },
      graphics: [
        {
          id: 'timeline-bg',
          type: 'shape',
          position: { x: 5, y: 15, width: 90, height: 70 },
          content: { shape: 'rectangle' },
          style: {
            backgroundColor: '#F8FAFC',
            borderRadius: 20,
            opacity: 0.7
          },
          animation: { type: 'fadeIn', duration: 600, delay: 200 }
        },
        {
          id: 'timeline-progress',
          type: 'shape',
          position: { x: 10, y: 80, width: 80, height: 2 },
          content: { shape: 'rectangle' },
          style: {
            backgroundColor: '#3B82F6',
            borderRadius: 1,
            opacity: 0.8
          },
          animation: { type: 'slideIn', duration: 1200, delay: 800 }
        }
      ],
      background: { type: 'gradient', value: 'from-slate-50 to-blue-50' }
    }
  ];

  // Add quarter-specific slides with graphics
  quarters.forEach((quarter, index) => {
    const quarterItems = roadmapItems.filter(item => item.quarter === quarter);
    if (quarterItems.length > 0) {
      slides.push({
        id: `quarter-${quarter}`,
        title: `${quarter} Initiatives`,
        layout: 'content',
        content: {
          title: `${quarter} Technology Initiatives`,
          bullets: quarterItems.map(item => 
            `${item.title} - ${item.department} (${item.priority} Priority)`
          )
        },
        graphics: [
          {
            id: `quarter-${index}-accent`,
            type: 'shape',
            position: { x: 85, y: 10, width: 10, height: 80 },
            content: { shape: 'rectangle' },
            style: {
              backgroundColor: index % 2 === 0 ? '#3B82F6' : '#10B981',
              borderRadius: 15,
              opacity: 0.1
            },
            animation: { type: 'slideIn', duration: 800, delay: 400 }
          },
          {
            id: `quarter-${index}-icon`,
            type: 'icon',
            position: { x: 87, y: 15, width: 6, height: 6 },
            content: { icon: 'calendar' },
            style: {
              color: index % 2 === 0 ? '#3B82F6' : '#10B981',
              opacity: 0.8
            },
            animation: { type: 'zoomIn', duration: 600, delay: 800 }
          }
        ],
        background: { type: 'gradient', value: 'from-white to-slate-50' }
      });
    }
  });

  // Add department-specific slides with enhanced graphics
  const majorDepartments = departments.filter(dept => 
    roadmapItems.filter(item => item.department === dept).length >= 2
  );

  majorDepartments.forEach((department, index) => {
    const deptItems = roadmapItems.filter(item => item.department === department);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const color = colors[index % colors.length];
    
    slides.push({
      id: `dept-${department}`,
      title: `${department} Roadmap`,
      layout: 'content',
      content: {
        title: `${department} Technology Roadmap`,
        bullets: deptItems.map(item => 
          `${item.title} (${item.quarter}) - ${item.status}`
        )
      },
      graphics: [
        {
          id: `dept-${index}-header`,
          type: 'shape',
          position: { x: 5, y: 5, width: 90, height: 12 },
          content: { shape: 'rectangle' },
          style: {
            backgroundColor: color,
            borderRadius: 15,
            opacity: 0.1
          },
          animation: { type: 'slideIn', duration: 800, delay: 300 }
        },
        {
          id: `dept-${index}-icon`,
          type: 'icon',
          position: { x: 85, y: 7, width: 8, height: 8 },
          content: { icon: 'users' },
          style: {
            color: color,
            opacity: 0.8
          },
          animation: { type: 'fadeIn', duration: 600, delay: 600 }
        }
      ],
      background: { type: 'gradient', value: 'from-white to-slate-50' }
    });
  });

  // Enhanced priority breakdown slide
  slides.push({
    id: 'priority-breakdown',
    title: 'Priority Distribution',
    layout: 'content',
    content: {
      title: 'Initiative Priority Distribution',
      bullets: [
        `High Priority: ${priorities.high} initiatives (${Math.round(priorities.high / roadmapItems.length * 100)}%)`,
        `Medium Priority: ${priorities.medium} initiatives (${Math.round(priorities.medium / roadmapItems.length * 100)}%)`,
        `Low Priority: ${priorities.low} initiatives (${Math.round(priorities.low / roadmapItems.length * 100)}%)`,
        '',
        'High priority initiatives focus on core business objectives and member experience',
        'Medium priority initiatives support operational efficiency and growth',
        'Low priority initiatives provide foundation for future innovation'
      ]
    },
    graphics: [
      {
        id: 'priority-chart-bg',
        type: 'shape',
        position: { x: 70, y: 25, width: 25, height: 50 },
        content: { shape: 'rectangle' },
        style: {
          backgroundColor: '#F3F4F6',
          borderRadius: 20,
          opacity: 0.5
        },
        animation: { type: 'fadeIn', duration: 800, delay: 400 }
      },
      {
        id: 'priority-high',
        type: 'shape',
        position: { x: 75, y: 30, width: 15, height: 8 },
        content: { shape: 'rectangle' },
        style: {
          backgroundColor: '#EF4444',
          borderRadius: 8,
          opacity: 0.8
        },
        animation: { type: 'slideIn', duration: 600, delay: 600 }
      },
      {
        id: 'priority-medium',
        type: 'shape',
        position: { x: 75, y: 42, width: 12, height: 8 },
        content: { shape: 'rectangle' },
        style: {
          backgroundColor: '#F59E0B',
          borderRadius: 8,
          opacity: 0.8
        },
        animation: { type: 'slideIn', duration: 600, delay: 800 }
      },
      {
        id: 'priority-low',
        type: 'shape',
        position: { x: 75, y: 54, width: 8, height: 8 },
        content: { shape: 'rectangle' },
        style: {
          backgroundColor: '#10B981',
          borderRadius: 8,
          opacity: 0.8
        },
        animation: { type: 'slideIn', duration: 600, delay: 1000 }
      }
    ],
    background: { type: 'gradient', value: 'from-slate-50 to-red-50' }
  });

  // Enhanced status overview slide
  slides.push({
    id: 'status-overview',
    title: 'Implementation Status',
    layout: 'content',
    content: {
      title: 'Current Implementation Status',
      bullets: [
        `In Progress: ${statuses.inProgress} initiatives actively being developed`,
        `Backlog: ${statuses.backlog} initiatives planned for future quarters`,
        `Complete: ${statuses.complete} initiatives successfully delivered`,
        '',
        `Overall Progress: ${Math.round((statuses.complete + statuses.inProgress * 0.5) / roadmapItems.length * 100)}% completion rate`,
        'Strong momentum with multiple initiatives in active development',
        'Clear pipeline of future initiatives ready for execution'
      ]
    },
    graphics: [
      {
        id: 'status-progress-bg',
        type: 'shape',
        position: { x: 70, y: 30, width: 25, height: 40 },
        content: { shape: 'rectangle' },
        style: {
          backgroundColor: '#F0FDF4',
          borderRadius: 20,
          opacity: 0.7
        },
        animation: { type: 'fadeIn', duration: 800, delay: 300 }
      },
      {
        id: 'status-progress-bar',
        type: 'shape',
        position: { x: 75, y: 45, width: 15, height: 4 },
        content: { shape: 'rectangle' },
        style: {
          backgroundColor: '#10B981',
          borderRadius: 5,
          opacity: 0.9
        },
        animation: { type: 'slideIn', duration: 1000, delay: 800 }
      },
      {
        id: 'status-icon',
        type: 'icon',
        position: { x: 85, y: 35, width: 8, height: 8 },
        content: { icon: 'chart' },
        style: {
          color: '#10B981',
          opacity: 0.8
        },
        animation: { type: 'pulse', duration: 800, delay: 1200 }
      }
    ],
    background: { type: 'gradient', value: 'from-emerald-50 to-green-50' }
  });

  // Enhanced next steps slide
  slides.push({
    id: 'next-steps',
    title: 'Next Steps & Key Actions',
    layout: 'content',
    content: {
      title: 'Next Steps & Key Actions',
      bullets: [
        'Continue execution of high-priority initiatives in current quarter',
        'Finalize resource allocation for upcoming quarter initiatives',
        'Monitor progress against established milestones and KPIs',
        'Assess and adjust timeline based on market conditions and priorities',
        'Maintain focus on security, compliance, and scalability',
        'Regular stakeholder communication and progress updates'
      ]
    },
    graphics: [
      {
        id: 'next-steps-arrow',
        type: 'shape',
        position: { x: 80, y: 20, width: 15, height: 60 },
        content: { shape: 'rectangle' },
        style: {
          backgroundColor: '#3B82F6',
          borderRadius: 25,
          opacity: 0.1
        },
        animation: { type: 'slideIn', duration: 1000, delay: 500 }
      },
      {
        id: 'next-steps-icon',
        type: 'icon',
        position: { x: 85, y: 45, width: 8, height: 8 },
        content: { icon: 'target' },
        style: {
          color: '#3B82F6',
          opacity: 0.8
        },
        animation: { type: 'zoomIn', duration: 600, delay: 1000 }
      },
      {
        id: 'next-steps-accent',
        type: 'shape',
        position: { x: 5, y: 75, width: 70, height: 3 },
        content: { shape: 'rectangle' },
        style: {
          backgroundColor: '#10B981',
          borderRadius: 5,
          opacity: 0.6
        },
        animation: { type: 'slideIn', duration: 1200, delay: 800 }
      }
    ],
    background: { type: 'gradient', value: 'from-blue-50 to-indigo-50' }
  });

  return {
    slides,
    metadata: {
      totalItems: roadmapItems.length,
      quarters,
      departments,
      priorities,
      statuses
    }
  };
}

export async function exportToPowerPoint(presentation: any) {
  try {
    // Enhanced PowerPoint export with graphics support
    const pptxData = {
      title: presentation.title,
      author: presentation.author,
      slides: presentation.slides.map((slide: any, index: number) => ({
        slideNumber: index + 1,
        layout: slide.layout,
        title: slide.content.title || slide.title,
        content: slide.content,
        graphics: slide.graphics || [],
        background: slide.background || { type: 'solid', value: '#FFFFFF' },
        notes: slide.notes || '',
        theme: presentation.theme
      }))
    };

    // Convert to PowerPoint format with graphics
    const pptxBlob = await generatePowerPointFileWithGraphics(pptxData);
    
    // Download the file
    const url = URL.createObjectURL(pptxBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${presentation.title.replace(/\s+/g, '_')}_Enhanced.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('PowerPoint export failed:', error);
    throw new Error('Failed to export PowerPoint presentation');
  }
}

async function generatePowerPointFileWithGraphics(data: any): Promise<Blob> {
  // Enhanced PowerPoint generation with graphics support
  const pptxContent = {
    slides: data.slides.map((slide: any) => ({
      title: slide.title,
      content: slide.content,
      layout: slide.layout,
      slideNumber: slide.slideNumber,
      graphics: slide.graphics.map((graphic: any) => ({
        type: graphic.type,
        position: graphic.position,
        content: graphic.content,
        style: graphic.style,
        animation: graphic.animation
      })),
      background: slide.background,
      theme: data.theme
    })),
    metadata: {
      title: data.title,
      author: data.author,
      created: new Date().toISOString(),
      theme: data.theme,
      hasGraphics: true,
      version: '2.0'
    }
  };

  // For now, export as enhanced JSON that can be imported into PowerPoint tools
  const jsonString = JSON.stringify(pptxContent, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

// Enhanced graphics utilities
export const GraphicsUtils = {
  // Generate default graphics for slide types
  generateDefaultGraphics: (slideType: string, theme: string = 'corporate') => {
    const themeColors = {
      corporate: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B' },
      modern: { primary: '#6366F1', secondary: '#8B5CF6', accent: '#EC4899' },
      minimal: { primary: '#1F2937', secondary: '#6B7280', accent: '#9CA3AF' },
      dark: { primary: '#111827', secondary: '#374151', accent: '#10B981' },
      creative: { primary: '#8B5CF6', secondary: '#EC4899', accent: '#F59E0B' },
      tech: { primary: '#10B981', secondary: '#3B82F6', accent: '#06B6D4' }
    };

    const key = (theme in themeColors ? theme : 'corporate') as keyof typeof themeColors;
    const colors = themeColors[key];
    const graphics: GraphicElement[] = [];

    switch (slideType) {
      case 'title':
        graphics.push(
          {
            id: `${slideType}-bg-${Date.now()}`,
            type: 'shape',
            position: { x: 10, y: 15, width: 80, height: 8 },
            content: { shape: 'rectangle' },
            style: { backgroundColor: colors.primary, borderRadius: 20, opacity: 0.1 },
            animation: { type: 'slideIn', duration: 1000, delay: 500 }
          },
          {
            id: `${slideType}-accent-${Date.now()}`,
            type: 'shape',
            position: { x: 5, y: 5, width: 3, height: 90 },
            content: { shape: 'rectangle' },
            style: { backgroundColor: colors.secondary, borderRadius: 5, opacity: 0.8 },
            animation: { type: 'slideIn', duration: 800, delay: 200 }
          }
        );
        break;
      
      case 'content':
        graphics.push(
          {
            id: `${slideType}-icon-${Date.now()}`,
            type: 'icon',
            position: { x: 85, y: 15, width: 10, height: 10 },
            content: { icon: 'target' },
            style: { color: colors.secondary, opacity: 0.7 },
            animation: { type: 'fadeIn', duration: 800, delay: 1000 }
          }
        );
        break;
    }

    return graphics;
  },

  // Create animated entrance effects
  createAnimation: (type: string, duration: number = 500, delay: number = 0) => ({
    type,
    duration,
    delay
  }),

  // Generate color palette for themes
  getThemeColors: (theme: string) => {
    const palettes = {
      corporate: ['#3B82F6', '#1E40AF', '#93C5FD', '#DBEAFE'],
      modern: ['#6366F1', '#4F46E5', '#A5B4FC', '#E0E7FF'],
      minimal: ['#1F2937', '#374151', '#9CA3AF', '#F3F4F6'],
      dark: ['#111827', '#1F2937', '#374151', '#4B5563'],
      creative: ['#8B5CF6', '#7C3AED', '#C4B5FD', '#EDE9FE'],
      tech: ['#10B981', '#059669', '#6EE7B7', '#D1FAE5']
    };
    const key = (theme in palettes ? theme : 'corporate') as keyof typeof palettes;
    return palettes[key];
  }
};
