'use client';
import * as React from "react";

type Props = {
  action?: string; // defaults to /api/upload
  pathPrefix?: string;
  accept?: string;
  onUploaded?: (payload: { key: string; publicUrl?: string; path?: string }) => void;
};

export default function FileUpload({ action="/api/upload", pathPrefix, accept, onUploaded }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<number>(0);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    setProgress(0);

    const form = new FormData();
    form.append("file", file);
    if (pathPrefix) form.append("pathPrefix", pathPrefix);

    // Use fetch with no explicit progress; a real app could use XHR for progress events
    try {
      const res = await fetch(action, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }
      const payload = await res.json();
      onUploaded?.(payload);
    } catch (e: any) {
      setErr(e.message || "Upload failed");
    } finally {
      setBusy(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 800);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Upload a file</label>
      <input disabled={busy} type="file" accept={accept} onChange={handleChange} className="block" />
      {busy && <div className="text-sm">Uploading… {progress}%</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
    </div>
  );
}
