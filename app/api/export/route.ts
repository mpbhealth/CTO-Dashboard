import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE: z.string().min(1),
  UPLOAD_BUCKET: z.string().min(1).default("uploads")
});

const requestSchema = z.object({
  pathPrefix: z.string().optional(), // optional folder prefix
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const env = envSchema.parse({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
      UPLOAD_BUCKET: process.env.UPLOAD_BUCKET || "uploads"
    });

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const parsed = requestSchema.safeParse({ pathPrefix: form.get("pathPrefix") || undefined });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const key = `${parsed.data.pathPrefix ? parsed.data.pathPrefix.replace(/\/+$/,"") + "/" : ""}${ts}-${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from(env.UPLOAD_BUCKET)
      .upload(key, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { data: publicUrl } = supabase
      .storage
      .from(env.UPLOAD_BUCKET)
      .getPublicUrl(key);

    return NextResponse.json({ key, path: data?.path, publicUrl: publicUrl?.publicUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
