/**
 * Website Thumbnail Utility
 * 
 * Generates thumbnail URLs for website previews with fallback strategy:
 * 1. Custom thumbnail (user-provided)
 * 2. Microlink API (auto-generated screenshot)
 * 3. Google Favicon service (fallback)
 */

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    // Handle invalid URLs
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

/**
 * Get the Microlink screenshot URL for a website
 * Free tier: 50 requests/day
 * 
 * @param url - The website URL to screenshot
 * @returns Microlink API URL that returns a screenshot
 */
export function getMicrolinkScreenshotUrl(url: string): string {
  const params = new URLSearchParams({
    url,
    screenshot: 'true',
    meta: 'false',
    embed: 'screenshot.url',
  });
  return `https://api.microlink.io/?${params.toString()}`;
}

/**
 * Get the thum.io screenshot URL for a website (alternative service)
 * 
 * @param url - The website URL to screenshot
 * @param width - Optional width (default 600)
 * @returns thum.io URL that returns a screenshot
 */
export function getThumioScreenshotUrl(url: string, width = 600): string {
  return `https://image.thum.io/get/width/${width}/${url}`;
}

/**
 * Get Google's favicon service URL
 * 
 * @param url - The website URL
 * @param size - Icon size (16, 32, 64, 128, 256)
 * @returns Google favicon URL
 */
export function getFaviconUrl(url: string, size: 16 | 32 | 64 | 128 | 256 = 128): string {
  const domain = extractDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

/**
 * Get the best available thumbnail URL for a website
 * Uses a fallback strategy:
 * 1. Custom thumbnail if provided
 * 2. thum.io for screenshot (more reliable free tier than Microlink)
 * 
 * @param url - The website URL
 * @param customThumbnail - Optional custom thumbnail URL
 * @returns The best available thumbnail URL
 */
export function getThumbnailUrl(url: string, customThumbnail?: string | null): string {
  // Use custom thumbnail if provided
  if (customThumbnail) {
    return customThumbnail;
  }
  
  // Use thum.io for automatic screenshots (more reliable free tier)
  return getThumioScreenshotUrl(url);
}

/**
 * Get favicon URL as a fallback when screenshot fails
 * 
 * @param url - The website URL
 * @returns Google favicon URL at 128px
 */
export function getFallbackThumbnail(url: string): string {
  return getFaviconUrl(url, 128);
}

/**
 * Category-specific gradient backgrounds for when thumbnails fail to load
 */
export const categoryGradients: Record<string, string> = {
  infrastructure: 'from-cyan-500/20 to-cyan-600/30',
  analytics: 'from-violet-500/20 to-violet-600/30',
  development: 'from-emerald-500/20 to-emerald-600/30',
  marketing: 'from-amber-500/20 to-amber-600/30',
  operations: 'from-rose-500/20 to-rose-600/30',
  finance: 'from-blue-500/20 to-blue-600/30',
  general: 'from-slate-500/20 to-slate-600/30',
};

/**
 * Get the gradient class for a category
 * 
 * @param category - The link category
 * @returns Tailwind gradient class string
 */
export function getCategoryGradient(category: string): string {
  return categoryGradients[category.toLowerCase()] || categoryGradients.general;
}

/**
 * Category color mapping for borders and accents
 */
export const categoryColors: Record<string, { border: string; text: string; bg: string }> = {
  infrastructure: { border: 'border-cyan-500/50', text: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  analytics: { border: 'border-violet-500/50', text: 'text-violet-400', bg: 'bg-violet-500/20' },
  development: { border: 'border-emerald-500/50', text: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  marketing: { border: 'border-amber-500/50', text: 'text-amber-400', bg: 'bg-amber-500/20' },
  operations: { border: 'border-rose-500/50', text: 'text-rose-400', bg: 'bg-rose-500/20' },
  finance: { border: 'border-blue-500/50', text: 'text-blue-400', bg: 'bg-blue-500/20' },
  general: { border: 'border-slate-500/50', text: 'text-slate-400', bg: 'bg-slate-500/20' },
};

/**
 * Get the color classes for a category
 * 
 * @param category - The link category
 * @returns Object with border, text, and bg class strings
 */
export function getCategoryColors(category: string): { border: string; text: string; bg: string } {
  return categoryColors[category.toLowerCase()] || categoryColors.general;
}

/**
 * Predefined categories for the Command Center
 */
export const COMMAND_CENTER_CATEGORIES = [
  { id: 'infrastructure', label: 'Infrastructure', icon: 'Server' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { id: 'development', label: 'Development', icon: 'Code' },
  { id: 'marketing', label: 'Marketing', icon: 'Megaphone' },
  { id: 'operations', label: 'Operations', icon: 'Settings' },
  { id: 'finance', label: 'Finance', icon: 'DollarSign' },
  { id: 'general', label: 'General', icon: 'Globe' },
] as const;

