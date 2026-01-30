import { useState } from 'react';
import {
  Settings,
  Globe,
  FileText,
  Image,
  Code,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface SEOPage {
  path: string;
  title: string;
  description: string;
  indexed: boolean;
}

const seoPages: SEOPage[] = [
  { path: '/', title: 'MPB Health - Affordable Health Insurance Plans', description: 'Find affordable health insurance plans for you and your family...', indexed: true },
  { path: '/benefits', title: 'Health Benefits & Coverage | MPB Health', description: 'Explore comprehensive health benefits and coverage options...', indexed: true },
  { path: '/pricing', title: 'Health Insurance Pricing | MPB Health', description: 'Transparent pricing for all our health insurance plans...', indexed: true },
  { path: '/contact', title: 'Contact Us | MPB Health', description: 'Get in touch with our team for questions about health coverage...', indexed: true },
  { path: '/member-portal', title: 'Member Portal | MPB Health', description: 'Access your health insurance account and manage your benefits...', indexed: false },
];

export function AdminSEOSettings() {
  const [globalSettings, setGlobalSettings] = useState({
    siteName: 'MPB Health',
    siteTagline: 'Affordable Health Insurance Plans',
    defaultOgImage: '/og-image.jpg',
    googleAnalyticsId: 'G-XXXXXXXXXX',
    googleSearchConsole: 'verified',
    robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /member-portal/',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SEO Settings</h1>
          <p className="text-slate-500 mt-1">Configure search engine optimization settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Global Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          Global SEO Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Site Name</label>
            <input
              type="text"
              value={globalSettings.siteName}
              onChange={(e) => setGlobalSettings({ ...globalSettings, siteName: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Site Tagline</label>
            <input
              type="text"
              value={globalSettings.siteTagline}
              onChange={(e) => setGlobalSettings({ ...globalSettings, siteTagline: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Default OG Image URL</label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={globalSettings.defaultOgImage}
                onChange={(e) => setGlobalSettings({ ...globalSettings, defaultOgImage: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Google Analytics ID</label>
            <div className="relative">
              <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={globalSettings.googleAnalyticsId}
                onChange={(e) => setGlobalSettings({ ...globalSettings, googleAnalyticsId: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-slate-400" />
          Verification Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-900">Google Search Console</span>
            </div>
            <p className="text-sm text-emerald-700">Verified and connected</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-900">Bing Webmaster</span>
            </div>
            <p className="text-sm text-emerald-700">Verified and connected</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-900">Yandex Webmaster</span>
            </div>
            <p className="text-sm text-amber-700">Not configured</p>
          </div>
        </div>
      </div>

      {/* Page-specific SEO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            Page SEO Settings
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Page</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Indexed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {seoPages.map((page) => (
                <tr key={page.path} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{page.path}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 truncate max-w-xs">{page.title}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {page.indexed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Indexed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                        No Index
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Robots.txt */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-slate-400" />
          robots.txt Configuration
        </h3>
        <textarea
          value={globalSettings.robotsTxt}
          onChange={(e) => setGlobalSettings({ ...globalSettings, robotsTxt: e.target.value })}
          rows={6}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>
    </div>
  );
}

export default AdminSEOSettings;
