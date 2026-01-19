import { useState } from 'react';
import { Link, Copy, CheckCircle, Download, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UTMCampaignBuilderProps {
  propertyId: string;
  baseUrl?: string;
}

interface UTMParams {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

const presets = {
  email: { source: 'email', medium: 'email', campaign: '', term: '', content: '' },
  facebook: { source: 'facebook', medium: 'social', campaign: '', term: '', content: '' },
  instagram: { source: 'instagram', medium: 'social', campaign: '', term: '', content: '' },
  linkedin: { source: 'linkedin', medium: 'social', campaign: '', term: '', content: '' },
  tiktok: { source: 'tiktok', medium: 'social', campaign: '', term: '', content: '' },
  google_ads: { source: 'google', medium: 'cpc', campaign: '', term: '', content: '' },
  facebook_ads: { source: 'facebook', medium: 'cpc', campaign: '', term: '', content: '' },
  newsletter: { source: 'newsletter', medium: 'email', campaign: '', term: '', content: '' },
  referral: { source: 'referral', medium: 'referral', campaign: '', term: '', content: '' },
};

export default function UTMCampaignBuilder({ propertyId, baseUrl = '' }: UTMCampaignBuilderProps) {
  const [destinationUrl, setDestinationUrl] = useState(baseUrl);
  const [campaignName, setCampaignName] = useState('');
  const [utmParams, setUtmParams] = useState<UTMParams>({
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  });
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generateURL = () => {
    if (!destinationUrl) return '';

    const url = new URL(destinationUrl.startsWith('http') ? destinationUrl : `https://${destinationUrl}`);

    if (utmParams.source) url.searchParams.set('utm_source', utmParams.source);
    if (utmParams.medium) url.searchParams.set('utm_medium', utmParams.medium);
    if (utmParams.campaign) url.searchParams.set('utm_campaign', utmParams.campaign);
    if (utmParams.term) url.searchParams.set('utm_term', utmParams.term);
    if (utmParams.content) url.searchParams.set('utm_content', utmParams.content);

    return url.toString();
  };

  const generatedUrl = generateURL();

  const applyPreset = (presetName: keyof typeof presets) => {
    setUtmParams(presets[presetName]);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveCampaign = async () => {
    if (!campaignName || !utmParams.source || !utmParams.medium || !utmParams.campaign) {
      alert('Please fill in Campaign Name and all required UTM parameters');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('marketing_utm_campaigns').insert({
        property_id: propertyId,
        user_id: user.id,
        campaign_name: campaignName,
        utm_source: utmParams.source,
        utm_medium: utmParams.medium,
        utm_campaign: utmParams.campaign,
        utm_term: utmParams.term || null,
        utm_content: utmParams.content || null,
        destination_url: generatedUrl,
        notes: notes || null,
        budget: budget ? parseFloat(budget) : null,
      });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        resetForm();
      }, 2000);
    } catch {
      console.error('Error saving campaign');
      alert('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCampaignName('');
    setUtmParams({
      source: '',
      medium: '',
      campaign: '',
      term: '',
      content: '',
    });
    setNotes('');
    setBudget('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">UTM Campaign Builder</h3>
        <p className="text-sm text-slate-600 mb-4">
          Generate trackable URLs for your marketing campaigns across all platforms
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
          {Object.keys(presets).map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset as keyof typeof presets)}
              className="px-3 py-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors capitalize"
            >
              {preset.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Summer Sale 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Destination URL *
              </label>
              <input
                type="url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://mpbhealth.com/landing-page"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Source * <span className="text-xs text-slate-500">(utm_source)</span>
              </label>
              <input
                type="text"
                value={utmParams.source}
                onChange={(e) => setUtmParams({ ...utmParams, source: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="facebook"
              />
              <p className="text-xs text-slate-500 mt-1">Where the traffic comes from</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Medium * <span className="text-xs text-slate-500">(utm_medium)</span>
              </label>
              <input
                type="text"
                value={utmParams.medium}
                onChange={(e) => setUtmParams({ ...utmParams, medium: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="social"
              />
              <p className="text-xs text-slate-500 mt-1">The marketing medium</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Campaign * <span className="text-xs text-slate-500">(utm_campaign)</span>
              </label>
              <input
                type="text"
                value={utmParams.campaign}
                onChange={(e) => setUtmParams({ ...utmParams, campaign: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="summer_sale"
              />
              <p className="text-xs text-slate-500 mt-1">Campaign identifier</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Term <span className="text-xs text-slate-500">(utm_term)</span>
              </label>
              <input
                type="text"
                value={utmParams.term}
                onChange={(e) => setUtmParams({ ...utmParams, term: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="health insurance"
              />
              <p className="text-xs text-slate-500 mt-1">Paid keywords</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Content <span className="text-xs text-slate-500">(utm_content)</span>
              </label>
              <input
                type="text"
                value={utmParams.content}
                onChange={(e) => setUtmParams({ ...utmParams, content: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="banner_ad_v1"
              />
              <p className="text-xs text-slate-500 mt-1">A/B test variations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Budget (Optional)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="5000"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Campaign objectives and notes"
              />
            </div>
          </div>
        </div>
      </div>

      {generatedUrl && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Generated URL</h4>
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <Link className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 break-all font-mono">{generatedUrl}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy URL</span>
                </>
              )}
            </button>

            <button
              onClick={saveCampaign}
              disabled={saving || saved}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:bg-slate-400"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Campaign Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Campaign'}</span>
                </>
              )}
            </button>

            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Test URL</span>
            </a>

            <button
              onClick={resetForm}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
            >
              <span>Reset</span>
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Pro Tip:</strong> Use consistent naming conventions for easier tracking.
              Keep utm_source for platforms (facebook, google), utm_medium for channels (social, cpc, email),
              and utm_campaign for specific initiatives (summer_sale_2024).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
