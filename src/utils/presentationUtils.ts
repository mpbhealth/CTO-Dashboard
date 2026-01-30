export function exportToPresentation(data: Record<string, unknown>) {
  console.log('Exporting to presentation:', data);
}

export function formatSlideContent(content: Record<string, unknown>) {
  return content;
}

export function generatePresentationData(roadmapItems: Record<string, unknown>[]) {
  if (!roadmapItems || !Array.isArray(roadmapItems)) {
    return { slides: [] };
  }

  const slides = [
    {
      id: 'title-slide',
      title: 'Technology Roadmap',
      layout: 'title',
      content: {
        title: 'MPB Health Technology Roadmap',
        subtitle: 'Strategic Technology Initiatives'
      }
    },
    ...roadmapItems.map((item, index) => ({
      id: `roadmap-${item.id || index}`,
      title: item.title || 'Untitled',
      layout: 'content',
      content: {
        title: item.title || 'Untitled',
        bullets: [
          item.description || 'No description',
          `Status: ${item.status || 'Not specified'}`,
          `Priority: ${item.priority || 'Not specified'}`,
          item.owner ? `Owner: ${item.owner}` : null,
          item.department ? `Department: ${item.department}` : null
        ].filter(Boolean)
      }
    }))
  ];

  return { slides };
}

export function exportToPowerPoint(data: Record<string, unknown>) {
  console.log('Exporting to PowerPoint:', data);
}

export const GraphicsUtils = {
  createChart: (data: Record<string, unknown>) => data,
  formatImage: (url: string) => url,
  generateDefaultGraphics: (_layout: string, _theme: string) => {
    return [];
  }
};

export default {
  exportToPresentation,
  formatSlideContent,
  generatePresentationData,
  exportToPowerPoint,
  GraphicsUtils,
};
