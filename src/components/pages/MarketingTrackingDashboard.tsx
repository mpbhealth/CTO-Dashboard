import { useState } from 'react';
import { ArrowLeft, BarChart3, Link as LinkIcon, Users, Zap } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMarketingProperties } from '../../hooks/useMarketingData';
import TrackingPlatformsManager from '../ui/TrackingPlatformsManager';
import UTMCampaignBuilder from '../ui/UTMCampaignBuilder';

export default function MarketingTrackingDashboard() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { data: properties } = useMarketingProperties();
  const [activeTab, setActiveTab] = useState<'platforms' | 'campaigns' | 'conversions' | 'sharing'>('platforms');

  const property = properties.find((p) => p.id === propertyId);

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Property Not Found</h2>
          <p className="text-slate-600 mb-6">The marketing property you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/marketing-analytics')}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
          >
            Back to Analytics
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'platforms' as const, label: 'Tracking Platforms', icon: BarChart3 },
    { id: 'campaigns' as const, label: 'UTM Campaigns', icon: LinkIcon },
    { id: 'conversions' as const, label: 'Conversion Events', icon: Zap },
    { id: 'sharing' as const, label: 'Team Sharing', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/marketing-analytics')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{property.name}</h1>
            <p className="text-slate-600 mt-1">
              Manage tracking platforms, campaigns, and conversion events
            </p>
          </div>
        </div>
      </div>

      {property.website_url && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <BarChart3 className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Website URL</p>
                <a
                  href={property.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-pink-600 hover:text-pink-700 hover:underline"
                >
                  {property.website_url}
                </a>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-600">Timezone</p>
              <p className="text-sm font-medium text-slate-900">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'platforms' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Connected Tracking Platforms
              </h2>
              <p className="text-slate-600 mb-6">
                Manage all your analytics and advertising platform integrations in one place.
                Enable or disable platforms, test connections, and view installation codes.
              </p>
              <TrackingPlatformsManager
                propertyId={property.id}
                propertyName={property.name}
                websiteUrl={property.website_url || undefined}
              />
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <UTMCampaignBuilder
              propertyId={property.id}
              baseUrl={property.website_url || undefined}
            />
          </div>
        )}

        {activeTab === 'conversions' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Conversion Events</h2>
            <p className="text-slate-600 mb-6">
              Define and track custom conversion events across all your platforms.
            </p>
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <Zap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Conversion Tracking Coming Soon
              </h3>
              <p className="text-slate-600 text-sm">
                Set up custom conversion goals, funnels, and event tracking for your campaigns.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'sharing' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Team Collaboration</h2>
            <p className="text-slate-600 mb-6">
              Share access to this property with team members and control their permissions.
            </p>
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Team Sharing Coming Soon
              </h3>
              <p className="text-slate-600 text-sm">
                Invite team members and set granular permissions for viewing and editing data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
