'use client';
import * as React from "react";
import FileUpload from "@/components/FileUpload";
import { postExport } from "@/lib/exportClient";

export default function FilesDemo() {
  const [files, setFiles] = React.useState<any[]>([]);
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Files Demo</h1>
      <FileUpload pathPrefix="demo" onUploaded={(p) => setFiles(v => [...v, p])} />
      <div className="space-y-2">
        <button className="px-4 py-2 border rounded-xl" onClick={() => postExport("csv", files, "uploads.csv")}>
          Export CSV
        </button>
        <button className="px-4 py-2 border rounded-xl" onClick={() => postExport("xlsx", files, "uploads.xlsx")}>
          Export XLSX
        </button>
      </div>
      <pre className="bg-neutral-100 p-3 rounded-xl text-sm overflow-auto">{JSON.stringify(files, null, 2)}</pre>
    </main>
  );
}
