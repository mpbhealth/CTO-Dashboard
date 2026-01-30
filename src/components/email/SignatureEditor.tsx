import { useState, useCallback, useRef } from 'react';
import { RichTextEditor } from './RichTextEditor';
import {
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Link,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { EmailSignature, SocialLinks } from '@/types/email';

interface SignatureEditorProps {
  signature?: EmailSignature;
  onSave: (signature: Partial<EmailSignature>) => Promise<void>;
  onCancel: () => void;
  onImageUpload: (file: File) => Promise<string>;
}

const defaultSignatureTemplate = `
<p><strong>{{name}}</strong></p>
<p>{{title}}</p>
<p>{{company}}</p>
<p>{{phone}} | {{email}}</p>
`;

export function SignatureEditor({
  signature,
  onSave,
  onCancel,
  onImageUpload,
}: SignatureEditorProps) {
  const [name, setName] = useState(signature?.name || '');
  const [htmlContent, setHtmlContent] = useState(signature?.html_content || defaultSignatureTemplate);
  const [logoUrl, setLogoUrl] = useState(signature?.logo_url || '');
  const [logoWidth, setLogoWidth] = useState(signature?.logo_width || 150);
  const [isDefault, setIsDefault] = useState(signature?.is_default || false);
  const [includeSocialLinks, setIncludeSocialLinks] = useState(signature?.include_social_links || false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(signature?.social_links || {});
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const url = await onImageUpload(file);
      setLogoUrl(url);
    } catch (error) {
      console.error('Failed to upload logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  }, [onImageUpload]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a signature name');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: signature?.id,
        name: name.trim(),
        html_content: htmlContent,
        logo_url: logoUrl || undefined,
        logo_width: logoWidth,
        is_default: isDefault,
        include_social_links: includeSocialLinks,
        social_links: includeSocialLinks ? socialLinks : {},
      });
    } catch (error) {
      console.error('Failed to save signature:', error);
      alert('Failed to save signature. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSocialLink = (key: keyof SocialLinks, value: string) => {
    setSocialLinks((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  // Generate preview with logo and social links
  const generatePreviewHtml = () => {
    let preview = htmlContent;

    // Replace template variables with sample data
    const sampleData: Record<string, string> = {
      '{{name}}': 'John Smith',
      '{{title}}': 'Senior Account Manager',
      '{{company}}': 'MPB Health',
      '{{phone}}': '(555) 123-4567',
      '{{email}}': 'john.smith@mpbhealth.com',
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key, 'g'), value);
    });

    // Add logo if present
    if (logoUrl) {
      preview = `<img src="${logoUrl}" alt="Logo" style="width: ${logoWidth}px; height: auto; margin-bottom: 12px;" /><br/>` + preview;
    }

    // Add social links if enabled
    if (includeSocialLinks) {
      const socialHtml: string[] = [];
      if (socialLinks.linkedin) socialHtml.push(`<a href="${socialLinks.linkedin}" style="color: #0077b5; margin-right: 8px;">LinkedIn</a>`);
      if (socialLinks.twitter) socialHtml.push(`<a href="${socialLinks.twitter}" style="color: #1da1f2; margin-right: 8px;">Twitter</a>`);
      if (socialLinks.facebook) socialHtml.push(`<a href="${socialLinks.facebook}" style="color: #4267B2; margin-right: 8px;">Facebook</a>`);
      if (socialLinks.instagram) socialHtml.push(`<a href="${socialLinks.instagram}" style="color: #E1306C; margin-right: 8px;">Instagram</a>`);
      if (socialLinks.youtube) socialHtml.push(`<a href="${socialLinks.youtube}" style="color: #FF0000; margin-right: 8px;">YouTube</a>`);
      if (socialLinks.website) socialHtml.push(`<a href="${socialLinks.website}" style="color: #333; margin-right: 8px;">Website</a>`);

      if (socialHtml.length > 0) {
        preview += `<p style="margin-top: 12px;">${socialHtml.join('')}</p>`;
      }
    }

    return preview;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {signature ? 'Edit Signature' : 'Create Signature'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Editor Section */}
          <div className="space-y-6">
            {/* Signature Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Signature Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work Signature, Personal"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo
              </label>
              <div className="flex items-start gap-4">
                {logoUrl ? (
                  <div className="relative">
                    <img
                      src={logoUrl}
                      alt="Signature logo"
                      style={{ width: logoWidth }}
                      className="border border-gray-200 dark:border-gray-700 rounded"
                    />
                    <button
                      onClick={() => setLogoUrl('')}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="flex flex-col items-center justify-center w-32 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors"
                  >
                    {isUploadingLogo ? (
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Upload Logo</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {logoUrl && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={logoWidth}
                      onChange={(e) => setLogoWidth(Number(e.target.value) || 150)}
                      min={50}
                      max={400}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Signature Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Signature Content
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Use template variables: {'{{name}}'}, {'{{title}}'}, {'{{company}}'}, {'{{phone}}'}, {'{{email}}'}
              </p>
              <RichTextEditor
                content={htmlContent}
                onChange={setHtmlContent}
                onImageUpload={onImageUpload}
                placeholder="Design your email signature..."
                minHeight="150px"
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <input
                  type="checkbox"
                  checked={includeSocialLinks}
                  onChange={(e) => setIncludeSocialLinks(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Include Social Links
              </label>
              
              {includeSocialLinks && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-[#0077b5]" />
                    <input
                      type="url"
                      value={socialLinks.linkedin || ''}
                      onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                      placeholder="LinkedIn URL"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-[#1da1f2]" />
                    <input
                      type="url"
                      value={socialLinks.twitter || ''}
                      onChange={(e) => updateSocialLink('twitter', e.target.value)}
                      placeholder="Twitter URL"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-[#4267B2]" />
                    <input
                      type="url"
                      value={socialLinks.facebook || ''}
                      onChange={(e) => updateSocialLink('facebook', e.target.value)}
                      placeholder="Facebook URL"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-[#E1306C]" />
                    <input
                      type="url"
                      value={socialLinks.instagram || ''}
                      onChange={(e) => updateSocialLink('instagram', e.target.value)}
                      placeholder="Instagram URL"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-[#FF0000]" />
                    <input
                      type="url"
                      value={socialLinks.youtube || ''}
                      onChange={(e) => updateSocialLink('youtube', e.target.value)}
                      placeholder="YouTube URL"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-600" />
                    <input
                      type="url"
                      value={socialLinks.website || ''}
                      onChange={(e) => updateSocialLink('website', e.target.value)}
                      placeholder="Website URL"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Default checkbox */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Set as default signature
              </label>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview
              </label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 min-h-[300px]">
                <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-4 mt-4">
                  <div
                    dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }}
                    className="prose prose-sm dark:prose-invert max-w-none"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This is how your signature will appear in emails.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {signature ? 'Save Changes' : 'Create Signature'}
        </button>
      </div>
    </div>
  );
}

export default SignatureEditor;
