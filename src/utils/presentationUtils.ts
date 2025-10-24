import pptxgen from 'pptxgenjs';

export interface PresentationSlideData {
  title: string;
  content?: string;
  items?: string[];
  chartData?: any;
  layout?: string;
}

export function generatePresentationData(items: any[]): PresentationSlideData[] {
  return items.map(item => ({
    title: item.title || 'Untitled Slide',
    content: item.description || '',
    items: item.bullets || [],
    chartData: item.chartData,
    layout: item.layout || 'content'
  }));
}

export async function exportToPowerPoint(slides: PresentationSlideData[], filename: string = 'presentation.pptx') {
  const pres = new pptxgen();

  pres.author = 'MPB Health CTO Dashboard';
  pres.company = 'MPB Health';
  pres.subject = 'Generated Presentation';
  pres.title = filename.replace('.pptx', '');

  slides.forEach((slideData) => {
    const slide = pres.addSlide();

    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 32,
      bold: true,
      color: '0F172A'
    });

    if (slideData.content) {
      slide.addText(slideData.content, {
        x: 0.5,
        y: 1.8,
        w: 9,
        h: 4,
        fontSize: 18,
        color: '334155'
      });
    }

    if (slideData.items && slideData.items.length > 0) {
      slide.addText(slideData.items.map(item => `• ${item}`).join('\n'), {
        x: 0.5,
        y: 1.8,
        w: 9,
        h: 4,
        fontSize: 16,
        color: '334155'
      });
    }
  });

  await pres.writeFile({ fileName: filename });
}

export const GraphicsUtils = {
  drawChart(canvas: HTMLCanvasElement, data: any) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0EA5E9';
    ctx.fillRect(10, 10, 100, 100);
  },

  createChartImage(data: any): string {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    this.drawChart(canvas, data);
    return canvas.toDataURL('image/png');
  }
};
