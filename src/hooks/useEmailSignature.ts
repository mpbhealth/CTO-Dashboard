import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EmailSignature } from '@/types/email';

interface UseEmailSignatureOptions {
  userId?: string;
}

export function useEmailSignature(options: UseEmailSignatureOptions = {}) {
  const { userId } = options;
  const queryClient = useQueryClient();

  // Fetch signatures
  const {
    data: signatures = [],
    isLoading,
    error,
    refetch,
  } = useQuery<EmailSignature[]>({
    queryKey: ['emailSignatures', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('email_signatures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Save signature (create or update)
  const saveMutation = useMutation({
    mutationFn: async (signature: Partial<EmailSignature>) => {
      if (!userId) throw new Error('User ID is required');

      if (signature.id) {
        // Update existing
        const { data, error } = await supabase
          .from('email_signatures')
          .update({
            name: signature.name,
            html_content: signature.html_content,
            plain_text_content: signature.plain_text_content,
            logo_url: signature.logo_url,
            logo_width: signature.logo_width,
            logo_height: signature.logo_height,
            include_social_links: signature.include_social_links,
            social_links: signature.social_links,
            is_default: signature.is_default,
          })
          .eq('id', signature.id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('email_signatures')
          .insert({
            user_id: userId,
            name: signature.name,
            html_content: signature.html_content || '',
            plain_text_content: signature.plain_text_content,
            logo_url: signature.logo_url,
            logo_width: signature.logo_width,
            logo_height: signature.logo_height,
            include_social_links: signature.include_social_links,
            social_links: signature.social_links,
            is_default: signature.is_default,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSignatures', userId] });
    },
  });

  // Delete signature
  const deleteMutation = useMutation({
    mutationFn: async (signatureId: string) => {
      const { error } = await supabase
        .from('email_signatures')
        .delete()
        .eq('id', signatureId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSignatures', userId] });
    },
  });

  // Set default signature
  const setDefaultMutation = useMutation({
    mutationFn: async (signatureId: string) => {
      // Clear other defaults first
      await supabase
        .from('email_signatures')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Set new default
      const { error } = await supabase
        .from('email_signatures')
        .update({ is_default: true })
        .eq('id', signatureId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSignatures', userId] });
    },
  });

  // Upload signature image (logo or inline)
  const uploadImage = async (file: File, _type: 'logo' | 'inline' = 'logo'): Promise<string> => {
    if (!userId) throw new Error('User ID is required');

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const path = `signatures/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('email-assets')
      .upload(path, file, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('email-assets')
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  // Get default signature
  const defaultSignature = signatures.find((s) => s.is_default) || signatures[0];

  // Generate signature HTML with user data
  const generateSignatureHtml = (
    signature: EmailSignature,
    userData?: {
      name?: string;
      title?: string;
      company?: string;
      phone?: string;
      email?: string;
    }
  ): string => {
    let html = signature.html_content;

    // Replace template variables
    const defaults: Record<string, string> = {
      '{{name}}': userData?.name || '',
      '{{title}}': userData?.title || '',
      '{{company}}': userData?.company || 'MPB Health',
      '{{phone}}': userData?.phone || '',
      '{{email}}': userData?.email || '',
    };

    Object.entries(defaults).forEach(([key, value]) => {
      html = html.replace(new RegExp(key, 'g'), value);
    });

    // Add logo if present
    if (signature.logo_url) {
      html = `<img src="${signature.logo_url}" alt="Logo" style="width: ${signature.logo_width || 150}px; height: auto; margin-bottom: 12px;" /><br/>` + html;
    }

    // Add social links if enabled
    if (signature.include_social_links && signature.social_links) {
      const socialHtml: string[] = [];
      const links = signature.social_links;

      if (links.linkedin) socialHtml.push(`<a href="${links.linkedin}" style="color: #0077b5; margin-right: 8px; text-decoration: none;">LinkedIn</a>`);
      if (links.twitter) socialHtml.push(`<a href="${links.twitter}" style="color: #1da1f2; margin-right: 8px; text-decoration: none;">Twitter</a>`);
      if (links.facebook) socialHtml.push(`<a href="${links.facebook}" style="color: #4267B2; margin-right: 8px; text-decoration: none;">Facebook</a>`);
      if (links.instagram) socialHtml.push(`<a href="${links.instagram}" style="color: #E1306C; margin-right: 8px; text-decoration: none;">Instagram</a>`);
      if (links.youtube) socialHtml.push(`<a href="${links.youtube}" style="color: #FF0000; margin-right: 8px; text-decoration: none;">YouTube</a>`);
      if (links.website) socialHtml.push(`<a href="${links.website}" style="color: #333333; margin-right: 8px; text-decoration: none;">Website</a>`);

      if (socialHtml.length > 0) {
        html += `<p style="margin-top: 12px;">${socialHtml.join('')}</p>`;
      }
    }

    return html;
  };

  return {
    signatures,
    defaultSignature,
    isLoading,
    error,
    refetch,
    saveSignature: saveMutation.mutateAsync,
    deleteSignature: deleteMutation.mutateAsync,
    setDefaultSignature: setDefaultMutation.mutateAsync,
    uploadImage,
    generateSignatureHtml,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export default useEmailSignature;
