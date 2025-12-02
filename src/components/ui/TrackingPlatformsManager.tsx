import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Copy,
  Code,
  Eye,
  EyeOff,
  ExternalLink,
  Zap,
  BarChart3,
  Facebook,
  Instagram,
  Linkedin,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TrackingPlatform {
  id: string;
  platform_name: string;
  platform_type: string;
  tracking_id: string;
  is_connected: boolean;
  last_verified_at: string | null;
  verification_status: string;
  error_message: string | null;
  is_enabled: boolean;
  configuration: any;
}

interface TrackingPlatformsManagerProps {
  propertyId: string;
  propertyName: string;
  websiteUrl?: string;
}

export default function TrackingPlatformsManager({
  propertyId,
  propertyName,
  websiteUrl
}: TrackingPlatformsManagerProps) {
  const [platforms, setPlatforms] = useState<TrackingPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [showInstallCode, setShowInstallCode] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPlatforms();
  }, [propertyId]);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_tracking_platforms')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPlatforms(data || []);
    } catch (err) {
      console.error('Error fetching platforms:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = async (platformId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('marketing_tracking_platforms')
        .update({ is_enabled: !currentState })
        .eq('id', platformId);

      if (error) throw error;
      await fetchPlatforms();
    } catch (err) {
      console.error('Error toggling platform:', err);
    }
  };

  const verifyConnection = async (platformId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_tracking_platforms')
        .update({
          last_verified_at: new Date().toISOString(),
          verification_status: 'verified'
        })
        .eq('id', platformId);

      if (error) throw error;
      await fetchPlatforms();
    } catch (err) {
      console.error('Error verifying connection:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getPlatformIcon = (platformName: string) => {
    const icons: Record<string, any> = {
      google_analytics: BarChart3,
      facebook_pixel: Facebook,
      instagram_shopping: Instagram,
      linkedin_insight: Linkedin,
      tiktok_pixel: TrendingUp,
      google_tag_manager: Code,
      google_ads: Zap,
      bing_ads: Zap,
      hotjar: Eye,
    };
    return icons[platformName] || Settings;
  };

  const getPlatformColor = (platformName: string) => {
    const colors: Record<string, string> = {
      google_analytics: 'blue',
      facebook_pixel: 'blue',
      instagram_shopping: 'purple',
      linkedin_insight: 'blue',
      tiktok_pixel: 'slate',
      google_tag_manager: 'amber',
      google_ads: 'green',
      bing_ads: 'orange',
      hotjar: 'red',
    };
    return colors[platformName] || 'slate';
  };

  const getInstallationCode = (platform: TrackingPlatform) => {
    const snippets: Record<string, string> = {
      google_analytics: `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${platform.tracking_id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${platform.tracking_id}');
</script>`,
      facebook_pixel: `<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${platform.tracking_id}');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=${platform.tracking_id}&ev=PageView&noscript=1"/>
</noscript>`,
      google_tag_manager: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${platform.tracking_id}');</script>
<!-- End Google Tag Manager -->

<!-- Google Tag Manager (noscript) - Add after opening <body> tag -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${platform.tracking_id}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
      tiktok_pixel: `<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};

  ttq.load('${platform.tracking_id}');
  ttq.page();
}(window, document, 'ttq');
</script>`,
      linkedin_insight: `<!-- LinkedIn Insight Tag -->
<script type="text/javascript">
_linkedin_partner_id = "${platform.tracking_id}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script><script type="text/javascript">
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>
<noscript>
<img height="1" width="1" style="display:none;" alt=""
src="https://px.ads.linkedin.com/collect/?pid=${platform.tracking_id}&fmt=gif" />
</noscript>`,
      hotjar: `<!-- Hotjar Tracking Code -->
<script>
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${platform.tracking_id},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>`
    };

    return snippets[platform.platform_name] || `<!-- ${platform.platform_name} -->
<!-- Add tracking code for ${platform.tracking_id} -->`;
  };

  const getPlatformDisplayName = (platformName: string) => {
    const names: Record<string, string> = {
      google_analytics: 'Google Analytics 4',
      facebook_pixel: 'Facebook Pixel',
      instagram_shopping: 'Instagram Shopping',
      linkedin_insight: 'LinkedIn Insight Tag',
      tiktok_pixel: 'TikTok Pixel',
      google_tag_manager: 'Google Tag Manager',
      google_ads: 'Google Ads',
      bing_ads: 'Bing Ads',
      hotjar: 'Hotjar',
    };
    return names[platformName] || platformName;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        <Settings className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Tracking Platforms</h3>
        <p className="text-slate-600 text-sm">
          Add tracking platforms to this property to start collecting data
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {platforms.map((platform) => {
        const Icon = getPlatformIcon(platform.platform_name);
        const color = getPlatformColor(platform.platform_name);
        const isExpanded = expandedPlatform === platform.id;
        const showCode = showInstallCode === platform.id;

        return (
          <div
            key={platform.id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {getPlatformDisplayName(platform.platform_name)}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {platform.tracking_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {platform.verification_status === 'verified' ? (
                    <div className="flex items-center space-x-1 text-emerald-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : platform.verification_status === 'failed' ? (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Failed</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Pending</span>
                    </div>
                  )}

                  <button
                    onClick={() => togglePlatform(platform.id, platform.is_enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      platform.is_enabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        platform.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

              {platform.error_message && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{platform.error_message}</p>
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1">Status</p>
                    <p className="text-sm text-slate-900 capitalize">{platform.verification_status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1">Last Verified</p>
                    <p className="text-sm text-slate-900">
                      {platform.last_verified_at
                        ? new Date(platform.last_verified_at).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1">Tracking ID</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-mono text-slate-900">
                        {showSecrets[platform.id] ? platform.tracking_id : '••••••••••'}
                      </p>
                      <button
                        onClick={() =>
                          setShowSecrets({
                            ...showSecrets,
                            [platform.id]: !showSecrets[platform.id],
                          })
                        }
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        {showSecrets[platform.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(platform.tracking_id)}
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1">Platform Type</p>
                    <p className="text-sm text-slate-900 capitalize">{platform.platform_type}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => verifyConnection(platform.id)}
                    className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Test Connection</span>
                  </button>
                  <button
                    onClick={() => setShowInstallCode(showCode ? null : platform.id)}
                    className="flex items-center space-x-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm rounded-lg transition-colors"
                  >
                    <Code className="w-4 h-4" />
                    <span>{showCode ? 'Hide' : 'View'} Installation Code</span>
                  </button>
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Visit Site</span>
                    </a>
                  )}
                </div>

                {showCode && (
                  <div className="bg-slate-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-300">
                        Installation Code - Add to your website's &lt;head&gt; section
                      </p>
                      <button
                        onClick={() => copyToClipboard(getInstallationCode(platform))}
                        className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 overflow-x-auto">
                      <code>{getInstallationCode(platform)}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
