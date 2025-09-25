import PptxGenJS from 'pptxgenjs';

export interface PowerPointSlideContent {
  title?: string;
  subtitle?: string;
  bullets?: string[];
  leftColumn?: string[];
  rightColumn?: string[];
  imageUrl?: string;
  chartData?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
    }>;
  };
  timelineItems?: Array<{
    date?: string;
    quarter?: string;
    title: string;
    description?: string;
  }>;
}

export interface PowerPointSlide {
  title: string;
  layout: 'title' | 'content' | 'two-column' | 'image-content' | 'chart' | 'timeline';
  content: PowerPointSlideContent;
  notes?: string;
}

export interface PowerPointPresentation {
  title: string;
  author: string;
  slides: PowerPointSlide[];
  theme: 'corporate' | 'modern' | 'minimal' | 'dark';
}

export async function exportToPowerPointFile(presentation: PowerPointPresentation): Promise<void> {
  const pptx = new PptxGenJS();
  
  // Set presentation properties
  pptx.author = presentation.author;
  pptx.company = 'MPB Health';
  pptx.title = presentation.title;
  pptx.subject = 'Technology Roadmap Presentation';
  
  // Define theme colors and styles
  const themes = {
    corporate: {
      primary: '1E40AF',
      secondary: 'F1F5F9',
      accent: '3B82F6',
      text: '1F2937'
    },
    modern: {
      primary: '4F46E5',
      secondary: 'EDE9FE',
      accent: '6366F1',
      text: '1F2937'
    },
    minimal: {
      primary: '1F2937',
      secondary: 'F9FAFB',
      accent: '6B7280',
      text: '1F2937'
    },
    dark: {
      primary: '111827',
      secondary: '1F2937',
      accent: '10B981',
      text: 'FFFFFF'
    }
  };
  
  const themeColors = themes[presentation.theme] || themes.corporate;
  
  // Process each slide
  presentation.slides.forEach((slideData, index) => {
    const slide = pptx.addSlide();
    
    // Set slide background
    slide.background = { color: themeColors.secondary };
    
    switch (slideData.layout) {
      case 'title':
        createTitleSlide(pptx, slide, slideData, themeColors);
        break;
      case 'content':
        createContentSlide(pptx, slide, slideData, themeColors);
        break;
      case 'two-column':
        createTwoColumnSlide(pptx, slide, slideData, themeColors);
        break;
      case 'timeline':
        createTimelineSlide(pptx, slide, slideData, themeColors);
        break;
      case 'chart':
        createChartSlide(pptx, slide, slideData, themeColors);
        break;
      default:
        createContentSlide(pptx, slide, slideData, themeColors);
    }
    
    // Add slide notes if available
    if (slideData.notes) {
      slide.addNotes(slideData.notes);
    }
    
    // Add slide number
    slide.addText(`${index + 1}`, {
      x: 9.5,
      y: 7,
      w: 0.5,
      h: 0.3,
      fontSize: 10,
      color: themeColors.accent,
      align: 'right'
    });
  });
  
  // Save the presentation
  const fileName = `${presentation.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName });
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

function createTitleSlide(pptx: PptxGenJS, slide: PptxGenJS.Slide, slideData: PowerPointSlide, colors: ThemeColors) {
  // Main title
  slide.addText(slideData.content.title || slideData.title, {
    x: 1,
    y: 2.5,
    w: 8,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: colors.primary,
    align: 'center',
    fontFace: 'Segoe UI'
  });
  
  // Subtitle
  if (slideData.content.subtitle) {
    slide.addText(slideData.content.subtitle, {
      x: 1,
      y: 4.2,
      w: 8,
      h: 0.8,
      fontSize: 24,
      color: colors.text,
      align: 'center',
      fontFace: 'Segoe UI'
    });
  }
  
  // Add MPB Health logo placeholder
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.25,
    y: 5.5,
    w: 1.5,
    h: 0.5,
    fill: { color: colors.accent },
    line: { color: colors.accent, width: 1 }
  });
  
  slide.addText('MPB Health', {
    x: 4.25,
    y: 5.5,
    w: 1.5,
    h: 0.5,
    fontSize: 12,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: 'Segoe UI'
  });
}

function createContentSlide(pptx: PptxGenJS, slide: PptxGenJS.Slide, slideData: PowerPointSlide, colors: ThemeColors) {
  // Title
  slide.addText(slideData.content.title || slideData.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: colors.primary,
    fontFace: 'Segoe UI'
  });
  
  // Content bullets
  if (slideData.content.bullets && slideData.content.bullets.length > 0) {
    const bulletText = slideData.content.bullets.map((bullet: string) => ({
      text: bullet,
      options: {
        fontSize: 18,
        color: colors.text,
        bullet: { type: 'number', style: '•' },
        fontFace: 'Segoe UI',
        lineSpacing: 28
      }
    }));
    
    slide.addText(bulletText, {
      x: 0.8,
      y: 1.8,
      w: 8.4,
      h: 5,
      fontSize: 18,
      color: colors.text,
      fontFace: 'Segoe UI'
    });
  }
}

function createTwoColumnSlide(pptx: PptxGenJS, slide: PptxGenJS.Slide, slideData: PowerPointSlide, colors: ThemeColors) {
  // Title
  slide.addText(slideData.content.title || slideData.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: colors.primary,
    fontFace: 'Segoe UI'
  });
  
  // Left column
  if (slideData.content.leftColumn && slideData.content.leftColumn.length > 0) {
    const leftBullets = slideData.content.leftColumn.map((bullet: string) => ({
      text: bullet,
      options: {
        fontSize: 16,
        color: colors.text,
        bullet: { type: 'number', style: '•' },
        fontFace: 'Segoe UI',
        lineSpacing: 24
      }
    }));
    
    slide.addText(leftBullets, {
      x: 0.5,
      y: 1.8,
      w: 4.2,
      h: 5,
      fontSize: 16,
      color: colors.text,
      fontFace: 'Segoe UI'
    });
  }
  
  // Right column
  if (slideData.content.rightColumn && slideData.content.rightColumn.length > 0) {
    const rightBullets = slideData.content.rightColumn.map((bullet: string) => ({
      text: bullet,
      options: {
        fontSize: 16,
        color: colors.text,
        bullet: { type: 'number', style: '•' },
        fontFace: 'Segoe UI',
        lineSpacing: 24
      }
    }));
    
    slide.addText(rightBullets, {
      x: 5.3,
      y: 1.8,
      w: 4.2,
      h: 5,
      fontSize: 16,
      color: colors.text,
      fontFace: 'Segoe UI'
    });
  }
}

function createTimelineSlide(pptx: PptxGenJS, slide: any, slideData: PowerPointSlide, colors: any) {
  // Title
  slide.addText(slideData.content.title || slideData.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: colors.primary,
    fontFace: 'Segoe UI'
  });
  
  // Timeline items
  if (slideData.content.timelineItems && slideData.content.timelineItems.length > 0) {
    slideData.content.timelineItems.forEach((item: any, index: number) => {
      const yPos = 2 + (index * 1.2);
      
      // Timeline dot
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 0.8,
        y: yPos,
        w: 0.3,
        h: 0.3,
        fill: { color: colors.primary },
        line: { color: colors.primary, width: 2 }
      });
      
      // Timeline line (except for last item)
      if (index < slideData.content.timelineItems.length - 1) {
        slide.addShape(pptx.ShapeType.line, {
          x: 0.95,
          y: yPos + 0.3,
          w: 0,
          h: 0.9,
          line: { color: colors.accent, width: 2 }
        });
      }
      
      // Quarter/period
      slide.addText(item.quarter, {
        x: 1.5,
        y: yPos - 0.1,
        w: 2,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: colors.primary,
        fontFace: 'Segoe UI'
      });
      
      // Title
      slide.addText(item.title, {
        x: 3.8,
        y: yPos - 0.1,
        w: 5.7,
        h: 0.4,
        fontSize: 14,
        color: colors.text,
        fontFace: 'Segoe UI'
      });
      
      // Description
      if (item.description) {
        slide.addText(item.description, {
          x: 3.8,
          y: yPos + 0.25,
          w: 5.7,
          h: 0.4,
          fontSize: 12,
          color: colors.accent,
          fontFace: 'Segoe UI'
        });
      }
    });
  }
}

function createChartSlide(pptx: PptxGenJS, slide: any, slideData: PowerPointSlide, colors: any) {
  // Title
  slide.addText(slideData.content.title || slideData.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: colors.primary,
    fontFace: 'Segoe UI'
  });
  
  // Chart placeholder (would need actual chart data)
  slide.addShape(pptx.ShapeType.rect, {
    x: 1,
    y: 2,
    w: 8,
    h: 4.5,
    fill: { color: colors.secondary },
    line: { color: colors.accent, width: 1 }
  });
  
  slide.addText('Chart Placeholder\n(Chart data would be rendered here)', {
    x: 1,
    y: 3.8,
    w: 8,
    h: 1,
    fontSize: 16,
    color: colors.text,
    align: 'center',
    valign: 'middle',
    fontFace: 'Segoe UI'
  });
}

// Utility function to convert hex color to PowerPoint format
function hexToPptxColor(hex: string): string {
  return hex.replace('#', '');
}

// Export function that integrates with the presentation component
export async function exportPresentationToPowerPoint(presentation: any): Promise<void> {
  const powerPointData: PowerPointPresentation = {
    title: presentation.title,
    author: presentation.author,
    theme: presentation.theme,
    slides: presentation.slides.map((slide: any) => ({
      title: slide.title,
      layout: slide.layout,
      content: slide.content,
      notes: slide.notes
    }))
  };
  
  await exportToPowerPointFile(powerPointData);
}