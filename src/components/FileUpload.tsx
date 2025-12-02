import * as React from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Upload } from "lucide-react";

type Props = {
  pathPrefix?: string;
  bucket?: string;
  accept?: string;
  label?: string;
  onUploaded?: (payload: { key: string; publicUrl?: string; path?: string }) => void;
};

export default function FileUpload({
  pathPrefix = "general",
  bucket = "uploads",
  accept,
  label = "Upload a file",
  onUploaded
}: Props) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<number>(0);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setErr(null);
    setProgress(0);

    if (!isSupabaseConfigured) {
      setErr("File uploads are disabled because Supabase is not configured.");
      setBusy(false);
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      setErr("Supabase URL is not configured. Please check your environment settings.");
      setBusy(false);
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setErr(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
      setBusy(false);
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("pathPrefix", pathPrefix);
    form.append("bucket", bucket);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setProgress(Math.round(percentComplete));
      }
    });

    xhr.addEventListener("load", async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const payload = JSON.parse(xhr.responseText);
          onUploaded?.(payload);
        } catch {
          setErr("Failed to parse upload response");
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setErr(data?.error || `Upload failed (${xhr.status})`);
        } catch {
          setErr(`Upload failed (${xhr.status})`);
        }
      }
      setBusy(false);
      setTimeout(() => setProgress(0), 1000);
    });

    xhr.addEventListener("error", () => {
      setErr("Network error during upload");
      setBusy(false);
      setProgress(0);
    });

    xhr.addEventListener("abort", () => {
      setErr("Upload cancelled");
      setBusy(false);
      setProgress(0);
    });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl || supabaseUrl === 'undefined') {
        setErr("File upload is not configured. Please set up Supabase environment variables.");
        setBusy(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErr("You must be logged in to upload files");
        setBusy(false);
        return;
      }

      const apiUrl = `${supabaseUrl}/functions/v1/file-upload`;

      xhr.open("POST", apiUrl);
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.send(form);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Upload failed";
      setErr(errorMessage);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">Choose File</span>
          <input
            disabled={busy}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </label>
        {busy && (
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">Uploading... {progress}%</div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
      {err && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{err}</p>
        </div>
      )}
    </div>
  );
}
